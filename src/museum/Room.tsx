import { useMemo } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { BENCHES, HALF, type Q } from './input'
import { useProp } from '../proposal'
const W = HALF.x * 2, D = HALF.z * 2, H = 5
const Box = ({ p, s, c, e = 0, r = 0.8 }: { p: [number, number, number]; s: [number, number, number]; c: string; e?: number; r?: number }) => (
  <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={r} emissive={e ? c : '#000'} emissiveIntensity={e} /></mesh>
)
function Bench({ x, z }: { x: number; z: number }) {
  return (<group position={[x, 0, z]}>
    <Box p={[0, 0.48, 0]} s={[3.1, 0.14, 0.8]} c="#3a2314" r={0.4} /><Box p={[0, 0.58, 0]} s={[2.9, 0.08, 0.64]} c="#5b2a2a" r={0.7} />
    <Box p={[-1.3, 0.24, 0]} s={[0.12, 0.48, 0.7]} c="#1d120a" /><Box p={[1.3, 0.24, 0]} s={[0.12, 0.48, 0.7]} c="#1d120a" /></group>)
}
function Dimmer({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null), k = useRef(1)
  useFrame((_, d) => {
    k.current += ((useProp.getState().p.active ? 0.35 : 1) - k.current) * Math.min(1, d * 1.5)
    g.current?.traverse((o) => { const l = o as THREE.Light & { isLight?: boolean }; if (l.isLight) { l.userData.b ??= l.intensity; l.intensity = l.userData.b * k.current } })
  })
  return <group ref={g}>{children}</group>
}
export default function Room({ q }: { q: Q }) {
  const floor = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d')!
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) {
      const l = 30 + Math.random() * 8; x.fillStyle = `hsl(28 45% ${l}%)`; x.fillRect(i * 64, j * 128 + (i % 2) * 64 - 64, 63, 127)
      x.strokeStyle = 'rgba(30,15,5,.25)'; for (let n = 0; n < 5; n++) { x.beginPath(); const yy = j * 128 + Math.random() * 128; x.moveTo(i * 64 + 4, yy); x.lineTo(i * 64 + 60, yy + 6); x.stroke() }
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 4, D / 4); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t
  }, [])
  const wall = <meshStandardMaterial color="#efe4cf" roughness={0.92} />
  return (<>
    <Dimmer>
    <hemisphereLight args={['#fff0d8', '#3a2412', 0.35]} />
    {[[-7, 2], [7, 2], [-7, -3], [7, -3], [0, -3], [0, 3]].map(([x, z], i) => <pointLight key={i} position={[x, 4.4, z]} intensity={18} distance={14} color="#ffd9a0" />)}
    {[-4, 4].map((x) => (<spotLight key={x} position={[x, 4.8, 6]} target-position={[0, 1.5, -8]} angle={0.55} penumbra={0.8} intensity={140} color="#ffe2b0" castShadow={q !== 'low'} shadow-mapSize={[1024, 1024]} />))}
    </Dimmer>
    <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[W, D]} />
      {q !== 'high' ? <meshStandardMaterial map={floor} roughness={0.35} /> : <MeshReflectorMaterial map={floor} resolution={512} blur={[300, 100]} mixBlur={1} mixStrength={0.7} roughness={0.75} mirror={0} color="#ffffff" />}</mesh>
    <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}><planeGeometry args={[W, D]} /><meshStandardMaterial color="#f6efe0" roughness={1} /></mesh>
    <mesh position={[0, H / 2, -HALF.z]} receiveShadow><planeGeometry args={[W, H]} />{wall}</mesh>
    <mesh position={[0, H / 2, HALF.z]} rotation-y={Math.PI} receiveShadow><planeGeometry args={[W, H]} />{wall}</mesh>
    <mesh position={[-HALF.x, H / 2, 0]} rotation-y={Math.PI / 2} receiveShadow><planeGeometry args={[D, H]} />{wall}</mesh>
    <mesh position={[HALF.x, H / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow><planeGeometry args={[D, H]} />{wall}</mesh>
    {/* wainscot, skirting, cornice */}
    <Box p={[0, 0.55, -HALF.z + 0.03]} s={[W, 1.1, 0.06]} c="#4a2f1c" r={0.5} /><Box p={[0, 0.55, HALF.z - 0.03]} s={[W, 1.1, 0.06]} c="#4a2f1c" r={0.5} />
    <Box p={[-HALF.x + 0.03, 0.55, 0]} s={[0.06, 1.1, D]} c="#4a2f1c" r={0.5} /><Box p={[HALF.x - 0.03, 0.55, 0]} s={[0.06, 1.1, D]} c="#4a2f1c" r={0.5} />
    <Box p={[0, 1.13, -HALF.z + 0.05]} s={[W, 0.05, 0.1]} c="#c9a45c" r={0.3} /><Box p={[0, H - 0.1, -HALF.z + 0.1]} s={[W, 0.2, 0.2]} c="#e6d8bd" />
    {/* ceiling beams and glowing cove strips */}
    {[-8, -4, 0, 4, 8].map((x) => <Box key={x} p={[x, H - 0.15, 0]} s={[0.3, 0.3, D]} c="#d8c7a6" />)}
    <Box p={[0, H - 0.05, -HALF.z + 0.4]} s={[W - 1, 0.05, 0.12]} c="#ffd9a0" e={2} /><Box p={[0, H - 0.05, HALF.z - 0.4]} s={[W - 1, 0.05, 0.12]} c="#ffd9a0" e={2} />
    {/* north-wall centrepiece alcove (photograph arrives in Phase 3) */}
    <Box p={[0, 2.6, -HALF.z + 0.12]} s={[6, 3.6, 0.12]} c="#2f1c0f" r={0.4} /><Box p={[0, 2.6, -HALF.z + 0.2]} s={[5.5, 3.1, 0.05]} c="#e9dcc2" />
    <Box p={[0, 0.2, -HALF.z + 1]} s={[3, 0.4, 1.4]} c="#3a2314" r={0.35} />
    {BENCHES.map(([x, z]) => <Bench key={x} x={x} z={z} />)}
  </>)
}
