import { Link } from '@/components/Link'
import { RealtimeChat } from '@/components/realtime-chat'
import { Button, ButtonWithFx } from '@/components/ui/button'
import { OffChainDuelProvider } from '@/context/OffChainDuelContext'
import { useOffChainDuel } from '@/context/useOffChainDuel'
import { ForceBar } from '@/duel/ForceBar'
import { WizardEffects } from '@/duel/WizardEffects'
import { isDevnetEnv } from '@/lib/config'
import { DuelAction, DuelWizard } from '@/lib/duel/duel-reducer'
import { ChatMessage } from '@/lib/message'
import { getSpellSpec } from '@/lib/protocol/spell'
import { SFX } from '@/lib/sfx'
import { Howl } from 'howler'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const PRACTICE_DUEL_ID = 'practice-duel'

const TUTORIAL_MESSAGES_DELAY_MS = 800

const MUSIC = {
  script: new Howl({
    src: ['/g/music/practice-script.ogg'],
    volume: 1,
    loop: true,
    preload: true,
  }),
  duel: new Howl({
    src: ['/g/music/practice-duel.ogg'],
    volume: 0.8,
    loop: true,
    preload: true,
  }),
}

export function PracticeDuel() {
  return (
    <div className="w-[460px] h-full mx-auto px-4">
      <OffChainDuelProvider
        duelId={PRACTICE_DUEL_ID}
        currentWizardId="player"
        opponentId="opponent"
      >
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
    channel: PRACTICE_DUEL_ID,
    timestamp: new Date().toISOString(),
  }
}

function createOpponentMessage(opponentName: string, text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    text,
    username: opponentName,
    channel: PRACTICE_DUEL_ID,
    timestamp: new Date().toISOString(),
  }
}

function PracticeDuelContent() {
  const { dispatch } = useOffChainDuel()
  const [practiceStep, setPracticeStep] = useState<'script' | 'duel' | 'completed'>('script')

  // Start duel immediately
  useEffect(() => {
    dispatch({
      type: 'START_DUEL',
      payload: { countdownSeconds: 0 },
    })
  }, [dispatch])

  // Handle music playback based on practice step
  useEffect(() => {
    if (practiceStep === 'script') {
      MUSIC.duel.stop()
      MUSIC.script.play()
    } else if (practiceStep === 'duel') {
      MUSIC.script.fade(1, 0, 1200).on('fade', () => {
        MUSIC.script.stop()
        MUSIC.duel.play()
      })
    } else {
      MUSIC.script.stop()
      MUSIC.duel.stop()
    }

    return () => {
      MUSIC.script.stop()
      MUSIC.duel.stop()
    }
  }, [practiceStep])

  const handlePracticeScriptComplete = useCallback(() => {
    setPracticeStep('duel')
  }, [])

  const handleDuelCompleted = useCallback(() => {
    setPracticeStep('completed')
  }, [])

  return (
    <div className="flex flex-col h-full">
      {practiceStep === 'script' && <ScriptAction onComplete={handlePracticeScriptComplete} />}
      {practiceStep === 'duel' && <ApprenticeDuelAction onComplete={handleDuelCompleted} />}
      {practiceStep === 'completed' && <Result />}
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
    action: { type: 'SET_WIZARD', payload: { key: 'wizard2', name: 'Wood Target', force: 20 } },
  },
  { type: 'teacherMessage', message: 'Welcome to Wizards & Duels practice ground.' },
  {
    type: 'teacherMessage',
    message:
      'I\'ll teach you how to use basic spells. If you are seasoned wizard feel free to skip practice with "Skip Practice" button below.',
  },
  {
    type: 'teacherMessage',
    message: 'Here is a wood target, hit it with a magic arrow by typing "@arrow"',
  },
  { type: 'playerMessage', message: '@arrow' },
  {
    type: 'teacherMessage',
    message:
      'Good! "@" sign means you are casting a spell on your opponent, and "arrow" is the name of the spell. This spell cause damage to opponent force you can see your opponent force bar below. If magic force goes to 0 that means defeat.',
  },
  {
    type: 'teacherMessage',
    message: 'This Wood target is strong one, let\'s try to hit it once again by typing "@arrow"',
  },
  { type: 'playerMessage', message: '@arrow' },
  {
    type: 'teacherMessage',
    message: 'Good, as you can see, in duels, for sure many to come, your typing skills matter.',
    timeout: TUTORIAL_MESSAGES_DELAY_MS,
  },
  {
    type: 'teacherMessage',
    message:
      'Now it is time to practice defensive deflect spell. Your next practice target is an Arrow Machine.',
  },
  { type: 'teacherMessage', message: 'Type and send anything when you are ready for the next task' },
  { type: 'playerMessage', message: 'ready' },
  {
    type: 'duelStateChange',
    action: { type: 'SET_WIZARD', payload: { key: 'wizard2', name: 'Arrow Machine', force: 25 } },
  },
  {
    type: 'teacherMessage',
    message:
      'This Machine will cast magic arrows at you, same spell as you used to crush the Wood Target. Defend yourself agains @arrow spell from the Machine by casting a "!deflect" spell. Let`s practice it.',
    timeout: TUTORIAL_MESSAGES_DELAY_MS,
  },
  {
    type: 'playerMessage',
    message: '!deflect',
  },
  {
    type: 'teacherMessage',
    message:
      'Look, You\'ve got "deflect" spell effect on yourself, You can see all current effects below your and opponent\'s avatar',
    timeout: TUTORIAL_MESSAGES_DELAY_MS,
  },
  {
    type: 'teacherMessage',
    message:
      '"!" sign means you are casting a spell on yourself, and "deflect" effect defends you against spells that cause damage like "arrow" spell. As soon as opponet try to deal damage your "deflect" effect will gone but you will get no damage.',
    timeout: TUTORIAL_MESSAGES_DELAY_MS,
  },
  { type: 'teacherMessage', message: 'Say "ready" and the machine will throw an arrow at you...' },
  { type: 'playerMessage', message: 'ready' },
  { type: 'opponentMessage', message: '@arrow', timeout: 1200 },
  {
    type: 'teacherMessage',
    message:
      'Your deflect effect is gone, but you got no damage. A great advantage of deflect spell is that part of deflected damage is returned to the opponent.',
    timeout: TUTORIAL_MESSAGES_DELAY_MS,
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
    timeout: TUTORIAL_MESSAGES_DELAY_MS,
  },
  { type: 'playerMessage', message: '@arrow' },
  {
    type: 'teacherMessage',
    message: 'Well done! Next you will study "throw" spell and practice with Throw Machine',
    timeout: 800,
  },
  {
    type: 'teacherMessage',
    message: 'Tell me that you\'re "ready"',
  },
  { type: 'playerMessage', message: 'ready' },
  {
    type: 'duelStateChange',
    action: {
      type: 'SET_WIZARD',
      payload: { key: 'wizard2', name: 'Throwing Machine', force: 10 },
    },
  },
  {
    type: 'teacherMessage',
    message:
      'Throw spell usefull for removing effects from other spells but it is useless agaist any sort of damage like the one that cause magic arrows.',
  },
  {
    type: 'teacherMessage',
    message:
      'Any spell cost you force. The force is your life power. Remember? You will be defeated if you lose all of your force. But beauty of "throw" spell is that it requires the least amount of force from all known spells.',
  },
  {
    type: 'teacherMessage',
    message:
      'As we learned damage from "arrow" spell reduces force of the target, so "throw" is superiour against other effect spells out there but has no effect against arrow spell.',
  },
  {
    type: 'teacherMessage',
    message: 'Cast "!deflect" and we will see how the machine works',
  },
  { type: 'playerMessage', message: '!deflect' },
  { type: 'opponentMessage', message: '@throw', timeout: 1600 },
  {
    type: 'teacherMessage',
    message:
      'Machine is able to disarm your deflect spell, that costs 3 force with throw spell that costs 2. If you continue to cast deflect against opponent that disarms your deflect with throw spell you will lose advantage in a duel.',
    timeout: TUTORIAL_MESSAGES_DELAY_MS,
  },
  {
    type: 'teacherMessage',
    message:
      'But this machine can\'t withstand against your arrows. Let\' finish it... cast "@arrow"',
  },
  { type: 'playerMessage', message: '@arrow' },
  {
    type: 'teacherMessage',
    message:
      'That was easy. Arrow spell it the costest one that we learn today, you need 4 force to cast it.',
    timeout: TUTORIAL_MESSAGES_DELAY_MS,
  },
  {
    type: 'teacherMessage',
    message:
      'In the last practice challenge you will face one odd apprentice wiazard. He likes to use only "choke" spell against his opponents. Type and send anything whan you\'re ready to learn last spell for today.',
  },
  { type: 'playerMessage', message: 'ready' },
  {
    type: 'duelStateChange',
    action: {
      type: 'SET_WIZARD',
      payload: { key: 'wizard2', name: 'Apprentice Wizard', force: 128 },
    },
  },
  {
    type: 'duelStateChange',
    action: { type: 'RESET_DUEL', payload: { wizard1Force: 128, wizard2Force: 128 } },
  },
  {
    type: 'teacherMessage',
    message:
      'Listen carefully, "choke" is dangerous spell. if it is cast on the opponent 3 times it will crush him in an instant. "deflect" can\'t defend from it but as we learned you can protect yourself from opponent effects such as "choke" with "throw" spell.',
  },
  {
    type: 'teacherMessage',
    message:
      'Use all 4 spells "arrow", "throw", "choke", and "deflect" you learned to defeat your next opponent. Remember to use "@" to cast spells on opponet and "!" on yourself. ',
  },
  {
    type: 'teacherMessage',
    message: "Tell me when you're ready to face him.",
  },
  { type: 'playerMessage', message: 'ready' },
]

function ScriptAction({ onComplete }: { onComplete: () => void }) {
  const { duelData, currentWizardId, opponentId, dispatch } = useOffChainDuel()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [tutorialMessages, setTutorialMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    const step = SCRIPT[currentStepIndex]
    if (!step && currentStepIndex === SCRIPT.length) {
      onComplete()
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
        const spellName = step.message.slice(1).toLowerCase()
        SFX.spell.play(spellName)
        dispatch({
          type: 'CAST_SPELL',
          payload: {
            targetId,
            casterId: opponentId,
            spellName,
          },
        })
        setCurrentStepIndex((prev) => prev + 1)
      }, step.timeout ?? 0)
    } else if (step.type === 'playerMessage') {
      // action is handled by handleUserInput
    }
  }, [currentStepIndex, currentWizardId, dispatch, onComplete, opponentId])

  const handleUserInput = useCallback(
    (input: string) => {
      const step = SCRIPT[currentStepIndex]
      if (!step) {
        onComplete()
        return
      }

      if (step.type === 'playerMessage') {
        const message = input.trim().toLowerCase()
        if (step.message === 'ready') {
          // any message
          setCurrentStepIndex((prev) => prev + 1)
        } else if (message === step.message) {
          const targetId = message[0] === '@' ? opponentId : currentWizardId
          const spellName = message.slice(1)
          SFX.spell.play(spellName)
          dispatch({
            type: 'CAST_SPELL',
            payload: {
              casterId: currentWizardId,
              targetId,
              spellName,
            },
          })
          setCurrentStepIndex((prev) => prev + 1)
        }
      }
    },
    [currentStepIndex, currentWizardId, dispatch, onComplete, opponentId]
  )

  const wizard = duelData.wizard1.id === currentWizardId ? duelData.wizard1 : duelData.wizard2
  const opponent = duelData.wizard1.id === opponentId ? duelData.wizard1 : duelData.wizard2

  return (
    <>
      <RealtimeChat
        roomName={PRACTICE_DUEL_ID}
        username="Promising Wizard"
        onMessage={handleUserInput}
        messages={tutorialMessages}
        disablePersistentStorage
      />
      <ActionUi wizard={wizard} opponent={opponent} />
      {isDevnetEnv && (
        <Button variant="link" onClick={() => onComplete()}>
          skip to duel
        </Button>
      )}
    </>
  )
}

function ApprenticeDuelAction({ onComplete }: { onComplete: () => void }) {
  const { duelData, currentWizardId, opponentId, dispatch } = useOffChainDuel()
  const [tutorialMessages, setTutorialMessages] = useState<ChatMessage[]>([
    createTeacherMessage("Let's duel begin!"),
  ])

  // setup duel on mount
  useEffect(() => {
    dispatch({
      type: 'SET_WIZARD',
      payload: { key: 'wizard2', name: 'Apprentice Wizard', force: 1 },
    })
    dispatch({
      type: 'RESET_DUEL',
      payload: { wizard1Force: 128, wizard2Force: 128 },
    })
    dispatch({
      type: 'START_DUEL',
      payload: { countdownSeconds: 0 },
    })
  }, [dispatch])

  // run opponent actions
  const opponentCastIntervalRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    const to = setInterval(() => {
      setTutorialMessages((prev) => [...prev, createOpponentMessage(opponentId, '@choke')])
      const spellName = 'choke'
      SFX.spell.play(spellName)
      dispatch({
        type: 'CAST_SPELL',
        payload: {
          casterId: opponentId,
          targetId: currentWizardId,
          spellName,
        },
      })
    }, 3500)

    opponentCastIntervalRef.current = to

    return () => clearInterval(to)
  }, [currentWizardId, dispatch, opponentId])

  useEffect(() => {
    if (duelData.wizard2.force <= 3) {
      if (opponentCastIntervalRef.current) {
        clearInterval(opponentCastIntervalRef.current)
      }
      setTutorialMessages((prev) => [
        ...prev,
        createTeacherMessage('Your oponent has no more force to fight... surely you will win!'),
      ])
    }
  }, [duelData.wizard2])

  useEffect(() => {
    if (duelData.wizard2.force === 0) {
      if (opponentCastIntervalRef.current) {
        clearInterval(opponentCastIntervalRef.current)
      }
      setTimeout(() => {
        setTutorialMessages((prev) => [
          ...prev,
          createTeacherMessage('You have defeated your opponent!'),
          createTeacherMessage('Now you are ready to challenge the real wizards.'),
        ])
        MUSIC.duel.fade(1, 0.2, 2500)
      }, TUTORIAL_MESSAGES_DELAY_MS)
    }

    if (duelData.wizard1.force === 0) {
      setTimeout(() => {
        setTutorialMessages((prev) => [
          ...prev,
          createTeacherMessage('You have been defeated!'),
          createTeacherMessage("Let's try again."),
        ])
        dispatch({
          type: 'RESET_DUEL',
          payload: { wizard1Force: 128, wizard2Force: 128 },
        })
        dispatch({
          type: 'START_DUEL',
          payload: { countdownSeconds: 0 },
        })
      }, 300)
    }
  }, [dispatch, duelData.wizard1.force, duelData.wizard2.force])

  const handleUserInput = useCallback(
    (input: string) => {
      const message = input.trim()
      if (message[0] === '@' || message[0] === '!') {
        const targetId = message[0] === '@' ? opponentId : currentWizardId
        const spellName = message.slice(1).toLowerCase()
        const spellSpec = getSpellSpec(spellName)
        if (!spellSpec) {
          toast.warning(`"${spellName}" is not a spell`)
          return
        }

        SFX.spell.play(spellName)
        dispatch({
          type: 'CAST_SPELL',
          payload: {
            casterId: currentWizardId,
            targetId,
            spellName,
          },
        })
      }
    },
    [currentWizardId, dispatch, opponentId]
  )

  const handleExitDuel = useCallback(() => {
    setTutorialMessages((prev) => [...prev, createTeacherMessage('Good luck!')])
    MUSIC.duel.fade(0.1, 0, 1200).on('fade', () => {
      MUSIC.duel.stop()
      onComplete()
    })
  }, [onComplete])

  const wizard = duelData.wizard1.id === currentWizardId ? duelData.wizard1 : duelData.wizard2
  const opponent = duelData.wizard1.id === opponentId ? duelData.wizard1 : duelData.wizard2

  return (
    <>
      <RealtimeChat
        roomName={PRACTICE_DUEL_ID}
        username="Promising Wizard"
        onMessage={handleUserInput}
        messages={tutorialMessages}
        disablePersistentStorage
      />
      <ActionUi wizard={wizard} opponent={opponent} />
      {isDevnetEnv && (
        <Button variant="link" className="my-2" onClick={() => onComplete()}>
          skip to completed state
        </Button>
      )}
      {duelData.wizard2.force === 0 && (
        <div className="w-fit mx-auto mt-4">
          <ButtonWithFx onClick={handleExitDuel}>Claim Reward</ButtonWithFx>
        </div>
      )}
    </>
  )
}

function ActionUi({ wizard, opponent }: { wizard: DuelWizard; opponent: DuelWizard }) {
  const mimicDuelInterace = useMemo(
    () => ({
      id: PRACTICE_DUEL_ID,
      wizard1: wizard.id,
      wizard2: opponent.id,
      wizard1_force: wizard.force,
      wizard2_force: opponent.force,
      wizard1_effects: wizard.effects,
      wizard2_effects: opponent.effects,
      started_at: 0,
      prize_pool: '0',
    }),
    [opponent.effects, opponent.force, opponent.id, wizard.effects, wizard.force, wizard.id]
  )
  return (
    <div className="flex flex-col w-full">
      <ForceBar duel={mimicDuelInterace} currentWizardId={wizard.id} />

      <div className="flex justify-between items-start py-8 px-4 w-full">
        <div className="flex flex-col items-center w-1/3">
          <div className="w-12 h-12 bg-orange-300 rounded-full flex items-center justify-center mb-2">
            <span className="text-xl">🧙</span>
          </div>
          <p className="font-semibold text-sm">{opponent.id}</p>
          <div className="mt-2 min-h-[30px]">
            <WizardEffects effects={opponent.effects} />
          </div>
        </div>

        <div className="text-lg font-bold flex items-center">VS</div>

        <div className="flex flex-col items-center w-1/3">
          <div className="w-12 h-12 bg-indigo-300 rounded-full flex items-center justify-center mb-2">
            <span className="text-xl">🧙‍♂️</span>
          </div>
          <p className="font-semibold text-sm">You</p>
          <div className="mt-2 min-h-[30px]">
            <WizardEffects effects={wizard.effects} />
          </div>
        </div>
      </div>

      {opponent.force !== 0 && (
        <div className="flex gap-8 justify-center mt-4 text-center">
          <Link to="/d">Skip Practice</Link>
        </div>
      )}
    </div>
  )
}

function Result() {
  const { winner, duelData } = useOffChainDuel()

  const isWinner = winner === 'player'

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md h-full">
      <h2 className="text-2xl font-bold mb-6 text-center">{isWinner ? 'Victory!' : 'Defeat!'}</h2>

      <div className="flex items-center  w-full mb-6">
        <div className="text-center w-1/3">
          <div className="w-12 h-12 bg-orange-300 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🧙</span>
          </div>
          <p className="font-semibold">{duelData.wizard2.id}</p>
          <p className="text-sm text-gray-600">Force: {duelData.wizard2.force}</p>
        </div>

        <div className="text-xl font-bold grow text-center">VS</div>

        <div className="text-center w-1/3">
          <div className="w-12 h-12 bg-indigo-300 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🧙‍♂️</span>
          </div>
          <p className="font-semibold">You</p>
          <p className="text-sm text-gray-600">Force: {duelData.wizard1.force}</p>
        </div>
      </div>

      <p className="text-lg font-semibold mb-8">
        {isWinner ? 'You have defeated your opponent!' : 'You have been defeated!'}
      </p>

      <Link to="/d">
        <ButtonWithFx>Claim reward (Sign Up required)</ButtonWithFx>
      </Link>

      <p className="mt-4 text-center">
        We welcome you into the game <br />
        with "new player reward", sing up to claim.
      </p>
    </div>
  )
}

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
