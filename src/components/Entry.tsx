import { motion } from 'framer-motion'
import { useMuseum } from '../store'
export default function Entry() {
  const { boy, girl, set } = useMuseum()
  const room = new URLSearchParams(location.search).get('room')
  return (
    <div className="entry">
      <div className="entrance" aria-hidden><div className="arch" /><div className="floor" /></div>
      <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.6, ease: 'easeOut' }}>
        <h1>Our Little Museum</h1>
        <p className="sub">Every picture tells our story.</p>
        {room && <p className="note">You're invited to room {room.toUpperCase()}. Enter your name to join.</p>}
        <div className="names">
          <label>Boy's name<input value={boy} maxLength={24} onChange={(e) => set({ boy: e.target.value })} /></label>
          <label>Girl's name<input value={girl} maxLength={24} onChange={(e) => set({ girl: e.target.value })} /></label>
        </div>
        <button className="cta" disabled={!boy.trim() && !girl.trim()} onClick={() => set({ stage: 'select' })}>Enter our world</button>
      </motion.main>
    </div>
  )
}
