// React Imports
import { useRef } from 'react'

// Third-party Imports

// MUI Imports
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const ModeScreenFullWidth = () => {
  // States

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const { settings, updateSettings } = useSettings()

  const ScreenMode = () => {
    if (settings.contentWidth === 'compact') {
      return (
        <Tooltip title={'Wide Mode'}>
          <IconButton
            ref={anchorRef}
            onClick={() =>
              updateSettings({
                navbarContentWidth: 'wide',
                contentWidth: 'wide',
                footerContentWidth: 'wide'
              })
            }
            className='text-textPrimary'
          >
            <i className='tabler-arrow-autofit-width text-[22px]' />
          </IconButton>
        </Tooltip>
      )
    } else {
      return (
        <Tooltip title={'Compact Mode'}>
          <IconButton
            ref={anchorRef}
            onClick={() =>
              updateSettings({ navbarContentWidth: 'compact', contentWidth: 'compact', footerContentWidth: 'compact' })
            }
            className='text-textPrimary'
          >
            <i className='tabler-align-center  text-[22px]' />
          </IconButton>
        </Tooltip>
      )
    }
  }

  return (
    <>
      <ScreenMode />
    </>
  )
}

export default ModeScreenFullWidth
