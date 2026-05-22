import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRealtimeTable(table, filter = {}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      let query = supabase.from(table).select('*')
      Object.entries(filter).forEach(([k, v]) => {
        query = query.eq(k, v)
      })
      const { data } = await query
      if (isMounted) {
        setRows(data || [])
        setLoading(false)
      }
    }

    fetchData()

    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          setRows((current) => {
            if (payload.eventType === 'INSERT') return [...current, payload.new]
            if (payload.eventType === 'UPDATE')
              return current.map(r => r.id === payload.new.id ? payload.new : r)
            if (payload.eventType === 'DELETE')
              return current.filter(r => r.id !== payload.old.id)
            return current
          })
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [table, JSON.stringify(filter)])

  return { rows, loading, refetch: () => setLoading(true) }
}