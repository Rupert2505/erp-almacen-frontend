import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AUTH_UNAUTHORIZED_EVENT } from '../../../shared/utils/storageKeys'
import {
  authService,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  persistAuthSession,
  persistUser,
} from '../services/authService'
import type { AuthStatus, AuthUser, LoginCredentials } from '../types/auth.types'
import { AuthContext, type AuthContextValue } from './authContextDefinition'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [status, setStatus] = useState<AuthStatus>(() =>
    getStoredToken() ? 'checking' : 'unauthenticated',
  )

  const logout = useCallback(() => {
    clearAuthSession()
    setUser(null)
    setStatus('unauthenticated')
    navigate('/login', { replace: true })
  }, [navigate])

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials)
      persistAuthSession(response)
      setUser(response)
      setStatus('authenticated')
      navigate('/dashboard', { replace: true })
    },
    [navigate],
  )

  useEffect(() => {
    let isActive = true

    async function restoreSession() {
      if (!getStoredToken()) {
        clearAuthSession()
        setUser(null)
        setStatus('unauthenticated')
        return
      }

      try {
        const currentUser = await authService.me()

        if (!isActive) {
          return
        }

        persistUser(currentUser)
        setUser(currentUser)
        setStatus('authenticated')
      } catch {
        if (!isActive) {
          return
        }

        clearAuthSession()
        setUser(null)
        setStatus('unauthenticated')
      }
    }

    restoreSession()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthSession()
      setUser(null)
      setStatus('unauthenticated')
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      logout,
    }),
    [login, logout, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
