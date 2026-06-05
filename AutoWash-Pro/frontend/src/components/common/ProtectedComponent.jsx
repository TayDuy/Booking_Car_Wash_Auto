import React from 'react'
import ProtectedRoute from '../../routes/ProtectedRoute'

export default function ProtectedComponent({ children, roles = [] }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
}
