'use client'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import Logo from '@components/layout/shared/Logo'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'
import { Divider, Typography, useMediaQuery, useTheme } from '@mui/material'
import ColorMode from '../shared/ColorMode'
import CoolModeSelector from '../shared/CoolModeSelector'
import LayoutModeToggle from '../shared/LayoutModeToggle'
import BrowserFullscreenToggle from '../shared/BrowserFullscreenToggle'
import EnvironmentStatus from '../shared/EnvironmentStatus'
import ModeScreenFullWidth from '../shared/ScreenFullWidthContainerSwitch'
import { ModeDropdownToggler } from '../shared/ModeDropdownToggler'
import NavSearch from '../shared/search'

const NavbarContent = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()
  const theme = useTheme()
  const belowMdScreen = useMediaQuery(theme.breakpoints.down('md'))
  const belowSmScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <div
      className={classnames(horizontalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
    >
      <div className='flex items-center gap-4'>
        <NavToggle />
        {/* Hide Logo on Smaller screens */}
        {!isBreakpointReached && (
          <div className='flex items-center gap-3'>
            <Logo />
            <Typography variant='subtitle2' className='font-semibold text-textPrimary flex-shrink-0'>
              {import.meta.env.VITE_APPLICATION_VERSION}
            </Typography>
          </div>
        )}
        {belowMdScreen === false ? <EnvironmentStatus /> : null}
      </div>
      <div className='flex items-center'>
        {!belowSmScreen && <NavSearch />}
        <CoolModeSelector />
        <Divider className='mr-2' orientation='vertical' flexItem />
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
