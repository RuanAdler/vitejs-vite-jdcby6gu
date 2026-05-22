import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, requireHousehold = true }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Se está logado mas o profile ainda não carregou, espera
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Carregando perfil...</p>
      </div>
    )
  }

  if (requireHousehold && !profile?.household_id) return <Navigate to="/onboarding" replace />

  return children
}