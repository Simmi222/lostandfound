import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard, absolutePhoto, getCurrentUser, deleteReport, type ApiReport } from '../api'
import { Photo, DeleteConfirmModal } from '../components/ui'
import { Footer } from '../components/Chrome'

export default function Dashboard() {
  const [reports, setReports] = useState<ApiReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [reportToDelete, setReportToDelete] = useState<ApiReport | null>(null)
  const currentUser = getCurrentUser()

  const load = async () => {
    setLoading(true)
    try {
      const data = await getDashboard()
      setReports(data.reports)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please sign in first.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (report: ApiReport) => {
    setReportToDelete(report)
  }

  const confirmDelete = async () => {
    if (!reportToDelete) return
    const id = reportToDelete.id
    const kind = reportToDelete.kind
    setDeletingId(id)
    try {
      await deleteReport(id, kind)
      setReports((prev) => prev.filter((r) => r.id !== id))
      setReportToDelete(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete report.')
    } finally {
      setDeletingId(null)
    }
  }


  const canDelete = (r: ApiReport) =>
    Boolean(
      currentUser &&
        (currentUser.role === 'ADMIN' ||
          currentUser.username === r.created_by_username ||
          (r.created_by && currentUser.id === r.created_by))
    )

  useEffect(() => { void load() }, [])

  const getReportPhotoUrl = (report: ApiReport) => {
    if (report.photos?.[0]?.photo) {
      return absolutePhoto(report.photos[0].photo)
    }
    const match = report.name?.match(/report\s+(\d+)/i)
    if (match) {
      const parentId = Number(match[1])
      const parent = reports.find((r) => r.id === parentId)
      if (parent?.photos?.[0]?.photo) {
        return absolutePhoto(parent.photos[0].photo)
      }
    }
    return ''
  }

  return (
    <>
      <div className="page" style={{ maxWidth: 1080, margin: '0 auto' }}>
        <p className="eyebrow mono">Shared dashboard</p>
        <h1 className="h2">Everyone searching together.</h1>
        {error && (
          <div className="panel" style={{ marginTop: 24 }}>
            {error} <Link to="/login" style={{ textDecoration: 'underline', color: 'var(--candle)' }}>Sign in</Link>
          </div>
        )}

        <section className="panel" style={{ marginTop: 36, padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h2 className="h3">All active reports ({reports.length})</h2>
            <Link to="/report" className="btn btn-light btn-sm">
              Post new report
            </Link>
          </div>

          {loading && <p className="mono candle">Loading reports…</p>}

          {!loading && reports.length === 0 && (
            <p className="muted" style={{ padding: '24px 0' }}>No active reports found.</p>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            {reports.map((report) => (
              <Link
                key={report.id}
                to={`/person/${report.id}`}
                className="card"
                style={{
                  display: 'flex',
                  gap: 18,
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderRadius: 14,
                  background: 'rgba(243, 231, 211, 0.03)',
                  transition: 'background 0.2s, transform 0.2s',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 76,
                    borderRadius: 10,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#231810',
                  }}
                >
                  <Photo
                    src={getReportPhotoUrl(report)}
                    alt={report.name || 'Person'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 18, color: 'var(--ink)' }}>{report.name || 'Unknown'}</strong>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: report.kind === 'MISSING' ? 'rgba(240, 169, 74, 0.15)' : 'rgba(159, 216, 181, 0.15)',
                        color: report.kind === 'MISSING' ? 'var(--candle)' : 'var(--hope)',
                      }}
                    >
                      {report.kind}
                    </span>
                    {report.age !== null && (
                      <span className="mono faint" style={{ fontSize: 12 }}>{report.age} yrs</span>
                    )}
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Last seen · {report.last_seen_place || 'Location not specified'}
                  </p>
                  <p
                    className="faint"
                    style={{
                      fontSize: 13,
                      marginTop: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '65ch',
                    }}
                  >
                    {report.description}
                  </p>
                </div>
                {canDelete(report) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void handleDelete(report)
                    }}
                    disabled={deletingId === report.id}
                    className="btn btn-ghost btn-sm"
                    style={{
                      color: '#ff6b6b',
                      borderColor: 'rgba(255, 107, 107, 0.4)',
                      background: 'rgba(255, 107, 107, 0.08)',
                      fontSize: 12,
                      padding: '6px 12px',
                      marginLeft: 12,
                      flexShrink: 0,
                    }}
                    title="Delete this report"
                  >
                    {deletingId === report.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
      <DeleteConfirmModal
        open={Boolean(reportToDelete)}
        name={reportToDelete?.name || 'this report'}
        onClose={() => setReportToDelete(null)}
        onConfirm={confirmDelete}
        busy={Boolean(deletingId)}
      />
      <Footer />
    </>
  )
}

