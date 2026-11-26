import { useMuseum } from './store'
import Entry from './components/Entry'
import CharacterSelect from './components/CharacterSelect'
import Museum from './museum/Museum'
export default function App() {
  const stage = useMuseum((s) => s.stage)
  return stage === 'entry' ? <Entry /> : stage === 'select' ? <CharacterSelect /> : <Museum />
}
