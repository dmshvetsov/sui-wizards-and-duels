import { Authenticated } from './components/Authenticated'
import { Game } from './components/Game'

function App() {
  return (
    <div className="w-screen h-screen">
      <Authenticated component={Game} />
    </div>
  );
}

export default App
