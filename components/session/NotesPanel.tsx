'use client'

import { useEffect, useMemo, useState } from 'react'

interface NotesPanelProps {
  sessionId: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

export function NotesPanel({ sessionId, value, onChange, onClose }: NotesPanelProps) {
  const [saveLabel, setSaveLabel] = useState('Saved')
  const wordCount = useMemo(() => value.trim().split(/\s+/).filter(Boolean).length, [value])

  useEffect(() => {
    const key = `session-notes-${sessionId}`
    setSaveLabel('Saving...')

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(key, value)
      setSaveLabel('Saved')
    }, 450)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [sessionId, value])

  return (
    <div className="flex h-full w-[360px] flex-col bg-warm-white text-ink">
      <div className="flex h-[52px] items-center justify-between border-b border-ink/10 bg-[#F5F3EE] px-4">
        <h2 className="text-[14px] font-bold">Session notes</h2>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-ink-muted">{saveLabel}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-ink/5 hover:text-ink"
            aria-label="Close notes"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Take notes during your session. They will appear in your summary afterwards."
        className="h-[calc(100vh-100px)] w-full resize-none bg-transparent px-5 py-5 text-[15px] leading-[1.8] text-ink outline-none placeholder:text-ink-faint"
      />

      <div className="flex h-12 items-center justify-between border-t border-ink/10 bg-[#FCFBF8] px-4 text-[12px] text-ink-faint">
        <span>{wordCount} words</span>
      </div>
    </div>
  )
}
