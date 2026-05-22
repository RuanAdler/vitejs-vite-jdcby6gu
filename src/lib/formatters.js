export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(value || 0))

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('pt-BR')

export const formatMonth = (date) =>
  new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })