import { getClient } from './client'

type EdgeFunction = 'fund'

type GetFundResult =
  | { funded: false; rewardClaimed: boolean }
  | { funded: true; txDigest: string; rewardClaimed: boolean }

export async function get(fn: EdgeFunction): Promise<GetFundResult> {
  const res = await getClient().functions.invoke(fn, { method: 'GET' })
  if (res.error) {
    throw res.error
  }
  return res.data.result
}

export async function post(fn: EdgeFunction, body: Record<string, unknown>) {
  const res = await getClient().functions.invoke(fn, { method: 'POST', body })
  if (res.error) {
    throw res.error
  }
  return res.data.result
}
