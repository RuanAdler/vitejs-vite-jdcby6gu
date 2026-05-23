import { useEffect } from 'react'
import { X } from 'lucide-react'

// Bottom sheet reutilizável com animação de subida.
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center sm:justify-center z-50 animate-[fadeIn_.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-xl animate-[slideUp_.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 -mr-1">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
