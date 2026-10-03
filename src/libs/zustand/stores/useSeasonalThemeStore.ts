import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SeasonalTheme = 'default' | 'winter' | 'rainy' | 'autumn'
export type SeasonalThemeIntensity = 'low' | 'medium' | 'high'

const THEMES: SeasonalTheme[] = ['default', 'winter', 'rainy', 'autumn']
const INTENSITIES: SeasonalThemeIntensity[] = ['low', 'medium', 'high']

type SeasonalThemeState = {
  theme: SeasonalTheme
  intensity: SeasonalThemeIntensity
  setTheme: (theme: SeasonalTheme) => void
  setIntensity: (intensity: SeasonalThemeIntensity) => void
}

export const useSeasonalThemeStore = create<SeasonalThemeState>()(
  persist(
    set => ({
      theme: 'default',
      intensity: 'medium',
      setTheme: theme => set({ theme }),
      setIntensity: intensity => set({ intensity })
    }),
    {
      name: 'seasonal-theme-storage',
      partialize: state => ({ theme: state.theme, intensity: state.intensity }),
      merge: (persistedState, currentState) => {
        const stored = persistedState as { theme?: unknown; intensity?: unknown }
        const storedTheme = stored.theme === 'summer' ? 'rainy' : stored.theme

        return {
          ...currentState,
          theme: THEMES.includes(storedTheme as SeasonalTheme) ? (storedTheme as SeasonalTheme) : 'default',
          intensity: INTENSITIES.includes(stored.intensity as SeasonalThemeIntensity)
            ? (stored.intensity as SeasonalThemeIntensity)
            : 'medium'
        }
      }
    }
  )
)
