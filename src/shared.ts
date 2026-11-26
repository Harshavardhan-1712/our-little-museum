export type Track = { url: string; playing: boolean; base: number; at: number }
export type Media = { video: Track | null; music: Track | null }
export type Kind = 'video' | 'music'
export type Action = 'play' | 'pause' | 'replay' | 'stop' | 'end'
export const posOf = (t: Track, now: number) => (t.playing ? t.base + (now - t.at) / 1000 : t.base)
export function ctl(m: Media, kind: Kind, action: Action, now: number): Media {
  const t = m[kind]; if (!t) return m
  const cur = posOf(t, now); let n: Track
  if (action === 'play') n = { ...t, playing: true, base: cur, at: now }
  else if (action === 'pause') n = { ...t, playing: false, base: cur, at: now }
  else if (action === 'replay') n = { ...t, playing: true, base: 0, at: now }
  else { if (action === 'end' && !t.playing) return m; n = { ...t, playing: false, base: 0, at: now } }
  return { ...m, [kind]: n }
}
export const setTrack = (m: Media, kind: Kind, url: string | null, now: number): Media => ({ ...m, [kind]: url ? { url, playing: false, base: 0, at: now } : null })
