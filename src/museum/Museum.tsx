import { useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useMuseum } from '../store'
import Room from './Room'
import Player from './Player'
import Joystick from './Joystick'
import Gallery from './Gallery'
import { Lightbox, EditPanel, Chat } from './Panels'
import RemotePlayers from './RemotePlayers'
import Screen from './Screen'
import Interactions from './Interactions'
import MediaPanel from './MediaPanel'
import { useMediaSync } from './sync'
import { useMedia } from '../media'
import { useUI } from './ui'
import { useNet, isOwner, leaveRoom } from '../net'
import { input, type Q } from './input'
import Hearts from './Hearts'
import ProposalUI from './ProposalUI'
import { useProp } from '../proposal'
export default function Museum() {
  const { role, boy, girl, boyLook, girlLook, set } = useMuseum()
  const coarse = useMemo(() => matchMedia('(pointer:coarse)').matches, [])
  const drag = useRef<Map<number, [number, number]>>(new Map()); const [auto, setAuto] = useState<Q>(() => (coarse || (navigator.hardwareConcurrency ?? 4) < 6 ? 'medium' : 'high')); const gfx = useMedia((s) => s.gfx); const q: Q = gfx === 'auto' ? auto : gfx; const yes = useProp((s) => s.p.answer === 'yes'); useMediaSync(); const blocked = useMedia((s) => s.blocked); const ui = useUI();
  const female = role === 'girl'; const owner = useNet(isOwner); const code = useNet((s) => s.code); const count = useNet((s) => s.peers.length + 1)
  return (
    <div className="museum" onPointerDown={(e) => drag.current.set(e.pointerId, [e.clientX, e.clientY])}
      onPointerMove={(e) => {
        const p = drag.current.get(e.pointerId); if (!p) return
        input.yaw -= (e.clientX - p[0]) * 0.006; input.pitch = Math.min(0.9, Math.max(0.05, input.pitch + (e.clientY - p[1]) * 0.004))
        drag.current.set(e.pointerId, [e.clientX, e.clientY])
      }}
      onPointerUp={(e) => drag.current.delete(e.pointerId)} onPointerCancel={(e) => drag.current.delete(e.pointerId)}>
      <Canvas shadows={q !== 'low'} dpr={q === 'high' ? [1, 2] : q === 'medium' ? [1, 1.5] : [1, 1]} camera={{ fov: 58, near: 0.1, far: 60 }}>
        <color attach="background" args={['#120a05']} />
        <PerformanceMonitor onDecline={() => setAuto((a) => (a === 'high' ? 'medium' : 'low'))} />
        <Room q={q} />
        {yes && <Hearts n={q === 'low' ? 60 : q === 'medium' ? 110 : 180} />}
        <Gallery />
        <Screen />
        <RemotePlayers />
        <Player name={female ? girl : boy} look={female ? girlLook : boyLook} female={female} />
      </Canvas>
      {coarse && <Joystick />}
      <Lightbox /><EditPanel /><MediaPanel /><Interactions /><ProposalUI />
      {(ui.sitting || ui.near) && <button className="cta sit" onPointerDown={(e) => e.stopPropagation()} onClick={() => { input.sitReq = true }}>{ui.sitting ? 'Stand up' : coarse ? 'Sit down' : 'Sit down (E)'}</button>}<Chat />
      <div className="hud"><button className="ghost" onClick={() => { leaveRoom(); set({ stage: 'select' }) }}>{code ? 'Leave room' : 'Characters'}</button>
        <button className="ghost" onClick={() => useMedia.setState({ open: true })}>Media</button>
        {blocked && <button className="cta" onClick={() => useMedia.setState({ blocked: false })}>Tap to enable sound</button>}
        {owner && <button className="ghost" onClick={() => set({ editing: true })}>Edit gallery</button>}
        {code && <button className="ghost" onClick={() => void navigator.clipboard?.writeText(`${location.origin}/?room=${code}`)}>Room {code} · {count}/4 · Copy invite</button>}
        <span>{coarse ? 'Left stick to walk, drag to look' : 'WASD or arrows to walk, Shift to run, drag to look'}</span></div>
    </div>
  )
}
