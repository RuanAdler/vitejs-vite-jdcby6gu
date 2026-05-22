import { useState } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
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
  const [parcelado, setParcelado] = useState(false)
  const [numParcelas, setNumParcelas] = useState('2')
  const [efetivada, setEfetivada] = useState(true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!descricao || !valor) return
    setSaving(true)

    if (parcelado && parseInt(numParcelas) > 1) {
      const totalParcelas = parseInt(numParcelas)
      const valorPorParcela = parseFloat(valor) / totalParcelas
      const grupoId = crypto.randomUUID()
      const transacoesParaInserir = []

      for (let i = 0; i < totalParcelas; i++) {
        const dataParcela = new Date(data)
        dataParcela.setMonth(dataParcela.getMonth() + i)

        transacoesParaInserir.push({
          household_id: profile?.household_id,
          descricao: `${descricao} (${i + 1}/${totalParcelas})`,
          valor: valorPorParcela,
          tipo,
          data: dataParcela.toISOString().split('T')[0],
          criado_por: profile?.id,
          parcela_atual: i + 1,
          parcela_total: totalParcelas,
          parcela_grupo_id: grupoId,
          efetivada: i === 0 ? efetivada : false
        })
      }

      await supabase.from('transacoes').insert(transacoesParaInserir)
    } else {
      await supabase.from('transacoes').insert({
        household_id: profile?.household_id,
        descricao,
        valor: parseFloat(valor),
        tipo,
        data,
        criado_por: profile?.id,
        efetivada
      })
    }

    setDescricao('')
    setValor('')
    setTipo('despesa')
    setData(new Date().toISOString().split('T')[0])
    setParcelado(false)
    setNumParcelas('2')
    setEfetivada(true)
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (t) => {
    if (t.parcela_grupo_id) {
      if (confirm(`Deletar TODAS as ${t.parcela_total} parcelas?`)) {
        await supabase.from('transacoes').delete().eq('parcela_grupo_id', t.parcela_grupo_id)
      }
    } else {
      if (confirm('Tem certeza que quer deletar?')) {
        await supabase.from('transacoes').delete().eq('id', t.id)
      }
    }
  }

  const togglePago = async (t) => {
    await supabase
      .from('transacoes')
      .update({ efetivada: !t.efetivada })
      .eq('id', t.id)
  }

  const despesas = transacoes.filter(t => t.tipo === 'despesa')
  const receitas = transacoes.filter(t => t.tipo === 'receita')
  const totalDespesas = despesas.reduce((sum, t) => sum + t.valor, 0)
  const totalReceitas = receitas.reduce((sum, t) => sum + t.valor, 0)
  const despesasPendentes = despesas.filter(t => !t.efetivada).reduce((sum, t) => sum + t.valor, 0)

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
            <p className="text-xs text-gray-400 uppercase tracking-wider">Pendente</p>
            <p className="text-base font-semibold mt-1 text-amber-400">{formatCurrency(despesasPendentes)}</p>
          </div>
        </div>
      </div>

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
                    className={`flex justify-between items-center p-4 ${index !== transacoes.length - 1 ? 'border-b border-gray-100' : ''} ${!t.efetivada ? 'bg-amber-50' : ''}`}
                  >
                    {/* Checkbox de pago */}
                    <button
                      onClick={() => togglePago(t)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mr-3 transition ${
                        t.efetivada
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'bg-white border-gray-300 hover:border-emerald-600'
                      }`}
                    >
                      {t.efetivada && <Check size={14} className="text-white" strokeWidth={3} />}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className={`font-semibold text-sm ${t.efetivada ? 'text-gray-900' : 'text-gray-600'}`}>{t.descricao}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${lancador.bg} ${lancador.text} border ${lancador.border}`}>
                          {lancador.nome}
                        </span>
                        {!t.efetivada && (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 font-semibold">
                            Pendente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(t.data)}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className={`font-semibold ${t.tipo === 'receita' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {t.tipo === 'receita' ? '+' : '-'}{formatCurrency(t.valor)}
                      </p>
                      {t.criado_por === profile?.id && (
                        <button
                          onClick={() => handleDelete(t)}
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

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 bg-slate-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-slate-800 transition"
      >
        <Plus size={24} />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {parcelado ? 'Valor total' : 'Valor'}
              </label>
              <input
                type="number"
                placeholder="0,00"
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:outline-none mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {parcelado ? 'Data da 1ª parcela' : 'Data'}
              </label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:outline-none mt-1"
              />
            </div>

            {/* Checkbox de já foi pago */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div>
                <label className="text-sm font-semibold text-gray-700">Já foi pago?</label>
                <p className="text-xs text-gray-500 mt-0.5">Desmarque se for uma despesa futura</p>
              </div>
              <button
                type="button"
                onClick={() => setEfetivada(!efetivada)}
                className={`relative w-12 h-6 rounded-full transition ${efetivada ? 'bg-emerald-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${efetivada ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Toggle parcelado */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <label className="text-sm font-semibold text-gray-700">Parcelar?</label>
              <button
                type="button"
                onClick={() => setParcelado(!parcelado)}
                className={`relative w-12 h-6 rounded-full transition ${parcelado ? 'bg-slate-900' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${parcelado ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {parcelado && (
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Número de parcelas</label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    placeholder="Ex: 10"
                    value={numParcelas}
                    onChange={e => setNumParcelas(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:outline-none mt-1"
                  />
                </div>
                {valor && numParcelas && (
                  <p className="text-sm text-gray-700">
                    <strong>{numParcelas}x</strong> de <strong>{formatCurrency(parseFloat(valor) / parseInt(numParcelas))}</strong>
                  </p>
                )}
              </div>
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
          </div>
        </div>
      )}
    </div>
  )
}