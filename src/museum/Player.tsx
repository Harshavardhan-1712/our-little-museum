import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { MathUtils, Vector3, type Group, type PerspectiveCamera } from 'three'
import Avatar, { type PoseRef } from '../components/Avatar'
import type { Look } from '../store'
import { input, HALF, OBSTACLES, SEATS, myPos } from './input'
import { sendMove, useNet, targets } from '../net'
import { useAct, pose, endBond } from '../act'
import { useUI } from './ui'
const hit = (x: number, z: number) => OBSTACLES.some(([cx, cz, hw, hd]) => Math.abs(x - cx) < hw + 0.3 && Math.abs(z - cz) < hd + 0.3)
export default function Player({ name, look, female }: { name: string; look: Look; female: boolean }) {
  const g = useRef<Group>(null); const lerping = useRef(false); const moving = useRef(false), sitting = useRef(false), near = useRef(false), prevE = useRef(false)
  const poseRef = useRef<PoseRef>({ k: 'none', s: 0, side: 1 }), cin = useRef(0), aim = useRef(new Vector3()), wasLocked = useRef(false), endSent = useRef(false), tN = useRef(0)
  const tSend = useRef(0), mvPrev = useRef(false), sitPrev = useRef(false)
  const pos = useRef({ x: (Math.random() - 0.5) * 4, z: 6.5 }); const face = useRef(0)
  useEffect(() => {
    const dn = (e: KeyboardEvent) => { const t = (e.target as HTMLElement).tagName; if (t !== 'INPUT' && t !== 'TEXTAREA') input.keys.add(e.key.toLowerCase()) }
    const up = (e: KeyboardEvent) => input.keys.delete(e.key.toLowerCase())
    addEventListener('keydown', dn); addEventListener('keyup', up)
    return () => { removeEventListener('keydown', dn); removeEventListener('keyup', up); useUI.setState({ near: false, sitting: false }) }
  }, [])
  useFrame(({ camera }, dt) => {
    const k = input.keys, has = (...a: string[]) => a.some((c) => k.has(c)), meId = useNet.getState().me
    const bond = meId ? useAct.getState().bonds[meId] : undefined, locked = !!bond && bond.kind !== 'hand'
    const pid = bond ? (bond.a === meId ? bond.b : bond.a) : '', pt = pid ? targets[pid] : undefined
    const P = pos.current, face_ = face
    if (locked && sitting.current) { sitting.current = false; useUI.setState({ sitting: false }) }
    let best = -1, bd = 1.3; SEATS.forEach(([sx, sz], i) => { const d = Math.hypot(sx - P.x, sz - P.z); if (d < bd) { bd = d; best = i } })
    const can = !sitting.current && best >= 0 && !bond
    if (can !== near.current) { near.current = can; useUI.setState({ near: can }) }
    const e = has('e'), req = (e && !prevE.current) || input.sitReq; prevE.current = e; input.sitReq = false
    const stand = () => { sitting.current = false; P.z -= 0.95; useUI.setState({ sitting: false }) }
    if (req && !bond) {
      if (sitting.current) stand()
      else if (best >= 0) { P.x = SEATS[best][0]; P.z = SEATS[best][1]; face_.current = Math.PI; sitting.current = true; near.current = false; useUI.setState({ sitting: true, near: false }) }
    }
    lerping.current = false
    if (locked && pt) {
      const dx = P.x - pt.x, dz = P.z - pt.z, l = Math.hypot(dx, dz) || 1
      if (meId === bond!.a) {
        const D = bond!.kind === 'propose' ? 1.05 : bond!.kind === 'kiss' ? 0.7 : 0.66
        const tx = MathUtils.clamp(pt.x + (dx / l) * D, -HALF.x + 0.5, HALF.x - 0.5), tz = MathUtils.clamp(pt.z + (dz / l) * D, -HALF.z + 0.5, HALF.z - 0.5), f = Math.min(1, dt * 4)
        lerping.current = Math.hypot(tx - P.x, tz - P.z) > 0.01; P.x += (tx - P.x) * f; P.z += (tz - P.z) * f
      }
      const dd = Math.atan2(-dx, -dz) - face_.current; face_.current += Math.atan2(Math.sin(dd), Math.cos(dd)) * Math.min(1, dt * 8)
      moving.current = false
    } else {
      if (wasLocked.current) { let n = 0; while (hit(P.x, P.z) && n++ < 12) P.z += 0.3 }
      let ix = (has('d', 'arrowright') ? 1 : 0) - (has('a', 'arrowleft') ? 1 : 0) + input.x
      let iz = (has('s', 'arrowdown') ? 1 : 0) - (has('w', 'arrowup') ? 1 : 0) + input.y
      const len = Math.hypot(ix, iz); if (sitting.current && len > 0.3) stand()
      moving.current = len > 0.12 && !sitting.current
      if (moving.current) {
        ix /= Math.max(len, 1); iz /= Math.max(len, 1)
        const sy = Math.sin(input.yaw), cy = Math.cos(input.yaw), sp = (has('shift') ? 4.6 : 2.8) * dt
        const dx = (cy * ix + sy * iz) * sp, dz = (-sy * ix + cy * iz) * sp
        const lim = (v: number, h: number) => MathUtils.clamp(v, -h + 0.5, h - 0.5)
        const nx = lim(P.x + dx, HALF.x); if (!hit(nx, P.z)) P.x = nx
        const nz = lim(P.z + dz, HALF.z); if (!hit(P.x, nz)) P.z = nz
        let d = Math.atan2(dx, dz) - face_.current
        d = Math.atan2(Math.sin(d), Math.cos(d)); face_.current += d * Math.min(1, dt * 10)
      }
    }
    wasLocked.current = locked
    if (bond?.kind === 'hand' && meId === bond.a && pt && Math.hypot(pt.x - P.x, pt.z - P.z) > 2.6) { if (!endSent.current) { endSent.current = true; endBond() } } else if (!bond) endSent.current = false
    myPos.x = P.x; myPos.z = P.z; myPos.face = face_.current; pose(meId ?? '', P.x, P.z, face_.current, poseRef.current)
    tN.current += dt
    if (tN.current > 0.2) {
      tN.current = 0; let id = '', b2 = 3
      for (const q of useNet.getState().peers) { const t = targets[q.id]; if (!t) continue; const d = Math.hypot(t.x - P.x, t.z - P.z); if (d < b2) { b2 = d; id = q.id } }
      if ((useAct.getState().nearby?.id ?? '') !== id) useAct.setState({ nearby: id ? { id, name: useNet.getState().peers.find((q) => q.id === id)?.name ?? '' } : null })
    }
    tSend.current += dt
    if (tSend.current > 0.066 && (moving.current || lerping.current || mvPrev.current !== moving.current || sitPrev.current !== sitting.current || tSend.current > 1)) {
      tSend.current = 0; mvPrev.current = moving.current; sitPrev.current = sitting.current; sendMove(P.x, P.z, face_.current, moving.current, sitting.current)
    }
    if (g.current) { g.current.position.set(P.x, 0, P.z); g.current.rotation.y = face_.current }
    const D = 4.2, cp = Math.cos(input.pitch), cc = (v: number, h: number) => MathUtils.clamp(v, -h + 0.3, h - 0.3)
    const ct = bond?.kind === 'propose' && pt ? 1 : 0; cin.current += (ct - cin.current) * Math.min(1, dt * 2.2)
    const ease = cin.current * cin.current * (3 - 2 * cin.current)
    camera.position.set(cc(P.x + Math.sin(input.yaw) * D * cp, HALF.x), 1.6 + Math.sin(input.pitch) * D, cc(P.z + Math.cos(input.yaw) * D * cp, HALF.z))
    aim.current.set(P.x, 1.5, P.z)
    if (ease > 0.001 && pt) {
      const ax = pt.x - P.x, az = pt.z - P.z, l = Math.hypot(ax, az) || 1; let px = az / l, pz = -ax / l; if (pz < 0) { px = -px; pz = -pz }
      const mx = (P.x + pt.x) / 2, mz = (P.z + pt.z) / 2
      camera.position.lerp(new Vector3(cc(mx + px * 3, HALF.x), 1.15, cc(mz + pz * 3, HALF.z)), ease); aim.current.lerp(new Vector3(mx, 1.15, mz), ease)
    }
    const cam = camera as PerspectiveCamera, fov = 58 - 16 * ease
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix() }
    camera.lookAt(aim.current)
  })
  return (
    <group ref={g}>
      <Avatar look={look} female={female} spin={false} moving={moving} sitting={sitting} pose={poseRef} offset={0} />
      <Html position={[0, 2.55, 0]} center zIndexRange={[5, 0]}><div className="tag">{name || (female ? 'Girl' : 'Boy')}</div></Html>
    </group>
  )
}
