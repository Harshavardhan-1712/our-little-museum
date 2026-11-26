import { useRef, useState } from 'react'
import { input } from './input'
export default function Joystick() {
  const base = useRef<HTMLDivElement>(null); const [k, setK] = useState({ x: 0, y: 0 })
  const move = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect(); const R = r.width / 2
    let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R); const l = Math.hypot(dx, dy)
    if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R }
    input.x = dx / R; input.y = dy / R; setK({ x: dx, y: dy })
  }
  const end = () => { input.x = 0; input.y = 0; setK({ x: 0, y: 0 }) }
  return (
    <div ref={base} className="joy" aria-label="Move joystick"
      onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e) }}
      onPointerUp={end} onPointerCancel={end}>
      <div className="knob" style={{ transform: `translate(${k.x}px,${k.y}px)` }} />
    </div>
  )
}
