import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signUp(email, password, nome)
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">Comece a organizar suas finanças</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Seu nome" required
            value={nome} onChange={e => setNome(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
          />
          <input
            type="email" placeholder="Email" required
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
          />
          <input
            type="password" placeholder="Senha (mínimo 6 caracteres)" required minLength={6}
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">
          Já tem conta? <Link to="/login" className="text-slate-900 font-semibold">Entrar</Link>
        </p>
      </div>
    </div>
  )
}