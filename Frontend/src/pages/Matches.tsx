import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllMatches, absolutePhoto, type SimilarMatchItem, type DirectMatchItem } from '../api'
import { Photo, SplitTitle, StatusBadge } from '../components/ui'
import { Footer } from '../components/Chrome'

export default function Matches() {
  const [similar, setSimilar] = useState<SimilarMatchItem[]>([])
  const [direct, setDirect] = useState<DirectMatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAllMatches()
      .then((data) => {
        setSimilar(data.similar)
        setDirect(data.direct)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load matches.'))
      .finally(() => setLoading(false))
  }, [])

  const totalMatches = similar.length + direct.length

  const getConfidence = (dist: number) => {
    return Math.max(0, Math.min(100, Math.round((1 - Math.min(dist, 1)) * 100)))
  }

  return (
    <>
      <div className="page" style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="page-head" style={{ marginBottom: 40 }}>
          <div>
            <p className="eyebrow mono" style={{ marginBottom: 14 }}>
              Facial Recognition Matches
            </p>
            <SplitTitle className="h2" text="Faces that found each other." />
            <p className="muted" style={{ marginTop: 12, maxWidth: '58ch' }}>
              When report photos share high biometric facial similarity, our AI connects them here for human verification and family reunion.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="mono candle" style={{ fontSize: 18, fontWeight: 700 }}>
              {totalMatches} {totalMatches === 1 ? 'Match' : 'Matches'}
            </span>
          </div>
        </div>

        {loading && <p className="mono candle" style={{ marginTop: 32 }}>Loading matched cases…</p>}
        {error && <div className="panel" style={{ marginTop: 24 }}>{error}</div>}

        {!loading && !error && totalMatches === 0 && (
          <div className="panel" style={{ textAlign: 'center', padding: '60px 24px', marginTop: 32 }}>
            <p className="candle mono" style={{ fontSize: 22, fontWeight: 600 }}>No matched reports yet</p>
            <p className="faint" style={{ marginTop: 10, maxWidth: '48ch', marginInline: 'auto' }}>
              Whenever new photos are uploaded, facial recognition automatically checks across all reports. Matched pairs will appear right here.
            </p>
            <Link to="/report" className="btn btn-light btn-sm" style={{ marginTop: 24 }}>
              Report a missing person
            </Link>
          </div>
        )}

        <div style={{ display: 'grid', gap: 28, marginTop: 28 }}>
          {/* Similar Report Matches */}
          {similar.map((m) => {
            const conf = getConfidence(m.face_distance)
            return (
              <div
                key={`similar-${m.id}`}
                className="panel"
                style={{
                  padding: '24px 28px',
                  borderRadius: 20,
                  borderColor: conf >= 70 ? 'rgba(240, 169, 74, 0.45)' : 'var(--line)',
                  background: 'linear-gradient(145deg, rgba(38, 26, 18, 0.75), rgba(26, 17, 12, 0.95))',
                  boxShadow: conf >= 70 ? '0 0 24px rgba(240, 169, 74, 0.12)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        padding: '4px 14px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: conf >= 70 ? 'rgba(240, 169, 74, 0.2)' : 'rgba(243, 231, 211, 0.1)',
                        color: conf >= 70 ? 'var(--candle)' : 'var(--ink)',
                        border: '1px solid currentColor',
                      }}
                      className="mono"
                    >
                      {conf}% MATCH CONFIDENCE
                    </span>
                    <span className="mono faint" style={{ fontSize: 11 }}>
                      DISTANCE: {m.face_distance.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 20,
                    alignItems: 'center',
                  }}
                >
                  {/* Person 1 */}
                  <Link
                    to={`/person/${m.report_summary.id}`}
                    className="card"
                    style={{
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      padding: 16,
                      background: 'rgba(243, 231, 211, 0.03)',
                      borderRadius: 14,
                    }}
                  >
                    <div style={{ width: 84, height: 104, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <Photo src={absolutePhoto(m.report_summary.photo_url)} alt={m.report_summary.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <p className="mono faint" style={{ fontSize: 11 }}>REPORT #{m.report_summary.id}</p>
                      <strong style={{ fontSize: 18, color: 'var(--ink)' }}>{m.report_summary.name}</strong>
                      <p className="faint" style={{ fontSize: 13, marginTop: 4 }}>
                        {m.report_summary.age !== null ? `${m.report_summary.age} yrs` : 'Age unknown'} · {m.report_summary.last_seen_place}
                      </p>
                    </div>
                  </Link>

                  {/* Divider match indicator */}
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(240, 169, 74, 0.15)',
                        border: '1px solid var(--candle)',
                        color: 'var(--candle)',
                        fontSize: 18,
                      }}
                    >
                      ↔
                    </div>
                    <p className="mono faint" style={{ fontSize: 11, marginTop: 6 }}>BIOMETRIC MATCH</p>
                  </div>

                  {/* Person 2 */}
                  <Link
                    to={`/person/${m.matched_report_summary.id}`}
                    className="card"
                    style={{
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      padding: 16,
                      background: 'rgba(243, 231, 211, 0.03)',
                      borderRadius: 14,
                    }}
                  >
                    <div style={{ width: 84, height: 104, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <Photo src={absolutePhoto(m.matched_report_summary.photo_url)} alt={m.matched_report_summary.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <p className="mono faint" style={{ fontSize: 11 }}>REPORT #{m.matched_report_summary.id}</p>
                      <strong style={{ fontSize: 18, color: 'var(--ink)' }}>{m.matched_report_summary.name}</strong>
                      <p className="faint" style={{ fontSize: 13, marginTop: 4 }}>
                        {m.matched_report_summary.age !== null ? `${m.matched_report_summary.age} yrs` : 'Age unknown'} · {m.matched_report_summary.last_seen_place}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )
          })}

          {/* Direct Matches (Missing <-> Found) */}
          {direct.map((m) => {
            const conf = getConfidence(m.face_distance)
            const missingPhoto = m.missing_report_summary?.photo_url || m.missing_photo_url
            const foundPhoto = m.found_report_summary?.photo_url || m.found_photo_url || missingPhoto

            return (
              <div
                key={`direct-${m.id}`}
                className="panel"
                style={{
                  padding: '24px 28px',
                  borderRadius: 20,
                  borderColor: 'rgba(240, 169, 74, 0.45)',
                  background: 'linear-gradient(145deg, rgba(38, 26, 18, 0.75), rgba(26, 17, 12, 0.95))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        padding: '4px 14px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: 'rgba(240, 169, 74, 0.2)',
                        color: 'var(--candle)',
                        border: '1px solid currentColor',
                      }}
                      className="mono"
                    >
                      {conf}% MATCH CONFIDENCE
                    </span>
                    <span className="mono faint" style={{ fontSize: 11 }}>
                      DISTANCE: {m.face_distance.toFixed(4)}
                    </span>
                  </div>
                  <span className="mono candle" style={{ fontSize: 12, fontWeight: 600 }}>
                    VERIFIED FACE PAIR
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 20,
                    alignItems: 'center',
                  }}
                >
                  {/* Missing Person (Photo + Info) */}
                  <Link
                    to={`/person/${m.missing_report}`}
                    className="card"
                    style={{
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      padding: 16,
                      background: 'rgba(243, 231, 211, 0.03)',
                      borderRadius: 14,
                    }}
                  >
                    <div style={{ width: 92, height: 116, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(240, 169, 74, 0.3)' }}>
                      <Photo
                        src={absolutePhoto(missingPhoto)}
                        alt={m.missing_report_summary?.name || 'Missing person'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="mono faint" style={{ fontSize: 11, color: 'var(--candle)' }}>
                        MISSING PERSON REPORT #{m.missing_report}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 18, color: 'var(--ink)' }}>
                          {m.missing_report_summary?.name || 'Unknown'}
                        </strong>
                        <StatusBadge report={{ kind: 'FOUND', status: 'VERIFIED' }} />
                      </div>
                      <p className="faint" style={{ fontSize: 13, marginTop: 4 }}>
                        {m.missing_report_summary?.age !== null && m.missing_report_summary?.age !== undefined
                          ? `${m.missing_report_summary.age} yrs · `
                          : ''}
                        {m.missing_report_summary?.last_seen_place || 'Location not specified'}
                      </p>
                      <span className="mono faint" style={{ fontSize: 11, marginTop: 6, display: 'inline-block' }}>
                        View profile →
                      </span>
                    </div>
                  </Link>

                  {/* Divider match indicator */}
                  <div style={{ textAlign: 'center', padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(240, 169, 74, 0.15)',
                        border: '1px solid var(--candle)',
                        color: 'var(--candle)',
                        fontSize: 18,
                      }}
                    >
                      ↔
                    </div>
                    <p className="mono faint" style={{ fontSize: 11, marginTop: 2 }}>BIOMETRIC MATCH</p>
                  </div>

                  {/* Found Person (Photo + Info) */}
                  <Link
                    to={`/person/${m.found_report}`}
                    className="card"
                    style={{
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      padding: 16,
                      background: 'rgba(243, 231, 211, 0.03)',
                      borderRadius: 14,
                    }}
                  >
                    <div style={{ width: 92, height: 116, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(159, 216, 181, 0.35)' }}>
                      <Photo
                        src={absolutePhoto(foundPhoto)}
                        alt={m.found_report_summary?.name || 'Found person'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="mono faint" style={{ fontSize: 11, color: 'var(--hope)' }}>
                        FOUND / SIGHTING REPORT #{m.found_report}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 18, color: 'var(--ink)' }}>
                          {m.found_report_summary?.name || 'Unknown'}
                        </strong>
                        <StatusBadge report={{ kind: 'FOUND', status: 'VERIFIED' }} />
                      </div>
                      <p className="faint" style={{ fontSize: 13, marginTop: 4 }}>
                        {m.found_report_summary?.age !== null && m.found_report_summary?.age !== undefined
                          ? `${m.found_report_summary.age} yrs · `
                          : ''}
                        {m.found_report_summary?.last_seen_place || 'Location not specified'}
                      </p>
                      <span className="mono faint" style={{ fontSize: 11, marginTop: 6, display: 'inline-block' }}>
                        View profile →
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <Footer />
    </>
  )
}
