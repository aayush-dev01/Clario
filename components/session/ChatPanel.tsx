'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/hooks/useWebRTC'

interface ChatPanelProps {
  currentUserId: string
  messages: ChatMessage[]
  onClose: () => void
  onSend: (message: string) => void
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ChatPanel({ currentUserId, messages, onClose, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      return
    }

    onSend(trimmed)
    setDraft('')
  }

  return (
    <div className="flex h-full w-[360px] flex-col bg-[#161614] text-warm-white">
      <div className="flex h-[52px] items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 backdrop-blur-md">
        <h2 className="text-[14px] font-bold">Chat</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-warm-white/70 transition hover:bg-white/10 hover:text-warm-white"
          aria-label="Close chat"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)] px-4 py-4">
        {messages.map((message, index) => {
          const isSelf = message.senderId === currentUserId
          return (
            <div key={`${message.timestamp}-${index}`} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col`}>
                <span className="mb-1 font-hand text-[12px] text-warm-white/50">{message.senderName}</span>
                <div className={`rounded-[14px] px-3 py-2 ${isSelf ? 'bg-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.12)]' : 'bg-transparent'}`}>
                  <p className="text-[14px] leading-[1.5] text-warm-white/90">{message.message}</p>
                </div>
                <span className="mt-1 text-[11px] text-warm-white/30">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="flex h-16 items-center gap-3 border-t border-white/10 bg-[#141412] px-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              send()
            }
          }}
          placeholder="Send a quick note"
          className="h-10 flex-1 rounded-[8px] border border-white/10 bg-white/5 px-3 text-[14px] text-warm-white/90 outline-none placeholder:text-warm-white/30"
        />
        <button
          type="button"
          onClick={send}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/15"
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 11.5L20 4l-4.5 16-3.5-6L3 11.5Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
