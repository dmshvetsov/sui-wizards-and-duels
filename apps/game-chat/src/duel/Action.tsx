import { UserAccount } from '@/components/Authenticated'
import { RealtimeChat } from '@/components/realtime-chat'
import { Duel, DuelistCap } from '@/lib/protocol/duel'
import { getPidLatest } from '@/lib/protocol/package'
import { getSpellSpec } from '@/lib/protocol/spell'
import { SFX } from '@/lib/sfx'
import { executeWith } from '@/lib/sui/client'
import { displayName } from '@/lib/user'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ForceBar } from './ForceBar'
import { WizardEffects } from './WizardEffects'

import wizardCasting from '@/assets/wizard_casting.webp'
import wizardDefeated from '@/assets/wizard_defeated.webp'
import wizardDefending from '@/assets/wizard_defending.webp'
import wizardPreparing from '@/assets/wizard_preparing.webp'
import wizardReady from '@/assets/wizard_ready.webp'
import { LoadingSpin } from '@/components/Loader'
import { SPELL_CAST_ANIMATION_DURATION } from '@/lib/vfx'

const SPELL_KEYS: Record<string, { name: string; icon: string }> = {
  k: { name: 'choke', icon: '😶' },
  j: { name: 'arrow', icon: '💥' },
  i: { name: 'deflect', icon: '🛡️' },
  l: { name: 'throw', icon: '💨' },
}

type PlayerState = 'ready' | 'preparing' | 'casting'
type SpellState = { spellName: string | null; target: 'player' | 'opponent' | null }

// Helper to get icon by spell name
const getSpellIcon = (spellName: string): string | null => {
  const entry = Object.values(SPELL_KEYS).find((v) => v.name === spellName)
  return entry?.icon ?? null
}

export function Action(props: { duel: Duel; duelistCap: DuelistCap; userAccount: UserAccount }) {
  const { duel, duelistCap } = props

  const [chatMode, setChatMode] = useState(false)
  // Player and opponent character state
  const [playerState, setPlayerState] = useState<PlayerState>('ready')
  const [opponentState, setOpponentState] = useState<PlayerState>('ready')
  // Icon to display during casting and who it should appear over
  const [playerSpell, setPlayerSpell] = useState<SpellState>({ spellName: null, target: null })
  const [opponentSpell, setOpponentSpell] = useState<SpellState>({ spellName: null, target: null })

  const sprites = {
    ready: wizardReady,
    preparing: wizardPreparing,
    casting: wizardCasting,
    defending: wizardDefending,
    defeated: wizardDefeated,
  } as const

  const getSprite = (isCurrentPlayer: boolean): string => {
    if (isCurrentPlayer) {
      if (opponentState === 'casting' && opponentSpell.spellName !== 'deflect') {
        return sprites.defending
      }
      return sprites[playerState] ?? sprites.ready
    } else {
      if (playerState === 'casting' && playerSpell.spellName !== 'deflect') {
        return sprites.defending
      }
      return sprites[opponentState] ?? sprites.ready
    }
  }

  const client = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: executeWith(client, { showRawEffects: true, showObjectChanges: true }),
  })

  const handleOpponentInput = useCallback(
    (opponentInput: string) => {
      const message = opponentInput?.trim()
      if (!message) {
        return
      }
      const targetChar = message[0]
      const target =
        targetChar === '@' ? duelistCap?.wizard : targetChar === '!' ? duelistCap?.opponent : null
      if (!target) {
        // it is a chat message, do nothing
        return
      }

      const spellName = message.slice(1).trim().toLowerCase()
      const spellSpec = getSpellSpec(spellName)
      if (spellSpec) {
        console.debug('opponent spell', spellName)
        SFX.spellCast.play()
        setOpponentState('preparing')
        // SFX.spellPreparing.play()
        setTimeout(() => {
          SFX.spell.play(spellName)
          setOpponentSpell({ spellName, target: targetChar === '@' ? 'player' : 'opponent' })
          // if (playerState !== 'casting') {
          //   setPlayerSpell({ spellName: null, target: null })
          // }
          setOpponentState('casting')
          setTimeout(() => {
            if (playerState === 'ready') {
              setOpponentSpell({ spellName: null, target: null })
            }
            setOpponentState('ready')
          }, SPELL_CAST_ANIMATION_DURATION)
        }, 700)
      }
    },
    [duelistCap]
  )

  const castSpell = useCallback(
    (spellName: string, target: 'player' | 'opponent') => {
      const txExecutionSimTimeout = 700
      if (duel.id === 'demo') {
        setPlayerState('preparing')
        // SFX.spellPreparing.play()
        setTimeout(() => {
          setPlayerSpell({ spellName, target })
          SFX.spell.play(spellName)
          setPlayerState('casting')
          // if (opponentState !== 'casting') {
          //   setOpponentSpell({ spellName: null, target: null })
          // }
          setTimeout(() => {
            if (opponentState === 'ready') {
              setPlayerSpell({ spellName: null, target: null })
            }
            setPlayerState('ready')
          }, SPELL_CAST_ANIMATION_DURATION)
        }, txExecutionSimTimeout)
        return
      }

      const targetPrefix = target === 'opponent' ? '@' : '!'
      const message = `${targetPrefix}${spellName}`
      // identical logic from previous handleUserInput
      const spellSpec = getSpellSpec(spellName)
      if (!spellSpec) {
        toast.warning(`${spellName} is not a spell`)
        return
      }
      const start = Date.now()
      setPlayerState('preparing')
      SFX.spellPreparing.play()

      const tx = new Transaction()
      tx.setGasBudget(2_000_000)
      const [force] = tx.moveCall({
        target: `${getPidLatest()}::duel::use_force`,
        arguments: [tx.object(duel.id), tx.object(duelistCap.id), tx.pure.u64(spellSpec.cost)],
      })
      const [spell] = tx.moveCall({
        target: spellSpec.castMethod,
        arguments: [tx.object(force)],
      })
      tx.moveCall({
        target: spellSpec.applyMethod,
        arguments:
          spellSpec.module === 'damage'
            ? [
                tx.object(spell),
                tx.object(duel.id),
                tx.pure.address(target === 'opponent' ? duelistCap.opponent : duelistCap.wizard),
              ]
            : [
                tx.object(duel.id),
                tx.object(spell),
                tx.pure.address(target === 'opponent' ? duelistCap.opponent : duelistCap.wizard),
              ],
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            SFX.spell.play(spellName)
            setPlayerState('casting')
            setPlayerSpell({ spellName, target })
            // if (opponentState !== 'casting') {
            //   setOpponentSpell({ spellName: null, target: null })
            // }
            setTimeout(() => {
              if (opponentState === 'ready') {
                setPlayerSpell({ spellName: null, target: null })
              }
              setPlayerState('ready')
            }, SPELL_CAST_ANIMATION_DURATION)
            toast.success(`Cast spell ${message} successfully! (${Date.now() - start} ms)`) // log
          },
          onError: (err) => {
            setPlayerState('ready')
            SFX.spellError.play()
            toast.warning(`Failed to cast spell: ${err}`)
          },
          onSettled: () => {
            console.debug(`[performance] | ${message} spell tx settled in ${Date.now() - start} ms`)
          },
        }
      )
    },
    [duel, duelistCap, signAndExecute]
  )

  // global key handler for casting flow
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (chatMode) {
        // when typing chat, ignore casting keys
        return
      }
      // Prevent chat component key handling when we use keys for casting
      if (['i', 'j', 'k', 'l'].includes(e.key)) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (playerState !== 'ready') {
        console.debug('[handle key] | not actionable UI state', playerState)
        return
      }

      if (!SPELL_KEYS[e.key]) {
        console.debug('[handle key] | no spell for key', e.key)
        return
      }

      SFX.spellCast.play()
      const spellName = SPELL_KEYS[e.key].name
      const target: 'player' | 'opponent' = e.key === 'i' ? 'player' : 'opponent'
      castSpell(spellName, target)
    }

    window.addEventListener('keydown', handleKey, true) // capture phase
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [playerState, castSpell, chatMode])

  const opponentId = duelistCap?.opponent || ''
  const wizardEffects =
    props.userAccount.id === duel.wizard1 ? duel.wizard1_effects : duel.wizard2_effects
  const opponentEffects =
    props.userAccount.id === duel.wizard1 ? duel.wizard2_effects : duel.wizard1_effects

  useEffect(() => {
    // Global hotkeys for entering/exiting chat mode
    const handleChatToggle = (e: KeyboardEvent) => {
      // Do not trigger when already in chat and backslash typed as part of message
      if (e.key === '\\' && !chatMode) {
        setChatMode(true)
        e.preventDefault()
        e.stopPropagation()
      } else if (e.key === 'Escape' && chatMode) {
        setChatMode(false)
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', handleChatToggle, true)
    return () => window.removeEventListener('keydown', handleChatToggle, true)
  }, [chatMode])

  // useEffect(() => {
  //   const id = setInterval(() => {
  //     handleOpponentInput(['!deflect', '@choke', '@throw', '@arrow'][Math.round(Math.random() * 4)])
  //   }, 2000)
  //   return () => clearInterval(id)
  // }, [])

  return (
    <>
      {/* Overlay for action state */}
      <div className="h-2/5">
        <RealtimeChat
          active={chatMode}
          roomName={duel.id}
          username={props.userAccount.displayName}
          onIncomingMessage={handleOpponentInput}
        />
      </div>
      <div className="flex flex-col items-center w-full h-3/5">
        <div className="w-full mb-4">
          <ForceBar duel={duel} currentWizardId={props.userAccount.id} />
        </div>
        <div className="flex w-full justify-between items-center mb-4">
          <div className="mt-2 min-h-[30px]">
            <WizardEffects effects={opponentEffects} />
          </div>
          <div className="mt-2 min-h-[30px]">
            <WizardEffects effects={wizardEffects} />
          </div>
        </div>
        <div className="flex justify-between items-center w-full">
          <motion.div
            className="relative z-30 w-[300px]"
            initial={false}
            animate={
              opponentState === 'casting' || playerState === 'casting'
                ? { scale: 1.5, x: -120 }
                : { scale: 1 }
            }
          >
            <div className="flex flex-col items-center w-[300px]">
              <div className="relative w-[300px] h-[300px] flex items-center justify-center mb-2">

                {(playerState === 'casting' || opponentState === 'casting') && 
                  (playerSpell.target === 'opponent' || opponentSpell.target === 'opponent') && (
                  <div className="absolute top-24 left-1/3 -translate-x-1/2 flex gap-2">
                    {playerSpell.target === 'opponent' && playerSpell.spellName && (
                      <span className="text-6xl select-none">{getSpellIcon(playerSpell.spellName)}</span>
                    )}
                    {opponentSpell.target === 'opponent' && opponentSpell.spellName && (
                      <span className="text-6xl select-none">{getSpellIcon(opponentSpell.spellName)}</span>
                    )}
                  </div>
                )}
                <img src={getSprite(false)} alt="opponent wizard" className="object-contain" />
              </div>
              {opponentState !== 'casting' && playerState !== 'casting' && (
                <p className="font-semibold text-sm">{displayName(opponentId)}</p>
              )}
            </div>
          </motion.div>

          {/* Spell Book */}
          {opponentState !== 'casting' && playerState !== 'casting' && (
            <div className="flex flex-col items-center w-[120px]">
              {playerState === 'ready' ? (
                <div className="flex flex-wrap">
                  {['', 'i', '', 'j', 'k', 'l'].map((key, idx) =>
                    key ? (
                      <div key={idx} className="flex flex-col items-center w-[40px] h-[60px]">
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-3xl"
                        >
                          {SPELL_KEYS[key].icon}
                        </motion.div>
                        <span className="text-sm font-bold uppercase">{key}</span>
                      </div>
                    ) : (
                      <div key={idx} className="w-[40px] h-[60px]"></div>
                    )
                  )}
                </div>
              ) : (
                <LoadingSpin />
              )}
            </div>
          )}

          <motion.div
            className="flex justify-between items-center w-[300px] relative z-30"
            initial={false}
            animate={
              opponentState === 'casting' || playerState === 'casting'
                ? { scale: 1.5, x: 120 }
                : { scale: 1 }
            }
          >
            <div className="flex flex-col items-center w-[300px]">
              <div className="relative w-[300px] h-[300px] flex items-center justify-center mb-2 scale-x-[-1]">
                {(playerState === 'casting' || opponentState === 'casting') && 
                  (playerSpell.target === 'player' || opponentSpell.target === 'player') && (
                  <div className="absolute top-24 right-1/3 -translate-x-1/2 flex gap-2">
                    {playerSpell.target === 'player' && playerSpell.spellName && (
                      <span className="text-6xl select-none">{getSpellIcon(playerSpell.spellName)}</span>
                    )}
                    {opponentSpell.target === 'player' && opponentSpell.spellName && (
                      <span className="text-6xl select-none">{getSpellIcon(opponentSpell.spellName)}</span>
                    )}
                  </div>
                )}
                <img src={getSprite(true)} alt="your wizard" className="object-contain " />
              </div>
              {opponentState !== 'casting' && playerState !== 'casting' && (
                <p className="font-semibold text-sm">you</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <div className='italic text-muted-foreground absolute bottom-0 left-0 w-[280px] mx-auto py-4 px-4'>DISCLAIMER: current middle east wizard character is borrowed from another game and used for demo purpose only, it will NOT be part of Wizards and Duels game</div>
      <AnimatePresence>
        {(opponentState === 'casting' || playerState === 'casting') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-10"
            transition={{ duration: 0.1 }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
