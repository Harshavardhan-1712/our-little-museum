import { useMemo } from 'react'
import * as THREE from 'three'
import { els } from './sync'
import { useMedia, mediaCtl } from '../media'
import { useProp } from '../proposal'
import { useCanvasTex, wrap } from './Gallery'
const dark = '#14100c'
export default function Screen() {
  const has = useMedia((s) => !!s.media.video), playing = useMedia((s) => !!s.media.video?.playing)
  const vtex = useMemo(() => { const t = new THREE.VideoTexture(els.video); t.colorSpace = THREE.SRGBColorSpace; return t }, [])
  const idle = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const x = c.getContext('2d')!
    x.fillStyle = '#0b0705'; x.fillRect(0, 0, 1280, 720); x.fillStyle = '#c9a45c'; x.textAlign = 'center'
    x.font = "italic 84px 'Cormorant Garamond', Georgia, serif"; x.fillText('Our little cinema', 640, 340)
    x.fillStyle = '#9b8a6a'; x.font = "34px 'Cormorant Garamond', Georgia, serif"; x.fillText('The room owner can add a film from the Media panel.', 640, 420)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [])
  const prop = useProp((s) => s.p)
  const F = "'Cormorant Garamond', Georgia, serif"
  const ptex = useCanvasTex(1280, 720, (x) => {
    x.fillStyle = '#0b0705'; x.fillRect(0, 0, 1280, 720); x.strokeStyle = '#c9a45c'; x.lineWidth = 3; x.strokeRect(40, 40, 1200, 640); x.textAlign = 'center'
    if (prop.answer === 'yes') {
      x.fillStyle = '#ff7a93'; x.font = `italic 150px ${F}`; x.fillText('Yes ❤️', 640, 260)
      x.fillStyle = '#f3e9d6'; x.font = `54px ${F}`; wrap(x, prop.success, 1000).slice(0, 4).forEach((l, i) => x.fillText(l, 640, 370 + i * 70))
      return
    }
    x.fillStyle = '#f3e9d6'; x.font = `italic 64px ${F}`; wrap(x, prop.question, 1020).slice(0, 5).forEach((l, i) => x.fillText(l, 640, 170 + i * 84))
    x.fillStyle = '#c9a45c'; x.beginPath(); x.roundRect(300, 520, 300, 90, 45); x.fill()
    x.strokeStyle = '#c9a45c'; x.lineWidth = 3; x.beginPath(); x.roundRect(680, 520, 300, 90, 45); x.stroke()
    x.font = '500 44px Jost, sans-serif'; x.fillStyle = '#2a1a0f'; x.fillText('YES ❤️', 450, 580); x.fillStyle = '#c9a45c'; x.fillText('NOT YET', 830, 580)
    if (prop.answer === 'notyet') { x.fillStyle = '#9b8a6a'; x.font = `italic 34px ${F}`; x.fillText('Take all the time you need. The question will wait.', 640, 655) }
  }, [prop.active, prop.answer, prop.question, prop.success])
  return (
    <group position={[0, 0, -1]}>
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow><boxGeometry args={[6.4, 0.18, 1.4]} /><meshStandardMaterial color="#3a2314" roughness={0.4} /></mesh>
      {[-2.5, 2.5].map((x) => <mesh key={x} position={[x, 0.75, 0]} castShadow><boxGeometry args={[0.2, 1.1, 0.2]} /><meshStandardMaterial color={dark} roughness={0.5} /></mesh>)}
      {[-3.6, 3.6].map((x) => <mesh key={x} position={[x, 0.78, 0.1]} castShadow><boxGeometry args={[0.5, 1.2, 0.4]} /><meshStandardMaterial color={dark} roughness={0.7} /></mesh>)}
      <mesh position={[0, 2.85, 0]} castShadow><boxGeometry args={[5.9, 3.45, 0.2]} /><meshStandardMaterial color="#0c0907" roughness={0.35} metalness={0.4} /></mesh>
      <mesh position={[0, 2.85, 0.105]} onClick={(e) => { if (has && !prop.active && e.delta < 6) { e.stopPropagation(); mediaCtl('video', playing ? 'pause' : 'play') } }}
        onPointerOver={() => { if (has) document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
        <planeGeometry args={[5.6, 3.15]} /><meshBasicMaterial key={prop.active ? 'p' : has ? 'v' : 'i'} map={prop.active ? ptex : has ? vtex : idle} toneMapped={false} /></mesh>
      <pointLight position={[0, 2.6, 1]} intensity={playing ? 22 : 0} distance={9} color="#a9c0ff" />
    </group>
  )
}
