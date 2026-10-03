'use client'

import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import { useSettings } from '@core/hooks/useSettings'

const LayoutModeToggle = () => {
  const { settings, updateSettings } = useSettings()

  const isHorizontal = settings.layout === 'horizontal'
  const nextLayout = isHorizontal ? 'vertical' : 'horizontal'

  return (
    <Tooltip title={isHorizontal ? 'Switch to vertical layout' : 'Switch to horizontal layout'}>
      <IconButton className='text-textPrimary' onClick={() => updateSettings({ layout: nextLayout })}>
        <i className={isHorizontal ? 'tabler-layout-sidebar-left-expand' : 'tabler-layout-navbar'} />
      </IconButton>
    </Tooltip>
  )
}

export default LayoutModeToggle
