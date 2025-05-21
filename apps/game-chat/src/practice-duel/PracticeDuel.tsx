import { Link } from '@/components/Link'
import { RealtimeChat } from '@/components/realtime-chat'
import { OffChainDuelProvider } from '@/context/OffChainDuelContext'
import { useOffChainDuel } from '@/context/useOffChainDuel'
import { WizardEffects } from '@/duel/WizardEffects'
import { isDevnetEnv } from '@/lib/config'
import { DuelAction } from '@/lib/duel/duel-reducer'
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

type ScriptStep =
  | { type: 'duelStateChange'; action: DuelAction }
  | { type: 'teacherMessage'; message: string; timeout?: number }
  | { type: 'playerMessage'; message: string }
  | { type: 'opponentMessage'; message: string; timeout?: number; interval?: number }

const SCRIPT: ScriptStep[] = [
  {
    type: 'duelStateChange',
    action: { type: 'SET_OPPONENT', payload: { name: 'Wood Target', force: 20 } },
  },
  { type: 'teacherMessage', message: 'Welcome to practice ground' },
  {
    type: 'teacherMessage',
    message:
      'Let\'s practice your skills, here is a wood target. Hit it with a magic arrow by typing "@arrow"',
  },
  { type: 'playerMessage', message: '@arrow' },
  {
    type: 'teacherMessage',
    message:
      'Good! "@" sign means you are casting a spell on your opponent, and "arrow" is the name of the spell.',
  },
  {
    type: 'teacherMessage',
    message: 'This Wood target is strong stuff, let\'s try to hit it once again by typing "@arrow"',
  },
  { type: 'playerMessage', message: '@arrow' },
  {
    type: 'teacherMessage',
    message:
      'Good, as you can see in your future duels, for sure many to come, your typing skills matter.',
    timeout: 500
  },
  { type: 'teacherMessage', message: 'Now it is time to practice defensive spell !deflect.' },
  {
    type: 'teacherMessage',
    message:
      'Your next practice target is the Arrow Machine. It will cast arrows at you. You need to defend yourself!',
  },
  { type: 'teacherMessage', message: 'Type "ready" when you are ready for the next task' },
  { type: 'playerMessage', message: 'ready' },
  {
    type: 'duelStateChange',
    action: { type: 'SET_OPPONENT', payload: { name: 'Arrow Machine', force: 16 } },
  },
  {
    type: 'teacherMessage',
    message:
      'Defend yourself agains an @arrow spell from the Machine by casting a !deflect spell. Let`s practice it.',
    timeout: 500
  },
  {
    type: 'playerMessage',
    message: '!deflect',
  },
  {
    type: 'teacherMessage',
    message:
      'Look, You\'ve got "deflect" spell effect on yourself, You can see all current effects below your and opponents avatar',
    timeout: 500,
  },
  { type: 'teacherMessage', message: 'Say "ready" and the machine will throw an arrow at you...' },
  { type: 'playerMessage', message: 'ready' },
  { type: 'opponentMessage', message: '@arrow', timeout: 1200 },
  {
    type: 'teacherMessage',
    message:
      '"!" sign means you are casting a spell on yourself, and "deflect" effect defends you against attacks like "arrow" spell. As soon as opponet try to deal damage to you your "deflect" effect will gone but you will get no damage.',
    timeout: 500
  },
  {
    type: 'teacherMessage',
    message:
      'Now try to defeat the Arrow Machine. Use "!deflect" to defend from the next @arrow and then throw magic "@arrow" spells back at the machine.',
  },
  {
    type: 'playerMessage',
    message: '!deflect',
  },
  { type: 'opponentMessage', message: '@arrow', timeout: 1500 },
  {
    type: 'teacherMessage',
    message: 'Now! This is a great chance, use "@arrow"..!',
    timeout: 500,
  },
  { type: 'playerMessage', message: '@arrow' },
  {
    type: 'teacherMessage',
    message:
      'Well done! Next you will study "throw" spell and practice with Throw Machine',
    timeout: 800
  },
  {
    type: 'teacherMessage',
    message: 'Tell me that you\'re "ready"'
  },
  {
    type: 'duelStateChange',
    action: { type: 'SET_OPPONENT', payload: { name: 'Throwing Machine', force: 10 } },
  },
  {
    type: 'teacherMessage',
    message: 'Throw spell usefull for removing effects from other spells but it is useless from any sort of damage like the one that cause magic arrows.'
  },
  {
    type: 'teacherMessage',
    message: 'Any spell cost you force. The force is your life power, you will be defeated if you lose all your force. But beauty of "throw" spell is that it requires the least amount of force from all known spells'
  },
  {
    type: 'teacherMessage',
    message: 'As we learned damage from "arrow" spell reduces force of the target, so "throw" is superiour against other effect spells but not effective against spells that cause damage.'
  },
  {
    type: 'teacherMessage',
    message: 'Cast "!deflect" and we will see how the machine works'
  },
  { type: 'playerMessage', message: '!deflect' },
  { type: 'opponentMessage', message: '@throw', timeout: 1200 },
  {
    type: 'teacherMessage',
    message: 'Machine is able to disarm your deflect spell, that costs 3 force with spell that costs 2. If you continue to cast deflect against theow you will lose advantage in a duel.',
    timeout: 500
  },
  {
    type: 'teacherMessage',
    message: 'But this machine can\'t withstand against your arrows. Let\' finish it... cast "@arrow"'
  },
  { type: 'playerMessage', message: '@arrow' },
  {
    type: 'teacherMessage',
    message: 'That was easy. Arrow spell it the costest one that we learn today, you need 4 force to cast it.',
    timeout: 500
  },
  {
    type: 'teacherMessage',
    message: 'Cast "!deflect" and we will see how the machine works'
  },
  {
    type: 'teacherMessage',
    message: 'In the last practice challenge you will face one odd apprentice wiazard. He likes to use only "choke" spell against his opponents. Tell me whan you\'re "ready" to face him.'
  },
  { type: 'playerMessage', message: 'ready' },
  {
    type: 'duelStateChange',
    action: { type: 'SET_OPPONENT', payload: { name: 'Apprentice Wizard', force: 128 } },
  },
  {
    type: 'teacherMessage',
    message: 'Listen carefully, "choke" is dangerous spell. if it is cast on the opponent 3 times it will crush him in an instant. "defelct" can\'t defent from it but as we learned you can protect yourself from opponent effect such as "choke" with "throw" spell.'
  },
  {
    type: 'teacherMessage',
    message: ''
  },
  {
    type: 'teacherMessage',
    message: 'Use 4 spells "arrow", "throw", "choke", and "deflect" you learned to defeat your next opponent. Remember to use "@" to cast spells on opponet and "!" on yourself. Tell me when you\'re ready to face in a duel with apprentice wizard'
  },
  { type: 'playerMessage', message: 'ready' },
  { type: 'opponentMessage', message: '@choke', timeout: 4500 },
]

function Action() {
  const { duelData, currentWizardId, opponentId, dispatch } = useOffChainDuel()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [tutorialMessages, setTutorialMessages] = useState<ChatMessage[]>([])

  const step = SCRIPT[currentStepIndex]
  useEffect(() => {
    if (!step) {
      // FIXME: need better handling
      console.warn('no more steps')
      return
    }

    if (step.type === 'teacherMessage') {
      setTimeout(() => {
        setTutorialMessages((prev) => [...prev, createTeacherMessage(step.message)])
        setCurrentStepIndex((prev) => prev + 1)
      }, step.timeout)
    } else if (step.type === 'duelStateChange') {
      dispatch(step.action)
      setCurrentStepIndex((prev) => prev + 1)
    } else if (step.type === 'opponentMessage') {
      setTimeout(() => {
        setTutorialMessages((prev) => [...prev, createOpponentMessage(opponentId, step.message)])
        const targetId = step.message[0] === '@' ? currentWizardId : opponentId
        dispatch({
          type: 'CAST_SPELL',
          payload: {
            targetId,
            casterId: opponentId,
            spellName: step.message.slice(1),
          },
        })
        setCurrentStepIndex((prev) => prev + 1)
      }, step.timeout ?? 0)
    } else if (step.type === 'playerMessage') {
      // action is handled by handleCastSpell
    }
  }, [currentStepIndex, currentWizardId, dispatch, opponentId, step])

  const handleCastSpell = useCallback(
    (input: string) => {
      if (!step) {
        // FIXME: need better handling
        console.warn('no more steps')
        return
      }

      if (step.type === 'playerMessage') {
        if (input === step.message) {
          if (input === 'ready') {
            setCurrentStepIndex((prev) => prev + 1)
          } else {
            const targetId = input[0] === '@' ? opponentId : currentWizardId
            dispatch({
              type: 'CAST_SPELL',
              payload: { casterId: currentWizardId, targetId, spellName: input.slice(1).toLowerCase() },
            })
            setCurrentStepIndex((prev) => prev + 1)
          }
        }
      }
    },
    [currentWizardId, dispatch, opponentId, step]
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

// function Start() {
//   const { startDuel, duelData } = useOffChainDuel()
//
//   const handleStartDuel = () => {
//     startDuel({ countdownSeconds: 0 })
//   }
//
//   return (
//     <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold mb-6 text-center">Practice Ground</h2>
//
//       <div className="flex justify-between w-full mb-6">
//         <div className="text-center">
//           <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
//             <span className="text-xl">🧙</span>
//           </div>
//           <p className="font-semibold">Wooden Target</p>
//           <p className="text-sm text-gray-600">Force: {duelData.wizard2.force}</p>
//         </div>
//
//         <div className="text-center">
//           <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
//             <span className="text-xl">🧙‍♂️</span>
//           </div>
//           <p className="font-semibold">You</p>
//           <p className="text-sm text-gray-600">Force: {duelData.wizard1.force}</p>
//         </div>
//       </div>
//
//       <Button onClick={handleStartDuel}>Start Practice Duel</Button>
//
//       <div className="mt-4 text-center">
//         <p className="text-sm text-gray-600 mb-2">
//           Practice mode: Cast spells with @ (opponent) or ! (self)
//         </p>
//         <Link to="/" className="text-blue-500 hover:underline">
//           Back to Home
//         </Link>
//       </div>
//     </div>
//   )
// }
//
// function Result() {
//   const { winner, duelData } = useOffChainDuel()
//
//   const isWinner = winner === 'player'
//
//   return (
//     <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold mb-6 text-center">{isWinner ? 'Victory!' : 'Defeat!'}</h2>
//
//       <div className="flex justify-between w-full mb-6">
//         <div className="text-center">
//           <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
//             <span className="text-xl">🧙</span>
//           </div>
//           <p className="font-semibold">{duelData.wizard2.id}</p>
//           <p className="text-sm text-gray-600">Force: {duelData.wizard2.force}</p>
//         </div>
//
//         <div className="text-center">
//           <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
//             <span className="text-xl">🧙‍♂️</span>
//           </div>
//           <p className="font-semibold">You</p>
//           <p className="text-sm text-gray-600">Force: {duelData.wizard1.force}</p>
//         </div>
//       </div>
//
//       <p className="text-lg font-semibold mb-4">
//         {isWinner ? 'You have defeated your opponent!' : 'You have been defeated!'}
//       </p>
//
//       <Link
//         to="/"
//         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
//       >
//         Back to Home
//       </Link>
//     </div>
//   )
// }

function DevTools() {
  const { duelData } = useOffChainDuel()

  if (!isDevnetEnv) {
    return null
  }

  return (
    <div className="top-0 left-0 absolute pl-6 pb-8 text-xs">
      <pre className="text-gray-600 mt-2">duel: {JSON.stringify(duelData, null, 4)}</pre>
    </div>
  )
}
