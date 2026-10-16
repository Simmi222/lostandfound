import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { isLoggedIn, submitReport, submitStrangerReport, type CaseReport, type StrangerReport } from '../api'
import { PhotoDrop } from '../components/FaceScan'
import { Icon, SplitTitle } from '../components/ui'

const steps = ['Their photo', 'Who they are', 'Where they were', 'Your words', 'Review']

const empty: CaseReport = {
  photos: [], name: '', age: '', height: '', city: '', lastSeenPlace: '', lastSeenDate: '', wearing: '', traits: '', letter: '', contactName: '', contactPhone: '',
}

const photoChecks = ['Face detected', 'Photo is clear enough to recognise', 'No heavy filters or obstructions', 'Ready to share with searchers']

export default function Report() {
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') === 'relative' ? 'relative' : searchParams.get('type') === 'stranger' ? 'stranger' : 'choose'
  const [reportTarget, setReportTarget] = useState<'choose' | 'relative' | 'stranger'>(initialType)

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [form, setForm] = useState<CaseReport>(empty)
  const [scanning, setScanning] = useState(false)
  const [checksDone, setChecksDone] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const morePhotos = useRef<HTMLInputElement>(null)
  const mainPhoto = form.photos[0] ?? null
  const [caseId, setCaseId] = useState<string | null>(null)

  const set = <K extends keyof CaseReport>(k: K, v: CaseReport[K]) => setForm((f) => ({ ...f, [k]: v }))


  useEffect(() => {
    if (!mainPhoto) return
    setScanning(true)
    setChecksDone(0)
    const timers = photoChecks.map((_, i) => setTimeout(() => setChecksDone(i + 1), 1300 + i * 550))
    const end = setTimeout(() => setScanning(false), 1300 + photoChecks.length * 550)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(end)
    }
  }, [mainPhoto])

  const canNext = [
    !!mainPhoto && !scanning,
    !!form.name.trim() && !!form.age.trim(),
    !!form.lastSeenPlace.trim() && !!form.city.trim(),
    true,
    !!form.contactName.trim() && !!form.contactPhone.trim(),
  ][step]

  const hints = [
    mainPhoto ? 'Checking the photo…' : 'Add at least one clear photo to continue.',
    'Add their name and age to continue.',
    'Add the city and the place they were last seen to continue.',
    '',
    'Add your name and phone so volunteers can reach you privately.',
  ]

  const addPhotos = (files: FileList | File[]) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const room = 5 - form.photos.length
    if (imgs.length > room) setError(`You can add up to 5 photos. ${room > 0 ? `Only the first ${room} were added.` : ''}`)
    else setError(null)
    if (room > 0) set('photos', [...form.photos, ...imgs.slice(0, room)])
  }

  const go = (to: number) => {
    setDir(to > step ? 1 : -1)
    setStep(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitReport(form, setProgress)
      setCaseId(res.caseId)
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : ''
      setError(
        detail
          ? `We couldn’t send your report: ${detail}`
          : 'We couldn’t send your report. Nothing you entered is lost — please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoggedIn()) {
    return (
      <div className="page" style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
        <p className="eyebrow mono" style={{ marginBottom: 14 }}>Sign in required</p>
        <h1 className="h2" style={{ marginBottom: 20 }}>Please sign in to post a report</h1>
        <p className="muted" style={{ marginBottom: 32, lineHeight: 1.6 }}>
          To create and manage a report and receive updates on potential photo matches, an account is required.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-light">Sign in</Link>
          <Link to="/register" className="btn btn-ghost">Create account</Link>
        </div>
      </div>
    )
  }

  if (caseId) return <Lit name={form.name} caseId={caseId} />

  if (reportTarget === 'choose') {
    return (
      <div className="page" style={{ maxWidth: 860, margin: '20px auto 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p className="eyebrow mono" style={{ marginBottom: 14 }}>Report someone</p>
          <h1 className="h2" style={{ marginBottom: 16 }}>Who would you like to report?</h1>
          <p className="muted" style={{ maxWidth: '54ch', margin: '0 auto', fontSize: 16, lineHeight: 1.6 }}>
            Please select an option. Relative reports are for family members, while Stranger reports are for sighted people on the street.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Option 1: Relative */}
          <div
            className="panel card"
            onClick={() => setReportTarget('relative')}
            style={{
              padding: '36px 30px',
              borderRadius: 20,
              cursor: 'pointer',
              border: '1px solid rgba(240, 169, 74, 0.4)',
              background: 'linear-gradient(145deg, rgba(38, 26, 18, 0.8), rgba(26, 17, 12, 0.95))',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(240, 169, 74, 0.15)', display: 'grid', placeItems: 'center', color: 'var(--candle)' }}>
              <Icon.users size={24} />
            </div>
            <div>
              <h2 className="h3" style={{ fontSize: 22, color: 'var(--ink)' }}>A Relative / Family Member</h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--candle)', display: 'block', marginTop: 4 }}>
                Missing Person Report
              </span>
            </div>
            <p className="faint" style={{ fontSize: 14, lineHeight: 1.6, flex: 1 }}>
              I am searching for a missing loved one (child, parent, spouse, relative). I can share their portraits, physical traits, and words from the heart.
            </p>
            <button type="button" className="btn btn-light btn-sm" style={{ alignSelf: 'flex-start' }}>
              Continue as Relative →
            </button>
          </div>

          {/* Option 2: Stranger */}
          <div
            className="panel card"
            onClick={() => setReportTarget('stranger')}
            style={{
              padding: '36px 30px',
              borderRadius: 20,
              cursor: 'pointer',
              border: '1px solid rgba(159, 216, 181, 0.4)',
              background: 'linear-gradient(145deg, rgba(20, 36, 28, 0.8), rgba(14, 26, 20, 0.95))',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(159, 216, 181, 0.15)', display: 'grid', placeItems: 'center', color: 'var(--hope)' }}>
              <Icon.eye size={24} />
            </div>
            <div>
              <h2 className="h3" style={{ fontSize: 22, color: 'var(--ink)' }}>A Sighted Stranger</h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--hope)', display: 'block', marginTop: 4 }}>
                Sighting / Found Report
              </span>
            </div>
            <p className="faint" style={{ fontSize: 14, lineHeight: 1.6, flex: 1 }}>
              I saw a stranger on the road, station, or public place who looks lost or vulnerable. Photo is mandatory so our biometric AI can identify them against family reports.
            </p>
            <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', borderColor: 'var(--hope)', color: 'var(--hope)' }}>
              Continue as Stranger →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (reportTarget === 'stranger') {
    return <StrangerReportForm onBack={() => setReportTarget('choose')} />
  }

  const first = form.name.trim().split(' ')[0] || 'them'

  return (
    <div className="page">
      <button
        type="button"
        onClick={() => setReportTarget('choose')}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 24, display: 'inline-flex', gap: 8, alignItems: 'center' }}
      >
        <Icon.back size={14} /> Back to options (Relative / Stranger)
      </button>

      <div style={{ maxWidth: 1180, margin: '0 auto 56px' }}>
        <p className="eyebrow mono" style={{ marginBottom: 18 }}>Report someone missing</p>
        <SplitTitle className="h2" text="Let’s bring them home, together." />
      </div>
      <div className="report">

        <nav className="steps" aria-label="Progress">
          {steps.map((s, i) => (
            <button
              key={s}
              className={`step ${i === step ? 'on' : i < step ? 'done' : ''}`}
              onClick={() => i < step && go(i)}
              disabled={i > step}
              aria-current={i === step ? 'step' : undefined}
            >
              <span className="step-dot">{i < step ? <Icon.check size={14} /> : i + 1}</span>
              <span className="label">{s}</span>
            </button>
          ))}
        </nav>

        <div className="report-pane">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: dir * -60, filter: 'blur(6px)' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              {step === 0 && (
                <>
                  <h2 className="h3">Start with their face.</h2>
                  <p className="muted">Choose a recent, clear photo where their face is easy to see — the way a stranger on the street would see them.</p>
                  <PhotoDrop
                    file={mainPhoto}
                    onFile={(f) => (mainPhoto ? set('photos', [f, ...form.photos.slice(1)]) : addPhotos([f]))}
                    scanning={scanning}
                    prompt="Drop a photo here"
                    hint="Or click to choose one. JPG or PNG. Avoid filters, sunglasses or group photos."
                  />
                  {mainPhoto && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p className="mono faint">More photos help matching — different angles, recent ones ({form.photos.length}/5)</p>
                      <div className="thumbs">
                        {form.photos.map((f, i) => (
                          <Thumb
                            key={f.name + f.lastModified + i}
                            file={f}
                            main={i === 0}
                            onRemove={() => set('photos', form.photos.filter((_, k) => k !== i))}
                            onMakeMain={() => set('photos', [f, ...form.photos.filter((_, k) => k !== i)])}
                          />
                        ))}
                        {form.photos.length < 5 && (
                          <button className="thumb-add" onClick={() => morePhotos.current?.click()} aria-label="Add more photos">
                            <Icon.upload size={18} />
                          </button>
                        )}
                        <input
                          ref={morePhotos}
                          type="file"
                          accept="image/*"
                          multiple
                          hidden
                          onChange={(e) => {
                            if (e.target.files) addPhotos(e.target.files)
                            e.target.value = ''
                          }}
                        />
                      </div>
                      <p className="form-hint">The highlighted photo is shown first. Tap another photo to make it the main one.</p>
                    </div>
                  )}
                  {mainPhoto && (
                    <div className="checks">
                      {photoChecks.map((c, i) => (
                        <motion.div key={c} className="check" initial={{ opacity: 0.25 }} animate={{ opacity: i < checksDone ? 1 : 0.25 }}>
                          <span className="check-icon">
                            {i < checksDone ? <Icon.check size={13} /> : <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />}
                          </span>
                          {c}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className="h3">Tell us who they are.</h2>
                  <div className="field">
                    <label className="mono" htmlFor="f-name">Full name</label>
                    <input id="f-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Their name" autoFocus />
                  </div>
                  <div className="row-2">
                    <div className="field">
                      <label className="mono" htmlFor="f-age">Age</label>
                      <input id="f-age" className="input" inputMode="numeric" value={form.age} onChange={(e) => set('age', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 22" />
                    </div>
                    <div className="field">
                      <label className="mono" htmlFor="f-height">Height</label>
                      <input id="f-height" className="input" value={form.height} onChange={(e) => set('height', e.target.value)} placeholder={'e.g. 5\'4"'} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="mono" htmlFor="f-traits">How would someone recognise {first}?</label>
                    <textarea id="f-traits" className="textarea" value={form.traits} onChange={(e) => set('traits', e.target.value)} placeholder="A scar, a tattoo, the way they walk, a habit, a phrase they always say…" />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="h3">Where was {first} last seen?</h2>
                  <div className="row-2">
                    <div className="field">
                      <label className="mono" htmlFor="f-city">City</label>
                      <input id="f-city" className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
                    </div>
                    <div className="field">
                      <label className="mono" htmlFor="f-date">Date and time</label>
                      <input id="f-date" type="datetime-local" className="input" value={form.lastSeenDate} onChange={(e) => set('lastSeenDate', e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="mono" htmlFor="f-place">Exact place</label>
                    <input id="f-place" className="input" value={form.lastSeenPlace} onChange={(e) => set('lastSeenPlace', e.target.value)} placeholder="Station, street, landmark…" />
                  </div>
                  <div className="field">
                    <label className="mono" htmlFor="f-wearing">What were they wearing?</label>
                    <input id="f-wearing" className="input" value={form.wearing} onChange={(e) => set('wearing', e.target.value)} placeholder="Colours, jacket, bag, shoes" />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="h3">If {first} reads this, what do you want them to know?</h2>
                  <p className="muted">This is optional. But strangers stop for a face — and stay for words like these. And sometimes, the person you’re looking for reads them too.</p>
                  <textarea className="textarea letter" style={{ minHeight: 220 }} value={form.letter} onChange={(e) => set('letter', e.target.value)} placeholder="You are not in trouble. We just want you home…" aria-label="Your message to them" />
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="h3">One last thing — how can volunteers reach you?</h2>
                  <p className="muted">Your number stays private. It is never shown publicly or printed on posters; tips are routed to you through us.</p>
                  <div className="row-2">
                    <div className="field">
                      <label className="mono" htmlFor="f-cname">Your name & relation</label>
                      <input id="f-cname" className="input" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="e.g. Sunita, mother" />
                    </div>
                    <div className="field">
                      <label className="mono" htmlFor="f-phone">Phone</label>
                      <input id="f-phone" className="input" inputMode="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+91 …" />
                    </div>
                  </div>
                  <ReviewCard form={form} />
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {submitting && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p className="mono faint">Uploading {form.photos.length} photo{form.photos.length > 1 ? 's' : ''} · {progress}%</p>
              <div className="progress"><motion.div animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut' }} /></div>
            </div>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          {!canNext && hints[step] && <p className="form-hint">{hints[step]}</p>}
          <div className="report-nav">
            <button className="btn btn-ghost" onClick={() => go(step - 1)} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
              <Icon.back size={16} /> Back
            </button>
            {step < steps.length - 1 ? (
              <button className="btn btn-light" disabled={!canNext} onClick={() => go(step + 1)}>
                Continue <Icon.arrow size={16} />
              </button>
            ) : (
              <button className="btn btn-light" disabled={!canNext || submitting} onClick={submit}>
                {submitting ? 'Posting report…' : 'Post report'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewCard({ form }: { form: CaseReport }) {
  const [url, setUrl] = useState<string | null>(null)
  const main = form.photos[0]
  useEffect(() => {
    if (!main) return
    const u = URL.createObjectURL(main)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [main])
  return (
    <div className="panel" style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr)', gap: 18, alignItems: 'center' }}>
      {url && <img src={url} alt="" style={{ width: 110, height: 140, objectFit: 'cover', borderRadius: 12 }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <p className="serif" style={{ fontSize: 30, lineHeight: 1 }}>{form.name}{form.age && `, ${form.age}`}</p>
        <p className="muted" style={{ fontSize: 14 }}>Last seen · {form.lastSeenPlace}, {form.city}</p>
        {form.wearing && <p className="faint" style={{ fontSize: 14 }}>Wearing · {form.wearing}</p>}
        {form.letter && <p className="serif italic" style={{ fontSize: 18, marginTop: 6 }}>“{form.letter}”</p>}
        <p className="mono faint" style={{ marginTop: 4 }}>{form.photos.length} photo{form.photos.length > 1 ? 's' : ''} · ready for matching</p>
      </div>
    </div>
  )
}

function Thumb({ file, main, onRemove, onMakeMain }: { file: File; main: boolean; onRemove: () => void; onMakeMain: () => void }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return (
    <motion.div className={`thumb ${main ? 'main' : ''}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
      {url && (
        <button onClick={onMakeMain} style={{ width: '100%', height: '100%' }} aria-label={main ? 'Main photo' : 'Make this the main photo'}>
          <img src={url} alt="" />
        </button>
      )}
      <button className="thumb-x" onClick={onRemove} aria-label="Remove photo"><Icon.x size={12} /></button>
    </motion.div>
  )
}

function Lit({ name, caseId }: { name: string; caseId: string }) {
  const first = name.trim().split(' ')[0]
  return (
    <div className="page" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="lit">
        <motion.div className="big-candle" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <motion.div className="glow" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, duration: 2 }} />
          <div className="wax" />
          <div className="wick" />
          <motion.div className="flame" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.9, duration: 0.8, type: 'spring' }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
          <p className="mono candle">Case {caseId}</p>
          <h1 className="h2" style={{ maxWidth: '14ch' }}>A light is on for {first}.</h1>
          <p className="lede">
            {first}’s face is now in front of people who are looking. You are not searching alone anymore. We’ll notify you the moment someone reports a sighting.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            <Link to="/dashboard" className="btn btn-light">Open your dashboard <Icon.arrow size={16} /></Link>
            <Link to="/stories" className="btn btn-ghost">See the others still waiting</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function StrangerReportForm({ onBack }: { onBack: () => void }) {
  const [photo, setPhoto] = useState<File | null>(null)
  const [strangerName, setStrangerName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [whereSeen, setWhereSeen] = useState('')
  const [city, setCity] = useState('')
  const [wearing, setWearing] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [marks, setMarks] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!photo) {
      setError('Stranger photo is mandatory for biometric face matching.')
      return
    }
    if (!strangerName.trim()) {
      setError("Stranger's name is mandatory (type 'Unknown' if not known).")
      return
    }
    if (!contactPhone.trim()) {
      setError('Contact phone number is mandatory so volunteers can reach you.')
      return
    }
    if (!whereSeen.trim()) {
      setError('Location where they were seen is mandatory.')
      return
    }

    setSubmitting(true)
    try {
      const res = await submitStrangerReport({
        photo,
        strangerName,
        contactPhone,
        whereSeen,
        city,
        wearing,
        height,
        age,
        gender,
        marks,
        details,
      })
      setCaseId(res.caseId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit stranger report.')
    } finally {
      setSubmitting(false)
    }
  }

  if (caseId) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div className="panel" style={{ maxWidth: 640, padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(159, 216, 181, 0.15)', display: 'grid', placeItems: 'center', color: 'var(--hope)' }}>
            <Icon.check size={32} />
          </div>
          <p className="mono candle">{caseId}</p>
          <h2 className="h3">Thank you for reporting this sighting.</h2>
          <p className="muted" style={{ lineHeight: 1.6 }}>
            The stranger photo has been submitted and facial recognition is currently comparing it against all missing family reports. If a match is verified, the family and local coordinators will be alerted.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Link to="/dashboard" className="btn btn-light btn-sm">View in Dashboard</Link>
            <Link to="/matches" className="btn btn-ghost btn-sm">View Matched Cases</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 780, margin: '0 auto' }}>
      <button type="button" onClick={onBack} className="btn btn-ghost btn-sm" style={{ marginBottom: 24, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <Icon.back size={14} /> Back to options (Relative / Stranger)
      </button>

      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow mono" style={{ color: 'var(--hope)', marginBottom: 12 }}>Stranger Sighting Report</p>
        <SplitTitle className="h2" text="Help a stranger find their way home." />
        <p className="muted" style={{ marginTop: 12, maxWidth: '58ch' }}>
          Stranger photo, name/alias, contact number, and location are mandatory. All other details like clothes and height are optional.
        </p>
      </div>

      <form className="panel" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '32px' }}>
        {error && <p className="form-error">{error}</p>}

        {/* 1. PHOTO (MANDATORY) */}
        <div className="field">
          <label className="mono" style={{ color: 'var(--candle)' }}>
            1. Stranger’s Photo * (Mandatory for Face Matching)
          </label>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <label
              className="btn btn-light btn-sm"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Icon.camera size={16} /> Choose Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
            {photo && (
              <span className="mono faint" style={{ fontSize: 12 }}>
                {photo.name} ({(photo.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>
          {previewUrl && (
            <div style={{ marginTop: 14, width: 140, height: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--candle)' }}>
              <img src={previewUrl} alt="Stranger preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>
            A front-facing, unblurred photo gives the highest facial recognition accuracy.
          </p>
        </div>

        {/* 2. STRANGER'S NAME (MANDATORY) */}
        <div className="field">
          <label className="mono" htmlFor="stranger-name" style={{ color: 'var(--candle)' }}>
            2. Stranger’s Name * (Mandatory)
          </label>
          <input
            id="stranger-name"
            className="input"
            value={strangerName}
            onChange={(e) => setStrangerName(e.target.value)}
            placeholder="Name they gave, or type 'Unknown'"
            required
          />
        </div>

        {/* 3. REPORTER'S PHONE NUMBER (MANDATORY) */}
        <div className="field">
          <label className="mono" htmlFor="contact-phone" style={{ color: 'var(--candle)' }}>
            3. Contact Phone Number * (Mandatory)
          </label>
          <input
            id="contact-phone"
            className="input"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            required
          />
          <p className="faint" style={{ fontSize: 12, marginTop: 4 }}>
            Kept confidential. Only used by volunteers/authorities if a match is confirmed.
          </p>
        </div>

        {/* 4. WHERE YOU SAW THEM (MANDATORY) */}
        <div className="field">
          <label className="mono" htmlFor="where-seen" style={{ color: 'var(--candle)' }}>
            4. Where Did You See Them? * (Mandatory)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <input
              id="where-seen"
              className="input"
              value={whereSeen}
              onChange={(e) => setWhereSeen(e.target.value)}
              placeholder="Landmark, station, market, street"
              required
            />
            <input
              id="stranger-city"
              className="input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City / Area (e.g. Mumbai, Dadar)"
            />
          </div>
        </div>

        {/* OPTIONAL FIELDS SECTION */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
          <p className="mono faint" style={{ marginBottom: 14 }}>
            Optional Information (Fill if you remember, leave blank if unsure)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div className="field">
              <label className="mono faint" htmlFor="stranger-wearing">What were they wearing? (Optional)</label>
              <input
                id="stranger-wearing"
                className="input"
                value={wearing}
                onChange={(e) => setWearing(e.target.value)}
                placeholder="e.g. Blue shirt, grey pants, no footwear"
              />
            </div>
            <div className="field">
              <label className="mono faint" htmlFor="stranger-height">Estimated height (Optional)</label>
              <input
                id="stranger-height"
                className="input"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 5'6&quot; or Medium"
              />
            </div>
            <div className="field">
              <label className="mono faint" htmlFor="stranger-age">Estimated age (Optional)</label>
              <input
                id="stranger-age"
                className="input"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
            <div className="field">
              <label className="mono faint" htmlFor="stranger-gender">Gender (Optional)</label>
              <select
                id="stranger-gender"
                className="input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select (optional)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Unknown">Not sure</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ marginTop: 14 }}>
            <label className="mono faint" htmlFor="stranger-marks">Identifying marks / conditions (Optional)</label>
            <input
              id="stranger-marks"
              className="input"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder="e.g. Scar on forehead, limp, seemed confused"
            />
          </div>

          <div className="field" style={{ marginTop: 14 }}>
            <label className="mono faint" htmlFor="stranger-details">More details / notes (Optional)</label>
            <textarea
              id="stranger-details"
              className="textarea"
              style={{ minHeight: 80 }}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Which way did they go, were they alone, what time of day…"
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="btn btn-light" disabled={submitting}>
            {submitting ? 'Submitting & Matching…' : 'Submit Stranger Report'}
          </button>
        </div>
      </form>
    </div>
  )
}

