import { io, type Socket } from 'socket.io-client'
import { create } from 'zustand'
import { useMuseum, type Look } from './store'
import { useMedia } from './media'
import { useProp, type Prop } from './proposal'
import { useAct, type Bond, type Kind } from './act'
import type { Media } from './shared'
export type Peer = { id: string; name: string; look: Look; female: boolean; x: number; z: number; ry: number }
export type Msg = { id: string; from: string; fromId: string; text: string; t: number }
type Net = { code: string | null; me: string | null; ownerId: string | null; peers: Peer[]; chat: Msg[] }
export const useNet = create<Net>(() => ({ code: null, me: null, ownerId: null, peers: [], chat: [] }))
export const isOwner = (n: Net) => n.code === null || n.ownerId === n.me
export const targets: Record<string, { x: number; z: number; ry: number; mv: boolean; sit: boolean; at: number }> = {}
let sock: Socket | null = null, wasOwner = false, timer: ReturnType<typeof setTimeout> | undefined
type JoinAck = { ok: boolean; error?: string; you: string; owner: string; peers: Peer[]; chat: Msg[]; gallery: { photos: []; dedication: string | null }; media: Media; now: number; bonds: Bond[]; proposal: Prop }
const payload = (code: string, create: boolean) => {
  const s = useMuseum.getState(), f = s.role === 'girl'
  return { code, create, name: f ? s.girl : s.boy, look: f ? s.girlLook : s.boyLook, female: f, gallery: { photos: s.photos, dedication: s.dedication }, media: useMedia.getState().media }
}
const emitJoin = (code: string, create: boolean) => new Promise<string | null>((res) => {
  const t0 = Date.now()
  sock!.emit('room:join', payload(code, create), (r: JoinAck) => {
    if (!r.ok) return res(r.error ?? 'Could not join.')
    useMedia.setState({ media: r.media, offset: r.now - (t0 + Date.now()) / 2 })
    r.peers.forEach((p) => { targets[p.id] = { x: p.x, z: p.z, ry: p.ry, mv: false, sit: false, at: 0 } })
    useNet.setState({ code, me: r.you, ownerId: r.owner, peers: r.peers.filter((p) => p.id !== r.you), chat: r.chat })
    if (r.owner !== r.you) useMuseum.setState({ photos: r.gallery.photos, dedication: r.gallery.dedication })
    useAct.setState({ bonds: Object.fromEntries(r.bonds.flatMap((b) => [[b.a, b], [b.b, b]])) })
    useProp.setState({ p: r.proposal })
    wasOwner = r.owner === r.you; res(null)
  })
})
export function joinRoom(code: string, create: boolean) {
  leaveRoom()
  return new Promise<string | null>((res) => {
    const s = (sock = io()); let done = false
    s.on('connect_error', () => { if (!done) { done = true; s.close(); sock = null; res('Could not reach the museum server. Is it running (npm run server)?') } })
    s.on('connect', () => {
      const first = !done; done = true
      void emitJoin(code, first ? create : wasOwner).then((err) => { if (first) { if (err) { s.close(); sock = null } res(err) } })
    })
    s.on('room:peer-joined', (p: Peer) => { targets[p.id] = { x: p.x, z: p.z, ry: p.ry, mv: false, sit: false, at: 0 }; useNet.setState((n) => ({ peers: [...n.peers.filter((q) => q.id !== p.id), p] })) })
    s.on('room:peer-left', (id: string) => { delete targets[id]; useNet.setState((n) => ({ peers: n.peers.filter((q) => q.id !== id) })) })
    s.on('media:state', (m: Media) => useMedia.setState({ media: m }))
    s.on('act:request', (r: { from: string; name: string; kind: Kind }) => { useAct.setState({ incoming: r }); setTimeout(() => { if (useAct.getState().incoming?.from === r.from) useAct.setState({ incoming: null }) }, 15000) })
    s.on('act:declined', (r: { name: string }) => useAct.setState({ waiting: false, notice: `${r.name} isn't ready yet.` }))
    s.on('act:start', (b: Bond) => useAct.setState((a) => ({ waiting: false, incoming: null, bonds: { ...a.bonds, [b.a]: b, [b.b]: b } })))
    s.on('act:ended', (b: Bond) => useAct.setState((a) => { const m = { ...a.bonds }; delete m[b.a]; delete m[b.b]; return { bonds: m } }))
    s.on('proposal:state', (p: Prop) => useProp.setState({ p }))
    s.on('room:owner', (id: string) => useNet.setState({ ownerId: id }))
    s.on('player:moved', (m: { id: string; x: number; z: number; ry: number; mv: boolean; sit: boolean }) => { targets[m.id] = { x: m.x, z: m.z, ry: m.ry, mv: m.mv, sit: !!m.sit, at: performance.now() } })
    s.on('chat:msg', (m: Msg) => useNet.setState((n) => ({ chat: [...n.chat, m].slice(-100) })))
    s.on('gallery:state', (g: { photos: []; dedication: string | null }) => useMuseum.setState({ photos: g.photos, dedication: g.dedication }))
  })
}
export function leaveRoom() {
  sock?.close(); sock = null; Object.keys(targets).forEach((k) => delete targets[k])
  useNet.setState({ code: null, me: null, ownerId: null, peers: [], chat: [] })
  useAct.setState({ bonds: {}, incoming: null, waiting: false, nearby: null })
  useProp.setState({ p: { active: false, answer: null, question: '', success: '' } })
  useMedia.setState((s) => ({ offset: 0, media: { video: s.media.video && { ...s.media.video, playing: false, base: 0 }, music: s.media.music && { ...s.media.music, playing: false, base: 0 } } }))
}
export const sendMove = (x: number, z: number, ry: number, mv: boolean, sit: boolean) => { sock?.volatile.emit('player:move', { x, z, ry, mv, sit }) }
export const emit = (e: string, p?: unknown) => { sock?.emit(e, p) }
export const sendChat = (t: string) => { sock?.emit('chat:send', t) }
// the owner's gallery edits are shared with the room
useMuseum.subscribe((s, prev) => {
  if (s.photos === prev.photos && s.dedication === prev.dedication) return
  const n = useNet.getState(); if (!sock || !n.code || n.ownerId !== n.me) return
  clearTimeout(timer)
  timer = setTimeout(() => { const g = useMuseum.getState(); sock?.emit('gallery:update', { photos: g.photos, dedication: g.dedication }) }, 400)
})
