import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ctl, setTrack, type Action, type Kind, type Media } from './shared'
import { useNet, emit } from './net'
type S = { media: Media; offset: number; musicVol: number; videoVol: number; muted: boolean; blocked: boolean; open: boolean; gfx: 'auto' | 'high' | 'medium' | 'low' }
const idle = (t: Media['video']) => t && { ...t, playing: false, base: 0, at: 0 }
export const useMedia = create<S>()(persist(
  (): S => ({ media: { video: null, music: null }, offset: 0, musicVol: 0.5, videoVol: 0.8, muted: false, blocked: false, open: false, gfx: 'auto' }),
  { name: 'our-little-museum-media', partialize: (s) => ({ media: { video: idle(s.media.video), music: idle(s.media.music) }, musicVol: s.musicVol, videoVol: s.videoVol, gfx: s.gfx }) }
))
export const serverNow = () => Date.now() + useMedia.getState().offset
export function mediaCtl(kind: Kind, action: Action) {
  if (useNet.getState().code) emit('media:ctl', { kind, action })
  else useMedia.setState((s) => ({ media: ctl(s.media, kind, action, Date.now()) }))
}
export function mediaSet(kind: Kind, url: string | null) {
  if (useNet.getState().code) emit('media:set', { kind, url })
  else useMedia.setState((s) => ({ media: setTrack(s.media, kind, url, Date.now()) }))
}
export async function uploadMedia(file: File): Promise<string> {
  const fd = new FormData(); fd.append('file', file)
  const r = await fetch('/api/upload-media', { method: 'POST', body: fd })
  if (!r.ok) throw new Error((await r.json().catch(() => ({ error: '' }))).error || 'Upload failed. Is the server running (npm run server)?')
  return (await r.json()).url as string
}
