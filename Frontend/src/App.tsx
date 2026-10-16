import { useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Lenis from 'lenis'
import { Nav, Preloader } from './components/Chrome'
import { Cursor } from './components/ui'
import Home from './pages/Home'
import Stories from './pages/Stories'
import PersonPage from './pages/Person'
import Report from './pages/Report'
import Search from './pages/Search'
import Dashboard from './pages/Dashboard'
import Matches from './pages/Matches'
import Auth from './pages/Auth'

let lenis: Lenis | null = null

function seenIntro() {
  try {
    return sessionStorage.getItem('ss-intro') === '1'
  } catch {
    return false
  }
}

export default function App() {
  const location = useLocation()
  const [intro, setIntro] = useState(() => location.pathname === '/' && !seenIntro())

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true })
    let raf = 0
    const loop = (t: number) => {
      lenis?.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis?.destroy()
      lenis = null
    }
  }, [])

  useEffect(() => {
    if (intro) lenis?.stop()
    else lenis?.start()
  }, [intro])

  const endIntro = useCallback(() => {
    try {
      sessionStorage.setItem('ss-intro', '1')
    } catch {
      /* storage unavailable */
    }
    setIntro(false)
  }, [])

  return (
    <>
      <div className="grain" aria-hidden />
      <Cursor />
      <AnimatePresence>{intro && <Preloader onDone={endIntro} />}</AnimatePresence>
      <Nav />
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          try {
            lenis?.scrollTo(0, { immediate: true })
            window.scrollTo(0, 0)
          } catch {
            window.scrollTo(0, 0)
          }
        }}
      >
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >

          <Routes location={location}>
            <Route path="/" element={<Home ready={!intro} />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/person/:id" element={<PersonPage />} />
            <Route path="/report" element={<Report />} />
            <Route path="/search" element={<Search />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
    </>
  )
}
