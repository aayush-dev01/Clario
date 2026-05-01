'use client'

import type { MouseEvent, RefObject, TouchEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'

interface DrawData {
  type: 'start' | 'draw' | 'end'
  x: number
  y: number
  color: string
  width: number
}

interface UseWhiteboardProps {
  socketRef: RefObject<Socket | null>
  roomId: string
}

const COLORS = ['#F9F8F6', '#888888', '#1A1916', '#3F3D36', '#6B6963', '#C4C2BC']

export function useWhiteboard({ socketRef, roomId }: UseWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const remoteLastPointRef = useRef<{ x: number; y: number } | null>(null)
  const boundSocketRef = useRef<Socket | null>(null)

  const [currentColor, setCurrentColor] = useState(COLORS[0])
  const [brushSize, setBrushSize] = useState(4)

  const configureCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ratio = window.devicePixelRatio || 1
    const bounds = canvas.getBoundingClientRect()
    canvas.width = Math.floor(bounds.width * ratio)
    canvas.height = Math.floor(bounds.height * ratio)

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.scale(ratio, ratio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = currentColor
    context.lineWidth = brushSize
    contextRef.current = context
  }, [brushSize, currentColor])

  useEffect(() => {
    configureCanvas()
    window.addEventListener('resize', configureCanvas)
    return () => window.removeEventListener('resize', configureCanvas)
  }, [configureCanvas])

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = currentColor
      contextRef.current.lineWidth = brushSize
    }
  }, [brushSize, currentColor])

  const pointFromEvent = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return null
    }

    const rect = canvas.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const drawSegment = useCallback((from: { x: number; y: number }, to: { x: number; y: number }, color: string, width: number) => {
    const context = contextRef.current
    if (!context) {
      return
    }

    context.strokeStyle = color
    context.lineWidth = width
    context.beginPath()
    context.moveTo(from.x, from.y)
    context.lineTo(to.x, to.y)
    context.stroke()
  }, [])

  const emitDraw = useCallback(
    (drawData: DrawData) => {
      socketRef.current?.emit('whiteboard-draw', {
        roomId,
        drawData,
      })
    },
    [roomId, socketRef]
  )

  const startDrawingAt = useCallback(
    (x: number, y: number) => {
      isDrawingRef.current = true
      lastPointRef.current = { x, y }
      emitDraw({ type: 'start', x, y, color: currentColor, width: brushSize })
    },
    [brushSize, currentColor, emitDraw]
  )

  const drawAt = useCallback(
    (x: number, y: number) => {
      if (!isDrawingRef.current || !lastPointRef.current) {
        return
      }

      drawSegment(lastPointRef.current, { x, y }, currentColor, brushSize)
      lastPointRef.current = { x, y }
      emitDraw({ type: 'draw', x, y, color: currentColor, width: brushSize })
    },
    [brushSize, currentColor, drawSegment, emitDraw]
  )

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) {
      return
    }

    isDrawingRef.current = false
    const lastPoint = lastPointRef.current
    if (lastPoint) {
      emitDraw({
        type: 'end',
        x: lastPoint.x,
        y: lastPoint.y,
        color: currentColor,
        width: brushSize,
      })
    }
    lastPointRef.current = null
  }, [brushSize, currentColor, emitDraw])

  const startDrawing = useCallback(
    (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
      const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX
      const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY
      if (typeof clientX !== 'number' || typeof clientY !== 'number') {
        return
      }

      const point = pointFromEvent(clientX, clientY)
      if (!point) {
        return
      }

      startDrawingAt(point.x, point.y)
    },
    [pointFromEvent, startDrawingAt]
  )

  const draw = useCallback(
    (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
      const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX
      const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY
      if (typeof clientX !== 'number' || typeof clientY !== 'number') {
        return
      }

      const point = pointFromEvent(clientX, clientY)
      if (!point) {
        return
      }

      drawAt(point.x, point.y)
    },
    [drawAt, pointFromEvent]
  )

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) {
      return
    }

    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    socketRef.current?.emit('whiteboard-clear', { roomId })
  }, [roomId, socketRef])

  useEffect(() => {
    let detach: (() => void) | null = null

    const maybeBind = (): boolean => {
      const socket = socketRef.current
      if (!socket || socket === boundSocketRef.current) {
        return false
      }

      boundSocketRef.current = socket

      const handleRemoteDraw = (drawData: DrawData) => {
        if (drawData.type === 'start') {
          remoteLastPointRef.current = { x: drawData.x, y: drawData.y }
          return
        }

        if (drawData.type === 'draw' && remoteLastPointRef.current) {
          drawSegment(remoteLastPointRef.current, { x: drawData.x, y: drawData.y }, drawData.color, drawData.width)
          remoteLastPointRef.current = { x: drawData.x, y: drawData.y }
          return
        }

        if (drawData.type === 'end') {
          remoteLastPointRef.current = null
        }
      }

      const handleClear = () => {
        const canvas = canvasRef.current
        const context = contextRef.current
        if (!canvas || !context) {
          return
        }

        context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      }

      socket.on('whiteboard-draw', handleRemoteDraw)
      socket.on('whiteboard-clear', handleClear)

      detach = () => {
        socket.off('whiteboard-draw', handleRemoteDraw)
        socket.off('whiteboard-clear', handleClear)
      }
      return true
    }

    if (maybeBind()) {
      return () => {
        detach?.()
      }
    }

    const intervalId = window.setInterval(() => {
      if (maybeBind()) {
        window.clearInterval(intervalId)
      }
    }, 250)

    return () => {
      window.clearInterval(intervalId)
      detach?.()
    }
  }, [drawSegment, socketRef])

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    currentColor,
    setCurrentColor,
    brushSize,
    setBrushSize,
  }
}
