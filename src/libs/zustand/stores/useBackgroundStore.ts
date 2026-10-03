import { create } from 'zustand'

import {
  DEFAULT_BACKGROUND_SHADING,
  deleteUserBackground,
  getUserBackground,
  saveUserBackground,
  saveUserBackgroundShading
} from '@/libs/indexed-db/userBackgroundStorage'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

type BackgroundState = {
  imageUrl: string | null
  shading: number
  isLoading: boolean
  isSaving: boolean
  error: string | null
  loadBackground: () => Promise<void>
  saveBackground: (image: Blob) => Promise<void>
  setShading: (shading: number) => void
  persistShading: () => Promise<void>
  resetBackground: () => Promise<void>
}

let activeObjectUrl: string | null = null

const getStorageKey = (): string | null => {
  const user = getUserData()
  const userId = String(user.USER_ID || user.EMPLOYEE_CODE || '').trim()

  if (!userId) return null

  return `${import.meta.env.VITE_APPLICATION_ID || 'master-data'}:${userId}`
}

const replaceObjectUrl = (image: Blob | null): string | null => {
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl)

  activeObjectUrl = image ? URL.createObjectURL(image) : null

  return activeObjectUrl
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to update the background image.'

export const useBackgroundStore = create<BackgroundState>((set, get) => ({
  imageUrl: null,
  shading: DEFAULT_BACKGROUND_SHADING,
  isLoading: false,
  isSaving: false,
  error: null,

  loadBackground: async () => {
    const storageKey = getStorageKey()

    if (!storageKey) return

    set({ isLoading: true, error: null })

    try {
      const preferences = await getUserBackground(storageKey)

      set({
        imageUrl: replaceObjectUrl(preferences.image),
        shading: preferences.shading,
        isLoading: false
      })
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) })
    }
  },

  saveBackground: async image => {
    const storageKey = getStorageKey()

    if (!storageKey) {
      set({ error: 'User information is unavailable. Please sign in again.' })

      return
    }

    set({ isSaving: true, error: null })

    try {
      await saveUserBackground(storageKey, image, get().shading)
      set({ imageUrl: replaceObjectUrl(image), isSaving: false })
    } catch (error) {
      set({ isSaving: false, error: getErrorMessage(error) })
      throw error
    }
  },

  setShading: shading => set({ shading }),

  persistShading: async () => {
    const storageKey = getStorageKey()

    if (!storageKey || !get().imageUrl) return

    try {
      await saveUserBackgroundShading(storageKey, get().shading)
    } catch (error) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  resetBackground: async () => {
    const storageKey = getStorageKey()

    if (!storageKey) return

    set({ isSaving: true, error: null })

    try {
      await deleteUserBackground(storageKey)
      set({ imageUrl: replaceObjectUrl(null), shading: DEFAULT_BACKGROUND_SHADING, isSaving: false })
    } catch (error) {
      set({ isSaving: false, error: getErrorMessage(error) })
      throw error
    }
  }
}))
