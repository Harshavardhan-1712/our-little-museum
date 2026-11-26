import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useMuseum, defaultDedication, type Photo } from '../store'
import { HALF } from './input'
type Slot = { p: [number, number, number]; ry: number }
const slots: Slot[] = (() => {
  const s: Slot[] = [], rows = [1.9, 3.4], cols = (xs: number[]) => xs
  for (const y of rows) for (const z of cols([-6, -3.6, -1.2, 1.2, 3.6, 6])) s.push({ p: [-HALF.x + 0.07, y, z], ry: Math.PI / 2 })
  for (const y of rows) for (const z of [-6, -3.6, -1.2, 1.2, 3.6, 6]) s.push({ p: [HALF.x - 0.07, y, z], ry: -Math.PI / 2 })
  for (const y of rows) for (const x of [-9.6, -7.2, -4.8, 4.8, 7.2, 9.6]) s.push({ p: [x, y, -HALF.z + 0.07], ry: 0 })
  for (const y of rows) for (const x of [-9.6, -7.2, -4.8, 4.8, 7.2, 9.6]) s.push({ p: [x, y, HALF.z - 0.07], ry: Math.PI })
  return s
})()
export function useCanvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, deps: unknown[]) {
  const [tex] = useState(() => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t })
  useEffect(() => {
    const c = tex.image as HTMLCanvasElement
    const go = () => { const x = c.getContext('2d')!; x.clearRect(0, 0, w, h); draw(x); tex.needsUpdate = true }
    go(); void document.fonts.load("italic 40px 'Cormorant Garamond'").then(go)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return tex
}
export function wrap(x: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(' ')) { const t = line ? line + ' ' + word : word; if (x.measureText(t).width > maxW && line) { out.push(line); line = word } else line = t }
    out.push(line)
  }
  return out
}
function Frame({ photo, slot, big }: { photo: Photo; slot: Slot; big?: boolean }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null); const view = useMuseum((s) => s.set)
  useEffect(() => {
    let live = true
    new THREE.TextureLoader().load(photo.url, (t) => { if (!live) { t.dispose(); return }; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; setTex(t) })
    return () => { live = false }
  }, [photo.url])
  const cap = useCanvasTex(512, 72, (x) => {
    x.fillStyle = '#c9a45c'; x.textAlign = 'center'; x.textBaseline = 'middle'; let f = 38
    do { x.font = `italic ${f}px 'Cormorant Garamond', Georgia, serif`; f -= 2 } while (x.measureText(photo.caption).width > 490 && f > 14)
    x.fillText(photo.caption, 256, 38)
  }, [photo.caption])
  if (!tex) return null
  const img = tex.image as HTMLImageElement, a = img.width / img.height, mw = big ? 5 : 1.7, mh = big ? 2.8 : 1.15
  let w = mw, h = w / a; if (h > mh) { h = mh; w = h * a }
  const b = big ? 0.2 : 0.07
  return (
    <group position={slot.p} rotation-y={slot.ry}
      onClick={(e) => { if (e.delta < 6) { e.stopPropagation(); view({ viewing: photo.id }) } }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
      <mesh castShadow position-z={0.03}><boxGeometry args={[w + b * 2 + 0.1, h + b * 2 + 0.1, 0.07]} /><meshStandardMaterial color={big ? '#b8923f' : '#2b1a0e'} roughness={big ? 0.3 : 0.45} metalness={big ? 0.7 : 0} /></mesh>
      <mesh position-z={0.068}><planeGeometry args={[w + 0.1, h + 0.1]} /><meshStandardMaterial color="#f4ecdc" roughness={1} /></mesh>
      <mesh position-z={0.072}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} roughness={0.55} /></mesh>
      <mesh position={[0, h / 2 + b + 0.22, 0.15]}><boxGeometry args={[Math.min(w * 0.6, 1.2), 0.04, 0.08]} /><meshStandardMaterial color="#ffd9a0" emissive="#ffd9a0" emissiveIntensity={2} /></mesh>
      {photo.caption && <mesh position={[0, -(h / 2 + b + 0.2), 0.04]}><planeGeometry args={[1.6, 0.225]} /><meshBasicMaterial map={cap} transparent /></mesh>}
    </group>
  )
}
function Wash() {
  const tg = useMemo(() => { const o = new THREE.Object3D(); o.position.set(0, 2.6, -HALF.z); return o }, [])
  const ref = useRef<THREE.SpotLight>(null)
  return (<><primitive object={tg} /><spotLight ref={ref} target={tg} position={[0, 4.7, -3.2]} angle={0.45} penumbra={0.9} intensity={220} color="#ffe6bd" /></>)
}
function Dedication() {
  const { dedication, girl } = useMuseum(); const text = dedication ?? defaultDedication(girl)
  const tex = useCanvasTex(1280, 800, (x) => {
    x.fillStyle = '#e9dcc2'; x.fillRect(0, 0, 1280, 800); x.fillStyle = '#3a2314'; x.textAlign = 'center'; x.textBaseline = 'top'
    const [first, ...rest] = text.split('\n'); x.font = "italic 76px 'Cormorant Garamond', Georgia, serif"
    x.fillStyle = '#8a6a2b'; x.fillText(first, 640, 90)
    x.fillStyle = '#3a2314'; x.font = "52px 'Cormorant Garamond', Georgia, serif"
    wrap(x, rest.join('\n'), 1000).slice(0, 9).forEach((l, i) => x.fillText(l, 640, 230 + i * 66))
  }, [text])
  return (<group position={[0, 2.5, HALF.z - 0.12]} rotation-y={Math.PI}>
    <mesh><boxGeometry args={[6.4, 4, 0.1]} /><meshStandardMaterial color="#2f1c0f" roughness={0.4} /></mesh>
    <mesh position-z={0.06}><planeGeometry args={[6, 3.75]} /><meshStandardMaterial map={tex} roughness={0.9} /></mesh>
    <spotLight position={[0, 2.2, 2.5]} target-position={[0, 0, 0]} angle={0.7} penumbra={1} intensity={25} color="#ffe2b0" />
  </group>)
}
export default function Gallery() {
  const photos = useMuseum((s) => s.photos)
  return (<>
    <Dedication />
    {photos[0] && <><Wash /><Frame key={photos[0].id + photos[0].url} photo={photos[0]} slot={{ p: [0, 2.6, -HALF.z + 0.26], ry: 0 }} big /></>}
    {photos.slice(1).map((p, i) => <Frame key={p.id + p.url} photo={p} slot={slots[i]} />)}
  </>)
}
