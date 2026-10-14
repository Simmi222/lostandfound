import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login, register } from '../api'

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const registering = location.pathname === '/register'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (registering && password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      if (registering) {
        await register({ username, email, password, confirm_password: confirm, role: 'RELATIVE' })
      } else {
        await login(username, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 560, margin: '0 auto' }}>
      <p className="eyebrow mono">{registering ? 'Create an account' : 'Welcome back'}</p>
      <h1 className="h2">{registering ? 'Start searching together.' : 'Sign in to continue.'}</h1>
      <form className="panel" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 28 }}>
        {error && <p className="form-error">{error}</p>}
        <div className="field">
          <label className="mono" htmlFor="username">Username</label>
          <input id="username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        {registering && (
          <div className="field">
            <label className="mono" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        )}
        <div className="field">
          <label className="mono" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {registering && (
          <div className="field">
            <label className="mono" htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
        )}
        <button className="btn btn-light" disabled={loading}>{loading ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="muted" style={{ marginTop: 20 }}>
        {registering ? 'Already have an account? ' : 'Need an account? '}
        <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Register'}</Link>
      </p>
    </div>
  )
}
