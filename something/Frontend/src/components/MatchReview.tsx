import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { requestVerification } from '../api'
import { Icon, Photo } from './ui'

type DisplayPerson = {
  id: string | number
  name: string
  age: number | null
  photo: string
  from: string
  lastSeenPlace: string
  city: string
  lastSeenDate: string
  wearing: string
  traits: string[]
}

export type MatchToReview = {
  person: DisplayPerson
  score: number
  otherPhoto: string
  otherLabel: string // e.g. "Photo you uploaded" or "Found-person report FP-2291"
  otherDetail?: string // where / when the other photo is from
}

// Side-by-side review. A match is never shown as a confirmed identity —
// it is sent to human verifiers, and nobody's contact details are exchanged directly.
export function MatchReview({ match, onClose, onReject }: { match: MatchToReview | null; onClose: () => void; onReject?: () => void }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const close = () => {
    onClose()
    setTimeout(() => setState('idle'), 400)
  }

  return (
    <AnimatePresence>
      {match && (
        <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} data-lenis-prevent style={{ overflowY: 'auto' }}>
          <motion.div
            className="modal"
            style={{ width: 'min(760px, 100%)', margin: 'auto' }}
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Review potential match"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span className="badge new">Potential match — human verification required</span>
              <button className="btn btn-ghost btn-sm" onClick={close} aria-label="Close"><Icon.x size={16} /></button>
            </div>

            {state === 'sent' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', padding: '24px 0' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="check-icon" style={{ width: 56, height: 56 }}>
                  <Icon.check size={26} />
                </motion.div>
                <h3 className="h3">Sent for verification.</h3>
                <p className="muted" style={{ maxWidth: '46ch' }}>
                  A trained volunteer will compare both photos and the details by hand. If it looks right, they will contact {match.person.from.split(',')[0].toLowerCase()} through us. Your phone number and theirs stay private.
                </p>
                <button className="btn btn-ghost" onClick={close}>Close</button>
              </div>
            ) : (
              <>
                <div className="match-pair">
                  <figure>
                    <div className="match-pair-photo"><Photo src={match.otherPhoto} alt={match.otherLabel} /></div>
                    <figcaption className="mono faint">{match.otherLabel}</figcaption>
                    {match.otherDetail && <p className="faint" style={{ fontSize: 13 }}>{match.otherDetail}</p>}
                  </figure>
                  <div className="match-pair-score">
                    <span className="serif candle" style={{ fontSize: 34, lineHeight: 1 }}>{Math.round(match.score * 100)}%</span>
                    <span className="mono faint">similar</span>
                  </div>
                  <figure>
                    <div className="match-pair-photo"><Photo src={match.person.photo.replace('w=900', 'w=500')} alt={`Portrait of ${match.person.name}`} /></div>
                    <figcaption className="mono faint">Missing · {match.person.name}, {match.person.age}</figcaption>
                    <p className="faint" style={{ fontSize: 13 }}>Last seen {match.person.lastSeenPlace}, {match.person.city} · {new Date(match.person.lastSeenDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                  </figure>
                </div>

                <div className="panel" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--candle)', flex: 'none', marginTop: 2 }}><Icon.eye size={18} /></span>
                  <p className="muted" style={{ fontSize: 14 }}>
                    AI matching is an indication, <b style={{ color: 'var(--ink)', fontWeight: 500 }}>not proof of identity</b>. Faces can look alike. Nothing is confirmed until a person checks the photos, the details and, where needed, speaks with the family.
                  </p>
                </div>

                <dl className="facts">
                  <div className="fact"><dt className="mono faint">Wearing when last seen</dt><dd>{match.person.wearing}</dd></div>
                  <div className="fact"><dt className="mono faint">How to recognise</dt><dd>{match.person.traits.join(' · ')}</dd></div>
                </dl>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      onReject?.()
                      close()
                    }}
                  >
                    Not the same person
                  </button>
                  <button
                    className="btn btn-light"
                    disabled={state === 'sending'}
                    onClick={async () => {
                      setState('sending')
                      await requestVerification(String(match.person.id))
                      setState('sent')
                    }}
                  >
                    {state === 'sending' ? 'Sending…' : 'Send for human verification'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
