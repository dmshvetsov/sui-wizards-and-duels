import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>Page not found</h1>
      <div className='flex gap-4 items-center'>
        <Button className="mt-4" onClick={() => navigate('/d')}>
          Back to the Game
        </Button>
        <Button variant="link" className="mt-4" onClick={() => navigate('/')}>
          or to home page
        </Button>
      </div>
    </div>
  )
}
