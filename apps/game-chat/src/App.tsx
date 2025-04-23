import { Authenticated } from './components/Authenticated'
import { Game } from './components/Game'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="w-screen h-screen">
        <Routes>
          <Route path="/d/:slug" element={<Authenticated component={Game} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
