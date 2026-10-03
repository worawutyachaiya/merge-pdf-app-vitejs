import { useEffect, useRef } from 'react'

import { useSettings } from '@core/hooks/useSettings'

import {
  useSeasonalThemeStore,
  type SeasonalTheme,
  type SeasonalThemeIntensity
} from '@/libs/zustand/stores/useSeasonalThemeStore'

type Particle = {
  x: number
  y: number
  size: number
  speed: number
  drift: number
  rotation: number
  rotationSpeed: number
  opacity: number
  variant: number
}

const PARTICLE_COUNTS: Record<SeasonalThemeIntensity, number> = {
  low: 18,
  medium: 32,
  high: 48
}

const createParticle = (width: number, height: number, theme: SeasonalTheme, initial = false): Particle => ({
  x: Math.random() * width,
  y: initial ? Math.random() * height : -30 - Math.random() * height * 0.2,
  size: theme === 'rainy' ? 5 + Math.random() * 5 : 10 + Math.random() * 16,
  speed:
    theme === 'rainy'
      ? 5 + Math.random() * 6
      : theme === 'winter'
        ? 0.35 + Math.random() * 0.75
        : 0.55 + Math.random() * 1.15,
  drift: (Math.random() - 0.5) * (theme === 'autumn' ? 0.9 : theme === 'rainy' ? 0.2 : 0.35),
  rotation: Math.random() * Math.PI * 2,
  rotationSpeed: (Math.random() - 0.5) * 0.025,
  opacity: 0.35 + Math.random() * 0.55,
  variant: Math.floor(Math.random() * 3)
})

const drawSnowflake = (context: CanvasRenderingContext2D, particle: Particle, isDarkMode: boolean) => {
  const opacity = Math.min(0.9, particle.opacity * (isDarkMode ? 0.9 : 0.68))

  context.save()
  context.strokeStyle = isDarkMode ? `rgb(255 255 255 / ${opacity})` : `rgb(96 165 250 / ${opacity})`
  context.lineWidth = isDarkMode ? Math.max(1, particle.size / 10) : Math.max(1, particle.size / 9)
  context.shadowColor = isDarkMode ? 'transparent' : 'rgb(59 130 246 / 0.14)'
  context.shadowBlur = isDarkMode ? 0 : 1
  context.beginPath()

  for (let arm = 0; arm < 3; arm++) {
    const angle = particle.rotation + (Math.PI / 3) * arm
    const dx = Math.cos(angle) * particle.size * 0.5
    const dy = Math.sin(angle) * particle.size * 0.5

    context.moveTo(particle.x - dx, particle.y - dy)
    context.lineTo(particle.x + dx, particle.y + dy)
  }

  context.stroke()
  context.restore()
}

const drawRainDrop = (context: CanvasRenderingContext2D, particle: Particle, isDarkMode: boolean) => {
  const length = particle.size * 2.2
  const opacity = Math.min(0.88, particle.opacity * (isDarkMode ? 0.72 : 0.72))

  context.save()
  context.strokeStyle = isDarkMode ? `rgb(147 197 253 / ${opacity})` : `rgb(96 165 250 / ${opacity})`
  context.lineWidth = isDarkMode ? Math.max(0.7, particle.size / 8) : Math.max(0.85, particle.size / 7)
  context.lineCap = 'round'
  context.shadowColor = isDarkMode ? 'transparent' : 'rgb(59 130 246 / 0.11)'
  context.shadowBlur = isDarkMode ? 0 : 1
  context.beginPath()
  context.moveTo(particle.x, particle.y)
  context.lineTo(particle.x - particle.size * 0.3, particle.y + length)
  context.stroke()
  context.restore()
}

const drawAutumnLeaf = (context: CanvasRenderingContext2D, particle: Particle) => {
  const colors = ['#e76f51', '#f4a261', '#d97706']

  context.save()
  context.translate(particle.x, particle.y)
  context.rotate(particle.rotation)
  context.globalAlpha = particle.opacity
  context.fillStyle = colors[particle.variant]
  context.beginPath()
  context.ellipse(0, 0, particle.size * 0.55, particle.size * 0.28, 0, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = 'rgb(92 51 23 / 0.55)'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(-particle.size * 0.42, 0)
  context.lineTo(particle.size * 0.52, 0)
  context.stroke()
  context.restore()
}

const SeasonalThemeLayer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useSeasonalThemeStore(state => state.theme)
  const intensity = useSeasonalThemeStore(state => state.intensity)
  const { settings } = useSettings()

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || theme === 'default') return

    const context = canvas.getContext('2d')
    const isDarkMode =
      settings.mode === 'dark' ||
      (settings.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    if (!context || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let width = window.innerWidth
    let height = window.innerHeight
    let animationFrame = 0
    let previousTime = performance.now()
    let particles: Particle[] = []

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const mobileScale = width < 768 ? 0.6 : 1
      const count = Math.round(PARTICLE_COUNTS[intensity] * mobileScale)

      particles = Array.from({ length: count }, () => createParticle(width, height, theme, true))
    }

    const animate = (time: number) => {
      const frameScale = Math.min((time - previousTime) / 16.67, 2)

      previousTime = time
      context.clearRect(0, 0, width, height)

      particles.forEach((particle, index) => {
        particle.y += particle.speed * frameScale
        particle.x += (particle.drift + Math.sin(time / 1200 + index) * (theme === 'rainy' ? 0.05 : 0.18)) * frameScale
        particle.rotation += particle.rotationSpeed * frameScale

        if (theme === 'winter') drawSnowflake(context, particle, isDarkMode)
        if (theme === 'rainy') drawRainDrop(context, particle, isDarkMode)
        if (theme === 'autumn') drawAutumnLeaf(context, particle)

        if (particle.y > height + 40 || particle.x < -50 || particle.x > width + 50) {
          particles[index] = createParticle(width, height, theme)
        }
      })

      animationFrame = requestAnimationFrame(animate)
    }

    const handleVisibilityChange = () => {
      cancelAnimationFrame(animationFrame)

      if (!document.hidden) {
        previousTime = performance.now()
        animationFrame = requestAnimationFrame(animate)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      context.clearRect(0, 0, width, height)
    }
  }, [intensity, settings.mode, theme])

  if (theme === 'default') return null

  return (
    <canvas key={theme} ref={canvasRef} aria-hidden='true' className='app-seasonal-theme-layer' data-theme={theme} />
  )
}

export default SeasonalThemeLayer
