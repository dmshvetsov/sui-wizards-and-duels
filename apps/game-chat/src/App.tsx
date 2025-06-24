import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthenticatedPage, WithUserAccount } from './components/Authenticated'
import { DesktopOnly } from './components/DesctopOnly'
import { NotFound } from './components/NotFound'
import { DuelLayout } from './duel/Duel'
import { PracticeDuel } from './practice-duel/PracticeDuel'
import { WaitRoom } from './waitroom/Waitroom'
import { ClaimWelcomeReward } from './rewards/ClaimWelcomReward'

const TOAST_OPTIONS = {
  duration: 6000,
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="app-container w-screen h-screen">
        <Routes>
          <Route index Component={PracticeDuel} />

          <Route Component={DesktopOnly}>
            <Route path="/practice" Component={PracticeDuel} />
            <Route path="/d" Component={AuthenticatedPage}>
              <Route index element={<WithUserAccount Component={WaitRoom} />} />
              <Route path=":slug" element={<WithUserAccount Component={DuelLayout} />} />
              <Route
                path="welcome-reward"
                element={<WithUserAccount Component={ClaimWelcomeReward} />}
              />
            </Route>
          </Route>

          <Route path="*" Component={NotFound} />
        </Routes>
        <Toaster toastOptions={TOAST_OPTIONS} />
      </div>
    </BrowserRouter>
  )
}

export default App
