import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Transacoes from './pages/Transacoes'
import Contas from './pages/Contas'
import Recorrencias from './pages/Recorrencias'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={
            <ProtectedRoute requireHousehold={false}><Onboarding /></ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
              <BottomNav />
            </ProtectedRoute>
          } />
          <Route path="/transacoes" element={
            <ProtectedRoute>
              <Transacoes />
              <BottomNav />
            </ProtectedRoute>
          } />
          <Route path="/contas" element={
            <ProtectedRoute>
              <Contas />
              <BottomNav />
            </ProtectedRoute>
          } />
          <Route path="/recorrencias" element={
            <ProtectedRoute>
              <Recorrencias />
              <BottomNav />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}