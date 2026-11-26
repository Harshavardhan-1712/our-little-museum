import { useEffect } from 'react'
import { useAct, request, respond, endBond, type Kind } from '../act'
import { useNet } from '../net'
import { useMuseum } from '../store'
const ASK: Record<Kind, string> = { hand: 'hold your hand', hug: 'give you a hug', kiss: 'give you a kiss', propose: 'show you something special' }
export default function Interactions() {
  const a = useAct(), me = useNet((s) => s.me), role = useMuseum((s) => s.role), stop = (e: React.PointerEvent) => e.stopPropagation()
  useEffect(() => { if (!a.notice) return; const t = setTimeout(() => useAct.setState({ notice: '' }), 3500); return () => clearTimeout(t) }, [a.notice])
  if (!me) return null
  const bond = a.bonds[me]
  return (
    <div className="acts" onPointerDown={stop} role="region" aria-label="Together">
      {a.notice && <p className="pill" role="status">{a.notice}</p>}
      {a.incoming && !bond && (<div className="pill"><span>{a.incoming.name} would like to {ASK[a.incoming.kind]}.</span>
        <button className="cta" onClick={() => respond(true)}>Accept</button><button className="ghost" onClick={() => respond(false)}>Not now</button></div>)}
      {bond && <button className="ghost" onClick={endBond}>{bond.kind === 'hand' ? 'Let go' : bond.kind === 'propose' ? 'End moment' : 'Step back'}</button>}
      {!bond && !a.incoming && a.waiting && <p className="pill" role="status">Waiting for a reply…</p>}
      {!bond && !a.incoming && !a.waiting && a.nearby && (<>
        <span className="pill">{a.nearby.name}</span>
        {([['hand', 'Hold hands'], ['hug', 'Hug'], ['kiss', 'Kiss']] as const).map(([k, l]) => <button key={k} className="ghost" onClick={() => request(a.nearby!.id, k)}>{l}</button>)}
        {role === 'boy' && <button className="ghost" onClick={() => request(a.nearby!.id, 'propose')}>Propose</button>}</>)}
    </div>)
}
