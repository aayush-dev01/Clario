'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { getRealtimeConfig } from '@/lib/realtime-client'

interface UseWebRTCProps {
  roomId: string
  userId: string
  userName: string
  role: 'learner' | 'teacher'
  initialMessages?: ChatMessage[]
  onSessionEnded: () => void
}

export interface ChatMessage {
  id?: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  timestamp: string
}

interface PeerInfo {
  socketId: string
  userName: string
  role: string
}

function isLoopbackHost(hostname: string) {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname)
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'ended'

async function resolveSocketUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim()

  if (typeof window === 'undefined') {
    return configuredUrl || 'http://localhost:4000'
  }

  const runtimeConfig = await getRealtimeConfig().catch(() => null)
  const runtimeSocketUrl = runtimeConfig?.socketUrl?.trim()
  if (runtimeSocketUrl) {
    return runtimeSocketUrl
  }

  if (!configuredUrl) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    return `${protocol}//${window.location.hostname}:4000`
  }

  try {
    const url = new URL(configuredUrl)
    if (isLoopbackHost(url.hostname) && !isLoopbackHost(window.location.hostname)) {
      url.hostname = window.location.hostname
    }

    if (!url.port && url.protocol === 'http:' && isLoopbackHost(url.hostname)) {
      url.port = '4000'
    }

    if (window.location.protocol === 'https:' && url.protocol === 'http:' && url.hostname === window.location.hostname) {
      url.protocol = 'https:'
    }

    return url.toString()
  } catch {
    return configuredUrl
  }
}

const ICE_SERVERS: RTCConfiguration = {
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
}

async function getRtcConfiguration() {
  if (typeof window === 'undefined') {
    return ICE_SERVERS
  }

  try {
    const response = await fetch('/api/rtc-config', { cache: 'no-store' })
    if (!response.ok) {
      return ICE_SERVERS
    }

    const payload = (await response.json()) as RTCConfiguration
    if (!payload?.iceServers?.length) {
      return ICE_SERVERS
    }

    return {
      ...ICE_SERVERS,
      ...payload,
      iceServers: payload.iceServers,
      iceCandidatePoolSize: payload.iceCandidatePoolSize ?? ICE_SERVERS.iceCandidatePoolSize,
    } satisfies RTCConfiguration
  } catch {
    return ICE_SERVERS
  }
}

function attachMediaStream(videoElement: HTMLVideoElement | null, stream: MediaStream | null, shouldMute = false) {
  if (!videoElement) {
    return
  }

  videoElement.muted = shouldMute
  videoElement.srcObject = stream

  if (!stream) {
    return
  }

  const playVideo = () => {
    void videoElement.play().catch(() => {
      // Browsers may delay autoplay until metadata is ready.
    })
  }

  if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
    playVideo()
    return
  }

  videoElement.onloadedmetadata = () => {
    playVideo()
  }
}

export function useWebRTC({
  roomId,
  userId,
  userName,
  role,
  initialMessages = [],
  onSessionEnded,
}: UseWebRTCProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const targetSocketIdRef = useRef<string | null>(null)
  const { getToken } = useAuth()

  const [socketInstance, setSocketInstance] = useState<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages)
  const [peerInfo, setPeerInfo] = useState<PeerInfo | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [signalingUrl, setSignalingUrl] = useState('')

  useEffect(() => {
    if (initialMessages.length === 0) {
      return
    }

    setChatMessages((previous) => {
      const merged = [...initialMessages, ...previous]
      const seen = new Set<string>()

      return merged.filter((message) => {
        const key = message.id ?? `${message.senderId}-${message.timestamp}-${message.message}`
        if (seen.has(key)) {
          return false
        }

        seen.add(key)
        return true
      })
    })
  }, [initialMessages])

  const createPeerConnection = useCallback((stream: MediaStream, rtcConfiguration: RTCConfiguration) => {
    const pc = new RTCPeerConnection(rtcConfiguration)

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream)
    })

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        attachMediaStream(remoteVideoRef.current, event.streams[0])
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && targetSocketIdRef.current && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate.toJSON(),
          targetSocketId: targetSocketIdRef.current,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected')
      } else if (pc.connectionState === 'disconnected') {
        setConnectionStatus('disconnected')
      } else if (pc.connectionState === 'failed') {
        setConnectionStatus('failed')
      } else if (pc.connectionState === 'connecting') {
        setConnectionStatus('connecting')
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected')
        setConnectionError(null)
      } else if (pc.iceConnectionState === 'checking') {
        setConnectionStatus('connecting')
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionStatus('disconnected')
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionStatus('failed')
        setConnectionError('The peer connection failed. Make sure both devices are reachable on the same network.')
      }
    }

    return pc
  }, [roomId])

  useEffect(() => {
    let socket: Socket | null = null
    let activeStream: MediaStream | null = null

    const bindSocketEvents = (activeSocket: Socket) => {
      activeSocket.on('connect', () => {
        setConnectionError(null)
      })

      activeSocket.on('connect_error', (error) => {
        console.error('Socket connect error:', error)
        const message =
          error.message === 'websocket error' || error.message === 'xhr poll error'
            ? 'We could not connect to the live session server. Refresh once and try again.'
            : error.message || 'We could not reach the signaling server.'
        setConnectionError(message)
        setConnectionStatus('failed')
      })

      activeSocket.on('disconnect', () => {
        setConnectionStatus('disconnected')
      })

      activeSocket.on(
        'peer-joined',
        async ({
          socketId,
          userName: peerName,
          role: peerRole,
          shouldCreateOffer,
        }: {
          socketId: string
          userName: string
          role: string
          shouldCreateOffer?: boolean
        }) => {
          targetSocketIdRef.current = socketId
          setPeerInfo({ socketId, userName: peerName, role: peerRole })
          setConnectionStatus('connecting')

          if (shouldCreateOffer && peerConnectionRef.current) {
            try {
              const offer = await peerConnectionRef.current.createOffer()
              await peerConnectionRef.current.setLocalDescription(offer)
              activeSocket.emit('offer', { roomId, offer, targetSocketId: socketId })
            } catch (error) {
              console.error('Error creating offer:', error)
              setConnectionError('We could not start the peer connection.')
              setConnectionStatus('failed')
            }
          }
        }
      )

      activeSocket.on(
        'offer',
        async ({
          offer,
          from,
          fromName,
        }: {
          offer: RTCSessionDescriptionInit
          from: string
          fromName: string
        }) => {
          targetSocketIdRef.current = from
          setPeerInfo({ socketId: from, userName: fromName, role: role === 'teacher' ? 'learner' : 'teacher' })

          if (!peerConnectionRef.current) {
            return
          }

          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await peerConnectionRef.current.createAnswer()
            await peerConnectionRef.current.setLocalDescription(answer)
            activeSocket.emit('answer', { roomId, answer, targetSocketId: from })
          } catch (error) {
            console.error('Error handling offer:', error)
            setConnectionError('We could not finish the room handshake.')
            setConnectionStatus('failed')
          }
        }
      )

      activeSocket.on('answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        if (!peerConnectionRef.current) {
          return
        }

        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
        } catch (error) {
          console.error('Error handling answer:', error)
          setConnectionError('We could not finish the room handshake.')
          setConnectionStatus('failed')
        }
      })

      activeSocket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        if (!peerConnectionRef.current) {
          return
        }

        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (error) {
          console.error('Error adding ICE candidate:', error)
        }
      })

      activeSocket.on('chat-message', (message: ChatMessage) => {
        setChatMessages((previous) => [...previous, message])
      })

      activeSocket.on('peer-disconnected', () => {
        setConnectionStatus('disconnected')
        setPeerInfo(null)

        attachMediaStream(remoteVideoRef.current, null)

        peerConnectionRef.current?.close()
        if (localStreamRef.current) {
          void getRtcConfiguration().then((rtcConfiguration) => {
            if (localStreamRef.current) {
              peerConnectionRef.current = createPeerConnection(localStreamRef.current, rtcConfiguration)
            }
          })
        }
      })

      activeSocket.on('room-status', ({ participantCount: count }: { participantCount: number }) => {
        setParticipantCount(count)
      })

      activeSocket.on('room-error', ({ message }: { message: string }) => {
        console.error('Room error:', message)
        setConnectionError(message)
        setConnectionStatus('failed')
      })

      activeSocket.on('session-ended', () => {
        setConnectionStatus('ended')
        onSessionEnded()
      })

      activeSocket.on('peer-screen-share-started', ({ fromName }: { fromName: string }) => {
        console.log(`${fromName} started screen sharing`)
      })

      activeSocket.on('peer-screen-share-stopped', () => {
        console.log('Peer stopped screen sharing')
      })
    }

    const initMedia = async () => {
      try {
        const token = await getToken()
        if (!token) {
          setConnectionError('Your session expired. Please sign in again.')
          setConnectionStatus('failed')
          return
        }

        const resolvedSocketUrl = await resolveSocketUrl()
        const rtcConfiguration = await getRtcConfiguration()
        setSignalingUrl(resolvedSocketUrl)

        socket = io(resolvedSocketUrl, {
          transports: ['polling', 'websocket'],
          upgrade: true,
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 5,
          auth: { token },
        })

        socketRef.current = socket
        setSocketInstance(socket)
        bindSocketEvents(socket)

        let stream: MediaStream

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            },
          })
          setConnectionError(null)
        } catch (mediaError) {
          console.error('Media access error:', mediaError)
          stream = new MediaStream()
          setIsMuted(true)
          setIsCameraOff(true)
          setConnectionError('Camera or mic access is blocked. You can still use chat and session tools while we keep the room connected.')
        }

        activeStream = stream
        localStreamRef.current = stream
        setIsMuted(stream.getAudioTracks().length === 0 || stream.getAudioTracks().every((track) => !track.enabled))
        setIsCameraOff(stream.getVideoTracks().length === 0 || stream.getVideoTracks().every((track) => !track.enabled))

        attachMediaStream(localVideoRef.current, stream, true)

        const pc = createPeerConnection(stream, rtcConfiguration)
        peerConnectionRef.current = pc

        const joinRoom = () => {
          socket?.emit('register')
          socket?.emit('join-room', { roomId })
          setConnectionStatus('idle')
        }

        if (socket.connected) {
          joinRoom()
        } else {
          socket.once('connect', joinRoom)
        }
      } catch (error) {
        console.error('Session setup error:', error)
        setConnectionError('We could not prepare the live session connection.')
        setConnectionStatus('failed')
      }
    }

    void initMedia()

    return () => {
      socket?.emit('leave-room', { roomId })
      peerConnectionRef.current?.close()
      peerConnectionRef.current = null
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      screenStreamRef.current?.getTracks().forEach((track) => track.stop())
      activeStream?.getTracks().forEach((track) => track.stop())
      socket?.disconnect()
      attachMediaStream(localVideoRef.current, null, true)
      attachMediaStream(remoteVideoRef.current, null)
      socketRef.current = null
      setSocketInstance(null)
    }
  }, [createPeerConnection, getToken, onSessionEnded, role, roomId, userId, userName])

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0]
    if (!audioTrack) {
      return
    }

    audioTrack.enabled = !audioTrack.enabled
    setIsMuted(!audioTrack.enabled)
  }, [])

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0]
    if (!videoTrack) {
      return
    }

    videoTrack.enabled = !videoTrack.enabled
    setIsCameraOff(!videoTrack.enabled)
  }, [])

  const stopScreenShare = useCallback(async () => {
    const localStream = localStreamRef.current
    const peerConnection = peerConnectionRef.current
    if (!localStream || !peerConnection) {
      return
    }

    const cameraTrack = localStream.getVideoTracks()[0]
    const sender = peerConnection.getSenders().find((item) => item.track?.kind === 'video')
    if (sender && cameraTrack) {
      await sender.replaceTrack(cameraTrack)
    }

    attachMediaStream(localVideoRef.current, localStream, true)

    screenStreamRef.current?.getTracks().forEach((track) => track.stop())
    screenStreamRef.current = null
    setIsSharingScreen(false)
    socketRef.current?.emit('screen-share-stopped', { roomId })
  }, [roomId])

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: false,
      })

      screenStreamRef.current = screenStream
      const screenTrack = screenStream.getVideoTracks()[0]

      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find((item) => item.track?.kind === 'video')
        if (sender) {
          await sender.replaceTrack(screenTrack)
        }
      }

      attachMediaStream(localVideoRef.current, screenStream, true)

      setIsSharingScreen(true)
      socketRef.current?.emit('screen-share-started', { roomId })

      screenTrack.onended = () => {
        void stopScreenShare()
      }
    } catch (error) {
      console.error('Screen share error:', error)
    }
  }, [roomId, stopScreenShare])

  const sendChatMessage = useCallback(
    (message: string) => {
      if (!socketRef.current || !message.trim()) {
        return
      }

      socketRef.current.emit('chat-message', {
        roomId,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      })
    },
    [roomId]
  )

  const endSession = useCallback(() => {
    socketRef.current?.emit('end-session', { roomId })
    setConnectionStatus('ended')
  }, [roomId])

  return {
    localVideoRef,
    remoteVideoRef,
    socketRef,
    socketInstance,
    peerConnectionRef,
    localStreamRef,
    connectionStatus,
    connectionError,
    isMuted,
    isCameraOff,
    isSharingScreen,
    chatMessages,
    peerInfo,
    participantCount,
    signalingUrl,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    sendChatMessage,
    endSession,
  }
}
