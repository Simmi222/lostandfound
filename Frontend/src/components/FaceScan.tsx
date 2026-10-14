import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './ui'

// Visual-only "scan" over an uploaded photo. Real detection lives on the backend.
const landmarks = [
  [38, 40], [62, 40], [50, 52], [42, 64], [50, 66], [58, 64], [30, 46], [70, 46], [50, 30], [36, 74], [64, 74], [50, 80],
]

export function ScanOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div className="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="scan-line"
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="scan-box"
            initial={{ left: '20%', top: '15%', width: '60%', height: '70%', opacity: 0 }}
            animate={{ left: '33%', top: '18%', width: '34%', height: '58%', opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <i /><i /><i /><i />
          </motion.div>
          {landmarks.map(([x, y], i) => (
            <motion.span
              key={i}
              className="scan-dot"
              style={{ left: `${33 + (x / 100) * 34}%`, top: `${18 + (y / 100) * 58}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.6, 1], opacity: [0, 1, 0.8] }}
              transition={{ delay: 1.2 + i * 0.08, duration: 0.6 }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function PhotoDrop({
  file,
  onFile,
  scanning,
  prompt,
  hint,
}: {
  file: File | null
  onFile: (f: File) => void
  scanning: boolean
  prompt: string
  hint: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) onFile(f)
  }

  return (
    <div
      className={`drop ${over ? 'over' : ''}`}
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      aria-label={prompt}
    >
      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
      {url ? (
        <motion.div className="drop-preview" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }}>
          <img src={url} alt="Uploaded photo preview" />
          <ScanOverlay active={scanning} />
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 24 }}>
          <motion.div
            animate={{ y: over ? -8 : [0, -6, 0] }}
            transition={over ? { duration: 0.3 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(242,181,107,0.12)', color: 'var(--candle)' }}
          >
            <Icon.upload size={26} />
          </motion.div>
          <p className="serif" style={{ fontSize: 30, lineHeight: 1.1 }}>{prompt}</p>
          <p className="faint" style={{ fontSize: 14, maxWidth: 380 }}>{hint}</p>
        </div>
      )}
    </div>
  )
}
