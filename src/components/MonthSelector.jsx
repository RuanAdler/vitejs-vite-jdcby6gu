import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, monthLabel, startOfMonth } from '../lib/finance'

// Navegador de mês. value/onChange trabalham com uma Date (dia 1 do mês).
export default function MonthSelector({ value, onChange, light = false }) {
  const ehMesAtual =
    value.getFullYear() === new Date().getFullYear() &&
    value.getMonth() === new Date().getMonth()

  const texto = light ? 'text-white' : 'text-slate-900'
  const btn = light
    ? 'text-white/70 hover:text-white hover:bg-white/10'
    : 'text-gray-500 hover:text-slate-900 hover:bg-gray-100'

  return (
    <div className="flex items-center justify-between">
      <button onClick={() => onChange(addMonths(value, -1))} className={`p-2 rounded-lg transition ${btn}`}>
        <ChevronLeft size={20} />
      </button>
      <div className="text-center">
        <p className={`text-sm font-semibold capitalize ${texto}`}>{monthLabel(value)}</p>
        {!ehMesAtual && (
          <button
            onClick={() => onChange(startOfMonth())}
            className={`text-xs ${light ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-slate-900'}`}
          >
            voltar para hoje
          </button>
        )}
      </div>
      <button onClick={() => onChange(addMonths(value, 1))} className={`p-2 rounded-lg transition ${btn}`}>
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
