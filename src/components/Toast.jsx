import { createContext, useContext, useCallback, useState } from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(() => {})

export const useToast = () => useContext(ToastContext)

const icones = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const cores = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-900',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((mensagem, tipo = 'success') => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, mensagem, tipo }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => {
          const Icon = icones[t.tipo] || Info
          return (
            <div
              key={t.id}
              className={`${cores[t.tipo]} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm w-full animate-[slideDown_.2s_ease-out]`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{t.mensagem}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
