/**
 * Login page component.
 * Handles user authentication via email/password.
 * Design: Argos "Ancient Greece meets Modern Tech"
 */

import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-beige border-2 border-terracotta/30 flex items-center justify-center shadow-tablet">
            <svg className="w-8 h-8 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-serif font-semibold text-charcoal tracking-wide">ARGOS</h1>
          <p className="text-bronze mt-2 font-light">L'œil qui voit tout</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-beige rounded-tablet p-8 shadow-tablet">
          <h2 className="text-xl font-serif text-charcoal mb-6 text-center">Connexion</h2>

          {error && (
            <div className="mb-4 p-3 bg-terracotta/10 border border-terracotta/30 rounded-lg text-terracotta-dark text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-medium text-bronze mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-cream/50 border border-bronze/20 rounded-lg text-charcoal placeholder-bronze/50 focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30 transition-colors"
              placeholder="votre@email.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-bronze mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-cream/50 border border-bronze/20 rounded-lg text-charcoal placeholder-bronze/50 focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-terracotta hover:bg-terracotta-dark disabled:bg-terracotta/50 text-white font-medium rounded-lg transition-colors shadow-tablet hover:shadow-tablet-hover"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="mt-6 text-center text-sm text-bronze">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-terracotta hover:text-terracotta-dark font-medium transition-colors">
              S'inscrire
            </Link>
          </p>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-bronze/60">
          Plateforme de Veille Informationnelle
        </p>
      </div>
    </div>
  )
}
