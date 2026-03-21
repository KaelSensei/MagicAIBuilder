"use client";
// Simple toast notification store
import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  add: (type: ToastType, message: string) => void;
  remove: (id: string) => void;
}

/** Returns a state updater that removes the toast with the given id */
function withoutToast(id: string) {
  return (state: ToastStore) => ({ toasts: state.toasts.filter((t) => t.id !== id) });
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    // Auto-dismiss after 5s for warnings, 3s for others
    const duration = type === "warning" ? 5000 : 3000;
    setTimeout(() => set(withoutToast(id)), duration);
  },
  remove: (id) => set(withoutToast(id)),
}));

/** Convenience hook — returns typed toast helpers */
export function useToast() {
  const { add } = useToastStore();

  return {
    success: (message: string) => add("success", message),
    error: (message: string) => add("error", message),
    warning: (message: string) => add("warning", message),
    info: (message: string) => add("info", message),
    toast: add,
  };
}
