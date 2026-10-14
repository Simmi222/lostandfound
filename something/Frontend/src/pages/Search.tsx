import { useState } from 'react'
import { Link } from 'react-router-dom'
import { searchByName, searchByPhoto, type Match, type Person } from '../api'

export default function Search() {
  const [query, setQuery] = useState('')
  const [nameResults, setNameResults] = useState<Person[]>([])
  const [photoResults, setPhotoResults] = useState<Match[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const byName = async () => {
    if (!query.trim()) return
    setBusy(true); setError('')
    try { setNameResults(await searchByName(query)) } catch (err) { setError(err instanceof Error ? err.message : 'Search failed.') }
    finally { setBusy(false) }
  }

  const byPhoto = async (file: File) => {
    setBusy(true); setError('')
    try { setPhotoResults(await searchByPhoto(file)) } catch (err) { setError(err instanceof Error ? err.message : 'Photo search failed.') }
    finally { setBusy(false) }
  }

  return (
    <div className="page">
      <p className="eyebrow mono">Search all reports</p>
      <h1 className="h2">A face stayed with you.</h1>
      <div className="panel" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or place" />
        <button className="btn btn-light" onClick={() => void byName()} disabled={busy}>Search name</button>
        <label className="btn btn-ghost">
          Search photo
          <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void byPhoto(e.target.files[0])} />
        </label>
      </div>
      {error && <p className="form-error" style={{ marginTop: 16 }}>{error}</p>}
      {busy && <p className="mono candle" style={{ marginTop: 24 }}>Searching…</p>}
      <div style={{ marginTop: 28, display: 'grid', gap: 14 }}>
        {nameResults.map((person) => (
          <Link key={person.id} to={`/person/${person.id}`} className="card">
            <strong>{person.name}</strong>
            <p className="muted">{person.age ?? 'Age unknown'} · {person.lastSeenPlace}</p>
            <p className="faint">{person.description}</p>
          </Link>
        ))}
        {photoResults.map((match) => (
          <Link key={`${match.report_id}-${match.photo_id}`} to={`/person/${match.report_id}`} className="card">
            <strong>{match.name}</strong>
            <p className="candle">Distance: {match.face_distance.toFixed(4)}</p>
            <p className="muted">{match.age ?? 'Age unknown'} · {match.last_seen_place}</p>
            <p className="faint">{match.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
