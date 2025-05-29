import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthenticatedPage, WithUserAccount } from './components/Authenticated'
import { DuelLayout } from './duel/Duel'
import { Landing } from './landing/Landing'
import { PracticeDuel } from './practice-duel/PracticeDuel'
import { WaitRoom } from './waitroom/Waitroom'
import { ClaimWelcomeReward } from './welcome-reward/ClaimWelcomReward'
import { WithRewardClaim } from './rewards/WithRewardClaim'
import { NotFound } from './components/NotFound'


function App() {
  return (
    <BrowserRouter>
      <div className="w-screen h-screen">
        <Routes>
          <Route index Component={Landing} />
          <Route path="/practice" Component={PracticeDuel} />
          <Route path="/d" Component={AuthenticatedPage}>
            <Route
              index
              element={
                <WithRewardClaim>
                  <WithUserAccount Component={WaitRoom} />
                </WithRewardClaim>
              }
            />
            <Route path=":slug" element={<WithUserAccount Component={DuelLayout} />} />
            <Route
              path="welcome-reward"
              element={<WithUserAccount Component={ClaimWelcomeReward} />}
            />
          </Route>
          <Route path="*" Component={NotFound} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  )
}

export default App
