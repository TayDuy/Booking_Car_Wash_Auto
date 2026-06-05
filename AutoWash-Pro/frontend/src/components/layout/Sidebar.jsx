import React from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li><Link to="/admin">Dashboard</Link></li>
          <li><Link to="/admin/bookings">Bookings</Link></li>
          <li><Link to="/admin/customers">Customers</Link></li>
          <li><Link to="/admin/vehicles">Vehicles</Link></li>
        </ul>
      </nav>
    </aside>
  )
}
