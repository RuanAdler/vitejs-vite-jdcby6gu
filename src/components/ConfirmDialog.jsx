import Modal from './Modal'

// Confirmação estilizada para substituir window.confirm.
export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={`flex-1 py-3 rounded-lg font-semibold text-white transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
