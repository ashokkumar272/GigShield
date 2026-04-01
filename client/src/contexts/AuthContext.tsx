import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient, ApiError } from '../lib/apiClient'
import { tokenStorage } from '../lib/storage'
import type { WorkerProfile, WorkerLoginPayload, WorkerRegisterPayload } from '../types/api'

type AuthContextValue = {
  isAuthenticated: boolean
  token: string | null
  profile: WorkerProfile | null
  isLoading: boolean
  login: (payload: WorkerLoginPayload) => Promise<void>
  register: (payload: WorkerRegisterPayload) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get())
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!!token)

  const refreshProfile = async () => {
    if (!tokenStorage.get()) return
    try {
      const data = await apiClient.getMyProfile()
      setProfile(data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        tokenStorage.clear()
        setToken(null)
        setProfile(null)
      }
      throw error
    }
  }

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    refreshProfile()
      .catch(() => undefined)
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const login = async (payload: WorkerLoginPayload) => {
    const response = await apiClient.loginWorker(payload)
    tokenStorage.set(response.access_token)
    setToken(response.access_token)
    await refreshProfile()
  }

  const register = async (payload: WorkerRegisterPayload) => {
    await apiClient.registerWorker(payload)
  }

  const logout = () => {
    tokenStorage.clear()
    setToken(null)
    setProfile(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      profile,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [token, profile, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
