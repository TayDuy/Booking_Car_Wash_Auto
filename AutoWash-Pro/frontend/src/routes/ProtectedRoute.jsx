import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

// allowedRoles: array of role names that can access children
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const auth = useAuth()
  const token = auth?.token
  const user = auth?.user

  if (!token) {
    return <Navigate to="/auth/login" replace />
  }

  if (allowedRoles.length && user) {
    const userRoleUpper = user.role?.toUpperCase();
    const hasRole = allowedRoles.some(role => role.toUpperCase() === userRoleUpper);
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}
