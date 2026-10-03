'use client'

import { useEffect, useState } from 'react'

import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

const BrowserFullscreenToggle = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    setIsSupported(Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen))
    handleFullscreenChange()

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const handleToggleFullscreen = async () => {
    if (!isSupported) return

    if (document.fullscreenElement) {
      await document.exitFullscreen()

      return
    }

    await document.documentElement.requestFullscreen()
  }

  return (
    <Tooltip title={isFullscreen ? 'Exit browser fullscreen' : 'Browser fullscreen'}>
      <span>
        <IconButton className='text-textPrimary' disabled={!isSupported} onClick={handleToggleFullscreen}>
          <i className={`${isFullscreen ? 'tabler-minimize' : 'tabler-maximize'} text-[22px]`} />
        </IconButton>
      </span>
    </Tooltip>
  )
}

export default BrowserFullscreenToggle
