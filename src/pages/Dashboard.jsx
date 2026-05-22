import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{profile?.households?.nome}</h1>
            <p className="text-gray-600">Olá, {profile?.nome}!</p>
          </div>
          <button onClick={signOut} className="text-red-600 font-medium">Sair</button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <p className="text-sm text-gray-600 mb-1">Código de convite (compartilhe com sua esposa)</p>
          <p className="text-2xl font-mono font-bold tracking-wider">
            {profile?.households?.invite_code?.toUpperCase()}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-gray-500">📊 Em breve: saldo, gráficos e próximos vencimentos</p>
        </div>
      </div>
    </div>
  )
}