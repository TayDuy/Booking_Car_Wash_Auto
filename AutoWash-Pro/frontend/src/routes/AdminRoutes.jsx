import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage'
import ManageBookingsPage from '../features/admin/pages/ManageBookingsPage'
import ManageCustomersPage from '../features/admin/pages/ManageCustomersPage'
import ManageVehiclesPage from '../features/admin/pages/ManageVehiclesPage'
import ManagePromotionsPage from '../features/admin/pages/ManagePromotionsPage'
import ReportsPage from '../features/admin/pages/ReportsPage'

function AdminRoutes() {
  return (
    <Routes>
      <Route path="" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="bookings" element={<ProtectedRoute allowedRoles={["STAFF","ADMIN"]}><ManageBookingsPage /></ProtectedRoute>} />
      <Route path="customers" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageCustomersPage /></ProtectedRoute>} />
      <Route path="vehicles" element={<ProtectedRoute allowedRoles={["STAFF","ADMIN"]}><ManageVehiclesPage /></ProtectedRoute>} />
      <Route path="promotions" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManagePromotionsPage /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ReportsPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default AdminRoutes
