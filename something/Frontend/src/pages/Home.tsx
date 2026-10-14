import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMissing, type Person } from '../api'
import { Footer } from '../components/Chrome'
import { Icon, Photo, SplitTitle, TimeApart } from '../components/ui'

export default function Home({ ready }: { ready: boolean }) {
  const [reports, setReports] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listMissing()
      .then(setReports)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load reports.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <section className="hero" style={{ minHeight: '78vh' }}>
        <div className="hero-shade" />
        <div className="hero-content" style={{ opacity: ready ? 1 : 0 }}>
          <div>
            <p className="mono candle" style={{ marginBottom: 22 }}>Community missing-person reports</p>
            <SplitTitle className="hero-title" text="Someone is still waiting to come home." />
          </div>
          <div className="hero-side">
            <p>Every face here belongs to a real report shared by someone looking for help. Your post can help another person recognise them.</p>
            <div className="hero-actions">
              <Link to="/report" className="btn btn-light"><Icon.upload /> Post a report</Link>
              <Link to="/search" className="btn btn-ghost"><Icon.eye /> Search a photo</Link>
            </div>
          </div>
        </div>
        <div className="scroll-cue mono faint">Community reports <i /></div>
      </section>

      <section className="page" style={{ paddingTop: 84 }}>
        <div className="page-head">
          <div>
            <p className="eyebrow mono" style={{ marginBottom: 14 }}>Their stories</p>
            <h2 className="h3">Not cases. <span className="italic candle">People.</span></h2>
          </div>
          <p className="mono faint">{reports.length} reports</p>
        </div>

        {loading && <p className="mono candle" style={{ marginTop: 32 }}>Loading reports…</p>}
        {error && <div className="panel" style={{ marginTop: 28 }}>{error}</div>}
        {!loading && !error && reports.length === 0 && (
          <div className="panel" style={{ marginTop: 28 }}>
            <p>No reports have been posted yet.</p>
            <Link to="/report" className="btn btn-light btn-sm" style={{ marginTop: 18 }}>Post the first report</Link>
          </div>
        )}

        <div className="grid" style={{ marginTop: 32 }}>
          {reports.map((person) => (
            <Link key={person.id} to={`/person/${person.id}`} className="card">
              <div className="card-photo">
                <Photo src={person.photo} alt={`Portrait of ${person.name}`} />
                <div className="days">
                  <span className="mono candle"><TimeApart since={person.lastSeenDate} compact /></span>
                  <span className="mono faint">{person.city}</span>
                </div>
              </div>
              <div>
                <p className="card-name">{person.name}{person.age !== null ? `, ${person.age}` : ''}</p>
                <p className="faint" style={{ fontSize: 14, marginTop: 6 }}>Last seen · {person.lastSeenPlace}</p>
                <p className="muted" style={{ fontSize: 14, marginTop: 10 }}>{person.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </>
  )
}
