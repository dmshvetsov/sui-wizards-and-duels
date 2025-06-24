import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LootCard(props: { title: string; description: string }) {
  return (
    <Card className="w-[150px] h-auto text-center">
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
