// React Imports
import { useState } from 'react'

// Next Imports

// MUI Imports
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Divider from '@mui/material/Divider'
import type { Breakpoint } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'
import { useDebounce } from 'react-use'
import { HexColorPicker, HexColorInput } from 'react-colorful'

// Type Imports
import type { Settings } from '@core/contexts/settingsContext'
import type { Direction } from '@core/types'
import type { PrimaryColorConfig } from '@configs/primaryColorConfig'

// Icon Imports

// Config Imports
import primaryColorConfig from '@configs/primaryColorConfig'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Style Imports
import styles from './styles.module.css'
import BackgroundCustomizer from './BackgroundCustomizer'

type CustomizerProps = {
  breakpoint?: Breakpoint | 'xxl' | `${number}px` | `${number}rem` | `${number}em`
  dir?: Direction
  disableDirection?: boolean
  isShowPrimaryPalette?: boolean
}

type DebouncedColorPickerProps = {
  settings: Settings
  isColorFromPrimaryConfig: PrimaryColorConfig | undefined
  handleChange: (field: keyof Settings | 'primaryColor', value: Settings[keyof Settings] | string) => void
}

const DebouncedColorPicker = (props: DebouncedColorPickerProps) => {
  // Props
  const { settings, isColorFromPrimaryConfig, handleChange } = props

  // States
  const [debouncedColor, setDebouncedColor] = useState(settings.primaryColor ?? primaryColorConfig[0].main)

  // Hooks
  useDebounce(() => handleChange('primaryColor', debouncedColor), 200, [debouncedColor])

  return (
    <>
      <HexColorPicker
        color={!isColorFromPrimaryConfig ? (settings.primaryColor ?? primaryColorConfig[0].main) : '#eee'}
        onChange={setDebouncedColor}
      />
      <HexColorInput
        className={styles.colorInput}
        color={!isColorFromPrimaryConfig ? (settings.primaryColor ?? primaryColorConfig[0].main) : '#eee'}
        onChange={setDebouncedColor}
        prefixed
        placeholder='Type a color'
      />
    </>
  )
}

const ColorMode = ({ isShowPrimaryPalette = true }: CustomizerProps) => {
  // States
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

  // Hooks
  const { settings, updateSettings } = useSettings()

  // Vars

  const isColorFromPrimaryConfig = primaryColorConfig.find(item => item.main === settings.primaryColor)

  // Update Settings
  const handleChange = (field: keyof Settings | 'direction', value: Settings[keyof Settings] | Direction) => {
    // Update direction state
    if (field === 'direction') {
      //setDirection(value as Direction)
    } else {
      // Update settings in cookie
      updateSettings({ [field]: value })
    }
  }

  const handleMenuClose = (event: MouseEvent | TouchEvent): void => {
    if (anchorEl?.contains(event.target as HTMLElement)) {
      return
    }

    setIsMenuOpen(false)
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <div
          className={classnames(styles.primaryColorWrapper, {})}
          onClick={event => {
            setAnchorEl(event.currentTarget)
            setIsMenuOpen(prev => !prev)
          }}
        >
          <div
            className={classnames(styles.primaryColor, 'flex items-center justify-center')}
            style={{
              backgroundColor: !isColorFromPrimaryConfig ? settings.primaryColor : 'var(--mui-palette-action-selected)',
              color: isColorFromPrimaryConfig
                ? 'var(--mui-palette-text-primary)'
                : 'var(--mui-palette-primary-contrastText)'
            }}
          >
            <i className='tabler-color-picker text-xl' />
          </div>
        </div>

        {isShowPrimaryPalette &&
          primaryColorConfig.map(item => (
            <div
              key={item.main}
              className={classnames('m-1', styles.primaryColorWrapper, {
                [styles.active]: settings.primaryColor === item.main
              })}
              onClick={() => handleChange('primaryColor', item.main)}
            >
              <div className={styles.primaryColor} style={{ backgroundColor: item.main }} />
            </div>
          ))}
        <Popper transition open={isMenuOpen} disablePortal anchorEl={anchorEl} placement='bottom-end' className='z-[1]'>
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} style={{ transformOrigin: 'right top' }}>
              <Paper elevation={6} className={styles.colorPopup}>
                <ClickAwayListener onClickAway={handleMenuClose}>
                  <div>
                    <DebouncedColorPicker
                      settings={settings}
                      isColorFromPrimaryConfig={isColorFromPrimaryConfig}
                      handleChange={handleChange}
                    />
                    <Divider sx={{ my: 4 }} />
                    <BackgroundCustomizer />
                  </div>
                </ClickAwayListener>
              </Paper>
            </Fade>
          )}
        </Popper>
      </div>
    </div>
  )
}

export default ColorMode
