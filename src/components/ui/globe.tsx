import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'
import type { COBEOptions } from 'cobe'
import { useMotionValue, useSpring } from 'motion/react'

import { cn } from '@/lib/utils'

const MOVEMENT_DAMPING = 1400

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [1, 1, 1],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [19.4326, -99.1332], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 }
  ]
}

export function Globe({ className, config = GLOBE_CONFIG }: { className?: string; config?: COBEOptions }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phiRef = useRef(0)
  const widthRef = useRef(0)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)

  const rotation = useMotionValue(0)
  const rotationSpring = useSpring(rotation, {
    mass: 1,
    damping: 30,
    stiffness: 100
  })
  const tilt = useMotionValue(0)
  const tiltSpring = useSpring(tilt, { mass: 1, damping: 30, stiffness: 100 })

  const updatePointerInteraction = (value: { x: number; y: number } | null) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? 'grabbing' : 'grab'
    }
  }

  const updateMovement = (clientX: number, clientY: number) => {
    const pointer = pointerInteracting.current

    if (!pointer) return

    const deltaX = clientX - pointer.x
    const deltaY = clientY - pointer.y

    pointerInteracting.current = { x: clientX, y: clientY }
    rotation.set(rotation.get() + deltaX / MOVEMENT_DAMPING)
    tilt.set(Math.max(-0.65, Math.min(0.65, tilt.get() + deltaY / MOVEMENT_DAMPING)))
  }

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        widthRef.current = canvasRef.current.offsetWidth
      }
    }

    window.addEventListener('resize', onResize)
    onResize()

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      onRender: state => {
        if (!pointerInteracting.current) phiRef.current += 0.005
        state.phi = phiRef.current + rotationSpring.get()
        state.theta = config.theta + tiltSpring.get()
        state.width = widthRef.current * 2
        state.height = widthRef.current * 2
      }
    })

    return () => {
      globe.destroy()
      window.removeEventListener('resize', onResize)
    }
  }, [config, rotationSpring, tiltSpring])

  return (
    <div className={cn('absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]', className)}>
      <canvas
        className={cn('size-full opacity-100 transition-opacity duration-500 [contain:layout_paint_size]')}
        ref={canvasRef}
        onPointerDown={event => {
          event.currentTarget.setPointerCapture(event.pointerId)
          updatePointerInteraction({ x: event.clientX, y: event.clientY })
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerCancel={() => updatePointerInteraction(null)}
        onPointerMove={event => updateMovement(event.clientX, event.clientY)}
      />
    </div>
  )
}
