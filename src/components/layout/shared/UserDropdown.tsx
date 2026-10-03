// React Imports
import type { MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

// Next Imports
import { useParams } from 'react-router'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Divider from '@mui/material/Divider'
import Fade from '@mui/material/Fade'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Typography from '@mui/material/Typography'

// Third-party Imports

// Type Imports
import type { Locale } from '@configs/i18n'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
// import { AuroraText } from '@/components/magicui/ui/aurora-text'
import { ImageEmployeeFromURL } from '@/libs/react-query/hooks/common-system/useImageData'
import { usesCreateUserGroupApplication } from '@/libs/react-query/hooks/common-system/useUserProfileSettingProgram'
import { fetchUserGroupFilterApp } from '@/libs/react-select/async-promise-load-options/securtity-center-system/fetchUserGroup'
import { useUserGroupStore } from '@/libs/zustand/stores/useUserGroupStore'
import { getLocalizedUrl } from '@/utils/i18n'
import type { UserProps } from '@/utils/types/UserType'
import { deleteUserDataInCookies, getUserData } from '@/utils/user-profile/userLoginProfile'
import { Menu } from '@mui/material'
import { useNavigate } from 'react-router'

const UserDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [userData, setUserData] = useState<UserProps>()
  const [small, setSmall] = useState('')
  const [large, setLarge] = useState('')
  const [isOpenModel, setIsOpenModel] = useState(false)
  const [userGroupAnchorEl, setUserGroupAnchorEl] = useState<null | HTMLElement>(null)
  const [userGroups, setUserGroups] = useState<string[]>([])
  const selectedGroup = useUserGroupStore(state => state.selectedGroup)
  const setSelectedGroup = useUserGroupStore(state => state.setSelectedGroup) // Effect
  const { fetchDefaultGroup } = useUserGroupStore()
  const DEFAULT_GROUP = 'Merge Menu'
  useEffect(() => {
    fetchDefaultGroup(getUserData().USER_ID)
  }, [])

  useEffect(() => {
    const fetchUserGroups = async () => {
      const dataItem = getUserData()
      const res = await fetchUserGroupFilterApp(dataItem?.EMPLOYEE_CODE ?? '', import.meta.env.VITE_APPLICATION_ID)
      setUserGroups(res.map(item => item.USER_GROUP_NAME))
    }

    fetchUserGroups()
  }, [])

  useEffect(() => {
    const dataItem = getUserData()
    setUserData(dataItem)
    ImageEmployeeFromURL(dataItem?.EMPLOYEE_CODE ?? '', setSmall, setLarge)
  }, [])

  useEffect(() => {
    if (!userGroups.length) return
    if (!selectedGroup) return

    const isValidGroup = selectedGroup === DEFAULT_GROUP || userGroups.includes(selectedGroup)

    if (!isValidGroup) {
      console.warn('Invalid user group detected → reset to default')

      setSelectedGroup(DEFAULT_GROUP)
      handleAdd(DEFAULT_GROUP)
    }
  }, [userGroups, selectedGroup])

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null)

  // Hooks
  //const router = useRouter()
  const navigate = useNavigate()

  // const { data: session } = useSession()
  const { settings } = useSettings()
  const params = useParams()
  const locale = params?.lang ?? 'en'

  const handleDropdownOpen = () => {
    !open ? setOpen(true) : setOpen(false)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      navigate(getLocalizedUrl(url, locale as Locale))
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleUserLogout = async () => {
    try {
      // Sign out from the app
      deleteUserDataInCookies()
      navigate(import.meta.env.VITE_BASE_WEB_APP_LOGIN_URL + '?continue=' + import.meta.env.VITE_BASE_WEB_APP_URL)
    } catch (error) {
      console.error(error)

      // Show above error in a toast like following
      // toastService.error((err as Error).message)
    }
  }

  const handleAdd = (group: string) => {
    const dataItem = {
      USER_ID: getUserData().USER_ID,
      APPLICATION_ID: import.meta.env.VITE_APPLICATION_ID,
      USER_PROFILE_SETTING_APPLICATION_DATA: {
        userGroupData: {
          userGroup: group
        }
      }
    }

    mutate(dataItem)
  }

  const onMutateSuccess = () => {
    console.log('onMutateSuccess')
  }

  const onMutateError = (e: any) => {
    console.log('onMutateError', e)
  }
  const { mutate } = usesCreateUserGroupApplication(onMutateSuccess, onMutateError)

  return (
    <>
      <div className='flex flex-col mr-2 ml-2' onClick={handleDropdownOpen} style={{ cursor: 'pointer' }}>
        <Typography variant='body1' textAlign='right'>
          <span style={{ color: 'var(--primary-color)' }}>{userData?.EMPLOYEE_CODE ?? ''}</span>{' '}
          <Typography component='span' variant='caption' color='text.secondary'>
            {userData?.FIRST_NAME ?? ''}
          </Typography>
        </Typography>
        {/* </Typography> */}
        <Typography variant='body2' textAlign='right'>
          {/* {selectedGroup === 'Merge Menu' ? (
            <AuroraText className='ml-auto'>{selectedGroup}</AuroraText>
          ) : ( */}
          {selectedGroup === 'Merge Menu' ? '✨ Merge Menu' : selectedGroup}
          {/* )} */}
        </Typography>
      </div>
      <Avatar
        ref={anchorRef}
        alt={userData?.EMPLOYEE_CODE ?? ''}
        src={small || ''}
        onClick={handleDropdownOpen}
        className='cursor-pointer'
        sx={{
          // width: 56,
          // height: 56,
          img: { objectFit: 'cover' } // ป้องกันการยืด/บีบ
        }}
      />
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-6 gap-2' tabIndex={-1}>
                    {/* <Avatar /> */}
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {userData?.FIRST_NAME ?? ''} {userData?.LAST_NAME ?? ''.substring(0, 3)}
                      </Typography>
                      <Typography variant='caption'>
                        {userData?.SECTION_NAME +
                          '' +
                          ' - ' +
                          userData?.JOB_GRADE +
                          '' +
                          ' (' +
                          userData?.POSITION_NAME +
                          '' +
                          ')'}
                      </Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  {/* <MenuItem className='mli-2 gap-3'>
                    <i className='tabler-user' />
                    <Typography color='text.primary'>My Profile</Typography>
                  </MenuItem> */}
                  <MenuItem className='mli-2 gap-3' onClick={e => setUserGroupAnchorEl(e.currentTarget)}>
                    <Typography color='text.primary'>
                      {selectedGroup === 'Merge Menu' && '✨'}
                      {selectedGroup}
                    </Typography>
                  </MenuItem>
                  {/* <MenuItem className='mli-2 gap-3'>
                    <i className='tabler-settings' />
                    <Typography color='text.primary'>Settings</Typography>
                  </MenuItem> */}
                  <div className='flex items-center plb-2 pli-3'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='tabler-logout' />}
                      onClick={handleUserLogout}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
                    >
                      Logout
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
      <Menu
        anchorEl={userGroupAnchorEl}
        open={Boolean(userGroupAnchorEl)}
        onClose={() => setUserGroupAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* Default */}
        <MenuItem
          selected={selectedGroup === 'Merge Menu'}
          onClick={() => {
            setSelectedGroup('Merge Menu')
            handleAdd('Merge Menu')
            setUserGroupAnchorEl(null)
          }}
        >
          ✨ Merge Menu
        </MenuItem>

        <Divider />

        {/* From API */}
        {userGroups.map(group => (
          <MenuItem
            key={group}
            selected={selectedGroup === group}
            onClick={() => {
              setSelectedGroup(group)
              handleAdd(group)
              setUserGroupAnchorEl(null)
            }}
          >
            {group}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default UserDropdown
