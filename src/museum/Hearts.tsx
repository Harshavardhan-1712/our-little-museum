import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HALF } from './input'
export default function Hearts({ n }: { n: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null), dummy = useMemo(() => new THREE.Object3D(), [])
  const geo = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(0, -0.3); s.bezierCurveTo(-0.5, 0.05, -0.35, 0.4, 0, 0.18); s.bezierCurveTo(0.35, 0.4, 0.5, 0.05, 0, -0.3)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }); g.center(); return g
  }, [])
  const seeds = useMemo(() => Array.from({ length: n }, () => ({
    x: (Math.random() - 0.5) * (HALF.x * 2 - 2), z: (Math.random() - 0.5) * (HALF.z * 2 - 2), sp: 0.35 + Math.random() * 0.9, off: Math.random() * 6, ph: Math.random() * 6.28, sc: 0.18 + Math.random() * 0.22,
  })), [n])
  useFrame(({ clock }) => {
    const m = mesh.current; if (!m) return; const t = clock.elapsedTime
    seeds.forEach((p, i) => {
      dummy.position.set(p.x + Math.sin(t * 0.8 + p.ph) * 0.4, ((t * p.sp + p.off) % 5.6) - 0.3, p.z)
      dummy.rotation.set(0, t * 0.9 + p.ph, Math.sin(t + p.ph) * 0.2); dummy.scale.setScalar(p.sc); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (<instancedMesh ref={mesh} args={[geo, undefined, n]} frustumCulled={false}>
    <meshStandardMaterial color="#ff4d6d" emissive="#ff2d55" emissiveIntensity={0.7} roughness={0.35} /></instancedMesh>)
}
