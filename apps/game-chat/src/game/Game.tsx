import { RealtimeChat } from "../components/realtime-chat";
import { UserAccount } from "../components/Authenticated";
import { Navigate, useParams } from "react-router-dom";
import { DuelProvider } from "@/context/DuelContext";

export function Game({ userAccount }: { userAccount: UserAccount }) {
  const { slug: duelId } = useParams<{ slug: string }>()
  if (!duelId) {
    return <Navigate to="/" />
  }

  return (
    <div className="w-[460px] h-full mx-auto px-4">
      <DuelProvider duelId={duelId}>
        <RealtimeChat roomName={duelId} username={userAccount.username} />
      </DuelProvider>
    </div>
  )
}