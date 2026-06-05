import React from 'react'
import useAuth from '../../hooks/useAuth'

export default function Header() {
  const auth = useAuth()
  return (
    <header className="site-header">
      <div className="brand">AutoWash Pro</div>
      <div className="actions">
        {auth?.user ? <span>{auth.user.name}</span> : null}
      </div>
    </header>
  )
}
