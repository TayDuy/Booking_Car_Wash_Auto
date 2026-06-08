import React, { useState } from 'react'
import useAuth from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await auth.login({ email, password })
      // redirect handled by routes or app
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>Login</h1>
      <form onSubmit={submit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button type="submit" disabled={loading}>Sign in</button>
      </form>

      <p>
        Chưa có tài khoản? <Link to="/register-test">Đăng ký</Link>
      </p>
    </div>
  )
}
