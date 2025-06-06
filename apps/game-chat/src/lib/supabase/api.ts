import { getClient } from './client'

type EdgeFuncation = 'fund'

type GetFundResult = { funded: false } | { funded: true, txDigest: string }

export async function get(fn: EdgeFuncation): Promise<GetFundResult> {
  const res = await getClient().functions.invoke(fn, { method: 'GET' })
  if (res.error) {
    throw res.error
  }
  return res.data.result
}

export async function post(fn: EdgeFuncation, body: Record<string, unknown>) {
  const res = await getClient().functions.invoke(fn, { method: 'POST', body })
  if (res.error) {
    throw res.error
  }
  return res.data.result
}
