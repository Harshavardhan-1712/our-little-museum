import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useNet, emit } from './net'
export type Prop = { active: boolean; answer: 'yes' | 'notyet' | null; question: string; success: string }
export const useProp = create<{ p: Prop; q: string; s: string }>()(persist(
  () => ({ p: { active: false, answer: null, question: '', success: '' } as Prop, q: '', s: '' }),
  { name: 'our-little-museum-proposal', partialize: (s) => ({ q: s.q, s: s.s }) }
))
export const defaultQ = (girl: string) => `${girl || 'My love'}, will you make every tomorrow a beautiful memory with me?`
export const defaultS = (girl: string) => `${girl || 'She'} said yes. Every tomorrow starts now. ❤️`
const room = () => !!useNet.getState().code
export const startProposal = (question: string, success: string) => { if (room()) emit('proposal:start', { question, success }); else useProp.setState({ p: { active: true, answer: null, question, success } }) }
export const answerProposal = (a: 'yes' | 'notyet') => { if (room()) emit('proposal:answer', a); else useProp.setState((s) => ({ p: { ...s.p, answer: a } })) }
export const endProposal = () => { if (room()) emit('proposal:end'); else useProp.setState((s) => ({ p: { ...s.p, active: false, answer: null } })) }
