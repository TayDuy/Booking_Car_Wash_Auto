import React, { createContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, saveAuth } from '../api/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    if (!token) return null
    return {
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      fullName: localStorage.getItem('fullName'),
      role: localStorage.getItem('role'),
      customerId: localStorage.getItem('customerId'),
    }
  })
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [token])

  const login = async (credentials) => {
    const data = await apiLogin(credentials.username, credentials.password)
    if (data) {
      saveAuth(data)
      setToken(data.accessToken)
      setUser({
        userId: data.user.userId,
        username: data.user.username,
        fullName: data.user.fullName,
        role: data.user.role,
        customerId: data.user.customerId
      })
    }
    return data
  }

  const logout = () => {
    apiLogout()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
