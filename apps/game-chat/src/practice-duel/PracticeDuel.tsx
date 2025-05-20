import { Link } from '@/components/Link'
import { RealtimeChat } from '@/components/realtime-chat'
import { Button } from '@/components/ui/button'
import { OffChainDuelProvider } from '@/context/OffChainDuelContext'
import { useOffChainDuel } from '@/context/useOffChainDuel'
import { WizardEffects } from '@/duel/WizardEffects'
import { DuelState } from '@/lib/duel/duel-reducer'
import { ChatMessage } from '@/lib/message'
import { useCallback, useEffect, useState } from 'react'

export function PracticeDuel() {
  return (
    <div className="w-[460px] h-full mx-auto px-4">
      <OffChainDuelProvider currentWizardId="player" opponentId="opponent">
        <PracticeDuelContent />
        <DevTools />
      </OffChainDuelProvider>
    </div>
  )
}

// Helper function to create a teacher message
function createTeacherMessage(text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    text,
    username: 'Teacher Wizard',
    channel: 'practice-duel',
    timestamp: new Date().toISOString(),
  }
}

function createOpponentMessage(opponentName: string, text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    text,
    username: opponentName,
    channel: 'practice-duel',
    timestamp: new Date().toISOString(),
  }
}

// Define the tutorial step interface
interface TutorialStep {
  id: string
  opponentSetup: {
    name: string
    force: number
  }
  intro: string[]
  expectedAction: (message: string) => boolean
  stepCompleted: (state: { duel: DuelState; messages: ChatMessage[] }) => boolean
  hint: string
  opponentAction?: (
    messageCallback: (message: string) => void,
  ) => (() => void) | undefined
}

/**
 * PRACTICE_STEP_1:
 * - change duel state, opponent name to "wood target" with force 20
 * - teacher wizard message: let's practive your skills, here is a wood target hit it with a magic arrow by typing "@arrow"
 * - wait for the player to cast "@arror" spell, if he types something else, teacher wizards reply "you must cast a magic arrow spell by typing @arrow"
 * - teacher wizard message: good, "@" sign means you are casting a spell on your opponent, and "arrow" is the name of the spell.
 * - teacher wizard message: this wood target is strong stuff, let's try to hit it harder by typing "@arrow" again
 * - wait for the player to cast "@arror" spell, if he types something else, teacher wizards reply "let's keep practicing, cast @arrow"
 * - teacher wizard message: good, as you can see in your future duels, for shure many to come, your typing skills matter.
 * - teacher wizard message tell me "ready" when you are ready for the next task
 * - wait for the player to type "ready"
 */

/**
 * PRACTICE_STEP_2:
 * - change duel state, opponent name to "arrow machine" with force 20
 * - teacher wizard message: now it is time to practice defensive spell, cast a spell to deflect the machine arrow attack by typing "!deflect"
 * - arrow machine: casts "@arrow" spells every 2.5 seconds, ever time @arrow is not deflect by the player wizard teacher says "to defend yourself you must deflect the arrow, cast !deflect"
 * - wait for the player to cast "!deflect" spell, if he types something else, teacher wizards reply "defend yourself, cast !deflect"
 * - arrow machine stops casting arrows
 * - teacher wizard message: good, "!" sign means you are casting a spell on yourself, and "deflect" spell defends you agains attacks like the "arrow" spell
 * - teacher wizard message: now try to defeat the arrow machine, youse deflect message to defend yourself, and magic arrow spells to attack the machine
 * - teacher wizard message: we will start as you type "ready"
 * - arrow machine starts casting arrows every 2 seconds, if players get 48 damage reset the game state, teacher wizard message: you will be defeated this way, but you will get better, try again by typing "ready", repeat until player wins
 * - wait for the player to cast two @arrow to defeat the machine
 * - teacher wizard message: good, now you know how to deflect arrows and attack with arrows
 * - teacher wizard message: tell me "ready" when you are ready for the next task
 * - wait for the player to type "ready"
 */

/**
 * PRACTICE_STEP_3:
 * - change duel state, opponent name to "throw machine"  with force 30
 * - teacher wizard message: now it is time to practice defence against "throw" spell, to counter attack throw spell cast arrow spell or deflect spell
 * - teacher wizard message: after successful counter attack to remove throw spell attack the machine to defeat it
 * - teacher wizard message tell me "ready" when you are ready to try
 * - wait for the player to type "ready"
 * - throw machine: casts "@throw" spells every 2.5 seconds, every time @throw is applien when player already has thrown effect wizard teacher says "counter attack throw spell to remove "thrown" effect on yourself and defeat the machine with @arrow spell"
 * - wait for the player to cast three @arrow to defeat the machine
 * - teacher wizard message: good, you have learned how to counter attack throw spell
 * - teacher wizard message: you are ready for the last challenge, tell me "ready" when you are ready
 * - wait for the player to type "ready"
 */

/**
 * PRACTICE_STEP_4:
 * - change duel state, opponent name to "Apprentice Wizard"  with force 128
 * - teacher wizard message: you will face an apprentice wizard, he loves to choke their opponents
 * - teacher wizard message: @choke is dangerous spell if casted 3 times in a row it will defeat you, but you can protect yourself with @throw spell
 * - teacher wizard message: tell me when you "ready" to challenge the apprentice wizard
 * - apprentice wizard casts @choke every 2.5 seconds if he is thrown he casts an arrow, on 7 seconds just before 3rd choke reset the game state to 128 force for each wizards, teacher wizard says: "you was a moment avay from beign defeated, let's try again, throw your opponent to take advantage over him and choke him or cast arrows. Say "ready" when you are ready to try again"
 * - wait for the duel ends
 */

// Define the tutorial steps
const TUTORIAL_STEPS: TutorialStep[] = [
  // Step 1: Learn to cast arrow spell
  {
    id: 'cast-arrow',
    opponentSetup: {
      name: 'Wood Target',
      force: 20,
    },
    intro: [
      'Welcome to practice ground',
      'Let\'s practice your skills, here is a wood target. Hit it with a magic arrow by typing "@arrow"',
    ],
    expectedAction: (message) => message === '@arrow',
    stepCompleted: ({ duel }) => {
      return duel.wizard2.force === 8
    },
    hint: 'You must cast a magic arrow spell by typing @arrow',
  },
  // Step 2: Cast arrow again
  {
    id: 'cast-arrow-again',
    opponentSetup: {
      name: 'Wood Target',
      force: 8,
    },
    intro: [
      'Good! "@" sign means you are casting a spell on your opponent, and "arrow" is the name of the spell.',
      'This wood target is strong stuff, let\'s try to hit it once again by typing "@arrow"',
    ],
    expectedAction: (message) => message === '@arrow',
    stepCompleted: ({ duel }) => {
      return duel.wizard2.force === 0
    },
    hint: "Let's keep practicing, cast @arrow again",
  },
  {
    id: 'cast-arrow-outro',
    opponentSetup: {
      name: 'Wood Target',
      force: 0,
    },
    intro: [
      'Good, as you can see in your future duels, for sure many to come, your typing skills matter.',
      'Now it is time to practice defensive spell. You can defend yourself agains an @arrow spell by casting a !deflect spell. Let`s practice it.',
      'The next opponent is the Arrow Machine. It will cast arrows at you. You need to defend yourself!',
      'Type "ready" when you are ready for the next task',
    ],
    expectedAction: (message) => message === 'ready',
    stepCompleted: ({ messages }) => {
      return messages[0].text === 'ready'
    },
    hint: 'type and send "ready" to continue',
  },
  {
    id: 'cast-deflect',
    opponentSetup: {
      name: 'Arrow Machine',
      force: 48,
    },
    intro: [],
    expectedAction: (message) => message === '!deflect',
    stepCompleted: ({ duel }) => {
      return duel.wizard1.effects[2] === 1
    },
    hint: 'To defend yourself you must deflect the arrow, cast !deflect',
    opponentAction: (onMessage) => {
      const to = setInterval(() => {
        onMessage('@arrow')
      }, 3500)

      return () => clearInterval(to)
    },
  },
  {
    id: 'cast-on-yourself-explanation',
    opponentSetup: {
      name: 'Arrow Machine',
      force: 48,
    },
    intro: [
      'Good! "!" sign means you are casting a spell on yourself, and "deflect" spell defends you against attacks like the "arrow" spell.',
      'Now try to defeat the Arrow Machine. Use !deflect to defend yourself, and magic @arrow spells to attack the machine.',
      'Tell me "ready" when you are ready to continue.',
    ],
    expectedAction: (message) => message === 'ready',
    stepCompleted: ({ messages }) => {
      return messages[0].text === 'ready'
    },
    hint: 'type and send "ready" to continue',
  },
  {
    id: 'defeat-arrow-machine',
    opponentSetup: {
      name: 'Arrow Machine',
      force: 12,
    },
    intro: [],
    hint: 'To defend yourself you must deflect the arrow, cast !deflect, and right after attack the machine, cast @arrow',
    expectedAction: (message) => message === 'ready',
    stepCompleted: ({ messages }) => {
      return messages[0].text === 'ready'
    },
    opponentAction: (onMessage) => {
      const to = setInterval(() => {
        onMessage('@arrow')
      }, 3500)

      return () => clearInterval(to)
    },
  },
  {
    id: 'arrow-machine-defeated',
    opponentSetup: {
      name: 'Arrow Machine',
      force: 0,
    },
    intro: [
      'Good! Now you know how to deflect arrows and attack with arrows.',
      'Tell me "ready" when you are ready to continue',
    ],
    expectedAction: (message) => message === 'ready',
    stepCompleted: ({ messages }) => {
      return messages[0].text === 'ready'
    },
    hint: 'type and send "ready" to continue',
    opponentAction: () => undefined, // No opponent action in this step
  },
]

function PracticeDuelContent() {
  const { dispatch } = useOffChainDuel()

  useEffect(() => {
    dispatch({
      type: 'START_DUEL',
      payload: { countdownSeconds: 0 },
    })
  }, [dispatch])

  return (
    <div className="flex flex-col h-full">
      {/* {duelState === 'pending' && <Start />} */}
      <Action />
      {/* {duelState === 'finished' && <Result />} */}
    </div>
  )
}

function Action() {
  const { duelData, duelState, currentWizardId, opponentId, dispatch } = useOffChainDuel()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [tutorialMessages, setTutorialMessages] = useState<ChatMessage[]>([])
  // Get the current step
  const currentStep = TUTORIAL_STEPS[currentStepIndex]
  // if (duelState === 'finished') {
  //   currentStep = {
  //     id: 'player-lost',
  //     opponentSetup: {
  //       name: duelData.wizard2.id,
  //       force: duelData.wizard2.force,
  //     },
  //     intro: [
  //       'You failed. That happens. You will get better.',
  //       'Type "ready" when you are ready to try again',
  //     ],
  //     expectedAction: () => false,
  //     stepCompleted: ({ messages }) => {
  //       return messages[0].text === 'ready'
  //     },
  //     hint: '',
  //   }
  // }

  const handleOpponentSpell = useCallback(
    (input: string) => {
      dispatch({
        type: 'CAST_SPELL',
        payload: {
          casterId: opponentId,
          spellName: 'arrow',
          targetId: 'player',
        },
      })
      setTutorialMessages((prev) => [...prev, createOpponentMessage(opponentId, input)])
    },
    [dispatch, opponentId]
  )

  // Init and switch practice steps
  useEffect(() => {
    // Set up opponent
    dispatch({
      type: 'SET_OPPONENT',
      payload: currentStep.opponentSetup,
    })

    // Add intro messages
    const stepIntroMessages = currentStep.intro.map(createTeacherMessage)
    setTutorialMessages(stepIntroMessages)

    // Set up opponent action if any
    if (currentStep.opponentAction) {
      const cleanup = currentStep.opponentAction(handleOpponentSpell)
      return cleanup
    }
  }, [currentStep, dispatch, currentWizardId, opponentId, handleOpponentSpell])

  // Handle user messages and spell casting
  const handleCastSpell = useCallback(
    (userInput: string) => {
      const message = userInput.trim()
      if (!message || !currentStep) return

      const targetChar = message[0]
      const isSpell = targetChar === '@' || targetChar === '!'

      // Check if the user's action matches the expected action for the current step
      const isExpectedAction = currentStep.expectedAction(message)

      if (isExpectedAction) {
        // If this is the last step, we're done
        if (currentStepIndex >= TUTORIAL_STEPS.length - 1) {
          // Handle completion of the tutorial
          // TODO: complete
        } else {
          // Show outro messages for the current step
          setTimeout(() => {
            setCurrentStepIndex((prev) => prev + 1)
          }, 750)
        }
      } else {
        // If the user's action doesn't match but is a valid attempt, show the hint
        setTimeout(() => {
          const hintMessage = createTeacherMessage(currentStep.hint)
          setTutorialMessages((prev) => [...prev, hintMessage])
        }, 500)
      }

      // Process the spell casting if it's a spell command
      if (isSpell) {
        const spellName = message.slice(1).trim().toLowerCase()
        const targetId = targetChar === '@' ? opponentId : 'player'
        dispatch({
          type: 'CAST_SPELL',
          payload: {
            casterId: currentWizardId,
            spellName,
            targetId,
          },
        })
      }
    },
    [currentStep, currentStepIndex, dispatch, currentWizardId, opponentId]
  )

  // Get wizard and opponent data
  const wizard = duelData.wizard1.id === currentWizardId ? duelData.wizard1 : duelData.wizard2
  const opponent = duelData.wizard1.id === opponentId ? duelData.wizard1 : duelData.wizard2

  return (
    <>
      <RealtimeChat
        roomName="practice-duel"
        username="Practice Wizard"
        onMessage={handleCastSpell}
        messages={tutorialMessages}
      />
      <div className="flex flex-col w-full">
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-2">
          <div className="bg-blue-500 h-full" style={{ width: `${(wizard.force / 128) * 100}%` }} />
        </div>
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
          <div
            className="bg-red-500 h-full"
            style={{ width: `${(opponent.force / 128) * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-start py-8 px-4 w-full">
          <div className="flex flex-col items-center w-1/3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl">🧙</span>
            </div>
            <p className="font-semibold text-sm">{opponent.id}</p>
            <div className="mt-2 min-h-[30px]">
              <WizardEffects effects={opponent.effects} />
            </div>
          </div>

          <div className="text-lg font-bold flex items-center">VS</div>

          <div className="flex flex-col items-center w-1/3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl">🧙‍♂️</span>
            </div>
            <p className="font-semibold text-sm">You</p>
            <div className="mt-2 min-h-[30px]">
              <WizardEffects effects={wizard.effects} />
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Practice mode: Cast spells with @ (opponent) or ! (self)
          </p>
          <Link to="/" className="text-blue-500 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </>
  )
}

function Start() {
  const { startDuel, duelData } = useOffChainDuel()

  const handleStartDuel = () => {
    startDuel({ countdownSeconds: 0 })
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Practice Ground</h2>

      <div className="flex justify-between w-full mb-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🧙</span>
          </div>
          <p className="font-semibold">Wooden Target</p>
          <p className="text-sm text-gray-600">Force: {duelData.wizard2.force}</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🧙‍♂️</span>
          </div>
          <p className="font-semibold">You</p>
          <p className="text-sm text-gray-600">Force: {duelData.wizard1.force}</p>
        </div>
      </div>

      <Button onClick={handleStartDuel}>Start Practice Duel</Button>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Practice mode: Cast spells with @ (opponent) or ! (self)
        </p>
        <Link to="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

function Result() {
  const { winner, duelData } = useOffChainDuel()

  const isWinner = winner === 'player'

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">{isWinner ? 'Victory!' : 'Defeat!'}</h2>

      <div className="flex justify-between w-full mb-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🧙</span>
          </div>
          <p className="font-semibold">{duelData.wizard2.id}</p>
          <p className="text-sm text-gray-600">Force: {duelData.wizard2.force}</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🧙‍♂️</span>
          </div>
          <p className="font-semibold">You</p>
          <p className="text-sm text-gray-600">Force: {duelData.wizard1.force}</p>
        </div>
      </div>

      <p className="text-lg font-semibold mb-4">
        {isWinner ? 'You have defeated your opponent!' : 'You have been defeated!'}
      </p>

      <Link
        to="/"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  )
}

function DevTools() {
  const { duelData } = useOffChainDuel()

  // FIXME: uncomment
  // if (!isDevnetEnv) {
  //   return null
  // }

  return (
    <div className="top-0 left-0 absolute pl-6 pb-8 text-xs">
      <pre className="text-gray-600 mt-2">duel: {JSON.stringify(duelData, null, 4)}</pre>
    </div>
  )
}
