import { create } from 'zustand';

export interface ToastMessage {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'success' | 'warning';
}

interface ToastState {
  current: ToastMessage | null;
  show: (toast: Omit<ToastMessage, 'id'>) => void;
  dismiss: () => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (toast) => set({ current: { ...toast, id: nextId++ } }),
  dismiss: () => set({ current: null }),
}));

export const toast = {
  show: (message: string, options?: Omit<ToastMessage, 'id' | 'message'>) =>
    useToastStore.getState().show({ message, ...options }),
  dismiss: () => useToastStore.getState().dismiss(),
};
