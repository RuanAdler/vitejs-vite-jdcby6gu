import { useState } from 'react'
import { Plus, Trash2, Wallet, Pencil, PiggyBank, Banknote, CreditCard } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency } from '../lib/formatters'
import { calcSaldo, startOfMonth } from '../lib/finance'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import CurrencyInput from '../components/CurrencyInput'
import { useToast } from '../components/Toast'

const tipos = {
  corrente: { label: 'Conta corrente', Icon: CreditCard },
  poupanca: { label: 'Poupança', Icon: PiggyBank },
  dinheiro: { label: 'Caixinha', Icon: Banknote },
  outro: { label: 'Outro', Icon: Wallet },
}

export default function Contas() {
  const { profile } = useAuth()
  const toast = useToast()
  const hh = { household_id: profile?.household_id }
  const { rows: contas } = useRealtimeTable('contas', hh)
  const { rows: transacoes } = useRealtimeTable('transacoes', hh)

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('corrente')
  const [saldoInicial, setSaldoInicial] = useState(0)
  const [confirmar, setConfirmar] = useState(null)

  const abrirNovo = () => {
    setEditId(null); setNome(''); setTipo('corrente'); setSaldoInicial(0); setShowModal(true)
  }
  const abrirEdicao = (c) => {
    setEditId(c.id); setNome(c.nome); setTipo(c.tipo); setSaldoInicial(c.saldo_inicial || 0); setShowModal(true)
  }

  const handleSave = async () => {
    if (!nome) return toast('Informe o nome da conta', 'error')
    if (editId) {
      const { error } = await supabase.from('contas').update({ nome, tipo, saldo_inicial: saldoInicial }).eq('id', editId)
      if (error) return toast('Erro ao salvar', 'error')
      toast('Conta atualizada')
    } else {
      const { error } = await supabase.from('contas').insert({ household_id: profile?.household_id, nome, tipo, saldo_inicial: saldoInicial })
      if (error) return toast('Erro ao salvar', 'error')
      toast('Conta criada')
    }
    setShowModal(false)
  }

  const confirmarDelete = async () => {
    await supabase.from('contas').delete().eq('id', confirmar.id)
    toast('Conta excluída')
  }

  const saldoTotal = calcSaldo(contas, transacoes, startOfMonth())
  const totalInicial = contas.reduce((s, c) => s + (c.saldo_inicial || 0), 0)

  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 pt-8 pb-14">
        <h1 className="text-2xl font-bold mb-6">Contas</h1>
        <p className="text-xs text-white/50 uppercase tracking-wider">Saldo atual</p>
        <p className={`text-4xl font-bold mt-1 tracking-tight ${saldoTotal < 0 ? 'text-red-400' : ''}`}>{formatCurrency(saldoTotal)}</p>
        <p className="text-xs text-white/40 mt-2">Saldo inicial das contas: {formatCurrency(totalInicial)} + lançamentos pagos</p>
      </div>

      <div className="px-4 -mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {contas.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Wallet size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma conta cadastrada</p>
              <p className="text-gray-400 text-xs mt-1">Toque no + para adicionar</p>
            </div>
          ) : (
            contas.map((c, i) => {
              const t = tipos[c.tipo] || tipos.outro
              const Icon = t.Icon
              return (
                <div key={c.id} className={`flex items-center p-4 ${i !== contas.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                    <Icon size={18} className="text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{c.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
                  </div>
                  <div className="text-right flex items-center gap-2 shrink-0">
                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(c.saldo_inicial)}</p>
                    <button onClick={() => abrirEdicao(c)} className="text-gray-400 hover:text-slate-900 transition p-1">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setConfirmar(c)} className="text-gray-400 hover:text-red-600 transition p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <button onClick={abrirNovo} className="fixed bottom-24 right-4 bg-slate-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-slate-800 transition">
        <Plus size={24} />
      </button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar conta' : 'Nova conta'}>
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Nome</label>
          <input
            type="text" placeholder="Ex: Nubank, Itaú" value={nome} onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tipo</label>
          <select
            value={tipo} onChange={(e) => setTipo(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none mt-1 bg-white"
          >
            {Object.entries(tipos).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Saldo inicial</label>
          <CurrencyInput value={saldoInicial} onChange={setSaldoInicial} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition">{editId ? 'Salvar' : 'Criar'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmar} onClose={() => setConfirmar(null)} onConfirm={confirmarDelete}
        title="Excluir conta" message={`Excluir a conta "${confirmar?.nome}"?`} confirmLabel="Excluir"
      />
    </div>
  )
}
