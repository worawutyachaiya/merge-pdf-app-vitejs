import { useEffect, useId, useMemo, useRef } from 'react'

import { useColorScheme } from '@mui/material/styles'
import type { COBEOptions } from 'cobe'

import { Globe } from '@/components/ui/globe'
import { useSettings } from '@core/hooks/useSettings'

import styles from './home.module.css'

const FlyingEagle = () => {
  const id = useId()
  const eagleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const eagle = eagleRef.current

    if (!eagle) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animation: Animation | undefined
    let direction = Math.random() < 0.5 ? 1 : -1

    const startFlight = () => {
      animation?.cancel()
      if (reducedMotion.matches) return

      const startHeight = 15 + Math.random() * 60
      const endHeight = 15 + Math.random() * 60
      const controlHeight = 10 + Math.random() * 70
      const width = eagle.parentElement?.clientWidth ?? 1000
      const height = eagle.parentElement?.clientHeight ?? 600
      const keyframes: Keyframe[] = Array.from({ length: 31 }, (_, index) => {
        const progress = index / 30
        const horizontal = direction === 1 ? progress : 1 - progress
        const vertical =
          (1 - progress) ** 2 * startHeight + 2 * (1 - progress) * progress * controlHeight + progress ** 2 * endHeight
        const slope = 2 * ((1 - progress) * (controlHeight - startHeight) + progress * (endHeight - controlHeight))
        const angle = (Math.atan2((slope / 100) * height, width + 200) * 180) / Math.PI

        return {
          offset: progress,
          left: `calc(${horizontal * 100}% + ${horizontal * 200 - 100}px)`,
          top: `${vertical}%`,
          transform: `translate(-50%, -50%) rotate(${angle * direction}deg) scaleX(${direction})`
        }
      })

      animation = eagle.animate(keyframes, {
        duration: 4500 + Math.random() * 1500,
        easing: 'linear',
        fill: 'both'
      })
      // Return from the side the eagle just exited, with a new height and curve.
      animation.onfinish = () => {
        direction *= -1
        startFlight()
      }
    }

    startFlight()
    reducedMotion.addEventListener('change', startFlight)

    return () => {
      animation?.cancel()
      reducedMotion.removeEventListener('change', startFlight)
    }
  }, [])

  return (
    <div ref={eagleRef} className={styles.eagle} aria-hidden='true'>
      <svg viewBox='0 0 200 150' role='presentation' focusable='false'>
        <defs>
          <linearGradient id={`${id}-wing`} x1='0' y1='0' x2='0.8' y2='1'>
            <stop stopColor='#ac8965' />
            <stop offset='0.45' stopColor='#73543f' />
            <stop offset='1' stopColor='#302a29' />
          </linearGradient>
          <linearGradient id={`${id}-body`} x1='0' y1='0' x2='0' y2='1'>
            <stop stopColor='#89694d' />
            <stop offset='1' stopColor='#392f2b' />
          </linearGradient>
          <linearGradient id={`${id}-head`} x1='0' y1='0' x2='0.5' y2='1'>
            <stop stopColor='#fffef6' />
            <stop offset='1' stopColor='#cbd3d4' />
          </linearGradient>
        </defs>
        <g className={styles.eagleWingBack}>
          <path
            fill='#493d34'
            d='M105 83C88 68 77 45 60 22L43 8Q39 8 42 15L53 34 32 17Q26 14 29 21L46 43 24 28Q18 25 22 33L42 54 22 44Q17 43 21 49L48 73Q67 89 98 93Z'
          />
          <path fill='#927355' opacity='.65' d='M101 83Q77 63 59 33L67 58Q77 78 101 88Z' />
        </g>
        <path fill={`url(#${id}-head)`} d='M81 88L35 99 40 105 49 104 46 110 58 108 57 113 89 99Z' />
        <path fill='none' stroke='#a7ada9' strokeWidth='1.2' d='M43 102L78 92M53 106L80 95M61 108L82 98' />
        <path fill={`url(#${id}-body)`} d='M65 90Q87 74 115 77L143 75 153 85Q138 100 112 102L79 99Z' />
        <g className={styles.eagleWingFront}>
          <path
            fill={`url(#${id}-wing)`}
            d='M118 84Q107 67 92 57L69 29 51 10Q46 7 48 14L60 37 38 18Q32 14 35 23L52 47 28 30Q22 27 26 35L47 58 23 45Q17 43 22 51L45 70 26 62Q20 61 26 68L49 85Q76 102 109 97Z'
          />
          <path fill='#bd9b72' opacity='.4' d='M112 85Q90 72 76 57L56 32 71 64Q85 83 106 91Z' />
          <path
            fill='none'
            stroke='#302923'
            strokeOpacity='.5'
            strokeWidth='1.5'
            strokeLinecap='round'
            d='M60 37L82 70M52 47L77 76M47 58L72 81M45 70L66 85M49 85L75 90'
          />
          <path
            fill='none'
            stroke='#c3a17c'
            strokeOpacity='.5'
            strokeWidth='1.3'
            strokeLinecap='round'
            d='M80 68L90 82M88 73L98 86M96 78L106 89'
          />
        </g>
        <path
          fill={`url(#${id}-head)`}
          d='M132 78Q137 67 149 67 160 66 166 73L173 77 165 85Q159 92 148 91L141 95 142 90 135 92 137 86 130 87Z'
        />
        <path fill='#dfa83e' d='M164 75Q177 74 182 81L179 89 175 83 164 82Z' />
        <path fill='none' stroke='#a9762e' strokeWidth='1.2' strokeLinecap='round' d='M167 80L176 81' />
        <path fill='#554b3a' d='M153 74L162 74 158 77Z' />
        <circle fill='#e5b44c' cx='158' cy='76' r='2' />
        <circle fill='#20252a' cx='158.5' cy='76' r='1.1' />
        <path fill='none' stroke='#fffef6' strokeWidth='1.6' strokeLinecap='round' d='M151 72L162 73' />
      </svg>
    </div>
  )
}

const Homepage = () => {
  const { mode, systemMode } = useColorScheme()
  const { settings } = useSettings()
  const currentMode = mode === 'system' ? systemMode : mode || settings.mode
  const isDark = currentMode === 'dark'

  const globeConfig = useMemo<COBEOptions>(
    () => ({
      width: 1000,
      height: 1000,
      onRender: () => undefined,
      devicePixelRatio: 2,
      phi: 0.15,
      theta: 0.24,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 1.1 : 0.65,
      mapSamples: 26000,
      mapBrightness: isDark ? 3.2 : 1.45,
      baseColor: isDark ? [0.22, 0.23, 0.3] : [0.78, 0.87, 0.9],
      markerColor: isDark ? [0.7, 0.71, 0.84] : [0.27, 0.42, 0.52],
      glowColor: isDark ? [0.11, 0.11, 0.15] : [0.95, 0.96, 0.98],
      markers: []
    }),
    [isDark]
  )

  return (
    <main className={styles.home} data-theme={isDark ? 'dark' : 'light'}>
      <div className={styles.globeStage}>
        <Globe className={styles.globe} config={globeConfig} />
      </div>
      <FlyingEagle />
      <div className={styles.dragHint} aria-hidden='true'>
        <span>↔</span>
        Drag to rotate
      </div>
    </main>
  )
}

export default Homepage
