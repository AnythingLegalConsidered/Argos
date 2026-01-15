/**
 * Navigation bar component.
 * Shared across authenticated pages.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function Navbar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav className="bg-marble border-b border-border shadow-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and nav links */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sand border border-terracotta/30 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
                </div>
                <span className="font-display text-xl font-semibold text-charcoal">
                  ARGOS
                </span>
              </Link>

              {/* Nav links */}
              <div className="flex items-center gap-1">
                <Link
                  to="/"
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive('/')
                      ? 'bg-terracotta/10 text-terracotta'
                      : 'text-muted-foreground hover:text-charcoal hover:bg-muted'
                    }
                  `}
                >
                  Feed
                </Link>
                <Link
                  to="/search"
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive('/search')
                      ? 'bg-terracotta/10 text-terracotta'
                      : 'text-muted-foreground hover:text-charcoal hover:bg-muted'
                    }
                  `}
                >
                  Recherche
                </Link>
                <Link
                  to="/sources"
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive('/sources')
                      ? 'bg-terracotta/10 text-terracotta'
                      : 'text-muted-foreground hover:text-charcoal hover:bg-muted'
                    }
                  `}
                >
                  Sources
                </Link>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-terracotta transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Se déconnecter ?"
        message="Vous allez être déconnecté de votre session Argos."
        confirmLabel="Déconnexion"
        variant="danger"
      />
    </>
  )
}
