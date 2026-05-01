'use client'

import { useUser } from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VideoErrorBoundary } from '@/components/VideoErrorBoundary'
import { ChatPanel } from '@/components/session/ChatPanel'
import { NotesPanel } from '@/components/session/NotesPanel'
import { ResourcesPanel, type SharedResourceItem } from '@/components/session/ResourcesPanel'
import { WhiteboardPanel } from '@/components/session/WhiteboardPanel'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useWhiteboard } from '@/hooks/useWhiteboard'
import { trpc } from '@/lib/trpc/client'

type ActivePanel = 'chat' | 'whiteboard' | 'notes' | 'resources' | null

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function inferResource(value: string, addedByName: string): SharedResourceItem {
  const isUrl = /^https?:\/\//i.test(value)
  return {
    id: crypto.randomUUID(),
    title: value,
    url: isUrl ? value : '',
    addedByName,
    createdAt: new Date().toISOString(),
  }
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E0E0C] px-6 text-center">
      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] px-8 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-warm-white/75" />
        </div>
        <p className="font-hand text-[24px] text-warm-white/70">{label}</p>
      </div>
    </div>
  )
}

function SessionState({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string
  detail?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E0E0C] px-6 text-center">
      <div className="max-w-[420px] rounded-[28px] border border-white/8 bg-white/[0.03] px-8 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <p className="font-hand text-[28px] text-warm-white/75">{title}</p>
        {detail ? <p className="mt-3 text-[14px] leading-[1.7] text-warm-white/55">{detail}</p> : null}
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-[13px] font-medium text-warm-white transition hover:bg-white/15"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ConnectionQuality({ latencyMs }: { latencyMs: number | null }) {
  const activeBars = latencyMs === null ? 1 : latencyMs < 100 ? 3 : latencyMs < 200 ? 2 : 1

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-md">
      <svg viewBox="0 0 20 16" className="h-4 w-5" fill="none">
        {[0, 1, 2].map((index) => {
          const height = [5, 9, 13][index]
          return (
            <rect
              key={index}
              x={index * 6 + 1}
              y={15 - height}
              width="4"
              height={height}
              rx="1.5"
              fill="#F9F8F6"
              opacity={index < activeBars ? 0.92 : 0.22}
            />
          )
        })}
      </svg>
      <span className="text-[11px] text-warm-white/60">{latencyMs ? `${Math.round(latencyMs)}ms` : 'Checking'}</span>
    </div>
  )
}

function DotLoader() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-warm-white/60"
          style={{ animationDelay: `${index * 0.2}s` }}
        />
      ))}
    </span>
  )
}

function StatusBadge({
  title,
  detail,
  tone = 'neutral',
}: {
  title: string
  detail?: string
  tone?: 'neutral' | 'warning' | 'danger'
}) {
  const toneClasses =
    tone === 'danger'
      ? 'border-[#FF8A8A]/30 bg-[#3C1717]/70 text-[#FFE3E3]'
      : tone === 'warning'
        ? 'border-[#E5D2A0]/25 bg-[#2A2415]/70 text-[#F4E6BF]'
        : 'border-white/10 bg-black/25 text-warm-white'

  return (
    <div
      className={`max-w-[360px] rounded-[22px] border px-6 py-5 text-center shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl ${toneClasses}`}
    >
      <p className="font-hand text-[28px] leading-none">{title}</p>
      {detail ? <p className="mt-3 text-[14px] leading-[1.7] text-inherit/75">{detail}</p> : null}
    </div>
  )
}

function SessionRoom({
  roomId,
  sessionRecordId,
  userId,
  userName,
  role,
}: {
  roomId: string
  sessionRecordId: string
  userId: string
  userName: string
  role: 'learner' | 'teacher'
}) {
  const router = useRouter()
  const startM = trpc.sessions.start.useMutation()
  const endM = trpc.sessions.end.useMutation()

  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [notes, setNotes] = useState('')
  const [resources, setResources] = useState<SharedResourceItem[]>([])

  const videoContainerRef = useRef<HTMLDivElement>(null)
  const localEndRef = useRef(false)
  const sessionStartedRef = useRef(false)

  const handleRemoteSessionEnded = useCallback(() => {
    if (localEndRef.current) {
      return
    }
    router.push(`/summary/${sessionRecordId}`)
  }, [router, sessionRecordId])

  const {
    localVideoRef,
    remoteVideoRef,
    socketRef,
    socketInstance,
    peerConnectionRef,
    connectionStatus,
    connectionError,
    isMuted,
    isCameraOff,
    isSharingScreen,
    chatMessages,
    peerInfo,
    participantCount,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    sendChatMessage,
    endSession,
  } = useWebRTC({
    roomId,
    userId,
    userName,
    role,
    onSessionEnded: handleRemoteSessionEnded,
  })

  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    currentColor,
    setCurrentColor,
    brushSize,
    setBrushSize,
  } = useWhiteboard({ socketRef, roomId })

  useEffect(() => {
    const saved = window.localStorage.getItem(`session-notes-${roomId}`)
    if (saved) {
      setNotes(saved)
    }
  }, [roomId])

  useEffect(() => {
    if (!socketInstance) {
      return
    }

    const handleSharedResource = (resource: SharedResourceItem) => {
      setResources((previous) => [...previous, resource])
    }

    socketInstance.on('resource-shared', handleSharedResource)
    return () => {
      socketInstance.off('resource-shared', handleSharedResource)
    }
  }, [socketInstance])

  useEffect(() => {
    if (activePanel === 'chat') {
      setUnreadMessages(0)
      return
    }

    const latestMessage = chatMessages[chatMessages.length - 1]
    if (latestMessage && latestMessage.senderId !== userId) {
      setUnreadMessages((count) => count + 1)
    }
  }, [activePanel, chatMessages, userId])

  useEffect(() => {
    if (activePanel) {
      setControlsVisible(true)
      return
    }

    let timeoutId = window.setTimeout(() => {
      setControlsVisible(false)
    }, 4000)

    const handleMouseMove = () => {
      setControlsVisible(true)
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        setControlsVisible(false)
      }, 4000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [activePanel])

  useEffect(() => {
    if (connectionStatus !== 'connected') {
      return
    }

    if (role === 'teacher' && !sessionStartedRef.current) {
      sessionStartedRef.current = true
      startM.mutate({ sessionId: sessionRecordId })
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [connectionStatus, role, sessionRecordId, startM])

  useEffect(() => {
    if (connectionStatus !== 'connected') {
      return
    }

    const intervalId = window.setInterval(async () => {
      const peerConnection = peerConnectionRef.current
      if (!peerConnection) {
        return
      }

      const stats = await peerConnection.getStats()
      let nextLatency: number | null = null

      stats.forEach((report) => {
        const roundTripTime =
          'currentRoundTripTime' in report && typeof report.currentRoundTripTime === 'number'
            ? report.currentRoundTripTime
            : 'roundTripTime' in report && typeof report.roundTripTime === 'number'
              ? report.roundTripTime
              : null

        if (roundTripTime !== null) {
          nextLatency = roundTripTime * 1000
        }
      })

      setLatencyMs(nextLatency)
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [connectionStatus, peerConnectionRef])

  const panelTitle = useMemo(() => {
    if (activePanel === 'chat') return 'Chat'
    if (activePanel === 'whiteboard') return 'Whiteboard'
    if (activePanel === 'notes') return 'Notes'
    if (activePanel === 'resources') return 'Resources'
    return null
  }, [activePanel])

  const togglePanel = (panel: Exclude<ActivePanel, null>) => {
    setActivePanel((current) => (current === panel ? null : panel))
    if (panel === 'chat') {
      setUnreadMessages(0)
    }
  }

  const handleAddResource = (value: string) => {
    const resource = inferResource(value, userName)
    setResources((previous) => [...previous, resource])
    socketRef.current?.emit('resource-shared', { roomId, resource: { ...resource, addedById: userId } })
  }

  const handleEndSession = async () => {
    if (endM.isPending) {
      return
    }

    localEndRef.current = true
    endSession()

    try {
      await endM.mutateAsync({
        sessionId: sessionRecordId,
        learnerNotes: notes.trim() || undefined,
      })
    } finally {
      router.push(`/summary/${sessionRecordId}`)
    }
  }

  const localInitials = getInitials(userName || 'You')
  const waitingLabel = peerInfo?.userName || 'your partner'

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0E0E0C] text-warm-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,248,246,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(201,171,107,0.08),transparent_26%)] opacity-60" />

      <div className="relative flex h-full items-center justify-between">
        <motion.div
          animate={{ width: activePanel ? 'calc(100vw - 380px)' : 'calc(100vw - 40px)' }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          className="relative ml-5 mr-5 h-[calc(100vh-40px)]"
        >
          <div
            ref={videoContainerRef}
            className="relative h-full overflow-hidden rounded-[24px] border border-white/8 bg-[#1A1916] shadow-[0_28px_90px_rgba(0,0,0,0.5)]"
          >
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,8,0.35),transparent_22%,transparent_74%,rgba(9,9,8,0.45))]" />

            {connectionStatus === 'idle' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
                <StatusBadge
                  title={`Waiting for ${waitingLabel}`}
                  detail="As soon as they join this same session link, the call will start stitching itself together."
                />
                <DotLoader />
              </div>
            ) : null}

            {connectionStatus === 'connecting' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
                <StatusBadge
                  title="Connecting..."
                  detail="We are negotiating the peer-to-peer link now. This usually settles in a few seconds on the same network."
                />
                <DotLoader />
              </div>
            ) : null}

            {connectionStatus === 'disconnected' ? (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <StatusBadge
                  title="Connection lost"
                  detail="We are trying to reconnect the room. Stay on this page for a moment."
                  tone="warning"
                />
              </div>
            ) : null}

            {connectionStatus === 'failed' ? (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <StatusBadge
                  title="Call setup failed"
                  detail={connectionError || 'We could not access your camera, microphone, or signaling server.'}
                  tone="danger"
                />
              </div>
            ) : null}

            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-md">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D8C18D]" />
              <span className="font-hand text-[16px] text-warm-white/75">{formatTimer(elapsedSeconds)}</span>
            </div>

            <div className="absolute right-4 top-4">
              <ConnectionQuality latencyMs={latencyMs} />
            </div>

            <div className="absolute left-4 top-[62px] rounded-full border border-white/8 bg-black/20 px-3 py-1.5 text-[12px] text-warm-white/60 backdrop-blur-md">
              {peerInfo ? `${peerInfo.userName} · ${peerInfo.role}` : 'Private session room'}
            </div>

            <div className="absolute left-4 bottom-4 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[12px] text-warm-white/65 backdrop-blur-md">
              {participantCount} participant{participantCount === 1 ? '' : 's'}
              {panelTitle ? ` · ${panelTitle}` : ''}
            </div>

            <motion.div
              drag
              dragConstraints={videoContainerRef}
              dragElastic={0.08}
              className="absolute bottom-4 right-4 h-[101px] w-[180px] overflow-hidden rounded-[16px] border border-white/12 bg-[#2A2926] shadow-[0_20px_40px_rgba(0,0,0,0.38)]"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${isCameraOff ? 'opacity-0' : 'opacity-100'}`}
              />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-[linear-gradient(180deg,rgba(0,0,0,0.38),transparent)] px-3 py-2 text-[11px] text-warm-white/70">
                <span>You</span>
                <span>{isSharingScreen ? 'Screen sharing' : isCameraOff ? 'Camera off' : 'Camera on'}</span>
              </div>
              {isCameraOff ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-hand text-[24px] text-warm-white">{localInitials}</span>
                </div>
              ) : null}
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {activePanel ? (
            <motion.aside
              key={activePanel}
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="h-screen w-[360px] border-l border-white/8 bg-black/10 shadow-[-18px_0_40px_rgba(0,0,0,0.25)]"
            >
              {activePanel === 'chat' ? (
                <ChatPanel
                  currentUserId={userId}
                  messages={chatMessages}
                  onClose={() => setActivePanel(null)}
                  onSend={sendChatMessage}
                />
              ) : null}
              {activePanel === 'whiteboard' ? (
                <WhiteboardPanel
                  canvasRef={canvasRef}
                  onClose={() => setActivePanel(null)}
                  onClear={clearCanvas}
                  onStartDrawing={startDrawing}
                  onDraw={draw}
                  onStopDrawing={stopDrawing}
                  currentColor={currentColor}
                  onColorChange={setCurrentColor}
                  brushSize={brushSize}
                  onBrushSizeChange={setBrushSize}
                />
              ) : null}
              {activePanel === 'notes' ? (
                <NotesPanel sessionId={roomId} value={notes} onChange={setNotes} onClose={() => setActivePanel(null)} />
              ) : null}
              {activePanel === 'resources' ? (
                <ResourcesPanel resources={resources} onAdd={handleAddResource} onClose={() => setActivePanel(null)} />
              ) : null}
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>

      <motion.div
        initial={false}
        animate={{
          opacity: controlsVisible || activePanel ? 1 : 0,
          y: controlsVisible || activePanel ? 0 : 18,
        }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
      >
        <div className="pointer-events-auto relative flex h-[68px] items-center gap-[6px] rounded-full border border-white/10 bg-[rgba(14,14,12,0.84)] px-7 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-[24px]">
          <ControlButton active={isMuted} onClick={toggleMute} label={isMuted ? 'Unmute' : 'Mute'}>
            <MicrophoneIcon muted={isMuted} />
          </ControlButton>
          <ControlButton active={isCameraOff} onClick={toggleCamera} label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}>
            <CameraIcon off={isCameraOff} />
          </ControlButton>
          <ControlButton
            active={isSharingScreen}
            onClick={() => (isSharingScreen ? stopScreenShare() : startScreenShare())}
            label={isSharingScreen ? 'Stop screen share' : 'Share screen'}
          >
            <ScreenShareIcon />
          </ControlButton>

          <div className="mx-1 h-7 w-px bg-white/10" />

          <ControlButton active={activePanel === 'chat'} onClick={() => togglePanel('chat')} label="Open chat">
            <ChatIcon />
            {unreadMessages > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 font-hand text-[11px] text-warm-white">
                {unreadMessages}
              </span>
            ) : null}
          </ControlButton>
          <ControlButton active={activePanel === 'whiteboard'} onClick={() => togglePanel('whiteboard')} label="Open whiteboard">
            <WhiteboardIcon />
          </ControlButton>
          <ControlButton active={activePanel === 'notes'} onClick={() => togglePanel('notes')} label="Open notes">
            <NotesIcon />
          </ControlButton>
          <ControlButton active={activePanel === 'resources'} onClick={() => togglePanel('resources')} label="Open resources">
            <LinkIcon />
          </ControlButton>

          <div className="mx-1 h-7 w-px bg-white/10" />

          <div className="relative">
            <ControlButton active={false} onClick={() => setShowEndConfirm((open) => !open)} label="End session" end>
              <EndCallIcon />
            </ControlButton>

            <AnimatePresence>
              {showEndConfirm ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-[58px] right-0 w-[196px] rounded-[16px] border border-white/10 bg-[#141412] p-3 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                >
                  <p className="text-[12px] text-warm-white/80">End session for both?</p>
                  <div className="mt-3 flex items-center justify-center gap-4 text-[12px]">
                    <button
                      type="button"
                      onClick={() => setShowEndConfirm(false)}
                      className="text-warm-white/60 transition hover:text-warm-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleEndSession()}
                      className="text-warm-white transition hover:text-warm-white/80"
                    >
                      {endM.isPending ? 'Ending...' : 'End'}
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ControlButton({
  children,
  onClick,
  active,
  label,
  end = false,
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  label: string
  end?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${
        end ? 'bg-white/5 hover:bg-white/10' : active ? 'bg-white/12' : 'bg-transparent hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      {children}
    </svg>
  )
}

function MicrophoneIcon({ muted }: { muted: boolean }) {
  return (
    <IconBase>
      <path d="M12 4a3 3 0 0 1 3 3v5a3 3 0 1 1-6 0V7a3 3 0 0 1 3-3Z" strokeLinecap="round" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3M8.5 20h7" strokeLinecap="round" />
      {muted ? <path d="M4 4l16 16" strokeLinecap="round" /> : null}
    </IconBase>
  )
}

function CameraIcon({ off }: { off: boolean }) {
  return (
    <IconBase>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h7A2.5 2.5 0 0 1 16 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 15.5Z" strokeLinecap="round" />
      <path d="M16 10l4-2.5v9L16 14" strokeLinecap="round" strokeLinejoin="round" />
      {off ? <path d="M4 4l16 16" strokeLinecap="round" /> : null}
    </IconBase>
  )
}

function ScreenShareIcon() {
  return (
    <IconBase>
      <path d="M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15V7a1.5 1.5 0 0 1 1.5-1.5Z" strokeLinecap="round" />
      <path d="M12 8v6M9.5 10.5L12 8l2.5 2.5M8 19h8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  )
}

function ChatIcon() {
  return (
    <IconBase>
      <path
        d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v5A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  )
}

function WhiteboardIcon() {
  return (
    <IconBase>
      <path d="M5.5 5.5h10A2.5 2.5 0 0 1 18 8v10.5H7.5A2.5 2.5 0 0 1 5 16V6a.5.5 0 0 1 .5-.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 4.5l4 4M10 14l7-7 2 2-7 7-3 .8Z" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  )
}

function NotesIcon() {
  return (
    <IconBase>
      <path d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v12H7A2.5 2.5 0 0 1 4.5 16.5v-9A3 3 0 0 1 7.5 4.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 9.5h7M8.5 13h7M8.5 16.5h4" strokeLinecap="round" />
    </IconBase>
  )
}

function LinkIcon() {
  return (
    <IconBase>
      <path
        d="M10 14L14 10M8.5 16.5l-1.5 1.5a3 3 0 1 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0M15.5 7.5l1.5-1.5a3 3 0 0 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  )
}

function EndCallIcon() {
  return (
    <IconBase>
      <path
        d="M5 15.5c4.5-4 9.5-4 14 0l-1.8 2.2a1 1 0 0 1-1.3.2l-2.2-1.4a1 1 0 0 0-1 .02l-1.2.82a1 1 0 0 1-1.1 0l-1.2-.82a1 1 0 0 0-1-.02L7.2 17.9a1 1 0 0 1-1.3-.2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  )
}

export default function SessionPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  const [boundaryKey, setBoundaryKey] = useState(0)
  const verifyQ = trpc.sessions.verifyAccess.useQuery(
    { roomId: params.sessionId },
    { enabled: isLoaded && isSignedIn, retry: 1 }
  )
  const meQ = trpc.users.getCurrentUser.useQuery(undefined, { enabled: isLoaded && isSignedIn, retry: 1 })

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (verifyQ.data && !verifyQ.data.authorized) {
      const fallbackRoute = meQ.data?.role === 'TEACHER' ? '/teacher-dashboard' : '/dashboard'
      router.replace(fallbackRoute)
    }
  }, [meQ.data?.role, router, verifyQ.data])

  const retrySessionSetup = () => {
    setBoundaryKey((current) => current + 1)
    void Promise.all([verifyQ.refetch(), meQ.refetch()])
  }

  if (!isLoaded || verifyQ.isLoading || meQ.isLoading) {
    return <LoadingState label="Preparing your session..." />
  }

  if (!isSignedIn) {
    return <SessionState title="Redirecting to sign in..." />
  }

  if (verifyQ.isError || meQ.isError) {
    const detail = verifyQ.error?.message || meQ.error?.message || 'We could not load this session right now.'
    return (
      <SessionState
        title="Session setup hit a wall"
        detail={detail}
        actionLabel="Try again"
        onAction={retrySessionSetup}
      />
    )
  }

  if (!user || !meQ.data) {
    return (
      <SessionState
        title="We couldn't load your account"
        detail="Refresh and try again. If this keeps happening, sign out and back in."
        actionLabel="Try again"
        onAction={retrySessionSetup}
      />
    )
  }

  if (verifyQ.data && !verifyQ.data.authorized) {
    return <SessionState title="Redirecting you back..." detail="You do not have access to this session." />
  }

  if (!verifyQ.data?.session) {
    const fallbackRoute = meQ.data.role === 'TEACHER' ? '/teacher-dashboard' : '/dashboard'
    return (
      <SessionState
        title="Session not found"
        detail="This session link is missing or no longer valid."
        actionLabel="Go to dashboard"
        onAction={() => router.replace(fallbackRoute)}
      />
    )
  }

  const role = meQ.data.role === 'TEACHER' ? 'teacher' : 'learner'
  const fallbackName = [meQ.data.firstName, meQ.data.lastName].filter(Boolean).join(' ').trim()
  const userName = user.fullName?.trim() || fallbackName || 'Clario user'

  return (
    <VideoErrorBoundary onRetry={retrySessionSetup} resetKey={boundaryKey}>
      <SessionRoom
        roomId={params.sessionId}
        sessionRecordId={verifyQ.data.session.id}
        userId={user.id}
        userName={userName}
        role={role}
      />
    </VideoErrorBoundary>
  )
}
