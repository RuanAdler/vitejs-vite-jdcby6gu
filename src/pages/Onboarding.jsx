import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)
  const [nomeHousehold, setNomeHousehold] = useState('Nosso Lar')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const criarHousehold = async () => {
    setLoading(true); setError('')
    const { data: hh, error: e1 } = await supabase
      .from('households').insert({ nome: nomeHousehold }).select().single()
    if (e1) { setError(e1.message); setLoading(false); return }

    const { error: e2 } = await supabase
      .from('profiles').update({ household_id: hh.id }).eq('id', user.id)
    if (e2) { setError(e2.message); setLoading(false); return }

    await supabase.rpc('seed_categorias_padrao', { p_household_id: hh.id })

    await refreshProfile()
    navigate('/')
  }

  const entrarHousehold = async () => {
    setLoading(true); setError('')
    const { data: hh, error: e1 } = await supabase
      .from('households').select('id').eq('invite_code', inviteCode.trim()).maybeSingle()
    if (e1 || !hh) { setError('Código inválido'); setLoading(false); return }

    const { error: e2 } = await supabase
      .from('profiles').update({ household_id: hh.id }).eq('id', user.id)
    if (e2) { setError(e2.message); setLoading(false); return }

    await refreshProfile()
    navigate('/')
  }

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">Bem-vindo!</h1>
          <p className="text-gray-600 text-center mb-6">Como você quer começar?</p>
          <button onClick={() => setMode('criar')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium mb-3 hover:bg-blue-700">
            Criar um novo lar
          </button>
          <button onClick={() => setMode('entrar')}
            className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-50">
            Entrar com código de convite
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {mode === 'criar' ? 'Criar novo lar' : 'Entrar com código'}
        </h1>
        {mode === 'criar' ? (
          <>
            <input type="text" placeholder="Nome do lar" value={nomeHousehold}
              onChange={e => setNomeHousehold(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg mb-3" />
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button onClick={criarHousehold} disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar'}
            </button>
          </>
        ) : (
          <>
            <input type="text" placeholder="Código de convite" value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg mb-3 uppercase" />
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button onClick={entrarHousehold} disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </>
        )}
        <button onClick={() => setMode(null)} className="w-full mt-3 text-gray-500 text-sm">
          ← Voltar
        </button>
      </div>
    </div>
  )
}