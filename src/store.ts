import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export type Look = { skin: string; outfit: string; hair: 'short' | 'long' | 'bun'; hairColor: string }
export type Photo = { id: string; url: string; caption: string }
export const MAX_PHOTOS = 45, MIN_PHOTOS = 6
export const defaultDedication = (girl: string) =>
  `To ${girl || 'my love'},\nEvery moment with you deserves its own place in the world.\nThis little museum is made of memories, love, and everything I wish to experience with you.`
export type State = {
  stage: 'entry' | 'select' | 'museum'; role: 'boy' | 'girl'; boy: string; girl: string; boyLook: Look; girlLook: Look
  photos: Photo[]; dedication: string | null; viewing: string | null; editing: boolean
  set: (p: Partial<State>) => void
  addPhotos: (urls: string[]) => void; setCaption: (id: string, c: string) => void
  move: (id: string, d: -1 | 1) => void; makeFirst: (id: string) => void; replace: (id: string, url: string) => void; remove: (id: string) => void
}
export const useMuseum = create<State>()(persist(
  (set) => ({
    stage: 'entry', role: 'boy', boy: '', girl: '', photos: [], dedication: null, viewing: null, editing: false,
    boyLook: { skin: '#e0b48c', outfit: '#2b3a55', hair: 'short', hairColor: '#1b1209' },
    girlLook: { skin: '#e0b48c', outfit: '#6b2d3a', hair: 'long', hairColor: '#4a2c17' },
    set: (p) => set(p),
    addPhotos: (urls) => set((s) => ({ photos: [...s.photos, ...urls.map((url) => ({ id: crypto.randomUUID(), url, caption: '' }))].slice(0, MAX_PHOTOS) })),
    setCaption: (id, caption) => set((s) => ({ photos: s.photos.map((p) => (p.id === id ? { ...p, caption } : p)) })),
    move: (id, d) => set((s) => {
      const a = [...s.photos], i = a.findIndex((p) => p.id === id), j = i + d
      if (i < 0 || j < 0 || j >= a.length) return s
      ;[a[i], a[j]] = [a[j], a[i]]; return { photos: a }
    }),
    makeFirst: (id) => set((s) => ({ photos: [...s.photos.filter((p) => p.id === id), ...s.photos.filter((p) => p.id !== id)] })),
    replace: (id, url) => set((s) => ({ photos: s.photos.map((p) => (p.id === id ? { ...p, url } : p)) })),
    remove: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
  }),
  { name: 'our-little-museum', partialize: ({ role, boy, girl, boyLook, girlLook, photos, dedication }) => ({ role, boy, girl, boyLook, girlLook, photos, dedication }) }
))
export async function uploadFiles(files: File[]): Promise<string[]> {
  const fd = new FormData(); files.forEach((f) => fd.append('files', f))
  const r = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!r.ok) throw new Error((await r.json().catch(() => ({ error: '' }))).error || 'Upload failed. Is the server running (npm run server)?')
  return (await r.json()).urls as string[]
}
