import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import AuthLayout from '../layouts/AuthLayout'
import MainLayout from '../layouts/MainLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import CustomerRoutes from './CustomerRoutes'
import AdminRoutes from './AdminRoutes'

import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import HelpCenter from '../pages/helpcenter/Helpcenter'

import UnauthorizedPage from "../pages/UnauthorizedPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          
          <Route path="/auth" element={<AuthLayout />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          <Route path="/customer/*" element={<MainLayout />}>
            <Route path="/*" element={<CustomerRoutes />} />
          </Route>

          <Route path="/admin/*" element={<DashboardLayout />}>
            <Route path="/*" element={<AdminRoutes />} />
          </Route>

          <Route path="/support" element={<HelpCenter />} />

          <Route path="/" element={<Navigate to="/customer/home" replace />} />

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppRoutes
