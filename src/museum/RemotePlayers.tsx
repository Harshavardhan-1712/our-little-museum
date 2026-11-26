import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group } from 'three'
import Avatar, { type PoseRef } from '../components/Avatar'
import { useNet, targets, type Peer } from '../net'
import { pose } from '../act'
function Remote({ peer }: { peer: Peer }) {
  const g = useRef<Group>(null); const mv = useRef(false), sit = useRef(false), po = useRef<PoseRef>({ k: 'none', s: 0, side: 1 })
  useEffect(() => { const t = targets[peer.id]; if (t && g.current) { g.current.position.set(t.x, 0, t.z); g.current.rotation.y = t.ry } }, [peer.id])
  useFrame((_, dt) => {
    const t = targets[peer.id], o = g.current; if (!t || !o) return
    const k = Math.min(1, dt * 10)
    o.position.x += (t.x - o.position.x) * k; o.position.z += (t.z - o.position.z) * k
    o.rotation.y += Math.atan2(Math.sin(t.ry - o.rotation.y), Math.cos(t.ry - o.rotation.y)) * k
    sit.current = t.sit; mv.current = t.mv && performance.now() - t.at < 600
    pose(peer.id, o.position.x, o.position.z, o.rotation.y, po.current)
  })
  return (<group ref={g}><Avatar look={peer.look} female={peer.female} spin={false} moving={mv} sitting={sit} pose={po} offset={0} />
    <Html position={[0, 2.55, 0]} center zIndexRange={[5, 0]}><div className="tag">{peer.name}</div></Html></group>)
}
export default function RemotePlayers() { const peers = useNet((s) => s.peers); return <>{peers.map((p) => <Remote key={p.id} peer={p} />)}</> }
