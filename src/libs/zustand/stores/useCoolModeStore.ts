import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CoolModeParticle = 'circle' | '☘️' | '❄️' | '💸' | '❤️' | '✨'

const COOL_MODE_PARTICLES: CoolModeParticle[] = ['circle', '☘️', '❄️', '💸', '❤️', '✨']

const isCoolModeParticle = (value: unknown): value is CoolModeParticle =>
  COOL_MODE_PARTICLES.includes(value as CoolModeParticle)

type CoolModeState = {
  particle: CoolModeParticle
  setParticle: (particle: CoolModeParticle) => void
}

export const useCoolModeStore = create<CoolModeState>()(
  persist(
    set => ({
      particle: 'circle',
      setParticle: particle => set({ particle })
    }),
    {
      name: 'cool-mode-storage',
      partialize: state => ({ particle: state.particle }),
      merge: (persistedState, currentState) => {
        const storedParticle = (persistedState as Partial<CoolModeState>)?.particle

        return {
          ...currentState,
          particle: isCoolModeParticle(storedParticle) ? storedParticle : 'circle'
        }
      }
    }
  )
)
