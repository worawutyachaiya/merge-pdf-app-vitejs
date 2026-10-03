'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { Link } from 'react-router'

// MUI Imports
import { styled, useColorScheme, useTheme } from '@mui/material/styles'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import VerticalNav, { NavHeader, NavCollapseIcons } from '@menu/vertical-menu'
import VerticalMenu from './VerticalMenu'
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

// Style Imports
import navigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import type { getDictionary } from '@/utils/getDictionary'
import { Typography } from '@mui/material'

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  mode: Mode
}

const StyledNavHeaderFrame = styled('div')<{ scrolled: boolean }>(({ scrolled, theme }) => ({
  position: 'relative',
  zIndex: 2,
  borderBottom: scrolled ? `1px solid ${theme.palette.divider}` : '1px solid transparent',
  boxShadow: scrolled ? 'var(--mui-customShadows-xs)' : 'none',
  transition: theme.transitions.create(['border-color', 'box-shadow'], {
    duration: theme.transitions.duration.shorter
  })
}))

const Navigation = (props: Props) => {
  // Props
  const { dictionary, mode } = props

  // Hooks
  const verticalNavOptions = useVerticalNav()
  const { updateSettings, settings } = useSettings()
  const { mode: muiMode, systemMode: muiSystemMode } = useColorScheme()
  const theme = useTheme()

  const [isMenuScrolled, setIsMenuScrolled] = useState(false)

  // Vars
  const { isCollapsed, isHovered, collapseVerticalNav, isBreakpointReached } = verticalNavOptions
  const isSemiDark = settings.semiDark
  const isCollapsedWithoutHover = isCollapsed && !isHovered

  const currentMode = muiMode === 'system' ? muiSystemMode : muiMode || mode

  const isDark = currentMode === 'dark'

  const scrollMenu = (container: any, isPerfectScrollbar: boolean) => {
    container = isBreakpointReached || !isPerfectScrollbar ? container.target : container

    setIsMenuScrolled(container.scrollTop > 0)
  }

  useEffect(() => {
    if (settings.layout === 'collapsed') {
      collapseVerticalNav(true)
    } else {
      collapseVerticalNav(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.layout])

  return (
    // Sidebar Vertical Menu
    <VerticalNav
      customStyles={navigationCustomStyles(verticalNavOptions, theme)}
      collapsedWidth={71}
      width={300}
      backgroundColor={isCollapsed || isBreakpointReached ? 'var(--mui-palette-background-paper)' : 'transparent'}
      // The following condition adds the data-dark attribute to the VerticalNav component
      // when semiDark is enabled and the mode or systemMode is light
      {...(isSemiDark &&
        !isDark && {
          'data-dark': ''
        })}
    >
      {/* Nav Header including Logo & nav toggle icons  */}
      <StyledNavHeaderFrame scrolled={isMenuScrolled}>
        <NavHeader>
          <Link to='/'>
            <Logo />
          </Link>
          {!isCollapsedWithoutHover && (
            <Typography variant='subtitle2' className='mr-3 font-semibold text-textPrimary flex-shrink-0'>
              {import.meta.env.VITE_APPLICATION_VERSION}
            </Typography>
          )}
          {!isCollapsedWithoutHover && (
            <NavCollapseIcons
              lockedIcon={<i className='tabler-circle-dot text-xl' />}
              unlockedIcon={<i className='tabler-circle text-xl' />}
              closeIcon={<i className='tabler-x text-xl' />}
              onClick={() => updateSettings({ layout: !isCollapsed ? 'collapsed' : 'vertical' })}
            />
          )}
        </NavHeader>
      </StyledNavHeaderFrame>
      <VerticalMenu dictionary={dictionary} scrollMenu={scrollMenu} />
    </VerticalNav>
  )
}

export default Navigation
