import { Home, ArrowLeftRight, Wallet, Calendar } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/transacoes', icon: ArrowLeftRight, label: 'Lançamentos' },
    { path: '/contas', icon: Wallet, label: 'Contas' },
    { path: '/recorrencias', icon: Calendar, label: 'Fixas' }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center py-3 px-4 flex-1 transition ${
              isActive
                ? 'text-slate-900 border-t-2 border-slate-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}