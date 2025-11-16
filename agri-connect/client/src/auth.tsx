import React, { createContext, useContext, useEffect, useState } from 'react'
import API from './api'

type Role = 'admin'|'farmer'|'buyer'
type Auth = { role?: Role; initialized: boolean; login: (email: string, password: string) => Promise<Role>; logout: () => void }
const AuthCtx = createContext<Auth>({ initialized: false, login: async () => 'buyer', logout: () => {} })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role|undefined>()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('role') as Role | null
    if (saved) setRole(saved)
    setInitialized(true)
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await API.post('/auth/login', { email, password })
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    localStorage.setItem('role', data.role)
    setRole(data.role)
    window.dispatchEvent(new CustomEvent('auth:login'))
    return data.role as Role
  }

  const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('role')
    setRole(undefined)
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }

  return <AuthCtx.Provider value={{ role, initialized, login, logout }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
