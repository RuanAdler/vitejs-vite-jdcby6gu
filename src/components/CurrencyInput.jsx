import { useEffect, useRef, useState } from 'react'

// Campo de valor em R$ com máscara pt-BR. Emite um número (reais) via onChange.
// O usuário digita só números; os centavos são preenchidos da direita pra esquerda.
const formatar = (centavos) =>
  (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CurrencyInput({ value, onChange, placeholder = '0,00', autoFocus, className = '' }) {
  const [display, setDisplay] = useState(value ? formatar(Math.round(value * 100)) : '')
  const focado = useRef(false)

  useEffect(() => {
    if (focado.current) return
    setDisplay(value ? formatar(Math.round(value * 100)) : '')
  }, [value])

  const handleChange = (e) => {
    const digitos = e.target.value.replace(/\D/g, '')
    if (!digitos) {
      setDisplay('')
      onChange(0)
      return
    }
    const centavos = parseInt(digitos, 10)
    setDisplay(formatar(centavos))
    onChange(centavos / 100)
  }

  return (
    <div className="relative mt-1">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">R$</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={display}
        autoFocus={autoFocus}
        onFocus={() => (focado.current = true)}
        onBlur={() => (focado.current = false)}
        onChange={handleChange}
        className={`w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none ${className}`}
      />
    </div>
  )
}
