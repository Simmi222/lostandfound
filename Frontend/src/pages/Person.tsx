import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { getPerson, getCurrentUser, deleteReport } from '../api'
import type { Person } from '../api'
import { Icon, Magnetic, Photo, Reveal, SplitTitle, TimeApart } from '../components/ui'
import { Footer } from '../components/Chrome'
import { SightingModal } from '../components/Sighting'

const daysSince = (date: string) => Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000))

export default function PersonPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [person, setPerson] = useState<Person | null | undefined>(undefined)
  const [seen, setSeen] = useState(false)
  const [poster, setPoster] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const currentUser = getCurrentUser()
  const { scrollY } = useScroll()
  const photoScale = useTransform(scrollY, [0, 800], [1, 1.12])

  const canDelete = Boolean(
    currentUser &&
      person &&
      (currentUser.role === 'ADMIN' ||
        currentUser.username === person.from ||
        (person.created_by && currentUser.id === person.created_by))
  )

  const handleDelete = async () => {
    if (!person) return
    const ok = window.confirm(`Are you sure you want to delete the report for ${person.name}?`)
    if (!ok) return
    setDeleting(true)
    try {
      await deleteReport(Number(id), (person.kind as 'MISSING' | 'FOUND') || 'MISSING')
      navigate('/dashboard')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete report.')
      setDeleting(false)
    }
  }

  useEffect(() => {
    getPerson(id).then((p) => setPerson(p ?? null))
  }, [id])

  if (person === undefined)
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: '60vh' }}>
        <p className="mono candle">Loading case story…</p>
      </div>
    )
  if (person === null)
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <h1 className="h2">We couldn’t find this story.</h1>
          <Link to="/stories" className="btn btn-ghost" style={{ marginTop: 24 }}>Back to everyone</Link>
        </div>
      </div>
    )

  const first = person.name.split(' ')[0]
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: `Help find ${person.name}`, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* dismissed */
    }
  }

  const timeline = [
    { t: 'Morning', d: `An ordinary day. ${first} left home like any other day.` },
    { t: 'Afternoon', d: `Messages were normal. Nothing seemed wrong.` },
    { t: new Date(person.lastSeenDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }), d: `Last seen at ${person.lastSeenPlace}, ${person.city}.` },
    { t: 'Since then', d: `${daysSince(person.lastSeenDate).toLocaleString()} days. ${person.sightings} possible sightings shared by strangers.` },
  ]

  return (
    <>
      <div className="page">
        <Link to="/stories" className="mono faint" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: 32 }}>
          <Icon.back size={14} /> Everyone still missing
        </Link>
        <div className="person-hero">
          <motion.div
            className="person-photo"
            initial={{ clipPath: 'inset(100% 0% 0% 0% round 20px)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 20px)' }}
            transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.div style={{ width: '100%', height: '100%', scale: photoScale }}>
              <Photo src={person.photo} alt={`Portrait of ${person.name}`} />
            </motion.div>
          </motion.div>

          <div className="person-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p className="mono candle">{person.kind === 'FOUND' ? 'Sighted in' : 'Missing from'} {person.city || person.lastSeenPlace || 'Unknown location'}</p>

              <SplitTitle className="h2" text={person.name} delay={0.3} />
              <p className="mono faint">Time apart</p>
              <p className="days-big" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
                <TimeApart since={person.lastSeenDate} />
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                <Magnetic>
                  <button className="btn btn-light" onClick={() => setSeen(true)}>
                    <Icon.eye /> I may have seen {first}
                  </button>
                </Magnetic>
                <button className="btn btn-ghost" onClick={share}>
                  <Icon.share /> {copied ? 'Link copied' : 'Share'}
                </button>
                <button className="btn btn-ghost" onClick={() => setPoster(true)}>
                  <Icon.poster /> Poster
                </button>
                {canDelete && (
                  <button
                    className="btn btn-ghost"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      color: '#ff6b6b',
                      borderColor: 'rgba(255, 107, 107, 0.4)',
                      background: 'rgba(255, 107, 107, 0.08)',
                    }}
                  >
                    {deleting ? 'Deleting…' : 'Delete report'}
                  </button>
                )}
              </div>
            </div>

            <Reveal>
              <div className="letter-card">
                <p>{person.letter}</p>
                <p className="sig">— {person.from}</p>
              </div>
            </Reveal>

            <Reveal>
              <dl className="facts">
                <div className="fact"><dt className="mono faint">Age</dt><dd>{person.age}</dd></div>
                <div className="fact"><dt className="mono faint">Height</dt><dd>{person.height}</dd></div>
                <div className="fact"><dt className="mono faint">Last seen</dt><dd>{person.lastSeenPlace}</dd></div>
                <div className="fact"><dt className="mono faint">Wearing</dt><dd>{person.wearing}</dd></div>
              </dl>
            </Reveal>

            <Reveal>
              <p className="mono faint" style={{ marginBottom: 16 }}>How you might recognise {first}</p>
              <div className="filters">
                {person.traits.map((t) => (
                  <span key={t} className="chip" style={{ display: 'inline-flex', alignItems: 'center' }}>{t}</span>
                ))}
              </div>
            </Reveal>

            <Reveal>
              <p className="mono faint" style={{ marginBottom: 22 }}>The last day</p>
              <div className="timeline">
                {timeline.map((e, i) => (
                  <motion.div
                    key={i}
                    className={`tl-item ${i === timeline.length - 1 ? 'last' : ''}`}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.8 }}
                  >
                    <p className="mono candle">{e.t}</p>
                    <p style={{ marginTop: 4 }}>{e.d}</p>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
      <Footer />
      <SightingModal person={seen ? person : null} onClose={() => setSeen(false)} />
      <PosterModal person={poster ? person : null} onClose={() => setPoster(false)} />
    </>
  )
}

function PosterModal({ person, onClose }: { person: Person | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {person && (
        <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} data-lenis-prevent style={{ overflowY: 'auto' }}>
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, rotate: -3, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}
          >
            <div className="poster" style={{ width: 'min(420px, 92vw)', background: '#f3ece2', color: '#1a120a', borderRadius: 6, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)' }}>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 64, lineHeight: 0.9, textAlign: 'center' }}>MISSING</p>
              <img src={person.photo} alt="" style={{ width: '100%', aspectRatio: '4/4.4', objectFit: 'cover', borderRadius: 4 }} />
              <p style={{ fontFamily: 'var(--serif)', fontSize: 40, lineHeight: 1, textAlign: 'center' }}>{person.name}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <span><b>Age</b> {person.age}</span>
                <span><b>Height</b> {person.height}</span>
                <span style={{ gridColumn: 'span 2' }}><b>Last seen</b> {person.lastSeenPlace}, {person.city} · {new Date(person.lastSeenDate).toLocaleDateString()}</span>
                <span style={{ gridColumn: 'span 2' }}><b>Wearing</b> {person.wearing}</span>
              </div>
              <p style={{ fontSize: 12, borderTop: '1px solid #1a120a33', paddingTop: 10, textAlign: 'center' }}>
                Seen them? Report it at stillsearching.org/{person.id} — family contact details are never printed.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-light" onClick={() => window.print()}><Icon.poster /> Print poster</button>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
