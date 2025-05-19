import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Authenticated } from './components/Authenticated'
import { DuelLayout } from './duel/Duel'
import { Landing } from './landing/Landing'
import { PracticeDuel } from './practice-duel/PracticeDuel'
import { Signing } from './signing/Signin'
import { WaitRoom } from './waitroom/Waitroom'
import { ClaimWelcomeReward } from './welcome-reward/ClaimWelcomReward'

function App() {
  return (
    <BrowserRouter>
      <div className="w-screen h-screen">
        <Routes>
          <Route path="/d/:slug" element={<Authenticated component={DuelLayout} />} />
          <Route path="/d" element={<Authenticated component={WaitRoom} />} />
          <Route path="/signin" element={<Signing />} />
          <Route path="/practice" element={<PracticeDuel />} />
          <Route path="/welcome-reward" element={<Authenticated component={ClaimWelcomeReward} />} />
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  )
}

export default App
