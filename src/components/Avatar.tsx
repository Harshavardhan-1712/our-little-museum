import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Look } from '../store'
export type PoseRef = { k: 'none' | 'hold' | 'hug' | 'kiss' | 'kneel' | 'rec'; s: number; side: number }
type P = { look: Look; female: boolean; spin?: boolean; moving?: MutableRefObject<boolean>; sitting?: MutableRefObject<boolean>; pose?: MutableRefObject<PoseRef>; offset?: number }
const mix = (a: number, b: number, t: number) => a + (b - a) * t
export default function Avatar({ look, female, spin = true, moving, sitting, pose, offset = -1.1 }: P) {
  const g = useRef<Group>(null), ll = useRef<Group>(null), lr = useRef<Group>(null), al = useRef<Group>(null), ar = useRef<Group>(null)
  const box = useRef<Group>(null), lid = useRef<Group>(null)
  const t = useRef(0), amp = useRef(0), sit = useRef(0), pa = useRef(0), kt = useRef(0), last = useRef<PoseRef['k']>('none')
  useFrame((_, d) => {
    if (spin) { if (g.current) g.current.rotation.y += d * 0.35; return }
    const p = pose?.current, on = !!p && p.k !== 'none'; if (on) last.current = p!.k
    const k = last.current, f = Math.min(1, d * 6); pa.current += ((on ? 1 : 0) - pa.current) * f; const pw = pa.current
    const m = moving?.current && !(on && k !== 'hold') ? 1 : 0
    amp.current += (m - amp.current) * Math.min(1, d * 10); t.current += d * 8 * (0.4 + amp.current)
    const w = Math.sin(t.current) * 0.7 * amp.current
    sit.current += ((sitting?.current ? 1 : 0) - sit.current) * Math.min(1, d * 8); const q = sit.current * (1 - pw)
    kt.current = on && k === 'kneel' ? kt.current + d : 0
    let lx = w * (1 - q) - 1.45 * q, rx = -w * (1 - q) - 1.45 * q, alx = -w * 0.8 * (1 - q) - 0.5 * q, arx = w * 0.8 * (1 - q) - 0.5 * q
    let alz = 0, arz = 0, lean = 0, drop = 0.33 * q
    if (pw > 0.001 && p) {
      const T = (ax: number, az: number, bx: number, bz: number) => { alx = mix(alx, ax, pw); alz = mix(alz, az, pw); arx = mix(arx, bx, pw); arz = mix(arz, bz, pw) }
      if (k === 'hug') { T(-1.25, 0.5, -1.25, -0.5); lean = 0.03 * pw }
      else if (k === 'kiss') { T(-1.0, 0.45, -1.0, -0.45); lean = 0.07 * pw }
      else if (k === 'rec') T(-1.15, 0.45, -1.15, -0.45)
      else if (k === 'kneel') { T(-0.9, 0.5, -1.5, 0); lx = mix(lx, -1.1, pw); rx = mix(rx, 1.2, pw); drop = mix(drop, 0.5, pw) }
      else if (k === 'hold') {
        const th = Math.asin(Math.min(1, Math.max(0, (p.s / 2 - 0.39) / 0.72)))
        if (p.side > 0) { arx = mix(arx, -0.12, pw); arz = mix(arz, th, pw) } else { alx = mix(alx, -0.12, pw); alz = mix(alz, -th, pw) }
      }
    }
    if (ll.current && lr.current && al.current && ar.current) {
      ll.current.rotation.x = lx; lr.current.rotation.x = rx; al.current.rotation.set(alx, 0, alz); ar.current.rotation.set(arx, 0, arz)
    }
    if (g.current) { g.current.position.y = offset - drop; g.current.rotation.x = lean }
    if (box.current) box.current.visible = k === 'kneel' && pw > 0.5
    if (lid.current) lid.current.rotation.x = -Math.min(1, Math.max(0, (kt.current - 1.2) / 0.8)) * 1.9
  })
  const skin = <meshStandardMaterial color={look.skin} roughness={0.55} />
  const cloth = <meshStandardMaterial color={look.outfit} roughness={0.8} />
  const hair = <meshStandardMaterial color={look.hairColor} roughness={0.45} />
  const bw = female ? 0.22 : 0.29
  return (
    <group ref={g} position={[0, offset, 0]}>
      {([[-0.12, ll], [0.12, lr]] as const).map(([x, r]) => (
        <group key={x} ref={r} position={[x, 0.97, 0]}><mesh position={[0, -0.47, 0]} castShadow><capsuleGeometry args={[0.085, 0.75, 6, 12]} />
          {female ? skin : <meshStandardMaterial color="#26262b" roughness={0.8} />}</mesh></group>
      ))}
      <mesh position={[0, 1.3, 0]} castShadow><capsuleGeometry args={[bw, 0.5, 8, 16]} />{cloth}</mesh>
      {female && <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.2, 0.5, 0.7, 28]} />{cloth}</mesh>}
      {([[-1, al], [1, ar]] as const).map(([s, r]) => (
        <group key={s} ref={r} position={[s * (bw + 0.1), 1.55, 0]}><mesh position={[0, -0.35, 0]} castShadow><capsuleGeometry args={[0.06, 0.6, 6, 12]} />{skin}</mesh>
          {s === 1 && (
            <group ref={box} visible={false} position={[0, -0.8, 0]} rotation={[1.5, 0, 0]}>
              <mesh position={[0, 0.035, 0]}><boxGeometry args={[0.13, 0.07, 0.1]} /><meshStandardMaterial color="#1a0f0a" roughness={0.9} /></mesh>
              <mesh position={[0, 0.072, 0]}><boxGeometry args={[0.1, 0.006, 0.075]} /><meshStandardMaterial color="#6b1d2a" roughness={1} /></mesh>
              <mesh position={[0, 0.095, 0]}><torusGeometry args={[0.022, 0.005, 10, 24]} /><meshStandardMaterial color="#e6c35c" metalness={1} roughness={0.25} /></mesh>
              <mesh position={[0, 0.123, 0]}><octahedronGeometry args={[0.014]} /><meshStandardMaterial color="#f5fbff" roughness={0.05} emissive="#cfe8ff" emissiveIntensity={0.7} /></mesh>
              <group ref={lid} position={[0, 0.07, -0.05]}><mesh position={[0, 0.012, 0.05]}><boxGeometry args={[0.13, 0.024, 0.1]} /><meshStandardMaterial color="#1a0f0a" roughness={0.9} /></mesh></group>
            </group>)}
        </group>
      ))}
      <mesh position={[0, 1.78, 0]}><cylinderGeometry args={[0.07, 0.08, 0.15, 12]} />{skin}</mesh>
      <mesh position={[0, 1.97, 0]} castShadow><sphereGeometry args={[0.2, 32, 32]} />{skin}</mesh>
      {[-0.07, 0.07].map((x) => (<mesh key={x} position={[x, 1.99, 0.18]}><sphereGeometry args={[0.018, 12, 12]} /><meshStandardMaterial color="#120d09" /></mesh>))}
      <mesh position={[0, 2.01, -0.025]} scale={[1, 0.82, 1.05]} castShadow><sphereGeometry args={[0.215, 32, 32]} />{hair}</mesh>
      {look.hair === 'long' && <mesh position={[0, 1.78, -0.12]} castShadow><capsuleGeometry args={[0.17, 0.45, 8, 16]} />{hair}</mesh>}
      {look.hair === 'bun' && <mesh position={[0, 2.23, -0.04]}><sphereGeometry args={[0.09, 20, 20]} />{hair}</mesh>}
    </group>
  )
}
