import { useEffect, useState } from 'react'
import { getClient } from '../lib/supabase/client'
import { Loader } from '../components/Loader'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

interface LeaderboardEntry {
  sui_address: string
  points: number
}

function shortenAddress(address: string) {
  return address.slice(0, 6) + '...' + address.slice(-4)
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getClient()
          .from('reward_points')
          .select('sui_address, points')
          .order('points', { ascending: false })
          .limit(50)
        if (error) throw error
        setEntries(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  return (
    <div className="flex gap-8 items-start justify-center min-h-screen py-12 px-4">
      <div className="w-[225px]"></div>
      <div className="bg-white min-h-48 rounded-lg shadow-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Mint Essence Leaderboard</h1>
        <p className="mb-8 text-center text-gray-600">Top 50 ESNC holders</p>
        {loading ? (
          <Loader />
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3">SUI Address</th>
                <th className="py-2 px-3 text-right">ESNC</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.sui_address} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-3 font-semibold">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono">
                    {entry.sui_address === '' ? 'you' : shortenAddress(entry.sui_address)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold">{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Button variant="secondary">
        <Link to="/d">Back to Duelground</Link>
      </Button>
    </div>
  )
}
