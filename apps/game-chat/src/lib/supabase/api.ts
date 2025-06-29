import { getClient } from './client'

export type EdgeFunction = 'fund' | 'checkin' | 'duel-reward'

export type GetFundResult =
  | { funded: false; rewardClaimed: boolean }
  | { funded: true; txDigest: string; rewardClaimed: boolean }

export type DailyCheckinStatusResult = {
  claimed: boolean
  nextAvailable?: string
}

export async function get<T = any>(fn: EdgeFunction): Promise<T> {
  const res = await getClient().functions.invoke(fn, { method: 'GET' })
  if (res.error) {
    throw res.error
  }
  return res.data.result
}

export async function getAvailableReward(duelId: string): Promise<{ availableReward: number }> {
  const res = await getClient().functions.invoke(`/duel-reward/${duelId}`, { method: 'GET' })
  if (res.error) {
    throw res.error
  }
  return res.data.result as { availableReward: number }
}

export async function post<T = any>(fn: EdgeFunction, body: Record<string, unknown>): Promise<T> {
  const res = await getClient().functions.invoke(fn, { method: 'POST', body })
  if (res.error) {
    throw res.error
  }
  return res.data.result
}
