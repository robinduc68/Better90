import { todayISO } from '@/domain';

export const nowISO = () => new Date().toISOString();
export const today = () => todayISO(new Date());
