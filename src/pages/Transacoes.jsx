import { useState } from 'react'
import { Plus, Trash2, Check, Pencil, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, formatDate } from '../lib/formatters'
import { isInMonth, startOfMonth, ymd } from '../lib/finance'
import MonthSelector from '../components/MonthSelector'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import CurrencyInput from '../components/CurrencyInput'
import { useToast } from '../components/Toast'

const formInicial = () => ({
  descricao: '',
  valor: 0,
  tipo: 'despesa',
  data: ymd(new Date()),
  parcelado: false,
  numParcelas: '2',
  efetivada: true,
})

export default function Transacoes() {
  const { profile } = useAuth()
  const toast = useToast()
  const hh = { household_id: profile?.household_id }
  const { rows: transacoes } = useRealtimeTable('transacoes', hh)
  const { rows: profiles } = useRealtimeTable('profiles', hh)

  const [mes, setMes] = useState(startOfMonth())
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(formInicial())
  const [saving, setSaving] = useState(false)
  const [confirmar, setConfirmar] = useState(null)

  const set = (campo, v) => setForm((f) => ({ ...f, [campo]: v }))

  const abrirNovo = () => {
    setForm(formInicial())
    setEditId(null)
    setShowModal(true)
  }

  const abrirEdicao = (t) => {
    setForm({
      descricao: t.descricao.replace(/\s\(\d+\/\d+\)$/, ''),
      valor: t.valor,
      tipo: t.tipo,
      data: t.data,
      parcelado: false,
      numParcelas: '2',
      efetivada: t.efetivada,
    })
    setEditId(t.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.descricao || !form.valor) {
      toast('Preencha descrição e valor', 'error')
      return
    }
    setSaving(true)

    if (editId) {
      const { error } = await supabase
        .from('transacoes')
        .update({
          descricao: form.descricao,
          valor: form.valor,
          tipo: form.tipo,
          data: form.data,
          efetivada: form.efetivada,
        })
        .eq('id', editId)
      setSaving(false)
      if (error) return toast('Erro ao salvar', 'error')
      toast('Lançamento atualizado')
    } else if (form.parcelado && parseInt(form.numParcelas) > 1) {
      const total = parseInt(form.numParcelas)
      const valorParcela = Math.round((form.valor / total) * 100) / 100
      const grupoId = crypto.randomUUID()
      const linhas = []
      for (let i = 0; i < total; i++) {
        const d = new Date(`${form.data}T00:00:00`)
        d.setMonth(d.getMonth() + i)
        linhas.push({
          household_id: profile?.household_id,
          descricao: `${form.descricao} (${i + 1}/${total})`,
          valor: valorParcela,
          tipo: form.tipo,
          data: ymd(d),
          criado_por: profile?.id,
          parcela_atual: i + 1,
          parcela_total: total,
          parcela_grupo_id: grupoId,
          efetivada: i === 0 ? form.efetivada : false,
        })
      }
      const { error } = await supabase.from('transacoes').insert(linhas)
      setSaving(false)
      if (error) return toast('Erro ao salvar', 'error')
      toast(`${total} parcelas criadas`)
    } else {
      const { error } = await supabase.from('transacoes').insert({
        household_id: profile?.household_id,
        descricao: form.descricao,
        valor: form.valor,
        tipo: form.tipo,
        data: form.data,
        criado_por: profile?.id,
        efetivada: form.efetivada,
      })
      setSaving(false)
      if (error) return toast('Erro ao salvar', 'error')
      toast('Lançamento criado')
    }

    setShowModal(false)
  }

  const pedirDelete = (t) => {
    setConfirmar({
      transacao: t,
      grupo: !!t.parcela_grupo_id,
    })
  }

  const confirmarDelete = async () => {
    const t = confirmar.transacao
    if (t.parcela_grupo_id) {
      await supabase.from('transacoes').delete().eq('parcela_grupo_id', t.parcela_grupo_id)
    } else {
      await supabase.from('transacoes').delete().eq('id', t.id)
    }
    toast('Excluído')
  }

  const togglePago = async (t) => {
    await supabase.from('transacoes').update({ efetivada: !t.efetivada }).eq('id', t.id)
  }

  const doMes = transacoes
    .filter((t) => isInMonth(t.data, mes))
    .filter((t) => t.descricao.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => new Date(b.data) - new Date(a.data))

  const totalReceitas = doMes.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = doMes.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const pendentes = doMes.filter((t) => t.tipo === 'despesa' && !t.efetivada).reduce((s, t) => s + t.valor, 0)

  const lancadorInfo = (criado_por) => {
    const lancador = profiles.find((p) => p.id === criado_por)
    const ehMeu = criado_por === profile?.id
    return {
      nome: lancador?.nome || '—',
      bg: ehMeu ? 'bg-blue-50' : 'bg-pink-50',
      text: ehMeu ? 'text-blue-700' : 'text-pink-700',
      border: ehMeu ? 'border-blue-200' : 'border-pink-200',
    }
  }

  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 pt-8 pb-14">
        <h1 className="text-2xl font-bold mb-4">Lançamentos</h1>
        <div className="bg-white/5 rounded-xl p-3 mb-5 border border-white/10">
          <MonthSelector value={mes} onChange={setMes} light />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Receitas</p>
            <p className="text-base font-bold mt-1 text-emerald-400">{formatCurrency(totalReceitas)}</p>
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Despesas</p>
            <p className="text-base font-bold mt-1 text-red-400">{formatCurrency(totalDespesas)}</p>
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Pendente</p>
            <p className="text-base font-bold mt-1 text-amber-400">{formatCurrency(pendentes)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar lançamento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {doMes.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500 text-sm">{busca ? 'Nada encontrado' : 'Nenhum lançamento neste mês'}</p>
              <p className="text-gray-400 text-xs mt-1">Toque no + para adicionar</p>
            </div>
          ) : (
            doMes.map((t, i) => {
              const l = lancadorInfo(t.criado_por)
              const ehMeu = t.criado_por === profile?.id
              return (
                <div
                  key={t.id}
                  className={`flex items-center p-4 ${i !== doMes.length - 1 ? 'border-b border-gray-100' : ''} ${!t.efetivada ? 'bg-amber-50/60' : ''}`}
                >
                  <button
                    onClick={() => togglePago(t)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mr-3 shrink-0 transition ${
                      t.efetivada ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-gray-300 hover:border-emerald-600'
                    }`}
                  >
                    {t.efetivada && <Check size={14} className="text-white" strokeWidth={3} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className={`font-semibold text-sm ${t.efetivada ? 'text-gray-900' : 'text-gray-600'}`}>{t.descricao}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${l.bg} ${l.text} border ${l.border}`}>{l.nome}</span>
                      {!t.efetivada && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 font-semibold">Pendente</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(t.data)}</p>
                  </div>

                  <div className="text-right flex items-center gap-2 shrink-0">
                    <p className={`font-bold text-sm ${t.tipo === 'receita' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {t.tipo === 'receita' ? '+' : '-'}{formatCurrency(t.valor)}
                    </p>
                    {ehMeu && (
                      <>
                        <button onClick={() => abrirEdicao(t)} className="text-gray-400 hover:text-slate-900 transition p-1">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => pedirDelete(t)} className="text-gray-400 hover:text-red-600 transition p-1">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <button
        onClick={abrirNovo}
        className="fixed bottom-24 right-4 bg-slate-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-slate-800 transition"
      >
        <Plus size={24} />
      </button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar lançamento' : 'Novo lançamento'}>
        <div className="flex gap-2">
          <button
            onClick={() => set('tipo', 'receita')}
            className={`flex-1 py-3 rounded-lg font-semibold transition border-2 ${
              form.tipo === 'receita' ? 'bg-emerald-50 text-emerald-700 border-emerald-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            Receita
          </button>
          <button
            onClick={() => set('tipo', 'despesa')}
            className={`flex-1 py-3 rounded-lg font-semibold transition border-2 ${
              form.tipo === 'despesa' ? 'bg-red-50 text-red-700 border-red-600' : 'bg-white text-gray-600 border-gray-200'
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
            value={form.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none mt-1"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {form.parcelado ? 'Valor total' : 'Valor'}
          </label>
          <CurrencyInput value={form.valor} onChange={(v) => set('valor', v)} />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {form.parcelado ? 'Data da 1ª parcela' : 'Data'}
          </label>
          <input
            type="date"
            value={form.data}
            onChange={(e) => set('data', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none mt-1"
          />
        </div>

        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div>
            <label className="text-sm font-semibold text-gray-700">Já foi pago?</label>
            <p className="text-xs text-gray-500 mt-0.5">Desmarque se for futuro</p>
          </div>
          <button
            type="button"
            onClick={() => set('efetivada', !form.efetivada)}
            className={`relative w-12 h-6 rounded-full transition ${form.efetivada ? 'bg-emerald-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.efetivada ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {!editId && (
          <>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <label className="text-sm font-semibold text-gray-700">Parcelar?</label>
              <button
                type="button"
                onClick={() => set('parcelado', !form.parcelado)}
                className={`relative w-12 h-6 rounded-full transition ${form.parcelado ? 'bg-slate-900' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.parcelado ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {form.parcelado && (
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Número de parcelas</label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={form.numParcelas}
                    onChange={(e) => set('numParcelas', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 outline-none mt-1"
                  />
                </div>
                {form.valor > 0 && form.numParcelas && (
                  <p className="text-sm text-gray-700">
                    <strong>{form.numParcelas}x</strong> de{' '}
                    <strong>{formatCurrency(form.valor / parseInt(form.numParcelas))}</strong>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        onConfirm={confirmarDelete}
        title="Excluir lançamento"
        message={confirmar?.grupo ? `Isso vai excluir TODAS as ${confirmar.transacao.parcela_total} parcelas. Continuar?` : 'Tem certeza que quer excluir este lançamento?'}
        confirmLabel="Excluir"
      />
    </div>
  )
}
