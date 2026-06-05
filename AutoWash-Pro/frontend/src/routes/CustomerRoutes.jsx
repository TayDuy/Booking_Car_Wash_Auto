import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import HomePage from '../features/customer/pages/HomePage'
import ProfilePage from '../features/customer/pages/ProfilePage'
import BookingHistoryPage from '../features/customer/pages/BookingHistoryPage'

function CustomerRoutes() {
  return (
    <Routes>
      <Route path="home" element={<HomePage />} />
      <Route
        path="profile"
        element={<ProtectedRoute allowedRoles={["Customer", "Staff", "Manager", "Admin"]}><ProfilePage /></ProtectedRoute>}
      />
      <Route path="bookings" element={<BookingHistoryPage />} />
    </Routes>
  )
}

export default CustomerRoutes
