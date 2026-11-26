import { create } from 'zustand'
export const useUI = create<{ near: boolean; sitting: boolean }>(() => ({ near: false, sitting: false }))
