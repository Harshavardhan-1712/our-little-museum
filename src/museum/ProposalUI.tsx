import { useProp, answerProposal } from '../proposal'
import { useMuseum } from '../store'
import { useNet } from '../net'
export default function ProposalUI() {
  const p = useProp((s) => s.p), role = useMuseum((s) => s.role), inRoom = useNet((s) => !!s.code)
  if (!p.active) return null
  const stop = (e: React.PointerEvent) => e.stopPropagation()
  if (p.answer === 'yes') return <div className="prop yes" onPointerDown={stop} role="status"><h3>Yes ❤️</h3><p>{p.success}</p></div>
  const mine = role === 'girl' || !inRoom
  return (
    <div className="prop" onPointerDown={stop} role="region" aria-label="Proposal">
      {mine ? (<><p>A question is waiting on the screen. Take all the time you need.</p>
        <div><button className="cta" onClick={() => answerProposal('yes')}>YES ❤️</button><button className="ghost" onClick={() => answerProposal('notyet')}>NOT YET</button></div></>)
        : <p>The question is on the screen. Waiting for her answer…</p>}
    </div>)
}
