import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { isLoggedIn, searchByName, searchByPhoto, absolutePhoto, type Match, type Person } from '../api'
import { Photo } from '../components/ui'

export default function Search() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [nameResults, setNameResults] = useState<Person[]>([])
  const [photoResults, setPhotoResults] = useState<Match[]>([])
  const [photoMessage, setPhotoMessage] = useState('')
  const [searchedName, setSearchedName] = useState(false)
  const [searchedPhoto, setSearchedPhoto] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const authenticated = isLoggedIn()

  const byName = async () => {
    if (!authenticated) {
      setError('Please sign in first to search.')
      return
    }
    if (!query.trim()) return
    setBusy(true)
    setError('')
    setSearchedName(true)
    setSearchedPhoto(false)
    setPhotoResults([])
    try {
      const results = await searchByName(query)
      setNameResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setBusy(false)
    }
  }

  const byPhoto = async (file: File) => {
    if (!authenticated) {
      setError('Please sign in first to search.')
      return
    }
    setBusy(true)
    setError('')
    setPhotoMessage('')
    setSearchedPhoto(true)
    setSearchedName(false)
    setNameResults([])
    try {
      const data = await searchByPhoto(file)
      setPhotoResults(data.matches)
      setPhotoMessage(data.message || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo search failed.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const file = (location.state as { photoFile?: File } | null)?.photoFile
    if (file) {
      void byPhoto(file)
    }
  }, [location.state])

  return (
    <div className="page">
      <p className="eyebrow mono">Search all reports</p>
      <h1 className="h2">A face stayed with you.</h1>

      {!authenticated && (
        <div
          className="panel"
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            borderColor: 'rgba(235, 175, 110, 0.35)',
            background: 'rgba(235, 175, 110, 0.05)',
          }}
        >
          <div>
            <strong style={{ fontSize: 16 }}>Sign in required to search</strong>
            <p className="faint" style={{ fontSize: 14, marginTop: 4 }}>
              Please log in to your account to search community reports by photo or name.
            </p>
          </div>
          <Link to="/login" className="btn btn-light btn-sm">
            Sign in
          </Link>
        </div>
      )}

      <div className="panel" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void byName()}
          placeholder="Search by name or place"
        />
        <button className="btn btn-light" onClick={() => void byName()} disabled={busy}>
          Search name
        </button>
        <label className={`btn btn-ghost ${busy ? 'disabled' : ''}`}>
          Search photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && void byPhoto(e.target.files[0])}
          />
        </label>
      </div>

      {error && <p className="form-error" style={{ marginTop: 16 }}>{error}</p>}
      {busy && <p className="mono candle" style={{ marginTop: 24 }}>Searching records…</p>}

      {/* When no match found */}
      {!busy && !error && searchedPhoto && photoResults.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: '40px 24px', marginTop: 28 }}>
          <p className="candle mono" style={{ fontSize: 20, fontWeight: 600 }}>
            {photoMessage || 'User not found'}
          </p>
          <p className="faint" style={{ marginTop: 8 }}>
            {photoMessage
              ? 'Please try uploading a clearer, front-facing photo without obstruction.'
              : 'No matching person found for the uploaded photo in our database.'}
          </p>
        </div>
      )}

      {!busy && !error && searchedName && nameResults.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: '40px 24px', marginTop: 28 }}>
          <p className="candle mono" style={{ fontSize: 20, fontWeight: 600 }}>User not found</p>
          <p className="faint" style={{ marginTop: 8 }}>
            No matching reports found for &ldquo;{query}&rdquo;.
          </p>
        </div>
      )}

      {/* Results */}
      <div style={{ marginTop: 28, display: 'grid', gap: 14 }}>
        {nameResults.map((person) => (
          <Link
            key={person.id}
            to={`/person/${person.id}`}
            className="card"
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              padding: '14px 18px',
              borderRadius: 14,
            }}
          >
            <div
              style={{
                width: 68,
                height: 82,
                borderRadius: 10,
                overflow: 'hidden',
                flexShrink: 0,
                background: '#231810',
              }}
            >
              <Photo
                src={absolutePhoto(person.photo)}
                alt={person.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 18, color: 'var(--ink)' }}>{person.name}</strong>
                {person.age !== null && (
                  <span className="mono faint" style={{ fontSize: 12 }}>{person.age} yrs</span>
                )}
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Last seen · {person.lastSeenPlace}
              </p>
              <p
                className="faint"
                style={{
                  fontSize: 13,
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {person.description}
              </p>
            </div>
          </Link>
        ))}

        {photoResults.map((match) => (
          <Link
            key={`${match.report_id}-${match.photo_id}`}
            to={`/person/${match.report_id}`}
            className="card"
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              padding: '14px 18px',
              borderRadius: 14,
              border: '1px solid rgba(240, 169, 74, 0.3)',
              background: 'linear-gradient(145deg, rgba(38, 26, 18, 0.6), rgba(26, 17, 12, 0.85))',
            }}
          >
            <div
              style={{
                width: 68,
                height: 82,
                borderRadius: 10,
                overflow: 'hidden',
                flexShrink: 0,
                background: '#231810',
              }}
            >
              <Photo
                src={absolutePhoto(match.photo_url)}
                alt={match.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 18, color: 'var(--ink)' }}>{match.name}</strong>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(240, 169, 74, 0.18)',
                    color: 'var(--candle)',
                    border: '1px solid rgba(240, 169, 74, 0.35)',
                    fontWeight: 600,
                  }}
                >
                  {((1 - Math.min(match.face_distance, 1)) * 100).toFixed(0)}% MATCH CONFIDENCE
                </span>
                {match.age !== null && (
                  <span className="mono faint" style={{ fontSize: 12 }}>{match.age} yrs</span>
                )}
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Last seen · {match.last_seen_place}
              </p>
              <p
                className="faint"
                style={{
                  fontSize: 13,
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {match.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
