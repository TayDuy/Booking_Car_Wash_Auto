import React, { createContext, useState, useEffect } from 'react'
import authApi from '../api/authApi'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    if (!token) return null
    return {
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
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
    const res = await authApi.login(credentials)
    const data = res.data?.data
    if (data) {
      setToken(data.accessToken)
      setUser({
        userId: data.user.userId,
        username: data.user.username,
        role: data.user.role,
        customerId: data.user.customerId
      })
    }
    return res
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('customerId')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
