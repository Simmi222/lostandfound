import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { listMissing } from '../api'
import type { Person } from '../api'
import { Photo, SplitTitle, TimeApart } from '../components/ui'
import { Footer } from '../components/Chrome'

const ageBands = [
  { key: 'all', label: 'Everyone', test: () => true },
  { key: 'child', label: 'Children', test: (p: Person) => p.age !== null && p.age < 13 },
  { key: 'young', label: '13 – 25', test: (p: Person) => p.age !== null && p.age >= 13 && p.age <= 25 },
  { key: 'adult', label: '26 – 59', test: (p: Person) => p.age !== null && p.age > 25 && p.age < 60 },
  { key: 'elder', label: '60+', test: (p: Person) => p.age !== null && p.age >= 60 },
]

export default function Stories() {
  const [all, setAll] = useState<Person[]>([])
  const [q, setQ] = useState('')
  const [band, setBand] = useState('all')

  useEffect(() => {
    listMissing().then(setAll)
  }, [])

  const shown = useMemo(() => {
    const test = ageBands.find((b) => b.key === band)!.test
    const needle = q.trim().toLowerCase()
    return all.filter((p) => test(p) && (!needle || `${p.name} ${p.city} ${p.lastSeenPlace}`.toLowerCase().includes(needle)))
  }, [all, q, band])

  return (
    <>
      <div className="page">
        <div className="page-head">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p className="eyebrow mono">{all.length} people still waiting to come home</p>
            <SplitTitle className="h2" text="Every one of them is someone’s everything." />
          </div>
        </div>
        <div className="page-head" style={{ marginBottom: 36 }}>
          <div className="filters" role="group" aria-label="Filter by age">
            {ageBands.map((b) => (
              <button key={b.key} className={`chip ${band === b.key ? 'on' : ''}`} onClick={() => setBand(b.key)}>
                {b.label}
              </button>
            ))}
          </div>
          <input className="search-input" placeholder="Search a name or a city…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by name or city" />
        </div>

        <motion.div className="grid" layout>
          <AnimatePresence mode="popLayout">
            {shown.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
                transition={{ duration: 0.8, delay: Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link to={`/person/${p.id}`} className="card">
                  <div className="card-photo">
                    <Photo src={p.photo.replace('w=900', 'w=600')} alt={`Portrait of ${p.name}`} />
                    <div className="days">
                      <span className="mono candle"><TimeApart since={p.lastSeenDate} compact /></span>
                      <span className="mono faint">{p.city}</span>
                    </div>
                  </div>
                  <div>
                    <p className="card-name">{p.name}, {p.age}</p>
                    <p className="faint" style={{ fontSize: 14, marginTop: 6 }}>Last seen · {p.lastSeenPlace}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {all.length > 0 && shown.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', padding: '80px 0' }}>
            No one matches that search. That doesn’t mean they aren’t out there.
          </p>
        )}
      </div>
      <Footer />
    </>
  )
}
