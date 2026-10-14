import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon, Magnetic } from './ui'

const links = [
  { to: '/stories', label: 'Their stories' },
  { to: '/search', label: 'I saw someone' },
  { to: '/dashboard', label: 'Family dashboard' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('access')))
  const loc = useLocation()
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => setOpen(false), [loc.pathname])
  if (loc.pathname.startsWith('/dashboard')) return null

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
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                {l.label}
              </>
            )}
          </NavLink>
        ))}
        <Magnetic>
          <Link to="/report" className="btn btn-light btn-sm" style={{ marginLeft: 8 }}>
            Report someone missing
          </Link>
        </Magnetic>
        {loggedIn
          ? <button className="btn btn-ghost btn-sm" onClick={() => { localStorage.clear(); setLoggedIn(false); window.location.href = '/login' }}>Sign out</button>
          : <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>}
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
  return <div className="sample-note mono">Sample stories · design preview</div>
}
