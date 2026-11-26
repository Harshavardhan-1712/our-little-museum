import { create } from 'zustand'
import { useNet, targets, emit } from './net'
import { myPos } from './museum/input'
import type { PoseRef } from './components/Avatar'
export type Kind = 'hand' | 'hug' | 'kiss' | 'propose'
export type Bond = { a: string; b: string; kind: Kind }
type A = { bonds: Record<string, Bond>; incoming: { from: string; name: string; kind: Kind } | null; waiting: boolean; nearby: { id: string; name: string } | null; notice: string }
export const useAct = create<A>(() => ({ bonds: {}, incoming: null, waiting: false, nearby: null, notice: '' }))
export const where = (id: string) => (id === useNet.getState().me ? myPos : targets[id])
export const request = (to: string, kind: Kind) => { emit('act:request', { to, kind }); useAct.setState({ waiting: true }); setTimeout(() => useAct.setState({ waiting: false }), 15000) }
export const respond = (accept: boolean) => { const i = useAct.getState().incoming; if (!i) return; emit('act:respond', { to: i.from, accept }); useAct.setState({ incoming: null }) }
export const endBond = () => emit('act:end')
export function pose(id: string, x: number, z: number, face: number, out: PoseRef) {
  const b = useAct.getState().bonds[id], o = b && where(b.a === id ? b.b : b.a)
  if (!b || !o) { out.k = 'none'; return }
  const dx = o.x - x, dz = o.z - z
  out.s = Math.hypot(dx, dz); out.side = dx * Math.cos(face) - dz * Math.sin(face) >= 0 ? 1 : -1
  out.k = b.kind === 'hand' ? 'hold' : b.kind === 'propose' ? (b.a === id ? 'kneel' : 'rec') : b.kind
}
