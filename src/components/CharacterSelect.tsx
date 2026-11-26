import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { joinRoom } from '../net'
import { useMuseum, type Look, type State } from '../store'
import Avatar from './Avatar'
const SKINS = ['#f1d3b8', '#e0b48c', '#c68b62', '#8d5a3b', '#5a3a28']
const OUTFITS = ['#2b3a55', '#6b2d3a', '#2f4a3a', '#c9b79c', '#1f1f24', '#8a5a3a']
const HAIRS = ['#1b1209', '#4a2c17', '#8a5a2b', '#d9b66c', '#7a2e1f']
const STYLES: Look['hair'][] = ['short', 'long', 'bun']
const Swatches = ({ label, colors, value, pick }: { label: string; colors: string[]; value: string; pick: (c: string) => void }) => (
  <div className="row"><span>{label}</span><div>{colors.map((c) => (
    <button key={c} className={'sw' + (c === value ? ' on' : '')} style={{ background: c }} aria-label={`${label} ${c}`} aria-pressed={c === value} onClick={() => pick(c)} />
  ))}</div></div>
)
function Panel({ who }: { who: 'boy' | 'girl' }) {
  const s = useMuseum(); const female = who === 'girl'
  const key = female ? 'girlLook' : 'boyLook'; const look = s[key]; const name = s[who]
  const up = (p: Partial<Look>) => s.set({ [key]: { ...look, ...p } } as Partial<State>)
  return (
    <section className="panel">
      <div className="stage3d">
        <Canvas shadows camera={{ position: [0, 1.2, 4.6], fov: 32 }} dpr={[1, 2]}>
          <hemisphereLight args={['#fff1dc', '#3a2a1c', 0.7]} />
          <spotLight position={[3, 5, 4]} angle={0.5} penumbra={1} intensity={90} color="#ffd9a0" castShadow />
          <mesh position={[0, -1.17, 0]} receiveShadow><cylinderGeometry args={[0.8, 0.85, 0.1, 48]} /><meshStandardMaterial color="#3b2616" roughness={0.35} /></mesh>
          <Avatar look={look} female={female} />
          <ContactShadows position={[0, -1.11, 0]} opacity={0.5} blur={2.4} scale={4} />
        </Canvas>
      </div>
      <label className="nm">{female ? 'Girl' : 'Boy'}<input value={name} maxLength={24} onChange={(e) => s.set({ [who]: e.target.value } as Partial<State>)} /></label>
      <Swatches label="Outfit" colors={OUTFITS} value={look.outfit} pick={(c) => up({ outfit: c })} />
      <Swatches label="Skin" colors={SKINS} value={look.skin} pick={(c) => up({ skin: c })} />
      <Swatches label="Hair colour" colors={HAIRS} value={look.hairColor} pick={(c) => up({ hairColor: c })} />
      <div className="row"><span>Hairstyle</span><div>{STYLES.map((h) => (
        <button key={h} className={'chip' + (h === look.hair ? ' on' : '')} aria-pressed={h === look.hair} onClick={() => up({ hair: h })}>{h}</button>
      ))}</div></div>
    </section>
  )
}
const newCode = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
export default function CharacterSelect() {
  const { set, role } = useMuseum()
  const [code, setCode] = useState(() => (new URLSearchParams(location.search).get('room') || '').toUpperCase())
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const go = async (create: boolean) => {
    setBusy(true); setErr(''); const e = await joinRoom(create ? newCode() : code.trim().toUpperCase(), create); setBusy(false)
    if (e) setErr(e); else set({ stage: 'museum' })
  }
  return (
    <motion.div className="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <h2>Choose your characters</h2>
      <div className="panels"><Panel who="boy" /><Panel who="girl" /></div>
      <div className="who"><span>On this device I play</span>
        {(['boy', 'girl'] as const).map((r) => (
          <button key={r} className={'chip' + (r === role ? ' on' : '')} aria-pressed={r === role} onClick={() => set({ role: r })}>the {r}</button>
        ))}
      </div>
      <div className="room">
        <button className="cta" disabled={busy} onClick={() => void go(true)}>Create a room</button>
        <span>or</span>
        <input aria-label="Room code" placeholder="Room code" value={code} maxLength={12} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <button className="ghost" disabled={busy || code.trim().length < 3} onClick={() => void go(false)}>Join room</button>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="actions">
        <button className="ghost" onClick={() => set({ stage: 'entry' })}>Back</button>
        <button className="ghost" onClick={() => set({ stage: 'museum' })}>Explore alone</button>
      </div>
    </motion.div>
  )
}
