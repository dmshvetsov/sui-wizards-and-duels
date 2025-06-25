import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'

type LootCardProps = {
  title: string | number
  description: string
}

export function LootCard(props: LootCardProps) {
  return (
    <Card className="w-[150px] h-auto text-center">
      <CardHeader>
        <CardTitle>props.title</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

type LootCardCountableProps = {
  item: string
  number: number
  description: string
}

export function LootCardCountable(props: LootCardCountableProps) {
  const [isAnimationCompleted, setAnimationCompleted] = useState(false)
  const animatedValue = useMotionValue(0)
  const displayedNumber = useTransform(() => {
    const val = animatedValue.get()
    if (typeof val === 'number') {
      return Math.round(val)
    }
    return val
  })

  useEffect(() => {
    const numLength = (Math.log(Math.abs(props.number)) * Math.LOG10E + 1) | 0
    const controls = animate(animatedValue, props.number, {
      duration: 1.25 * Math.sqrt(numLength),
      onComplete: () => setAnimationCompleted(true),
    })
    return () => controls.stop()
  }, [animatedValue, props.number])

  console.log(displayedNumber.get(), props.number)
  return (
    <Card className="w-[150px] h-auto text-center">
      <CardHeader>
        <CardTitle>
          <motion.span
            className={cn({
              'animate-pulse': !isAnimationCompleted,
            })}
          >
            {displayedNumber}
          </motion.span>
          {' '}{props.item}
        </CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
