import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard, getSimilarMatches, type ApiReport } from '../api'

export default function Dashboard() {
  const [reports, setReports] = useState<ApiReport[]>([])
  const [matches, setMatches] = useState<unknown[]>([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [data, similar] = await Promise.all([getDashboard(), getSimilarMatches()])
      setReports(data.reports)
      setMatches([...data.matches, ...similar])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please sign in first.')
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="page">
      <p className="eyebrow mono">Shared dashboard</p>
      <h1 className="h2">Everyone searching together.</h1>
      {error && <div className="panel" style={{ marginTop: 24 }}>{error} <Link to="/login">Sign in</Link></div>}
      <div className="grid-2" style={{ marginTop: 36, alignItems: 'start' }}>
        <section className="panel">
          <h2 className="h3">All active reports ({reports.length})</h2>
          {reports.map((report) => (
            <Link key={report.id} to={`/person/${report.id}`} className="card" style={{ display: 'block', marginTop: 14 }}>
              <strong>{report.name || 'Unknown'}</strong>
              <p className="muted">{report.kind} · {report.last_seen_place || 'Location not specified'}</p>
              <p className="faint">{report.description}</p>
            </Link>
          ))}
        </section>
        <section className="panel">
          <h2 className="h3">Potential matches ({matches.length})</h2>
          {matches.length === 0 && <p className="muted" style={{ marginTop: 14 }}>No candidate matches yet.</p>}
          <Link to="/search" className="btn btn-light btn-sm" style={{ marginTop: 20 }}>Search a photo</Link>
        </section>
      </div>
    </div>
  )
}
