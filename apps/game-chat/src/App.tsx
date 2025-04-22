import { RealtimeChat } from './components/realtime-chat'

function App() {
  const roomName = 'test'
  const username = '@user9541'

  return (
    <div className="w-screen h-screen">
      <div className="w-[460px] h-full mx-auto px-4">
        <RealtimeChat roomName={roomName} username={username} />
      </div>
    </div>
  )
}

export default App
