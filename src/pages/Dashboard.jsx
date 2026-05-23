import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { formatCurrency } from '../lib/formatters'
import { calcSaldo, isInMonth, startOfMonth } from '../lib/finance'
import MonthSelector from '../components/MonthSelector'
import { useToast } from '../components/Toast'
import { LogOut, ArrowUpRight, ArrowDownRight, Copy, TrendingUp } from 'lucide-react'

const CORES_PESSOA = ['#2563eb', '#db2777', '#7c3aed', '#0891b2', '#ca8a04']

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const toast = useToast()
  const [mes, setMes] = useState(startOfMonth())

  const hh = { household_id: profile?.household_id }
  const { rows: contas } = useRealtimeTable('contas', hh)
  const { rows: transacoes } = useRealtimeTable('transacoes', hh)
  const { rows: recorrencias } = useRealtimeTable('recorrencias', hh)
  const { rows: profiles } = useRealtimeTable('profiles', hh)

  const doMes = transacoes.filter((t) => isInMonth(t.data, mes))

  const saldoAtual = calcSaldo(contas, transacoes, startOfMonth())
  const receitasMes = doMes.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const despesasMes = doMes.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const aReceber = doMes.filter((t) => t.tipo === 'receita' && !t.efetivada).reduce((s, t) => s + t.valor, 0)
  const aPagar = doMes.filter((t) => t.tipo === 'despesa' && !t.efetivada).reduce((s, t) => s + t.valor, 0)
  const saldoPrevisto = saldoAtual + aReceber - aPagar

  const totalFluxo = receitasMes + despesasMes
  const pctReceita = totalFluxo > 0 ? (receitasMes / totalFluxo) * 100 : 50

  const despesasFixas = recorrencias.filter((r) => r.tipo === 'despesa' && r.ativo).reduce((s, r) => s + r.valor, 0)

  const porPessoa = profiles.map((p, i) => {
    const minhas = doMes.filter((t) => t.criado_por === p.id)
    return {
      nome: p.nome,
      cor: CORES_PESSOA[i % CORES_PESSOA.length],
      receitas: minhas.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0),
      despesas: minhas.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0),
    }
  })

  const inviteCode = profile?.households?.invite_code?.toUpperCase()
  const copiarConvite = () => {
    navigator.clipboard?.writeText(inviteCode || '')
    toast('Código copiado!')
  }

  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 pt-8 pb-14">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Bem-vindo</p>
            <h1 className="text-2xl font-bold mt-1">{profile?.nome}</h1>
            <p className="text-xs text-white/50 mt-1">{profile?.households?.nome}</p>
          </div>
          <button onClick={signOut} className="text-white/60 hover:text-white transition p-2" title="Sair">
            <LogOut size={20} />
          </button>
        </div>

        <div className="bg-white/5 rounded-xl p-3 mb-5 border border-white/10">
          <MonthSelector value={mes} onChange={setMes} light />
        </div>

        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">Saldo atual</p>
          <p className={`text-4xl font-bold mt-1 tracking-tight ${saldoAtual < 0 ? 'text-red-400' : ''}`}>
            {formatCurrency(saldoAtual)}
          </p>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-6">
        {/* Receitas x Despesas do mês */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-2 divide-x divide-gray-200 mb-4">
            <div className="pr-4">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpRight size={15} className="text-emerald-600" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Receitas</p>
              </div>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(receitasMes)}</p>
            </div>
            <div className="pl-4">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownRight size={15} className="text-red-600" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Despesas</p>
              </div>
              <p className="text-xl font-bold text-red-700">{formatCurrency(despesasMes)}</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-red-100 overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${pctReceita}%` }} />
          </div>
        </div>

        {/* Previsão fim do mês */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <TrendingUp size={14} /> Previsão para o fim do mês
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">A receber</span>
              <span className="font-semibold text-emerald-700">+{formatCurrency(aReceber)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3 pb-3 border-b border-gray-100">
              <span className="text-gray-500">A pagar</span>
              <span className="font-semibold text-red-700">-{formatCurrency(aPagar)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Saldo previsto</span>
              <span className={`text-lg font-bold ${saldoPrevisto < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {formatCurrency(saldoPrevisto)}
              </span>
            </div>
          </div>
        </div>

        {/* Por pessoa */}
        {porPessoa.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Por pessoa</h3>
            <div className="space-y-3">
              {porPessoa.map((p) => (
                <div
                  key={p.nome}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                  style={{ borderLeft: `4px solid ${p.cor}` }}
                >
                  <p className="text-sm font-semibold text-gray-900 mb-3">{p.nome}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Receitas</p>
                      <p className="text-base font-semibold text-emerald-700 mt-0.5">{formatCurrency(p.receitas)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Despesas</p>
                      <p className="text-base font-semibold text-red-700 mt-0.5">{formatCurrency(p.despesas)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compromissos fixos */}
        {despesasFixas > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Compromissos fixos</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total mensal de despesas fixas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(despesasFixas)}</p>
            </div>
          </div>
        )}

        {/* Convite */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Código de convite</h3>
          <button
            onClick={copiarConvite}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
          >
            <div>
              <p className="text-2xl font-mono font-bold text-slate-900 tracking-wider">{inviteCode}</p>
              <p className="text-xs text-gray-500 mt-1">Toque para copiar e compartilhar</p>
            </div>
            <Copy size={20} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
