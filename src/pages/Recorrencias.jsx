import { useState } from 'react'
import { Plus, Trash2, Pencil, Pause, Play } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency } from '../lib/formatters'
import { ymd } from '../lib/finance'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import CurrencyInput from '../components/CurrencyInput'
import { useToast } from '../components/Toast'

export default function Recorrencias() {
  const { profile } = useAuth()
  const toast = useToast()
  const { rows: recorrencias } = useRealtimeTable('recorrencias', { household_id: profile?.household_id })

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState(0)
  const [tipo, setTipo] = useState('despesa')
  const [diaVencimento, setDiaVencimento] = useState('1')
  const [confirmar, setConfirmar] = useState(null)

  const abrirNovo = () => {
    setEditId(null); setDescricao(''); setValor(0); setTipo('despesa'); setDiaVencimento('1'); setShowModal(true)
  }
  const abrirEdicao = (r) => {
    setEditId(r.id); setDescricao(r.descricao); setValor(r.valor); setTipo(r.tipo); setDiaVencimento(String(r.dia_vencimento)); setShowModal(true)
  }

  const handleSave = async () => {
    if (!descricao || !valor) return toast('Preencha descrição e valor', 'error')
    const dia = Math.min(31, Math.max(1, parseInt(diaVencimento) || 1))
    if (editId) {
      const { error } = await supabase.from('recorrencias').update({ descricao, valor, tipo, dia_vencimento: dia }).eq('id', editId)
      if (error) return toast('Erro ao salvar', 'error')
      toast('Conta fixa atualizada')
    } else {
      const { error } = await supabase.from('recorrencias').insert({
        household_id: profile?.household_id, descricao, valor, tipo, frequencia: 'mensal',
        dia_vencimento: dia, data_inicio: ymd(new Date()), ativo: true,
      })
      if (error) return toast('Erro ao salvar', 'error')
      toast('Conta fixa criada')
    }
    setShowModal(false)
  }

  const toggleAtivo = async (r) => {
    await supabase.from('recorrencias').update({ ativo: !r.ativo }).eq('id', r.id)
    toast(r.ativo ? 'Pausada' : 'Reativada')
  }

  const confirmarDelete = async () => {
    await supabase.from('recorrencias').delete().eq('id', confirmar.id)
    toast('Excluída')
  }

  const despesasFixas = recorrencias.filter((r) => r.tipo === 'despesa')
  const receitasFixas = recorrencias.filter((r) => r.tipo === 'receita')
  const totalDespesas = despesasFixas.filter((r) => r.ativo).reduce((s, r) => s + r.valor, 0)
  const totalReceitas = receitasFixas.filter((r) => r.ativo).reduce((s, r) => s + r.valor, 0)

  const Linha = ({ r, last }) => (
    <div className={`flex items-center p-4 ${!last ? 'border-b border-gray-100' : ''} ${!r.ativo ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm">{r.descricao}</p>
          {!r.ativo && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Pausada</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Todo dia {r.dia_vencimento}</p>
      </div>
      <div className="text-right flex items-center gap-2 shrink-0">
        <p className={`font-bold text-sm ${r.tipo === 'receita' ? 'text-emerald-700' : 'text-red-700'}`}>
          {r.tipo === 'receita' ? '+' : ''}{formatCurrency(r.valor)}
        </p>
        <button onClick={() => toggleAtivo(r)} className="text-gray-400 hover:text-slate-900 transition p-1" title={r.ativo ? 'Pausar' : 'Reativar'}>
          {r.ativo ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button onClick={() => abrirEdicao(r)} className="text-gray-400 hover:text-slate-900 transition p-1"><Pencil size={15} /></button>
        <button onClick={() => setConfirmar(r)} className="text-gray-400 hover:text-red-600 transition p-1"><Trash2 size={15} /></button>
      </div>
    </div>
  )

  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 pt-8 pb-14">
        <h1 className="text-2xl font-bold mb-6">Compromissos fixos</h1>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Receitas/mês</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalReceitas)}</p>
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Despesas/mês</p>
            <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(totalDespesas)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-6">
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Despesas mensais</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {despesasFixas.length === 0 ? (
              <div className="text-center py-8 px-4"><p className="text-gray-500 text-sm">Nenhuma despesa fixa</p></div>
            ) : despesasFixas.map((r, i) => <Linha key={r.id} r={r} last={i === despesasFixas.length - 1} />)}
          </div>
        </div>

        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Receitas mensais</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {receitasFixas.length === 0 ? (
              <div className="text-center py-8 px-4"><p className="text-gray-500 text-sm">Nenhuma receita fixa</p></div>
            ) : receitasFixas.map((r, i) => <Linha key={r.id} r={r} last={i === receitasFixas.length - 1} />)}
          </div>
        </div>
      </div>

      <button onClick={abrirNovo} className="fixed bottom-24 right-4 bg-slate-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-slate-800 transition">
        <Plus size={24} />
      </button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar conta fixa' : 'Nova conta fixa'}>
        <div className="flex gap-2">
          <button onClick={() => setTipo('receita')} className={`flex-1 py-3 rounded-lg font-semibold transition border-2 ${tipo === 'receita' ? 'bg-emerald-50 text-emerald-700 border-emerald-600' : 'bg-white text-gray-600 border-gray-200'}`}>Receita</button>
          <button onClick={() => setTipo('despesa')} className={`flex-1 py-3 rounded-lg font-semibold transition border-2 ${tipo === 'despesa' ? 'bg-red-50 text-red-700 border-red-600' : 'bg-white text-gray-600 border-gray-200'}`}>Despesa</button>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Descrição</label>
          <input type="text" placeholder="Ex: Aluguel, Internet" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor</label>
          <CurrencyInput value={valor} onChange={setValor} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Dia do vencimento</label>
          <input type="number" min="1" max="31" placeholder="1-31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none mt-1" />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition">{editId ? 'Salvar' : 'Salvar'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmar} onClose={() => setConfirmar(null)} onConfirm={confirmarDelete} title="Excluir conta fixa" message={`Excluir "${confirmar?.descricao}"?`} confirmLabel="Excluir" />
    </div>
  )
}
