import { RealtimeChat } from "./realtime-chat";
import { UserAccount } from "./Authenticated";
import { Navigate, useParams } from "react-router-dom";

export function Game({ userAccount }: { userAccount: UserAccount }) {
  const { slug } = useParams<{ slug: string }>()
  if (!slug) {
    return <Navigate to="/" />
  }

  return (
    <div className="w-[460px] h-full mx-auto px-4">
      <RealtimeChat roomName={slug} username={userAccount.username} />
    </div>
  )
}