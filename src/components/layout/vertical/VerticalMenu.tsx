// MUI Imports
import { useTheme } from '@mui/material/styles'
import type { UIEvent } from 'react'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import menuData from '@_workspace/navigation/verticalMenuData'
import { useUserGroupStore } from '@/libs/zustand/stores/useUserGroupStore'
import { useGetMenuMergeUserGroupByUserNameAndApplicationId } from '@/libs/react-query/hooks/security-center-system/useGetMenu'
import type { getDictionary } from '@/utils/getDictionary'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import { GenerateVerticalMenu } from '@/components/GenerateMenu'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  scrollMenu: (container: HTMLElement | UIEvent<HTMLElement>, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)
const getUrlParamSearch = (selectedGroup: string) => {
  let params = ``

  params += `"APPLICATION_ID": "${import.meta.env.VITE_APPLICATION_ID}"`
  params += `, "USER_NAME":"${getUserData().USER_NAME}"`
  params += `, "USER_GROUP_NAME":"${selectedGroup}"`
  params = `{${params}}`

  return params
}

const VerticalMenu = ({ dictionary, scrollMenu }: Props) => {
  //zustand
  const selectedGroup = useUserGroupStore(state => state.selectedGroup)

  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const { data } = useGetMenuMergeUserGroupByUserNameAndApplicationId(getUrlParamSearch(selectedGroup), true)
  const permissions = data?.data?.ResultOnDb ?? []
  const menu = menuData(dictionary).filter(
    item =>
      'id' in item &&
      typeof item.id === 'number' &&
      permissions.some(
        permission =>
          Number(permission.id) === item.id || permission.children?.some(child => Number(child.id) === item.id)
      )
  )

  return (
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      {/* <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
          Home
        </MenuItem>
        <MenuItem href='/about' icon={<i className='tabler-info-circle' />}>
          About
        </MenuItem>
      </Menu> */}
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <GenerateVerticalMenu menuData={menu} />
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
