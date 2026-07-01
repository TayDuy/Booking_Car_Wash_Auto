import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import HomePage from '../features/customer/pages/HomePage'
import ProfilePage from '../features/customer/pages/ProfilePage'
import BookingHistoryPage from '../features/customer/pages/BookingHistoryPage'

function CustomerRoutes() {
  return (
    <Routes>
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER", "USER"]}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="booking/success" element={<BookingSuccessPage />} />
        <Route path="booking/:bookingId" element={<BookingDetailPage />} />
        <Route path="history" element={<BookingHistoryPage />} />
        <Route path="promotions" element={<PromotionListPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<CustomerNotificationPage />} />
        <Route path="support" element={<SupportPage />} />
      </Route>
    </Routes>
  )
}

export default CustomerRoutes
