'use client'

import type { RefObject } from 'react'

interface WhiteboardPanelProps {
  canvasRef: RefObject<HTMLCanvasElement>
  onClose: () => void
  onClear: () => void
  onStartDrawing: (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void
  onDraw: (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void
  onStopDrawing: () => void
  currentColor: string
  onColorChange: (color: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
}

const COLORS = ['#F9F8F6', '#888888', '#1A1916', '#3F3D36', '#6B6963', '#C4C2BC']
const BRUSH_SIZES = [2, 4, 8]

export function WhiteboardPanel({
  canvasRef,
  onClose,
  onClear,
  onStartDrawing,
  onDraw,
  onStopDrawing,
  currentColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
}: WhiteboardPanelProps) {
  return (
    <div className="flex h-full w-[360px] flex-col bg-[#0A0A08] text-warm-white">
      <div className="flex h-[52px] items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 backdrop-blur-md">
        <h2 className="text-[14px] font-bold">Whiteboard</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClear} className="text-[12px] text-warm-white/70 transition hover:text-warm-white">
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-warm-white/70 transition hover:bg-white/10 hover:text-warm-white"
            aria-label="Close whiteboard"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="h-[calc(100vh-100px)] w-[360px] touch-none bg-[linear-gradient(180deg,#0A0A08_0%,#10100D_100%)]"
        onMouseDown={onStartDrawing}
        onMouseMove={onDraw}
        onMouseUp={onStopDrawing}
        onMouseLeave={onStopDrawing}
        onTouchStart={onStartDrawing}
        onTouchMove={onDraw}
        onTouchEnd={onStopDrawing}
      />

      <div className="flex h-12 items-center justify-between border-t border-white/10 bg-[#161614] px-4">
        <div className="flex items-center gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorChange(color)}
              className={`h-5 w-5 rounded-full transition ${currentColor === color ? 'ring-2 ring-warm-white ring-offset-2 ring-offset-[#161614]' : ''}`}
              style={{ backgroundColor: color }}
              aria-label={`Select ${color} brush`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onBrushSizeChange(size)}
              className="flex h-8 w-8 items-center justify-center"
              aria-label={`Use brush size ${size}`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <circle cx="12" cy="12" r={size} className={brushSize === size ? 'text-warm-white' : 'text-warm-white/35'} />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
