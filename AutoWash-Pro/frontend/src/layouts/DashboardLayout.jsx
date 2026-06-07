import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="container">
        <Sidebar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
