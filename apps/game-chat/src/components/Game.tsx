import { RealtimeChat } from "./realtime-chat";
import { UserAccount } from "./Authenticated";

export function Game({ userAccount }: { userAccount: UserAccount }) {
  return (
    <div className="w-[460px] h-full mx-auto px-4">
      <RealtimeChat roomName="test" username={userAccount.username} />
    </div>
  )
}