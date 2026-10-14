import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { reportSighting } from '../api'
import { Icon } from './ui'

type DisplayPerson = { id: string | number; name: string; photo: string; from: string }

export function SightingModal({ person, onClose }: { person: DisplayPerson | null; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const close = () => {
    onClose()
    setTimeout(() => {
      setNote('')
      setState('idle')
    }, 400)
  }

  return (
    <AnimatePresence>
      {person && (
        <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} data-lenis-prevent>
          <motion.div
            className="modal"
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Report a sighting of ${person.name}`}
          >
            {state === 'sent' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="check-icon" style={{ width: 56, height: 56 }}>
                  <Icon.check size={26} />
                </motion.div>
                <h3 className="h3">Thank you for looking.</h3>
                <p className="muted">
                  Your sighting has been sent to {person.from.split(',')[0].toLowerCase()} and the case volunteers. You may have just changed everything.
                </p>
                <button className="btn btn-ghost" onClick={close}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <img src={person.photo} alt="" style={{ width: 64, height: 80, objectFit: 'cover', borderRadius: 10 }} />
                  <div>
                    <p className="mono faint">I may have seen</p>
                    <h3 className="h3">{person.name}</h3>
                  </div>
                </div>
                <div className="field">
                  <label className="mono" htmlFor="sighting-note">Where, when, what did you notice?</label>
                  <textarea
                    id="sighting-note"
                    className="textarea"
                    placeholder="Near the bus stand on MG Road, around 6pm today. Wearing a grey jacket…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <p className="faint" style={{ fontSize: 13 }}>
                  Do not approach if it feels unsafe. If you believe they are in danger right now, call emergency services first.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={close}>Cancel</button>
                  <button
                    className="btn btn-light"
                    disabled={!note.trim() || state === 'sending'}
                    onClick={async () => {
                      setState('sending')
                      await reportSighting(String(person.id), note)
                      setState('sent')
                    }}
                  >
                    {state === 'sending' ? 'Sending…' : 'Send sighting'}
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
