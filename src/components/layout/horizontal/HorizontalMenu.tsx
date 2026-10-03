// MUI Imports
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import HorizontalNav, { Menu } from '@menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from '@menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/horizontal/menuItemStyles'
import menuRootStyles from '@core/styles/horizontal/menuRootStyles'
import verticalNavigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import verticalMenuItemStyles from '@core/styles/vertical/menuItemStyles'
import verticalMenuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import menuData from '@_workspace/navigation/verticalMenuData'
import { GenerateHorizontalMenu } from '@/components/GenerateMenu'
import { useUserGroupStore } from '@/libs/zustand/stores/useUserGroupStore'
import { useGetMenuMergeUserGroupByUserNameAndApplicationId } from '@/libs/react-query/hooks/security-center-system/useGetMenu'
import type { MenuI } from '@/types/security-center-system/MenuTypes'
import type { HorizontalMenuDataType, VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

type RenderExpandIconProps = {
  level?: number
}

type RenderVerticalExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type PermissionChild = {
  id?: string
}

type WorkspaceMenuDataType = VerticalMenuDataType & {
  id?: number
  isSection?: boolean
  children?: WorkspaceMenuDataType[]
}

const RenderExpandIcon = ({ level }: RenderExpandIconProps) => (
  <StyledHorizontalNavExpandIcon level={level}>
    <i className='tabler-chevron-right' />
  </StyledHorizontalNavExpandIcon>
)

const RenderVerticalExpandIcon = ({ open, transitionDuration }: RenderVerticalExpandIconProps) => (
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

const getMenuIntersection = (
  menuChildren: WorkspaceMenuDataType[] = [],
  permissionChildren: PermissionChild[] = []
) => {
  return menuChildren.filter(menuItem =>
    permissionChildren.some(permission => Number(menuItem.id) === Number(permission.id))
  )
}

const getAllowedMenuItem = (item: WorkspaceMenuDataType, permissionMenuData: MenuI[]) => {
  const permissionItem = permissionMenuData.find(
    permission =>
      Number(permission.id) === Number(item.id) ||
      permission.children?.some(child => Number(child.id) === Number(item.id))
  )

  if (!permissionItem) return null

  if (item.children && permissionItem.children) {
    const children = getMenuIntersection(item.children, permissionItem.children)

    return children.length > 0 ? ({ ...item, children } as WorkspaceMenuDataType) : null
  }

  return item
}

const buildHorizontalMenu = (dictionary: Awaited<ReturnType<typeof getDictionary>>, permissionMenuData: MenuI[]) => {
  const menu: HorizontalMenuDataType[] = []
  const menuPermission = menuData(dictionary) as WorkspaceMenuDataType[]
  let currentSection: WorkspaceMenuDataType | null = null

  for (let i = 0; i < menuPermission.length; i++) {
    const item = menuPermission[i]

    if (item.isSection) {
      currentSection = {
        label: item.label,
        icon: 'tabler-layout-list',
        children: []
      }

      menu.push(currentSection as unknown as HorizontalMenuDataType)

      continue
    }

    const allowedItem = getAllowedMenuItem(item, permissionMenuData)

    if (!allowedItem) continue

    if (currentSection) {
      currentSection.children?.push(allowedItem)
    } else {
      menu.push(allowedItem as unknown as HorizontalMenuDataType)
    }
  }

  return menu.filter(item => !('children' in item) || item.children.length > 0)
}

const HorizontalMenu = ({ dictionary }: { dictionary: Awaited<ReturnType<typeof getDictionary>> }) => {
  // Hooks
  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()
  const selectedGroup = useUserGroupStore(state => state.selectedGroup)
  const { data, isSuccess } = useGetMenuMergeUserGroupByUserNameAndApplicationId(getUrlParamSearch(selectedGroup), true)

  // Vars
  const { transitionDuration } = verticalNavOptions
  const permissionMenuData = isSuccess ? ((data?.data?.ResultOnDb as unknown as MenuI[]) ?? []) : []
  const menu = buildHorizontalMenu(dictionary, permissionMenuData)

  return (
    <HorizontalNav
      switchToVertical
      verticalNavContent={VerticalNavContent}
      verticalNavProps={{
        customStyles: verticalNavigationCustomStyles(verticalNavOptions, theme),
        backgroundColor: 'var(--mui-palette-background-paper)'
      }}
    >
      <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(theme, 'tabler-circle')}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        <GenerateHorizontalMenu menuData={menu} />
      </Menu>
    </HorizontalNav>
  )
}

export default HorizontalMenu
