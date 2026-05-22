import { useState } from 'react'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency } from '../lib/formatters'

export default function Recorrencias() {
  const { profile } = useAuth()
  const { rows: recorrencias } = useRealtimeTable('recorrencias', {
    household_id: profile?.household_id
  })
  const [showModal, setShowModal] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('despesa')
  const [diaVencimento, setDiaVencimento] = useState('1')

  const handleSave = async () => {
    if (!descricao || !valor) return

    await supabase.from('recorrencias').insert({
      household_id: profile?.household_id,
      descricao,
      valor: parseFloat(valor),
      tipo,
      frequencia: 'mensal',
      dia_vencimento: parseInt(diaVencimento),
      data_inicio: new Date().toISOString().split('T')[0],
      ativo: true
    })

    setDescricao('')
    setValor('')
    setTipo('despesa')
    setDiaVencimento('1')
    setShowModal(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Deletar esta conta fixa?')) {
      await supabase.from('recorrencias').delete().eq('id', id)
    }
  }

  const despesasFixas = recorrencias.filter(r => r.tipo === 'despesa' && r.ativo)
  const receitasFixas = recorrencias.filter(r => r.tipo === 'receita' && r.ativo)
  const totalDespesasFixas = despesasFixas.reduce((sum, r) => sum + r.valor, 0)
  const totalReceitasFixas = receitasFixas.reduce((sum, r) => sum + r.valor, 0)

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 pt-8 pb-12">
        <h1 className="text-2xl font-semibold mb-6">Compromissos fixos</h1>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Receitas/mês</p>
            <p className="text-xl font-semibold text-emerald-400 mt-1">{formatCurrency(totalReceitasFixas)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Despesas/mês</p>
            <p className="text-xl font-semibold text-red-400 mt-1">{formatCurrency(totalDespesasFixas)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-6">
        {/* Despesas fixas */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3 mt-6">Despesas mensais</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {despesasFixas.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-gray-500 text-sm">Nenhuma despesa fixa</p>
              </div>
            ) : (
              despesasFixas.map((r, index) => (
                <div
                  key={r.id}
                  className={`flex justify-between items-center p-4 ${index !== despesasFixas.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{r.descricao}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Vencimento dia {r.dia_vencimento}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="font-semibold text-red-700">{formatCurrency(r.valor)}</p>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Receitas fixas */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Receitas mensais</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {receitasFixas.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-gray-500 text-sm">Nenhuma receita fixa</p>
              </div>
            ) : (
              receitasFixas.map((r, index) => (
                <div
                  key={r.id}
                  className={`flex justify-between items-center p-4 ${index !== receitasFixas.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{r.descricao}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Recebimento dia {r.dia_vencimento}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="font-semibold text-emerald-700">+{formatCurrency(r.valor)}</p>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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
            <h2 className="text-xl font-semibold text-gray-900">Nova conta fixa</h2>

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
                placeholder="Ex: Aluguel, Internet"
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
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Dia do vencimento</label>
              <input
                type="number"
                placeholder="1-31"
                min="1"
                max="31"
                value={diaVencimento}
                onChange={e => setDiaVencimento(e.target.value)}
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