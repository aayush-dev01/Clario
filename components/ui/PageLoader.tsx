'use client'

import { motion } from 'framer-motion'

export function PageLoader({
  title = 'Loading...',
  detail,
  tone = 'dark',
  compact = false,
}: {
  title?: string
  detail?: string
  tone?: 'dark' | 'light'
  compact?: boolean
}) {
  const dark = tone === 'dark'

  return (
    <div
      className={`flex ${compact ? 'min-h-[320px]' : 'min-h-screen'} items-center justify-center px-6 text-center ${
        dark ? 'bg-[#0E0E0C] text-warm-white' : 'bg-warm-white text-ink'
      }`}
    >
      <div className="max-w-[420px]">
        <div className="mx-auto mb-5 flex items-center justify-center gap-2">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className={`h-2.5 w-2.5 rounded-full ${dark ? 'bg-warm-white/70' : 'bg-ink/65'}`}
              animate={{ y: [0, -6, 0], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: index * 0.14 }}
            />
          ))}
        </div>
        <p className={`font-hand text-[28px] ${dark ? 'text-warm-white/80' : 'text-ink/80'}`}>{title}</p>
        {detail ? (
          <p className={`mt-3 text-[14px] leading-[1.7] ${dark ? 'text-warm-white/55' : 'text-ink-muted'}`}>{detail}</p>
        ) : null}
      </div>
    </div>
  )
}
