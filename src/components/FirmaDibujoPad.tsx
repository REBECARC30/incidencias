import { useCallback, useEffect, useRef } from 'react'
import { Eraser } from 'lucide-react'
import { Button } from './ui'

interface FirmaDibujoPadProps {
  value: string
  onChange: (dataUrl: string) => void
}

const PAD_HEIGHT = 160
const PAD_MIN_WIDTH = 280

export function FirmaDibujoPad({ value, onChange }: FirmaDibujoPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const loadedValue = useRef('')
  const logicalSize = useRef({ width: PAD_MIN_WIDTH, height: PAD_HEIGHT })
  const onChangeRef = useRef(onChange)

  onChangeRef.current = onChange

  const getCanvasPoint = useCallback((canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    const { width, height } = logicalSize.current
    return {
      x: (clientX - rect.left) * (width / rect.width),
      y: (clientY - rect.top) * (height / rect.height),
    }
  }, [])

  const syncCanvasSize = useCallback(
    (imageValue = value) => {
      const canvas = canvasRef.current
      const wrapper = wrapperRef.current
      if (!canvas || !wrapper) return

      const width = Math.max(wrapper.clientWidth, PAD_MIN_WIDTH)
      const height = PAD_HEIGHT
      const ratio = window.devicePixelRatio || 1

      logicalSize.current = { width, height }

      canvas.width = Math.floor(width * ratio)
      canvas.height = Math.floor(height * ratio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#38092d'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)

      if (imageValue) {
        const img = new Image()
        img.onload = () => {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)
        }
        img.src = imageValue
        loadedValue.current = imageValue
      } else {
        loadedValue.current = ''
      }
    },
    [value],
  )

  useEffect(() => {
    syncCanvasSize()

    const wrapper = wrapperRef.current
    if (!wrapper) return

    const observer = new ResizeObserver(() => {
      syncCanvasSize(loadedValue.current)
    })
    observer.observe(wrapper)

    return () => observer.disconnect()
  }, [syncCanvasSize])

  useEffect(() => {
    if (value === loadedValue.current) return
    syncCanvasSize(value)
  }, [value, syncCanvasSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const commitStroke = () => {
      const dataUrl = canvas.toDataURL('image/png')
      loadedValue.current = dataUrl
      onChangeRef.current(dataUrl)
    }

    const startDraw = (clientX: number, clientY: number) => {
      drawing.current = true
      lastPoint.current = getCanvasPoint(canvas, clientX, clientY)
    }

    const drawTo = (clientX: number, clientY: number) => {
      if (!drawing.current) return
      const ctx = canvas.getContext('2d')
      const last = lastPoint.current
      if (!ctx || !last) return

      const point = getCanvasPoint(canvas, clientX, clientY)
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
      lastPoint.current = point
    }

    const endDraw = () => {
      if (!drawing.current) return
      drawing.current = false
      lastPoint.current = null
      commitStroke()
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
      startDraw(e.clientX, e.clientY)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!drawing.current) return
      e.preventDefault()
      drawTo(e.clientX, e.clientY)
    }

    const endPointer = (e: PointerEvent) => {
      if (!drawing.current) return
      e.preventDefault()
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId)
      }
      endDraw()
    }

    canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
    canvas.addEventListener('pointermove', onPointerMove, { passive: false })
    canvas.addEventListener('pointerup', endPointer, { passive: false })
    canvas.addEventListener('pointercancel', endPointer, { passive: false })

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', endPointer)
      canvas.removeEventListener('pointercancel', endPointer)
    }
  }, [getCanvasPoint])

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const { width, height } = logicalSize.current
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    loadedValue.current = ''
    onChangeRef.current('')
  }

  return (
    <div className="space-y-2">
      <div
        ref={wrapperRef}
        className="overflow-hidden rounded-2xl border-2 border-dashed border-brand-200/80 bg-white shadow-inner"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair"
          style={{ touchAction: 'none' }}
          aria-label="Dibujar firma"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">Firma con el ratón o el dedo en el recuadro.</p>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser size={14} />
          Borrar
        </Button>
      </div>
    </div>
  )
}
