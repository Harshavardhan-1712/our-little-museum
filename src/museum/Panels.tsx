import { useEffect, useRef, useState } from 'react'
import { useNet, sendChat } from '../net'
import { useMuseum, uploadFiles, defaultDedication, MAX_PHOTOS, MIN_PHOTOS } from '../store'
const stop = (e: React.PointerEvent) => e.stopPropagation()
export function Lightbox() {
  const { photos, viewing, set } = useMuseum(); const p = photos.find((x) => x.id === viewing)
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') set({ viewing: null }) }; addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [set])
  if (!p) return null
  return (<div className="lightbox" onPointerDown={(e) => { stop(e); set({ viewing: null }) }}>
    <figure onPointerDown={stop}><img src={p.url} alt={p.caption || 'Memory'} />{p.caption && <figcaption>{p.caption}</figcaption>}</figure>
    <button className="ghost close" onClick={() => set({ viewing: null })}>Close</button></div>)
}
export function EditPanel() {
  const s = useMuseum(); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  if (!s.editing) return null
  const upload = async (files: FileList | null, id?: string) => {
    if (!files?.length) return; setBusy(true); setMsg('')
    try {
      const room = id ? 1 : MAX_PHOTOS - s.photos.length; const list = [...files].slice(0, room)
      if (!list.length) throw new Error(`Gallery is full (${MAX_PHOTOS} photos).`)
      const urls = await uploadFiles(list); if (id) s.replace(id, urls[0]); else s.addPhotos(urls)
    } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <aside className="edit" onPointerDown={stop}>
      <div className="eh"><h3>Edit the gallery</h3><button className="ghost" onClick={() => s.set({ editing: false })}>Done</button></div>
      <label>Dedication<textarea rows={6} value={s.dedication ?? defaultDedication(s.girl)} onChange={(e) => s.set({ dedication: e.target.value })} /></label>
      <p className="count">{s.photos.length} of {MAX_PHOTOS} photos{s.photos.length < MIN_PHOTOS && ` (add at least ${MIN_PHOTOS})`}. The first photo is the centrepiece.</p>
      <label className="cta add">{busy ? 'Uploading…' : 'Add photos'}<input type="file" accept="image/*" multiple hidden disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = '' }} /></label>
      {msg && <p className="err" role="alert">{msg}</p>}
      <ul>{s.photos.map((p, i) => (
        <li key={p.id}><img src={p.url} alt="" />
          <div><input placeholder={i === 0 ? 'Centrepiece caption' : 'Caption (optional)'} value={p.caption} maxLength={80} onChange={(e) => s.setCaption(p.id, e.target.value)} />
            <div className="btns">
              <button disabled={i === 0} onClick={() => s.move(p.id, -1)}>Earlier</button><button disabled={i === s.photos.length - 1} onClick={() => s.move(p.id, 1)}>Later</button>
              {i > 0 && <button onClick={() => s.makeFirst(p.id)}>Make centrepiece</button>}
              <label>Replace<input type="file" accept="image/*" hidden onChange={(e) => { void upload(e.target.files, p.id); e.target.value = '' }} /></label>
              <button onClick={() => s.remove(p.id)}>Remove</button></div></div></li>))}</ul>
    </aside>)
}
export function Chat() {
  const chat = useNet((s) => s.chat), code = useNet((s) => s.code), me = useNet((s) => s.me)
  const [open, setOpen] = useState(false), [text, setText] = useState(''), [seen, setSeen] = useState(0); const end = useRef<HTMLDivElement>(null)
  useEffect(() => { if (open) { setSeen(chat.length); end.current?.scrollIntoView() } }, [chat, open])
  if (!code) return null
  const send = () => { if (text.trim()) { sendChat(text.trim()); setText('') } }
  return (
    <div className="chat" onPointerDown={stop}>
      {open && <div className="log">{chat.map((m) => <p key={m.id} className={m.fromId === me ? 'mine' : ''}><b>{m.from}</b> {m.text}</p>)}<div ref={end} /></div>}
      {open && <div className="send"><input aria-label="Message" placeholder="Say something" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }} /><button className="ghost" onClick={send}>Send</button></div>}
      <button className="ghost" onClick={() => setOpen(!open)}>{open ? 'Hide chat' : `Chat${chat.length - seen > 0 ? ` (${chat.length - seen})` : ''}`}</button>
    </div>)
}
