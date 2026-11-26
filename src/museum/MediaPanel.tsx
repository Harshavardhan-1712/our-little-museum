import { useState } from 'react'
import { useMedia, mediaCtl, mediaSet, uploadMedia } from '../media'
import { useNet, isOwner } from '../net'
import { useMuseum } from '../store'
import { useProp, startProposal, endProposal, defaultQ, defaultS } from '../proposal'
import type { Kind } from '../shared'
export default function MediaPanel() {
  const m = useMedia(), owner = useNet(isOwner), [busy, setBusy] = useState(''), [err, setErr] = useState('')
  const girl = useMuseum((s) => s.girl), pr = useProp()
  if (!m.open) return null
  const up = async (kind: Kind, f?: File) => {
    if (!f) return; setBusy(kind); setErr('')
    try { mediaSet(kind, await uploadMedia(f)) } catch (e) { setErr((e as Error).message) } finally { setBusy('') }
  }
  const file = (kind: Kind, label: string, accept: string) => owner && (
    <label className="btn">{busy === kind ? 'Uploading…' : label}<input type="file" accept={accept} hidden disabled={!!busy} onChange={(e) => { void up(kind, e.target.files?.[0]); e.target.value = '' }} /></label>)
  const v = m.media.video, mu = m.media.music
  return (
    <aside className="media" onPointerDown={(e) => e.stopPropagation()}>
      <div className="eh"><h3>Media</h3><button className="ghost" onClick={() => useMedia.setState({ open: false })}>Done</button></div>
      <h4>Cinema screen</h4>
      <p className="count">{v ? (v.playing ? 'Playing for everyone' : 'Paused') : 'No video yet.'} Anyone in the room can control it, or click the screen.</p>
      <div className="btns2">{file('video', v ? 'Replace video' : 'Upload video', 'video/*')}
        <button disabled={!v} onClick={() => mediaCtl('video', 'play')}>Play</button><button disabled={!v} onClick={() => mediaCtl('video', 'pause')}>Pause</button><button disabled={!v} onClick={() => mediaCtl('video', 'replay')}>Replay</button>
        {owner && v && <button onClick={() => mediaSet('video', null)}>Remove</button>}</div>
      <label className="vol">Film volume<input type="range" min={0} max={1} step={0.05} value={m.videoVol} onChange={(e) => useMedia.setState({ videoVol: +e.target.value })} /></label>
      <h4>Background music</h4>
      <p className="count">{mu ? (mu.playing ? 'Playing, looping for everyone' : 'Stopped') : 'No track yet.'}{!owner && ' The owner starts and stops the music.'}</p>
      <div className="btns2">{file('music', mu ? 'Replace track' : 'Upload track', 'audio/*')}
        {owner && <><button disabled={!mu} onClick={() => mediaCtl('music', 'play')}>Play</button><button disabled={!mu} onClick={() => mediaCtl('music', 'stop')}>Stop</button>{mu && <button onClick={() => mediaSet('music', null)}>Remove</button>}</>}</div>
      <label className="vol">Music volume<input type="range" min={0} max={1} step={0.05} value={m.musicVol} onChange={(e) => useMedia.setState({ musicVol: +e.target.value })} /></label>
      <label className="vol"><span><input type="checkbox" checked={m.muted} onChange={(e) => useMedia.setState({ muted: e.target.checked })} /> Mute music on this device</span></label>
      {owner && (<><h4>Proposal mode</h4>
        <p className="count">Never starts by itself. When you begin, the lights dim and the screen asks the question; only the girl's device can answer.</p>
        <label className="vol">Question<textarea rows={3} value={pr.q || defaultQ(girl)} onChange={(e) => useProp.setState({ q: e.target.value })} /></label>
        <label className="vol">Message if she says yes<textarea rows={2} value={pr.s || defaultS(girl)} onChange={(e) => useProp.setState({ s: e.target.value })} /></label>
        <div className="btns2">{pr.p.active ? <button onClick={endProposal}>End proposal mode</button> : <button onClick={() => startProposal(pr.q || defaultQ(girl), pr.s || defaultS(girl))}>Begin proposal mode</button>}</div></>)}
      <h4>Graphics</h4>
      <select value={m.gfx} onChange={(e) => useMedia.setState({ gfx: e.target.value as typeof m.gfx })}><option value="auto">Auto (adapts to your device)</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
      {err && <p className="err" role="alert">{err}</p>}
    </aside>)
}
