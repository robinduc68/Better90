// Supabase Edge Function: permanently deletes the calling user's account.
// Removes their private photos from storage, then the auth user; all table
// rows are removed by ON DELETE CASCADE.
//
// Deploy: supabase functions deploy delete-account
// Requires the SUPABASE_SERVICE_ROLE_KEY secret (set automatically on Supabase).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return new Response('Unauthorized', { status: 401, headers: cors });
  const userId = userData.user.id;

  const admin = createClient(url, service);

  // Delete every object in the user's private photo folders (paged).
  for (const bucket of ['progress-photos', 'meal-photos']) {
    for (;;) {
      const { data: files, error } = await admin.storage.from(bucket).list(userId, { limit: 100 });
      if (error) return new Response(`Storage error: ${error.message}`, { status: 500, headers: cors });
      if (!files || files.length === 0) break;
      const { error: removeError } = await admin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
      if (removeError) return new Response(`Storage error: ${removeError.message}`, { status: 500, headers: cors });
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return new Response(`Delete error: ${deleteError.message}`, { status: 500, headers: cors });

  return new Response(JSON.stringify({ deleted: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
