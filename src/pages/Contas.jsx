import { useState } from 'react'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency } from '../lib/formatters'

export default function Contas() {
  const { profile } = useAuth()
  const { rows: contas } = useRealtimeTable('contas', {
    household_id: profile?.household_id
  })
  const [showModal, setShowModal] = useState(false)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('corrente')
  const [saldoInicial, setSaldoInicial] = useState('')

  const handleSave = async () => {
    if (!nome || !saldoInicial) return

    await supabase.from('contas').insert({
      household_id: profile?.household_id,
      nome,
      tipo,
      saldo_inicial: parseFloat(saldoInicial)
    })

    setNome('')
    setTipo('corrente')
    setSaldoInicial('')
    setShowModal(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Deletar esta conta?')) {
      await supabase.from('contas').delete().eq('id', id)
    }
  }

  const saldoTotal = contas.reduce((sum, c) => sum + (c.saldo_inicial || 0), 0)

  const tiposLabel = {
    corrente: 'Conta corrente',
    poupanca: 'Poupança',
    dinheiro: 'Caixinha',
    outro: 'Outro'
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 pt-8 pb-12">
        <h1 className="text-2xl font-semibold mb-6">Contas</h1>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Saldo total</p>
          <p className="text-4xl font-semibold mt-2 tracking-tight">{formatCurrency(saldoTotal)}</p>
        </div>
      </div>

      {/* Lista de contas */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {contas.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Wallet size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma conta cadastrada</p>
              <p className="text-gray-400 text-xs mt-1">Clique no botão + para adicionar</p>
            </div>
          ) : (
            contas.map((conta, index) => (
              <div
                key={conta.id}
                className={`flex justify-between items-center p-4 ${index !== contas.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{conta.nome}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tiposLabel[conta.tipo]}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{formatCurrency(conta.saldo_inicial)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(conta.id)}
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
            <h2 className="text-xl font-semibold text-gray-900">Nova conta</h2>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Nome</label>
              <input
                type="text"
                placeholder="Ex: Nubank, Itaú"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:outline-none mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tipo</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:outline-none mt-1"
              >
                <option value="corrente">Conta corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="dinheiro">Caixinha</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Saldo inicial</label>
              <input
                type="number"
                placeholder="0,00"
                value={saldoInicial}
                onChange={e => setSaldoInicial(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:outline-none mt-1"
              />
            </div>

            <div class="flex gap-2 pt-2">
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
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}