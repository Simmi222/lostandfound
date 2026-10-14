import { Fragment, useEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode } from 'react'
import { animate, motion, useInView, useMotionValue, useSpring } from 'framer-motion'

export function Photo({ alt = '', ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    const initials = alt.split(' ').map((w) => w[0]).slice(0, 2).join('')
    return (
      <div
        className={rest.className}
        style={{
          ...rest.style,
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background: 'radial-gradient(circle at 50% 30%, #36271b, #2a1d14)',
          fontFamily: 'var(--serif)',
          fontSize: 48,
          color: 'var(--ink-3)',
        }}
      >
        {initials}
      </div>
    )
  }
  return <img alt={alt} loading="lazy" draggable={false} onError={() => setFailed(true)} {...rest} />
}

export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

export function TimeApart({ since, compact = false }: { since: string; compact?: boolean }) {
  const now = useNow()
  const ms = Math.max(0, now - new Date(since).getTime())
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms / 3_600_000) % 24)
  const m = Math.floor((ms / 60_000) % 60)
  const s = Math.floor((ms / 1000) % 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  if (compact) return <span>{d.toLocaleString()} days</span>
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {d.toLocaleString()}d {pad(h)}h {pad(m)}m {pad(s)}s
    </span>
  )
}

export function CountUp({ to, duration = 2, suffix = '' }: { to: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setVal(Math.round(v)) })
    return () => c.stop()
  }, [inView, to, duration])
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  )
}

export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 200, damping: 15 })
  const y = useSpring(0, { stiffness: 200, damping: 15 })
  return (
    <motion.div
      ref={ref}
      style={{ x, y, display: 'inline-block' }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * strength)
        y.set((e.clientY - r.top - r.height / 2) * strength)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

export function Reveal({ children, delay = 0, y = 40, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function SplitTitle({ text, className, delay = 0, as: Tag = 'h1' }: { text: string; className?: string; delay?: number; as?: 'h1' | 'h2' }) {
  const ref = useRef<HTMLHeadingElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const words = text.split(' ')
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
        <span className="word" aria-hidden>
          <motion.span
            initial={{ y: '110%', rotate: 4 }}
            animate={inView ? { y: '0%', rotate: 0 } : undefined}
            transition={{ duration: 1.2, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
        </span>
        {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </Tag>
  )
}

export function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const hx = useSpring(x, { stiffness: 80, damping: 20 })
  const hy = useSpring(y, { stiffness: 80, damping: 20 })
  const dx = useSpring(x, { stiffness: 900, damping: 50 })
  const dy = useSpring(y, { stiffness: 900, damping: 50 })
  useEffect(() => {
    const m = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener('mousemove', m)
    return () => window.removeEventListener('mousemove', m)
  }, [x, y])
  return (
    <>
      <motion.div className="cursor-halo" style={{ x: hx, y: hy }} />
      <motion.div className="cursor" style={{ x: dx, y: dy }} />
    </>
  )
}

type IconProps = { size?: number }
const ico = (d: ReactNode) => ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
)
export const Icon = {
  arrow: ico(<path d="M5 12h14M13 6l6 6-6 6" />),
  back: ico(<path d="M19 12H5M11 6l-6 6 6 6" />),
  eye: ico(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  share: ico(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>),
  upload: ico(<><path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></>),
  search: ico(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>),
  camera: ico(<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></>),
  pin: ico(<><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>),
  check: ico(<path d="M5 12l5 5 9-10" />),
  x: ico(<path d="M6 6l12 12M18 6L6 18" />),
  home: ico(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>),
  inbox: ico(<><path d="M3 13l3-8h12l3 8v6H3z" /><path d="M3 13h5l1 3h6l1-3h5" /></>),
  users: ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14c2.5.6 4 2.8 4 6" /></>),
  map: ico(<><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>),
  poster: ico(<><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M8 17h8" /></>),
  menu: ico(<path d="M4 8h16M4 16h16" />),
  heart: ico(<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />),
  bell: ico(<><path d="M6 16V11a6 6 0 0112 0v5l2 2H4z" /><path d="M10 21h4" /></>),
}
