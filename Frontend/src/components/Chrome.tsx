import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getCurrentUser, logout } from '../api'
import { Icon, Magnetic } from './ui'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('access')))
  const [user, setUser] = useState(() => getCurrentUser())
  const loc = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const syncAuth = () => {
      setLoggedIn(Boolean(localStorage.getItem('access')))
      setUser(getCurrentUser())
    }
    syncAuth()
    window.addEventListener('auth-change', syncAuth)
    window.addEventListener('storage', syncAuth)
    return () => {
      window.removeEventListener('auth-change', syncAuth)
      window.removeEventListener('storage', syncAuth)
    }
  }, [loc.pathname])


  const [searchVal, setSearchVal] = useState(() => {
    return new URLSearchParams(window.location.search).get('q') || ''
  })

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => setOpen(false), [loc.pathname])

  useEffect(() => {
    if (loc.pathname === '/stories') {
      const q = new URLSearchParams(loc.search).get('q') || ''
      setSearchVal(q)
    }
  }, [loc.pathname, loc.search])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/stories?q=${encodeURIComponent(searchVal.trim())}`)
    } else {
      navigate('/stories')
    }
  }

  const handleSearchChange = (val: string) => {
    setSearchVal(val)
    if (loc.pathname === '/stories') {
      navigate(val.trim() ? `/stories?q=${encodeURIComponent(val)}` : '/stories', { replace: true })
    }
  }

  return (
    <motion.header
      className={`nav ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/" className="brand" aria-label="Still Searching home">
        <span className="brand-flame" />
        Still Searching
      </Link>
      <nav className={`nav-links ${open ? 'open' : ''}`}>
        <NavLink to="/stories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Their stories
        </NavLink>

        <NavLink to="/matches" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Matched
        </NavLink>

        <form className="nav-search-form" onSubmit={handleSearchSubmit}>
          <div className="nav-search-pill">
            <Icon.search size={14} />
            <input
              type="text"
              className="nav-search-input"
              placeholder="Search name, city or pic…"
              value={searchVal}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search name, city or pic"
            />
            {searchVal && (
              <button
                type="button"
                className="nav-search-clear"
                onClick={() => {
                  setSearchVal('')
                  if (loc.pathname === '/stories') navigate('/stories')
                }}
                aria-label="Clear search"
              >
                <Icon.x size={13} />
              </button>
            )}
            <label className="nav-search-camera-btn" title="Search by photo (face recognition)">
              <Icon.camera size={15} />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    navigate('/search', { state: { photoFile: file } })
                  }
                }}
              />
            </label>
          </div>
        </form>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Family dashboard
        </NavLink>

        <Magnetic>
          <Link to="/report" className="btn btn-light btn-sm" style={{ marginLeft: 8 }}>
            Report someone missing
          </Link>
        </Magnetic>
        {loggedIn ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginLeft: 6 }}>
            <span className="mono faint" style={{ fontSize: 11 }}>
              Signed in (<b style={{ color: 'var(--candle)' }}>{user?.username || 'You'}</b>)
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                logout()
                setLoggedIn(false)
                setUser(null)
                navigate('/login')
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-ghost btn-sm">
            Sign in
          </Link>
        )}

      </nav>
      <button className="nav-menu-btn btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
        {open ? <Icon.x /> : <Icon.menu />}
      </button>
    </motion.header>
  )
}

const preloadLines = ['Every face here', 'is someone’s whole world.', 'Look closely.']

export function Preloader({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (i >= preloadLines.length) {
      const t = setTimeout(onDone, 300)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setI((n) => n + 1), i === preloadLines.length - 1 ? 1500 : 1700)
    return () => clearTimeout(t)
  }, [i, onDone])

  return (
    <motion.div className="preloader" exit={{ opacity: 0, filter: 'blur(12px)' }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
      <AnimatePresence mode="wait">
        {i < preloadLines.length && (
          <motion.p
            key={i}
            className={`preloader-line ${i === 2 ? 'italic candle' : ''}`}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {preloadLines[i]}
          </motion.p>
        )}
      </AnimatePresence>
      <button className="preloader-skip mono faint" onClick={onDone}>
        Skip
      </button>
    </motion.div>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-big">Bring them home.</div>
      <div className="footer-row">
        <span>Every share is a flashlight. Every look counts.</span>
        <span>If someone is in immediate danger, call your local emergency number first.</span>
        <span>© {new Date().getFullYear()} Still Searching</span>
      </div>
    </footer>
  )
}

export function SampleNote() {
  return null
}
