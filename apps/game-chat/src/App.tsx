import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Authenticated } from './components/Authenticated'
import { Duel } from './duel/Duel'
import { WaitRoom } from './waitroom/Waitroom'

function App() {
  return (
    <BrowserRouter>
      <div className="w-screen h-screen">
        <Routes>
          <Route path="/d/:slug" element={<Authenticated component={Duel} />} />
          <Route path="/d" element={<Authenticated component={WaitRoom} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  )
}

export default App
