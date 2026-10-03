// Next Imports
import Cookies from 'js-cookie'

// Third-party Imports
// import 'server-only'

// Type Imports
import type { Settings } from '@core/contexts/settingsContext'
import type { SystemMode } from '@core/types'

// Config Imports
import themeConfig from '@configs/themeConfig'

export const getSettingsFromCookie = (): Settings => {
  // const cookieStore = await cookies()

  const cookieName = themeConfig.settingsCookieName

  //return JSON.parse(cookieStore.get(cookieName)?.value || '{}')
  return JSON.parse(Cookies.get(cookieName) || '{}')
}

export const getMode = () => {
  const settingsCookie = getSettingsFromCookie()

  // Get mode from cookie or fallback to theme config
  const _mode = settingsCookie.mode || themeConfig.mode

  return _mode
}

export const getSystemMode = (): SystemMode => {
  //const cookieStore = await cookies()
  //const mode = await getMode()
  const mode = getMode()

  //const colorPrefCookie = (cookieStore.get('colorPref')?.value || 'light') as SystemMode
  const colorPrefCookie = (Cookies.get('colorPref') || 'light') as SystemMode

  //return (mode === 'system' ? colorPrefCookie : mode) || 'light'
  return (mode === 'system' ? colorPrefCookie : mode) || 'light'
}

export const getServerMode = () => {
  const mode = getMode()
  const systemMode = getSystemMode()

  return mode === 'system' ? systemMode : mode
}

export const getSkin = () => {
  const settingsCookie = getSettingsFromCookie()

  return settingsCookie.skin || 'default'
}
