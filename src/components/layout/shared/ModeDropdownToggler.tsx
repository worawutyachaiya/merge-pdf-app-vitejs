'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'
import { useMedia } from 'react-use'

import Tooltip from '@mui/material/Tooltip'
import { useColorScheme } from '@mui/material/styles'

import { cn } from '@/libs/utils'
import { useSettings } from '@core/hooks/useSettings'

import styles from './ModeDropdownToggler.module.css'

type AnimationPhase = 'idle' | 'dance' | 'merge' | 'wave'
type ThemeMode = 'light' | 'dark'

type ThemeViewTransition = {
  ready: Promise<void>
  finished: Promise<void>
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (updateTheme: () => void) => ThemeViewTransition
}

interface AnimatedThemeTogglerProps extends ComponentPropsWithoutRef<'button'> {
  duration?: number
}

const DANCE_DURATION = 560
const MERGE_DURATION = 200

export const ModeDropdownToggler = ({ className, duration = 900, ...props }: AnimatedThemeTogglerProps) => {
  const { settings, updateSettings } = useSettings()
  const { mode } = useColorScheme()
  const prefersDark = useMedia('(prefers-color-scheme: dark)', false)
  const animationTimersRef = useRef<number[]>([])
  const mountedRef = useRef(true)
  const [phase, setPhase] = useState<AnimationPhase>('idle')
  const [targetMode, setTargetMode] = useState<ThemeMode>('dark')

  const isDark = mode ? mode === 'dark' : settings.mode === 'dark' || (settings.mode === 'system' && prefersDark)
  const isAnimating = phase !== 'idle'

  const clearAnimationTimers = useCallback(() => {
    animationTimersRef.current.forEach(window.clearTimeout)
    animationTimersRef.current = []
  }, [])

  const applyTheme = useCallback(
    (nextMode: ThemeMode) => {
      updateSettings({ mode: nextMode })
      document.documentElement.classList.toggle('dark', nextMode === 'dark')
    },
    [updateSettings]
  )

  const runWaveTransition = useCallback(
    async (nextMode: ThemeMode) => {
      const transitionDocument = document as DocumentWithViewTransition
      const startViewTransition = transitionDocument.startViewTransition?.bind(transitionDocument)

      if (!startViewTransition) {
        applyTheme(nextMode)
        setPhase('idle')
        return
      }

      let themeWasApplied = false

      try {
        const transition = startViewTransition(() => {
          flushSync(() => {
            // The old snapshot keeps the round mascot while the new snapshot
            // starts revealing the changed theme from that exact same circle.
            setPhase('wave')
            applyTheme(nextMode)
            themeWasApplied = true
          })
        })

        await transition.ready

        const waveRadius = Math.hypot(window.innerWidth / 2, window.innerHeight / 2)
        const wave = document.documentElement.animate(
          {
            clipPath: ['circle(54px at 50% 50%)', `circle(${waveRadius}px at 50% 50%)`]
          },
          {
            duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'both',
            pseudoElement: '::view-transition-new(root)'
          }
        )

        await Promise.allSettled([wave.finished, transition.finished])
      } catch {
        if (!themeWasApplied) applyTheme(nextMode)
      } finally {
        if (mountedRef.current) setPhase('idle')
      }
    },
    [applyTheme, duration]
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      clearAnimationTimers()
    }
  }, [clearAnimationTimers])

  const toggleTheme = useCallback(() => {
    if (isAnimating) return

    const nextMode: ThemeMode = isDark ? 'light' : 'dark'
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      applyTheme(nextMode)
      return
    }

    clearAnimationTimers()
    setTargetMode(nextMode)
    setPhase('dance')
    animationTimersRef.current.push(
      window.setTimeout(() => setPhase('merge'), DANCE_DURATION),
      window.setTimeout(() => void runWaveTransition(nextMode), DANCE_DURATION + MERGE_DURATION)
    )
  }, [applyTheme, clearAnimationTimers, isAnimating, isDark, runWaveTransition])

  return (
    <>
      <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
        <button
          {...props}
          type='button'
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          aria-pressed={isDark}
          aria-disabled={isAnimating}
          className={cn(styles.toggleButton, className)}
          onClick={toggleTheme}
        >
          <span className={styles.iconWrap} aria-hidden='true'>
            {isDark ? <Sun size={21} /> : <Moon size={21} />}
          </span>
        </button>
      </Tooltip>

      {(phase === 'dance' || phase === 'merge') &&
        createPortal(
          <div className={styles.transitionLayer} data-phase={phase} data-target-theme={targetMode} aria-hidden='true'>
            <div className={styles.mascotStage}>
              <span className={`${styles.sparkle} ${styles.sparkleLeft}`} />
              <span className={`${styles.sparkle} ${styles.sparkleRight}`} />
              <div className={styles.mascot}>
                <span className={styles.antennaRack}>
                  <span className={`${styles.antenna} ${styles.antennaShort}`} />
                  <span className={`${styles.antenna} ${styles.antennaMedium}`} />
                  <span className={`${styles.antenna} ${styles.antennaTall}`} />
                </span>
                <span className={`${styles.ear} ${styles.earLeft}`} />
                <span className={`${styles.ear} ${styles.earRight}`} />
                <span className={`${styles.arm} ${styles.armLeft}`} />
                <span className={`${styles.arm} ${styles.armRight}`} />
                <span className={`${styles.leg} ${styles.legLeft}`} />
                <span className={`${styles.leg} ${styles.legRight}`} />
                <span className={styles.facePanel} />
                <span className={`${styles.eye} ${styles.eyeLeft}`} />
                <span className={`${styles.eye} ${styles.eyeRight}`} />
                <span className={styles.cheekLeft} />
                <span className={styles.cheekRight} />
                <span className={styles.smile} />
                <span className={styles.chestPanel}>
                  <span className={styles.chestMark}>FITEL</span>
                  <span className={styles.chestLight} />
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
