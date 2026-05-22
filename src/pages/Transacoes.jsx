import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, formatDate } from '../lib/formatters'

export default function Transacoes() {
  const { profile } = useAuth()
  const { rows: transacoes } = useRealtimeTable('transacoes', {
    household_id: profile?.household_id
  })
  const { rows: profiles } = useRealtimeTable('profiles', {
    household_id: profile?.household_id
  })
  const [showModal, setShowModal] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('despesa')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])

  const handleSave = async () => {
    if (!descricao || !valor) return

    await supabase.from('transacoes').insert({
      household_id: profile?.household_id,
      descricao,
      valor: parseFloat(valor),
      tipo,
      data,
      criado_por: profile?.id
    })

    setDescricao('')
    setValor('')
    setTipo('despesa')
    setData(new Date().toISOString().split('T')[0])
    setShowModal(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que quer deletar?')) {
      await supabase.from('transacoes').delete().eq('id', id)
    }
  }

  const despesas = transacoes.filter(t => t.tipo === 'despesa')
  const receitas = transacoes.filter(t => t.tipo === 'receita')
  const totalDespesas = despesas.reduce((sum, t) => sum + t.valor, 0)
  const totalReceitas = receitas.reduce((sum, t) => sum + t.valor, 0)

  const getLancadorInfo = (criado_por) => {
    const lancador = profiles.find(p => p.id === criado_por)
    const isCurrentUser = criado_por === profile?.id
    return {
      nome: lancador?.nome || 'Desconhecido',
      bg: isCurrentUser ? 'bg-blue-50' : 'bg-pink-50',
      text: isCurrentUser ? 'text-blue-700' : 'text-pink-700',
      border: isCurrentUser ? 'border-blue-200' : 'border-pink-200'
    }
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 pt-8 pb-12">
        <h1 className="text-2xl font-semibold mb-6">Lançamentos</h1>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Receitas</p>
            <p className="text-base font-semibold mt-1 text-emerald-400">{formatCurrency(totalReceitas)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Despesas</p>
            <p className="text-base font-semibold mt-1 text-red-400">{formatCurrency(totalDespesas)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Saldo</p>
            <p className={`text-base font-semibold mt-1 ${totalReceitas - totalDespesas >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(totalReceitas - totalDespesas)}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de transações */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {transacoes.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500 text-sm">Nenhum lançamento ainda</p>
              <p className="text-gray-400 text-xs mt-1">Clique no botão + para começar</p>
            </div>
          ) : (
            transacoes
              .sort((a, b) => new Date(b.data) - new Date(a.data))
              .map((t, index) => {
                const lancador = getLancadorInfo(t.criado_por)
                return (
                  <div
                    key={t.id}
                    className={`flex justify-between items-center p-4 ${index !== transacoes.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{t.descricao}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${lancador.bg} ${lancador.text} border ${lancador.border}`}>
                          {lancador.nome}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(t.data)}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className={`font-semibold ${t.tipo === 'receita' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {t.tipo === 'receita' ? '+' : '-'}{formatCurrency(t.valor)}
                      </p>
                      {t.criado_por === profile?.id && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>

      {/* Botão flutuante */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 bg-slate-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-slate-800 transition"
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Novo lançamento</h2>

            <div className="flex gap-2">
              <button
                onClick={() => setTipo('receita')}
                className={`flex-1 py-3 rounded-lg font-semibold transition border-2 ${
                  tipo === 'receita'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                Receita
              </button>
              <button
                onClick={() => setTipo('despesa')}
                className={`flex-1 py-3 rounded-lg font-semibold transition border-2 ${
                  tipo === 'despesa'
                    ? 'bg-red-50 text-red-700 border-red-600'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                Despesa
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Salário, Mercado"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:outline-none mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor</label>
              <input
                type="number"
                placeholder="0,00"
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:outline-none mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Data</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:outline-none mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}