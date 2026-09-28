import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Supabase auth storage backed by the OS keychain/keystore.
 * SecureStore values are limited (~2 KB), so sessions are split into chunks.
 * On web (dev only) it falls back to AsyncStorage.
 */
const CHUNK = 1800;
const countKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, i: number) => `${key}.${i}`;
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

export const secureSessionStorage = {
  async getItem(rawKey: string): Promise<string | null> {
    if (Platform.OS === 'web') return AsyncStorage.getItem(rawKey);
    const key = safeKey(rawKey);
    const count = Number(await SecureStore.getItemAsync(countKey(key)));
    if (!count) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(rawKey: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.setItem(rawKey, value);
    const key = safeKey(rawKey);
    await this.removeItem(rawKey);
    const count = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(chunkKey(key, i), value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await SecureStore.setItemAsync(countKey(key), String(count));
  },
  async removeItem(rawKey: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(rawKey);
    const key = safeKey(rawKey);
    const count = Number(await SecureStore.getItemAsync(countKey(key)));
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(chunkKey(key, i));
    await SecureStore.deleteItemAsync(countKey(key));
  },
};
