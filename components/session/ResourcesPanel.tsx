'use client'

import { useState } from 'react'

export interface SharedResourceItem {
  id: string
  title: string
  url: string
  addedByName: string
  createdAt: string
}

interface ResourcesPanelProps {
  resources: SharedResourceItem[]
  onAdd: (value: string) => void
  onClose: () => void
}

function normalizeLabel(resource: SharedResourceItem) {
  return resource.title || resource.url
}

export function ResourcesPanel({ resources, onAdd, onClose }: ResourcesPanelProps) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      return
    }

    onAdd(trimmed)
    setDraft('')
  }

  return (
    <div className="flex h-full w-[360px] flex-col bg-warm-white text-ink">
      <div className="flex h-[52px] items-center justify-between border-b border-ink/10 bg-[#F5F3EE] px-4">
        <h2 className="text-[14px] font-bold">Resources</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-ink/5 hover:text-ink"
          aria-label="Close resources"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex h-14 items-center gap-3 border-b border-ink/10 bg-[#FCFBF8] px-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
          placeholder="Paste a link or type a resource"
          className="h-10 flex-1 rounded-[8px] border border-ink/10 bg-transparent px-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />
        <button type="button" onClick={submit} className="text-[14px] font-medium text-ink-muted transition hover:text-ink">
          Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {resources.length === 0 ? (
          <p className="text-[14px] leading-[1.7] text-ink-muted">
            No resources shared yet. Paste a link or type a resource name.
          </p>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-start gap-3 rounded-[14px] border border-ink/6 bg-[#FCFBF8] p-3 shadow-[0_8px_20px_rgba(26,25,22,0.04)]">
                <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 14L14 10M8.5 16.5l-1.5 1.5a3 3 0 1 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0M15.5 7.5l1.5-1.5a3 3 0 0 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-ink">{normalizeLabel(resource)}</p>
                  <p className="mt-1 text-[12px] text-ink-faint">Shared by {resource.addedByName}</p>
                </div>
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] text-ink-muted transition hover:text-ink"
                  >
                    Open
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
