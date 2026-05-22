import { useAuth } from '../contexts/AuthContext'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { formatCurrency } from '../lib/formatters'
import { LogOut, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const { rows: contas } = useRealtimeTable('contas', {
    household_id: profile?.household_id
  })
  const { rows: transacoes } = useRealtimeTable('transacoes', {
    household_id: profile?.household_id
  })
  const { rows: recorrencias } = useRealtimeTable('recorrencias', {
    household_id: profile?.household_id
  })
  const { rows: profiles } = useRealtimeTable('profiles', {
    household_id: profile?.household_id
  })

  const saldoTotal = contas.reduce((sum, c) => sum + (c.saldo_inicial || 0), 0)

  const minhasTransacoes = transacoes.filter(t => t.criado_por === profile?.id)
  const minhasDespesas = minhasTransacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0)
  const minhasReceitas = minhasTransacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0)

  const outroUser = profiles.find(p => p.id !== profile?.id)
  const outrasTransacoes = transacoes.filter(t => t.criado_por === outroUser?.id)
  const outrasDespesas = outrasTransacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0)
  const outrasReceitas = outrasTransacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0)

  const totalDespesas = minhasDespesas + outrasDespesas
  const totalReceitas = minhasReceitas + outrasReceitas
  const despesasFixas = recorrencias.filter(r => r.tipo === 'despesa' && r.ativo).reduce((sum, r) => sum + r.valor, 0)

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="bg-slate-900 text-white px-6 pt-8 pb-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Bem-vindo</p>
            <h1 className="text-2xl font-semibold mt-1">{profile?.nome}</h1>
            <p className="text-xs text-gray-400 mt-1">{profile?.households?.nome}</p>
          </div>
          <button
            onClick={signOut}
            className="text-gray-400 hover:text-white transition p-2"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Saldo total</p>
          <p className="text-4xl font-semibold mt-2 tracking-tight">{formatCurrency(saldoTotal)}</p>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight size={16} className="text-emerald-600" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Receitas</p>
              </div>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalReceitas)}</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight size={16} className="text-red-600" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Despesas</p>
              </div>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalDespesas)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Por pessoa</h3>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3" style={{borderLeft: '4px solid #2563eb'}}>
          <p className="text-sm font-semibold text-gray-900 mb-3">{profile?.nome}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Receitas</p>
              <p className="text-base font-semibold text-emerald-700 mt-1">{formatCurrency(minhasReceitas)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Despesas</p>
              <p className="text-base font-semibold text-red-700 mt-1">{formatCurrency(minhasDespesas)}</p>
            </div>
          </div>
        </div>

        {outroUser && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" style={{borderLeft: '4px solid #db2777'}}>
            <p className="text-sm font-semibold text-gray-900 mb-3">{outroUser.nome}</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500">Receitas</p>
                <p className="text-base font-semibold text-emerald-700 mt-1">{formatCurrency(outrasReceitas)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Despesas</p>
                <p className="text-base font-semibold text-red-700 mt-1">{formatCurrency(outrasDespesas)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {despesasFixas > 0 && (
        <div className="px-4 mt-6">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Compromissos fixos</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Total mensal de despesas fixas</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(despesasFixas)}</p>
          </div>
        </div>
      )}

      <div className="px-4 mt-6 mb-8">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Código de convite</h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-mono font-semibold text-slate-900 tracking-wider">
            {profile?.households?.invite_code?.toUpperCase()}
          </p>
          <p className="text-xs text-gray-500 mt-2">Compartilhe com {outroUser?.nome || 'sua esposa'} para sincronizar</p>
        </div>
      </div>
    </div>
  )
}