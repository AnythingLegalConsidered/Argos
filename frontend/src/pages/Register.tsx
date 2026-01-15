/**
 * Register page component.
 * Handles new user registration via email/password.
 * Design: Argos "Ancient Greece meets Modern Tech"
 */

import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-beige rounded-tablet p-8 shadow-tablet">
            <div className="w-16 h-16 bg-olive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-charcoal mb-2">Inscription réussie !</h2>
            <p className="text-bronze mb-6">
              Vérifiez votre email pour confirmer votre compte.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-terracotta hover:bg-terracotta-dark text-white font-medium rounded-lg transition-colors shadow-tablet"
            >
              Aller à la connexion
            </button>
          </div>
        </div>
      </div>
    )
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
          <p className="text-bronze mt-2 font-light">Rejoignez l'observatoire</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-beige rounded-tablet p-8 shadow-tablet">
          <h2 className="text-xl font-serif text-charcoal mb-6 text-center">Créer un compte</h2>

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

          <div className="mb-5">
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

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-bronze mb-2">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>

          <p className="mt-6 text-center text-sm text-bronze">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-terracotta hover:text-terracotta-dark font-medium transition-colors">
              Se connecter
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
