import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { login as apiLogin, logout as apiLogout, checkSession } from '@/api/auth'
import type { AuthContextValue, LoginCredentials, UserSummary, Session } from '@/types/auth'

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserSummary | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = user !== null

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await apiLogin(credentials)
      setUser(response.user)
      setSession(response.session)
    } catch (error) {
      setUser(null)
      setSession(null)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setSession(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await checkSession()
      if (response) {
        setUser(response.user)
        setSession(response.session)
      } else {
        setUser(null)
        setSession(null)
      }
    } catch {
      setUser(null)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setSession(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  const value: AuthContextValue = {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
