import { ExecuteTransactionBlockParams, SuiClient } from "@mysten/sui/client";

export function executeWith(client: SuiClient, opts: ExecuteTransactionBlockParams['options']) {
  return ({ bytes, signature }: { bytes: string; signature: string }) =>
    client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: opts,
    })
}
