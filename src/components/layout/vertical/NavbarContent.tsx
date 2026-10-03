'use client'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import { Divider, useMediaQuery, useTheme } from '@mui/material'

import BrowserFullscreenToggle from '../shared/BrowserFullscreenToggle'
import CoolModeSelector from '../shared/CoolModeSelector'
import EnvironmentStatus from '../shared/EnvironmentStatus'
import ModeScreenFullWidth from '../shared/ScreenFullWidthContainerSwitch'
import ColorMode from '../shared/ColorMode'
import LayoutModeToggle from '../shared/LayoutModeToggle'
import { ModeDropdownToggler } from '../shared/ModeDropdownToggler'
import NavSearch from '../shared/search'

const NavbarContent = () => {
  // Hooks
  const theme = useTheme()
  const belowMdScreen = useMediaQuery(theme.breakpoints.down('md'))
  const belowSmScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        <NavSearch />
        {belowMdScreen === false ? <EnvironmentStatus /> : null}
      </div>
      <div className='flex items-center'>
        <CoolModeSelector />
        <Divider className='mr-2' orientation='vertical' flexItem />
        {/* <LanguageDropdown /> */}
        <LayoutModeToggle />
        {belowSmScreen ? null : (
          <>
            <ModeScreenFullWidth />
            <BrowserFullscreenToggle />
            <Divider className='mr-2' orientation='vertical' flexItem />
          </>
        )}
        <ModeDropdownToggler />
        <ColorMode isShowPrimaryPalette={!belowSmScreen} />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
