import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { reportSeenPerson, type SeenReport } from '../api'
import { Icon } from './ui'

const nowLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const genders = ['Female', 'Male', 'Other', 'Not sure']
const ageRanges = ['Child (0–12)', 'Teen (13–17)', '18–30', '31–50', '51–70', '70+', 'Not sure']
const complexions = ['Fair', 'Wheatish', 'Dusky', 'Dark', 'Not sure']
const disabilityOptions = ['None noticed', 'Speech / hearing', 'Visual', 'Walking / physical', 'Seemed confused or unwell', 'Other']

const empty = (): SeenReport => ({
  reporterName: '', reporterPhone: '', personName: '', gender: '', ageRange: '', complexion: '', clothesColour: '',
  disabilities: [], disabilityNote: '', marks: '', place: '', city: '', seenAt: nowLocal(), notes: '',
})

function Chips({ options, value, onChange, label }: { options: string[]; value: string | string[]; onChange: (v: string) => void; label: string }) {
  const on = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o)
  return (
    <div className="filters" role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o} className={`chip ${on(o) ? 'on' : ''}`} aria-pressed={on(o)} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}

export function SeenForm({ photo, suggestedName }: { photo: File | null; suggestedName?: string }) {
  const [form, setForm] = useState<SeenReport>(empty)
  const [tried, setTried] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [sightingId, setSightingId] = useState('')
  const set = <K extends keyof SeenReport>(k: K, v: SeenReport[K]) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (suggestedName) setForm((f) => (f.personName ? f : { ...f, personName: suggestedName }))
  }, [suggestedName])

  const errors: Partial<Record<keyof SeenReport, string>> = {}
  if (!form.reporterName.trim()) errors.reporterName = 'Please add your name.'
  if (form.reporterPhone.replace(/\D/g, '').length < 10) errors.reporterPhone = 'Please add a valid phone number so a volunteer can call you back.'
  if (!form.place.trim()) errors.place = 'Where did you see them?'
  if (!form.seenAt) errors.seenAt = 'When did you see them?'
  const valid = Object.keys(errors).length === 0
  const err = (k: keyof SeenReport) => tried && errors[k] ? <p className="form-error">{errors[k]}</p> : null

  const toggleDisability = (o: string) => {
    if (o === 'None noticed') return set('disabilities', form.disabilities.includes(o) ? [] : [o])
    const rest = form.disabilities.filter((d) => d !== 'None noticed')
    set('disabilities', rest.includes(o) ? rest.filter((d) => d !== o) : [...rest, o])
  }

  const submit = async () => {
    setTried(true)
    if (!valid) return
    setState('sending')
    try {
      const res = await reportSeenPerson(form, photo)
      setSightingId(res.sightingId)
      setState('sent')
    } catch {
      setState('error')
    }
  }

  return (
    <section className="panel" style={{ padding: 'clamp(20px, 3vw, 36px)', marginTop: 'clamp(40px, 6vw, 80px)' }} aria-labelledby="seen-title">
      <AnimatePresence mode="wait">
        {state === 'sent' ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '24px 0' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="check-icon" style={{ width: 60, height: 60 }}>
              <Icon.check size={28} />
            </motion.div>
            <p className="mono candle">Sighting {sightingId}</p>
            <h2 className="h3">Thank you, {form.reporterName.split(' ')[0]}. You looked twice.</h2>
            <p className="muted" style={{ maxWidth: '52ch' }}>
              A volunteer will compare what you saw with every open case{form.personName ? `, starting with ${form.personName}` : ''}. If it matches, the family is told through us — your number stays private. We may call you to ask a few more questions.
            </p>
            <button className="btn btn-ghost" onClick={() => { setForm(empty()); setTried(false); setState('idle') }}>Report another sighting</button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="eyebrow mono">Tell us what you saw</p>
              <h2 id="seen-title" className="h3">Every small detail can bring someone home.</h2>
              <p className="muted" style={{ maxWidth: '62ch' }}>
                {photo ? 'Your photo will be sent along with these details.' : 'No photo? That’s okay — details alone help too.'} Fill in what you remember; leave the rest blank.
              </p>
            </div>

            <div className="seen-group">
              <p className="mono candle">About you</p>
              <div className="row-2">
                <div className="field">
                  <label className="mono" htmlFor="s-rname">Your name *</label>
                  <input id="s-rname" className="input" value={form.reporterName} onChange={(e) => set('reporterName', e.target.value)} placeholder="e.g. Rakesh Mehta" />
                  {err('reporterName')}
                </div>
                <div className="field">
                  <label className="mono" htmlFor="s-rphone">Your phone *</label>
                  <input id="s-rphone" className="input" inputMode="tel" value={form.reporterPhone} onChange={(e) => set('reporterPhone', e.target.value)} placeholder="+91 98xxx xxxxx" />
                  {err('reporterPhone') ?? <p className="form-hint">Private. Only a verified volunteer sees it.</p>}
                </div>
              </div>
            </div>

            <div className="seen-group">
              <p className="mono candle">About the person you saw</p>
              <div className="field">
                <label className="mono" htmlFor="s-pname">Their name, if you know it</label>
                <input id="s-pname" className="input" value={form.personName} onChange={(e) => set('personName', e.target.value)} placeholder="Did they say their name? Or does it match a poster?" />
              </div>
              <div className="field">
                <span className="mono faint">Gender</span>
                <Chips label="Gender" options={genders} value={form.gender} onChange={(v) => set('gender', form.gender === v ? '' : v)} />
              </div>
              <div className="field">
                <span className="mono faint">Approximate age</span>
                <Chips label="Approximate age" options={ageRanges} value={form.ageRange} onChange={(v) => set('ageRange', form.ageRange === v ? '' : v)} />
              </div>
              <div className="field">
                <span className="mono faint">Skin complexion</span>
                <Chips label="Skin complexion" options={complexions} value={form.complexion} onChange={(v) => set('complexion', form.complexion === v ? '' : v)} />
              </div>
              <div className="field">
                <label className="mono" htmlFor="s-clothes">Clothes & colours</label>
                <input id="s-clothes" className="input" value={form.clothesColour} onChange={(e) => set('clothesColour', e.target.value)} placeholder="e.g. Maroon saree, grey shawl, blue chappals" />
              </div>
              <div className="field">
                <span className="mono faint">Any disability or condition you noticed</span>
                <Chips label="Disability or condition" options={disabilityOptions} value={form.disabilities} onChange={toggleDisability} />
                {form.disabilities.some((d) => d !== 'None noticed') && (
                  <input className="input" value={form.disabilityNote} onChange={(e) => set('disabilityNote', e.target.value)} placeholder="Describe briefly — e.g. couldn’t speak, used a walking stick, kept asking for home" aria-label="Describe the disability or condition" />
                )}
              </div>
              <div className="field">
                <label className="mono" htmlFor="s-marks">Identifying marks</label>
                <textarea id="s-marks" className="textarea" style={{ minHeight: 90 }} value={form.marks} onChange={(e) => set('marks', e.target.value)} placeholder="Scar, mole, tattoo, birthmark, missing tooth, spectacles, mehendi…" />
              </div>
            </div>

            <div className="seen-group">
              <p className="mono candle">Where & when</p>
              <div className="row-2">
                <div className="field">
                  <label className="mono" htmlFor="s-place">Seen at (place) *</label>
                  <input id="s-place" className="input" value={form.place} onChange={(e) => set('place', e.target.value)} placeholder="Station, bus stand, temple, market, road…" />
                  {err('place')}
                </div>
                <div className="field">
                  <label className="mono" htmlFor="s-city">City / area</label>
                  <input id="s-city" className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Dadar, Mumbai" />
                </div>
              </div>
              <div className="row-2">
                <div className="field">
                  <label className="mono" htmlFor="s-time">Date & time *</label>
                  <input id="s-time" type="datetime-local" className="input" value={form.seenAt} max={nowLocal()} onChange={(e) => set('seenAt', e.target.value)} />
                  {err('seenAt')}
                </div>
                <div className="field">
                  <label className="mono" htmlFor="s-notes">Anything else?</label>
                  <input id="s-notes" className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Which way they went, who they were with…" />
                </div>
              </div>
            </div>

            <p className="faint" style={{ fontSize: 13 }}>
              Do not approach or follow anyone if it feels unsafe. If you think someone is in danger right now, call 112 first.
            </p>
            {state === 'error' && <p className="form-error" role="alert">We couldn’t send this. Nothing you typed is lost — please try again.</p>}
            {tried && !valid && <p className="form-error" role="alert">Please fill the highlighted fields above.</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-light" onClick={submit} disabled={state === 'sending'}>
                {state === 'sending' ? 'Sending…' : <>Send sighting <Icon.arrow size={16} /></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
