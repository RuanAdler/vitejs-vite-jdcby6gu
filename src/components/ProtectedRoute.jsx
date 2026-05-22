import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, requireHousehold = true }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user) return <Navigate to="/login" replace />
  if (requireHousehold && !profile?.household_id) return <Navigate to="/onboarding" replace />

  return children
}