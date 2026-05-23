// Helpers de data e cálculo financeiro.
// O "mês selecionado" é representado por uma Date apontando para o dia 1.

export const ymd = (d) => {
  const dt = d instanceof Date ? d : new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1)

export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1)

export const monthLabel = (d) =>
  d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

// Uma data ("YYYY-MM-DD") cai dentro do mês de referência?
export const isInMonth = (dateStr, ref) => {
  if (!dateStr) return false
  const dt = new Date(`${dateStr}T00:00:00`)
  return dt.getFullYear() === ref.getFullYear() && dt.getMonth() === ref.getMonth()
}

// Uma data é anterior ou igual ao último dia do mês de referência?
export const isOnOrBeforeMonth = (dateStr, ref) => {
  if (!dateStr) return false
  const dt = new Date(`${dateStr}T00:00:00`)
  const fimDoMes = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59)
  return dt <= fimDoMes
}

// Saldo real acumulado até o fim do mês de referência:
// saldo inicial das contas + receitas efetivadas - despesas efetivadas.
export const calcSaldo = (contas, transacoes, ref) => {
  const saldoInicial = contas.reduce((s, c) => s + (Number(c.saldo_inicial) || 0), 0)
  const movimento = transacoes
    .filter((t) => t.efetivada && isOnOrBeforeMonth(t.data, ref))
    .reduce((s, t) => s + (t.tipo === 'receita' ? 1 : -1) * (Number(t.valor) || 0), 0)
  return saldoInicial + movimento
}
