import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Authenticated } from './components/Authenticated'
import { Game } from './game/Game'
import { WaitRoom } from './waitroom/Waitroom'

function App() {
  return (
    <BrowserRouter>
      <div className="w-screen h-screen">
        <Routes>
          <Route path="/d/:slug" element={<Authenticated component={Game} />} />
          <Route path="/d" element={<Authenticated component={WaitRoom} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
