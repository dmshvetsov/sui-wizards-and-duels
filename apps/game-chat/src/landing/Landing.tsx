import { ButtonWithFx } from '@/components/ui/button'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParallax, ParallaxProvider } from 'react-scroll-parallax'
import bgImage from '../assets/bg.png'

function Content() {
  const navigate = useNavigate()
  const handleLaunchGame = () => navigate('/practice')

  const target = useRef<HTMLDivElement>(null)
  const bg = useParallax<HTMLDivElement>({ speed: -250, scale: [1, 1.5] })

  return (
    <div className="relative" ref={target}>
      <div
        className="absolute h-screen w-screen my-8 md:my-16 z-1"
        ref={bg.ref}
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      />

      {/* Hero Section */}
      <div className="relative z-100">
        <div className="container mx-auto px-4 h-[calc(100vh-80px)] md:h-[calc(100vh-120px)]">
          <div className="flex flex-col justify-center items-center text-center h-full">
            <h1 className="pt-16 md:pt-[120px] text-4xl md:text-6xl bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
              Wizards <span className="text-black">n</span> Duels
            </h1>
            <p className="text-base md:text-xl max-w-3xl text-gray-700 leading-relaxed mt-4 px-4 mb-8">
              Enter the mystical realm of blockchain-powered wizard duels! Master powerful spells,
              engage in strategic real-time duels, and stake SUI tokens for epic rewards. Play for
              free, experience the future of gaming digital ownership on the Sui blockchain.
            </p>

            <ButtonWithFx onClick={handleLaunchGame}>
              Play
            </ButtonWithFx>

            <div className="mt-6">
              <a
                href="https://x.com/wizardsnduels"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm md:text-base"
              >
                follow @wizardsandduels on X
              </a>
            </div>
          </div>
        </div>

        {/* About the Game */}
        <div className="container mx-auto py-8 md:py-16 px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center">
            About Wizards and Duels
          </h2>
          <div className="max-w-4xl mx-auto text-base md:text-lg text-gray-700 leading-relaxed">
            <p className="mb-4 md:mb-6">
              <strong>Wizards and Duels</strong> is a free to play, browser based, real-time
              strategy game where players engage in chat-typing duels, casting spells to deplete
              opponents' force. Think Hearthstone meets Street Fighter — but instantly accessible
              with no download.
            </p>
            <p className="mb-4 md:mb-6">
              Winners claim staked tokens and the opponent's equipment. Players can opt for a "play
              for fun" mode without stakes and/or loss of equipment.
            </p>
            <p className="mb-4 md:mb-6">
              The game emphasises digital ownership, allowing the trading of Wizards, created
              Equipment, and Artefacts on Sui NFT marketplaces. 
            </p>
            <p>
              Spell duels follow
              rock-paper-scissors mechanics, with "Dungeon & Dragons" dice roll mechanic
              (randomness) with hundreds of spells to choose from and combine into combo, each
              wizard is unique due to his developing path, ensuring no wizard is more powerful than
              others.
            </p>
          </div>
        </div>

        {/* Game Modes */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 bg-opacity-95 py-8 md:py-14 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center">Game Modes</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
              <GameModeCard
                title="Practice Mode"
                description="Perfect your skills against AI opponents in a risk-free environment. Learn spell combinations, master timing, and develop winning strategies before entering PvP battles."
                features={[
                  'AI opponents',
                  'No stakes required',
                  'Tutorial guidance',
                  'Skill development',
                ]}
              />
              <GameModeCard
                title="PvP Duels with Stakes"
                description="Challenge real players in high-stakes magical combat. Winner takes all!"
                features={[
                  'Real-time player vs player duels',
                  'SUI token stakes',
                  'Prize pools',
                  'Level up your wizards by playing (coming soon)',
                  'In game token rewards (coming soon)',
                ]}
              />
              <GameModeCard
                title="PvP Duels for Fun"
                description="Duel for fun with friends or other glory-seeking wizards."
                features={[
                  'Real-time player vs player duels',
                  'No stakes',
                  'No prize pools',
                  'Level up your wizards by playing (coming soon)',
                  'In game token rewards (coming soon)',
                ]}
              />
            </div>
          </div>
        </div>

        {/* Game Features */}
        <div className="py-8 md:py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center">
              Core Features
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <FeatureCard
                title="Strategic Spell Combat"
                description="Master four unique spells with distinct effects. Combine Arrow damage, Choke effects, Throw counters, and Deflect shields for tactical advantage."
              />
              <FeatureCard
                title="SUI Token Stakes"
                description="Stake up 100 SUI tokens in PvP duels. Winners claim the entire prize pool, making every duel a high-stakes magical battle. Free to play mode is available."
              />
              <FeatureCard
                title="Real-time Combat"
                description="Experience fast-paced, real-time spell casting with immediate feedback. No waiting for turns - cast spells as fast as you can type!"
              />
              <FeatureCard
                title="Immersive Audio"
                description="Enjoy atmospheric background music and satisfying spell sound effects that bring the magical world to life."
              />
              <FeatureCard
                title="Competitive Matchmaking"
                description="Fair matchmaking system pairs players with similar stake amounts, ensuring balanced and exciting duels for everyone."
              />
              <FeatureCard
                title="Free to Play right in your Browser"
                description="No need to install or pay for anything, jump into the game now."
              />
            </div>
          </div>
        </div>

        {/* How to Play */}
        <div className="bg-gray-50 bg-opacity-95 py-8 md:py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center">
              How to Play
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StepCard
                number="1"
                title="Start with practice"
                description="Playe practice mode agains NPCs right avay, no wallet required."
              />
              <StepCard
                number="2"
                title="Enter Battle"
                description="Sign in with Google to enjoy PvP matchmaking and duels."
              />
              <StepCard
                number="3"
                title="Cast Spells"
                description="Outsmart and outtype the opponent with rock-paper-scissors like spell system."
              />
              <StepCard
                number="4"
                title="Claim Victory"
                description="Reduce your opponent's force to zero to win the duel and claim your SUI prize pool! Free to play mode is available."
              />
            </div>
          </div>
        </div>

        {/* What's New */}
        <div className="py-8 md:py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center">
              What is New
            </h2>

            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              <FeatureCard
                title="Welcome Reward for new Players"
                description="We welcome each and every player with a welcome reward. Join and claim your reward right away."
              />
              <FeatureCard
                title="Duels with stakes"
                description="Players can now stake 0-100 SUI in PvP duels. Winners claim the entire prize pool of a duel"
              />
              <FeatureCard
                title="Music and Sound Effects"
                description="Spell sound effects and atmospheric music are now available in the game to make your experience even more immersive"
              />
              <FeatureCard
                title="Practice Mode"
                description="Practice ground with teacher who teach you spells and demo duels against NPCs to learn how to play and dominate in the game"
              />
            </div>
            <div className="mt-8 md:mt-12 text-center">
              <p className="text-base md:text-lg text-gray-600 mb-4">
                Follow our development progress and get the latest updates:
              </p>
              <a
                href="https://x.com/wizardsandduels"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm md:text-base"
              >
                @wizardsandduels on X
              </a>
            </div>
          </div>
        </div>

        {/* Final Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 bg-opacity-95 py-8 md:py-16 px-4 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">
              Ready to Begin Your Magical Journey?
            </h2>
            <h3 className="text-xl md:text-2xl mb-4">Outwit! Outspell!</h3>
            <p className="text-base md:text-xl mb-6 md:mb-8 text-purple-100 max-w-2xl mx-auto">
              Become the ultimate wizard duelist in fast and fierce browser battles Start with
              practice mode or dive straight into competitive PvP duels!
            </p>

            <ButtonWithFx onClick={handleLaunchGame} className="mx-auto">
              Play
            </ButtonWithFx>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 bg-opacity-95 py-8 md:py-12 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white">
                  Wizards and Duels
                </h3>
                <p className="text-sm md:text-base text-gray-400">
                  The premier blockchain-based wizard dueling game on Sui. Experience real-time
                  magical duels with cryptocurrency rewards.
                </p>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <a
                    href="/practice"
                    className="block text-sm md:text-base text-gray-400 hover:text-white transition-colors"
                  >
                    Practice Mode
                  </a>
                  <a
                    href="/d"
                    className="block text-sm md:text-base text-gray-400 hover:text-white transition-colors"
                  >
                    PvP Duels
                  </a>
                  <a
                    href="https://x.com/wizardsandduels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm md:text-base text-gray-400 hover:text-white transition-colors"
                  >
                    @wizardsnduels on X
                  </a>
                  <a
                    href="https://www.canva.com/design/DAGoUJ7edcs/we2GlnnSc2lngri-IV4FYg/view?utm_content=DAGoUJ7edcs&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h20b6c4a40a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm md:text-base text-gray-400 hover:text-white transition-colors"
                  >
                    Project pitch deck
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white">Built On</h3>
                <p className="text-sm md:text-base text-gray-400 mb-2">
                  <a
                    href="https://sui.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    Sui Blockchain
                  </a>
                </p>
                <p className="text-sm md:text-base text-gray-400 mb-2">
                  <a
                    href="https://enoki.mystenlabs.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    Enoki
                  </a>
                </p>
                <p className="text-xs md:text-sm text-gray-400">
                  Powered by Move smart contracts and Mysticeti consensus protocol for transparent,
                  secure, and lightning-fast gameplay.
                </p>
              </div>
            </div>

            <div className="mt-8 md:mt-16 pt-6 md:pt-8 text-center">
              <p className="text-xs md:text-sm text-gray-500">
                © 2024 Wizards and Duels. Built for Sui Overflow 2025 Hackathon.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <ParallaxProvider>
      <Content />
    </ParallaxProvider>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">{title}</h3>
      <p className="text-sm md:text-base text-gray-600">{description}</p>
    </div>
  )
}

function GameModeCard({
  title,
  description,
  features,
}: {
  title: string
  description: string
  features: string[]
}) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
      <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center">{title}</h3>
      <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 text-center">{description}</p>

      <ul className="space-y-2 mb-4 md:mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-xs md:text-sm text-gray-700">
            <span className="text-green-500 mr-2">✓</span>
            {feature}
          </li>
        ))}
      </ul>
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
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md relative hover:shadow-lg transition-shadow">
      <div className="absolute -top-3 -left-3 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-sm md:text-base">
        {number}
      </div>
      <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 mt-2">{title}</h3>
      <p className="text-sm md:text-base text-gray-600">{description}</p>
    </div>
  )
}
