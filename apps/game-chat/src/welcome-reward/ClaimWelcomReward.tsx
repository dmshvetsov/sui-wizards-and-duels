import { UserAccount } from "../components/Authenticated";

export function ClaimWelcomeReward({ userAccount }: { userAccount: UserAccount }) {
  // TODO: add backend function to send test tokens (and later a wizard NFT to the user)
  // TODO: only available in testnet
  return (
    <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-md text-center">
      <h2 className="text-lg font-semibold text-yellow-800">WIP</h2>
      <p className="mt-2 text-yellow-700">
        Claim your welcome reward to play.
      </p>
    </div>
  )
}
