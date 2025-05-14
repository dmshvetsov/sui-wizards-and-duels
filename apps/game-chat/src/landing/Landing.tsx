import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Landing() {
  const navigate = useNavigate()
  const handleLaunchGmae = () => navigate('/d')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-200">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold mb-6">Wizards and Duels</h1>
          <p className="text-xl mb-8 max-w-2xl">
            Master the arcane arts and challenge other wizards in magical duels on the Sui
            blockchain. Cast spells, defend against attacks, and claim victory to earn rewards!
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mt-4">
            <Button onClick={handleLaunchGmae}>Launch Game</Button>
          </div>
        </div>
      </div>

      {/* Game Features */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Game Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Magical Duels"
              description="Challenge other wizards to real-time duels using your magical abilities and strategic thinking."
            />
            <FeatureCard
              title="Blockchain Rewards"
              description="Win duels to earn Sui tokens directly to your wallet. The higher the stakes, the bigger the rewards."
            />
            <FeatureCard
              title="Spell Mastery"
              description="Learn and master different spells with unique effects to outsmart your opponents."
            />
          </div>
        </div>
      </div>

      {/* How to Play */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">How to Play</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StepCard
              number="1"
              title="Connect Wallet"
              description="Connect your Sui wallet or sign in with your preferred provider."
            />
            <StepCard
              number="2"
              title="Enter Waitroom"
              description="Join the waitroom to be matched with another wizard of similar skill."
            />
            <StepCard
              number="3"
              title="Cast Spells"
              description="During the duel, strategically cast spells to attack your opponent and defend yourself."
            />
            <StepCard
              number="4"
              title="Claim Victory"
              description="Reduce your opponent's force to zero to win the duel and claim your reward."
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="flex flex-col sm:flex-row gap-6 mb-12">
          <Button onClick={handleLaunchGmae}>Launch Game</Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            Wizards and Duels — A magical dueling game on the Sui blockchain
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-200 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="bg-gray-200 p-6 rounded-lg relative">
      <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-purple-300 flex items-center justify-center font-bold">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-3 mt-2">{title}</h3>
      <p>{description}</p>
    </div>
  )
}
