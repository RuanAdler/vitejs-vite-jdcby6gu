export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(value || 0))

export const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')

export const formatMonth = (date) =>
  new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

// Converte texto digitado pelo usuário ("1.234,56" ou "1234,56") em número
export const parseCurrency = (text) => {
  if (typeof text === 'number') return text
  if (!text) return 0
  const limpo = String(text).replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(limpo)
  return isNaN(n) ? 0 : n
}
