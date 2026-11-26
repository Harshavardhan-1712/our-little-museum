import { useEffect } from 'react'
import { useMedia, serverNow, mediaCtl } from '../media'
import { posOf } from '../shared'
const video = document.createElement('video'); video.playsInline = true; video.preload = 'auto'; video.crossOrigin = 'anonymous'
const music = new Audio(); music.loop = true; music.preload = 'auto'
export const els = { video, music }
export function useMediaSync() {
  useEffect(() => {
    const run = () => {
      const { media, musicVol, videoVol, muted } = useMedia.getState(), now = serverNow()
      for (const kind of ['video', 'music'] as const) {
        const t = media[kind], el = els[kind]
        if (!t) { if (el.getAttribute('src')) { el.pause(); el.removeAttribute('src'); el.load() } continue }
        const abs = new URL(t.url, location.href).href
        if (el.src !== abs) { el.src = abs; el.load() }
        el.volume = kind === 'music' ? musicVol : videoVol; el.muted = kind === 'music' && muted
        if (el.readyState < 1) continue
        let pos = posOf(t, now); const d = el.duration
        if (isFinite(d) && d > 0) pos = kind === 'music' ? pos % d : Math.min(pos, d)
        if (t.playing && !(kind === 'video' && el.ended)) {
          if (Math.abs(el.currentTime - pos) > 0.6) el.currentTime = pos
          if (el.paused) el.play().then(() => useMedia.setState({ blocked: false })).catch(() => useMedia.setState({ blocked: true }))
        } else {
          if (!el.paused) el.pause()
          if (Math.abs(el.currentTime - pos) > 0.05) el.currentTime = pos
        }
      }
    }
    const id = setInterval(run, 1000), unsub = useMedia.subscribe(run), onEnd = () => mediaCtl('video', 'end')
    els.video.addEventListener('ended', onEnd); els.video.addEventListener('loadedmetadata', run); els.music.addEventListener('loadedmetadata', run)
    addEventListener('pointerdown', run, true); run()
    return () => {
      clearInterval(id); unsub(); els.video.removeEventListener('ended', onEnd); els.video.removeEventListener('loadedmetadata', run); els.music.removeEventListener('loadedmetadata', run)
      removeEventListener('pointerdown', run, true); els.video.pause(); els.music.pause()
    }
  }, [])
}
