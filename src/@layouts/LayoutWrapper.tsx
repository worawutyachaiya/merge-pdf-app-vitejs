'use client'

// React Imports
import { useEffect, type CSSProperties, type ReactElement } from 'react'

// Type Imports
import type { SystemMode } from '@core/types'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useLayoutInit from '@core/hooks/useLayoutInit'
import { useBackgroundStore } from '@/libs/zustand/stores/useBackgroundStore'
import SeasonalThemeLayer from '@/components/layout/shared/SeasonalThemeLayer'
import { useSeasonalThemeStore } from '@/libs/zustand/stores/useSeasonalThemeStore'

// DX Imports
import './RainbowStyle.css'
import classNames from 'classnames'

type LayoutWrapperProps = {
  systemMode: SystemMode
  verticalLayout: ReactElement
  horizontalLayout: ReactElement
}

type BackgroundStyle = CSSProperties & {
  '--app-user-background-shading'?: number
}

const LayoutWrapper = (props: LayoutWrapperProps) => {
  // Props
  const { systemMode, verticalLayout, horizontalLayout } = props

  // Hooks
  const { settings } = useSettings()
  const imageUrl = useBackgroundStore(state => state.imageUrl)
  const shading = useBackgroundStore(state => state.shading)
  const loadBackground = useBackgroundStore(state => state.loadBackground)
  const seasonalTheme = useSeasonalThemeStore(state => state.theme)
  const envName = import.meta.env.VITE_ENV_NAME?.toLowerCase()
  const environmentTone = envName === 'sit' || envName === 'uat' ? envName : undefined
  const backgroundStyle: BackgroundStyle | undefined = imageUrl
    ? { '--app-user-background-shading': shading / 100 }
    : undefined

  useLayoutInit(systemMode)

  useEffect(() => {
    void loadBackground()
  }, [loadBackground])

  // Return the layout based on the layout context
  return (
    // <div className='flex flex-col flex-auto' data-skin={settings.skin}>
    //   {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}
    // </div>
    <div
      className={classNames(settings.mode, 'app-environment-shell flex flex-col flex-auto')}
      data-app-env={environmentTone}
      data-seasonal-theme={seasonalTheme}
      data-custom-background={imageUrl ? 'true' : undefined}
      data-skin={settings.skin}
      style={backgroundStyle}
    >
      {imageUrl && (
        <div
          aria-hidden='true'
          className='app-user-background-layer'
          style={{ backgroundImage: `url("${imageUrl}")` } as CSSProperties}
        />
      )}
      <SeasonalThemeLayer />
      {!imageUrl && <div className='w-full margin-auto jumbo absolute opacity-60 -animate' data-v-a742e9dc></div>}
      {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}
    </div>
  )
}

export default LayoutWrapper
