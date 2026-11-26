import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { ctl, setTrack, type Media, type Action } from '../src/shared'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
const MAX = 4
type Peer = { id: string; name: string; look: unknown; female: boolean; x: number; z: number; ry: number }
type Msg = { id: string; from: string; fromId: string; text: string; t: number }
type Bond = { a: string; b: string; kind: string }
type Proposal = { active: boolean; answer: 'yes' | 'notyet' | null; question: string; success: string }
type Gallery = { photos: { id: string; url: string; caption: string }[]; dedication: string | null }
type Room = { peers: Map<string, Peer>; owner: string; gallery: Gallery; chat: Msg[]; media: Media; bonds: Map<string, Bond>; pend: Map<string, string>; proposal: Proposal }
const rooms = new Map<string, Room>()
const app = express(); app.use(cors())
app.get('/health', (_q, r) => { r.json({ ok: true, rooms: rooms.size }) })
const UP = path.resolve(process.env.UPLOAD_DIR || 'uploads'); fs.mkdirSync(UP, { recursive: true })
const upload = multer({
  storage: multer.diskStorage({ destination: UP, filename: (_q, f, cb) => cb(null, randomUUID() + path.extname(f.originalname).toLowerCase().slice(0, 6)) }),
  limits: { fileSize: 15 * 1024 * 1024, files: 45 }, fileFilter: (_q, f, cb) => cb(null, f.mimetype.startsWith('image/')),
})
app.use('/uploads', express.static(UP, { maxAge: '7d' }))
app.post('/api/upload', upload.array('files', 45), (q, r) => {
  const files = (q.files as Express.Multer.File[] | undefined) ?? []
  if (!files.length) { r.status(400).json({ error: 'No valid image files received.' }); return }
  r.json({ urls: files.map((f) => '/uploads/' + f.filename) })
})
// Serve the production React application
const dist = path.resolve('dist')

app.use(express.static(dist))

// Handle browser navigation and room invite URLs
app.get(/.*/, (_q, r) => {
  const index = path.join(dist, 'index.html')

  if (fs.existsSync(index)) {
    r.sendFile(index)
  } else {
    r.status(404).send('Frontend build not found. Run npm run build.')
  }
})
const uploadMedia = multer({
  storage: multer.diskStorage({ destination: UP, filename: (_q, f, cb) => cb(null, randomUUID() + path.extname(f.originalname).toLowerCase().slice(0, 6)) }),
  limits: { fileSize: 200 * 1024 * 1024, files: 1 }, fileFilter: (_q, f, cb) => cb(null, /^(video|audio)\//.test(f.mimetype)),
})
app.post('/api/upload-media', uploadMedia.single('file'), (q, r) => {
  if (!q.file) { r.status(400).json({ error: 'Choose a video or audio file.' }); return }
  r.json({ url: '/uploads/' + q.file.filename })
})
const DIST = path.resolve('dist'), INDEX = path.join(DIST, 'index.html')
app.disable('x-powered-by')
if (fs.existsSync(INDEX)) {
  app.use(express.static(DIST, { maxAge: '1h' }))
  app.use((q, r, n) => { if (q.method === 'GET' && !q.path.startsWith('/uploads') && !q.path.startsWith('/api')) r.sendFile(INDEX); else n() })
}
// Serve production frontend
const distPath = path.resolve('dist')

app.use(express.static(distPath))

// Support direct navigation and room invite links
app.get('/{*splat}', (_q, r) => {
  r.sendFile(path.join(distPath, 'index.html'))
})

// Error handler
app.use((e: Error, _q: express.Request, r: express.Response, _n: express.NextFunction) => {
  r.status(400).json({ error: e.message })
})const http = createServer(app)
const io = new Server(http, { cors: { origin: '*' } })
const clean = (v: unknown, n: number) => String(v ?? '').slice(0, n)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanTrack = (t: any) => (typeof t?.url === 'string' && t.url.startsWith('/uploads/') ? { url: clean(t.url, 120), playing: false, base: 0, at: Date.now() } : null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanMedia = (m: any): Media => ({ video: cleanTrack(m?.video), music: cleanTrack(m?.music) })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanGallery = (g: any): Gallery => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photos: (Array.isArray(g?.photos) ? g.photos : []).slice(0, 45).filter((p: any) => typeof p?.url === 'string' && p.url.startsWith('/uploads/'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({ id: clean(p.id, 60), url: clean(p.url, 120), caption: clean(p.caption, 80) })),
  dedication: g?.dedication == null ? null : clean(g.dedication, 600),
})
io.on('connection', (sock) => {
  let code = ''
  const room = () => rooms.get(code)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sock.on('room:join', (p: any, ack?: (r: object) => void) => {
    const c = clean(p?.code, 12).toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (c.length < 3) return ack?.({ ok: false, error: 'Room code must be 3 to 12 letters or numbers.' })
    let r = rooms.get(c)
    if (!r) {
      if (!p?.create) return ack?.({ ok: false, error: 'No room with that code. Ask for the invite link again.' })
      r = { peers: new Map(), owner: sock.id, gallery: cleanGallery(p?.gallery), chat: [], media: cleanMedia(p?.media), bonds: new Map(), pend: new Map(), proposal: { active: false, answer: null, question: '', success: '' } }; rooms.set(c, r)
    }
    if (!r.peers.has(sock.id) && r.peers.size >= MAX) return ack?.({ ok: false, error: 'This room is full (4 people).' })
    code = c
    const peer: Peer = { id: sock.id, name: clean(p?.name, 24) || 'Guest', look: p?.look, female: !!p?.female, x: 0, z: 4.5, ry: 0 }
    r.peers.set(sock.id, peer); void sock.join(c)
    ack?.({ ok: true, you: sock.id, owner: r.owner, peers: [...r.peers.values()], gallery: r.gallery, chat: r.chat, media: r.media, now: Date.now(), bonds: [...new Set(r.bonds.values())], proposal: r.proposal })
    sock.to(c).emit('room:peer-joined', peer)
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sock.on('player:move', (m: any) => {
    const pr = room()?.peers.get(sock.id); if (!pr) return
    pr.x = Number(m?.x) || 0; pr.z = Number(m?.z) || 0; pr.ry = Number(m?.ry) || 0
    sock.to(code).volatile.emit('player:moved', { id: sock.id, x: pr.x, z: pr.z, ry: pr.ry, mv: !!m?.mv, sit: !!m?.sit })
  })
  sock.on('chat:send', (t: unknown) => {
    const r = room(), pr = r?.peers.get(sock.id), text = clean(t, 300).trim(); if (!r || !pr || !text) return
    const msg: Msg = { id: randomUUID(), from: pr.name, fromId: sock.id, text, t: Date.now() }
    r.chat.push(msg); if (r.chat.length > 50) r.chat.shift(); io.to(code).emit('chat:msg', msg)
  })
  sock.on('gallery:update', (g: unknown) => {
    const r = room(); if (!r || r.owner !== sock.id) return
    r.gallery = cleanGallery(g); sock.to(code).emit('gallery:state', r.gallery)
  })
  sock.on('media:set', (m: { kind?: string; url?: unknown }) => {
    const r = room(); if (!r || r.owner !== sock.id || (m?.kind !== 'video' && m?.kind !== 'music')) return
    const url = typeof m.url === 'string' && m.url.startsWith('/uploads/') ? clean(m.url, 120) : null
    r.media = setTrack(r.media, m.kind, url, Date.now()); io.to(code).emit('media:state', r.media)
  })
  sock.on('media:ctl', (m: { kind?: string; action?: string }) => {
    const r = room(); if (!r || (m?.kind !== 'video' && m?.kind !== 'music')) return
    if (m.kind === 'music' && r.owner !== sock.id) return
    if (!['play', 'pause', 'replay', 'stop', 'end'].includes(String(m.action))) return
    r.media = ctl(r.media, m.kind, m.action as Action, Date.now()); io.to(code).emit('media:state', r.media)
  })
  sock.on('act:request', (m: { to?: string; kind?: string }) => {
    const r = room(), me = r?.peers.get(sock.id), to = String(m?.to), kind = String(m?.kind)
    if (!r || !me || !r.peers.has(to) || to === sock.id || !['hand', 'hug', 'kiss', 'propose'].includes(kind)) return
    if (r.bonds.has(sock.id) || r.bonds.has(to) || (kind === 'propose' && me.female)) return
    const key = `${sock.id}>${to}`; r.pend.set(key, kind); setTimeout(() => r.pend.delete(key), 15000)
    io.to(to).emit('act:request', { from: sock.id, name: me.name, kind })
  })
  sock.on('act:respond', (m: { to?: string; accept?: boolean }) => {
    const r = room(), me = r?.peers.get(sock.id), key = `${m?.to}>${sock.id}`, kind = r?.pend.get(key)
    if (!r || !me || !kind) return
    r.pend.delete(key)
    if (!m.accept || r.bonds.has(sock.id) || r.bonds.has(String(m.to))) { io.to(String(m.to)).emit('act:declined', { name: me.name }); return }
    const b: Bond = { a: String(m.to), b: sock.id, kind }; r.bonds.set(b.a, b); r.bonds.set(b.b, b); io.to(code).emit('act:start', b)
  })
  sock.on('act:end', () => {
    const r = room(), b = r?.bonds.get(sock.id); if (!r || !b) return
    r.bonds.delete(b.a); r.bonds.delete(b.b); io.to(code).emit('act:ended', b)
  })
  sock.on('proposal:start', (m: { question?: unknown; success?: unknown }) => {
    const r = room(); if (!r || r.owner !== sock.id) return
    r.proposal = { active: true, answer: null, question: clean(m?.question, 240), success: clean(m?.success, 240) }
    if (r.media.video) { r.media = ctl(r.media, 'video', 'pause', Date.now()); io.to(code).emit('media:state', r.media) }
    io.to(code).emit('proposal:state', r.proposal)
  })
  sock.on('proposal:answer', (a: unknown) => {
    const r = room(), pr = r?.peers.get(sock.id)
    if (!r || !pr?.female || !r.proposal.active || r.proposal.answer === 'yes' || (a !== 'yes' && a !== 'notyet')) return
    r.proposal = { ...r.proposal, answer: a }; io.to(code).emit('proposal:state', r.proposal)
  })
  sock.on('proposal:end', () => {
    const r = room(); if (!r || r.owner !== sock.id) return
    r.proposal = { ...r.proposal, active: false, answer: null }; io.to(code).emit('proposal:state', r.proposal)
  })
  sock.on('disconnect', () => {
    const r = room(); if (!r) return
    const bd = r.bonds.get(sock.id); if (bd) { r.bonds.delete(bd.a); r.bonds.delete(bd.b); io.to(code).emit('act:ended', bd) }
    r.peers.delete(sock.id); io.to(code).emit('room:peer-left', sock.id)
    if (!r.peers.size) { rooms.delete(code); return }
    if (r.owner === sock.id) { r.owner = [...r.peers.keys()][0]; io.to(code).emit('room:owner', r.owner) }
  })
})
http.listen(Number(process.env.PORT) || 3001, () => console.log('Museum server up'))
