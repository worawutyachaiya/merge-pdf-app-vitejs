// React Imports
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'
import { useDebounce } from 'use-debounce'

import {
  useSearchApplicationByUserIdAndUserGroupId,
  useSearchApplicationMergeByUserIdAndUserGroupId
} from '@/hooks/useApplicationSearch'
import UserGroupService from '@/services/security-center-system/UserGroupServices'

// Utils
import { getUserData } from '@/utils/user-profile/userLoginProfile'

// Components
import CustomAvatar from '@core/components/mui/Avatar'

// Hooks
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

// Store Imports
import { useUserGroupStore } from '@/libs/zustand/stores/useUserGroupStore'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { Button, DialogActions } from '@mui/material'

type UserGroupType = {
  USER_GROUP_ID: number
  USER_GROUP_NAME: string
}

type ApplicationType = {
  APPLICATION_ID?: number
  APPLICATION_NAME?: string
  APPLICATION_URL?: string
  DESCRIPTION?: string | null
  name?: string
}

const SMART_ADMIN_GROUP_NAME = 'SMART_Admin'
const UNDER_DEVELOPMENT_ENVIRONMENTS = new Set(['SIT', 'UAT'])

const getUnderDevelopmentEnvironment = (description?: string | null) => description?.trim().toUpperCase() ?? ''

const isUnderDevelopmentApplication = (application: ApplicationType) =>
  UNDER_DEVELOPMENT_ENVIRONMENTS.has(getUnderDevelopmentEnvironment(application.DESCRIPTION))

const NavSearch = () => {
  // States
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue] = useDebounce(searchValue, 500)
  const { selectedGroup } = useUserGroupStore() // Global store
  const [userGroups, setUserGroups] = useState<UserGroupType[]>([])
  const [isUserGroupLoading, setIsUserGroupLoading] = useState(false)

  // Hooks
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  // const { lang: locale } = useParams() // Unused for now
  const { settings } = useSettings()
  const { isBreakpointReached } = useVerticalNav()

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }

    document.addEventListener('keydown', down)

    return () => document.removeEventListener('keydown', down)
  }, [])

  // Fetch User Groups on open
  useEffect(() => {
    if (open) {
      const fetchUserGroups = async () => {
        setIsUserGroupLoading(true)

        try {
          const userData = getUserData()
          if (!userData) return

          const response = await UserGroupService.getUserGroupByUsernameAndApplication({
            USER_NAME: userData.EMPLOYEE_CODE || userData.USER_NAME || '',
            APPLICATION_ID: import.meta.env.VITE_APPLICATION_ID
          })

          if (response?.data?.ResultOnDb) {
            const groups: UserGroupType[] = response.data.ResultOnDb.map((item: UserGroupType) => ({
              USER_GROUP_ID: item.USER_GROUP_ID,
              USER_GROUP_NAME: item.USER_GROUP_NAME
            }))

            // Remove duplicates
            const uniqueGroups = Array.from(new Set(groups.map(group => group.USER_GROUP_ID)))
              .map(id => groups.find(group => group.USER_GROUP_ID === id))
              .filter((group): group is UserGroupType => group !== undefined)

            setUserGroups(uniqueGroups)
            // No need to set default selectedUserGroup here as it comes from the store
          }
        } catch (error) {
          console.error('Error fetching user groups:', error)
        } finally {
          setIsUserGroupLoading(false)
        }
      }
      fetchUserGroups()
    }
  }, [open])

  const selectedGroupId = useMemo<number | null>(() => {
    const group = userGroups.find(g => g.USER_GROUP_NAME === selectedGroup)
    return group ? group.USER_GROUP_ID : null
  }, [userGroups, selectedGroup])

  const isMergeMenu = selectedGroup === 'Merge Menu'
  const smartAdminGroup = useMemo(
    () => userGroups.find(group => group.USER_GROUP_NAME === SMART_ADMIN_GROUP_NAME) ?? null,
    [userGroups]
  )
  const canViewUnderDevelopment = !!smartAdminGroup && (isMergeMenu || selectedGroup === SMART_ADMIN_GROUP_NAME)

  const searchPayload = useMemo(() => {
    if (!selectedGroup && !isMergeMenu) return null

    let ids = ''

    if (isMergeMenu) {
      if (!userGroups.length) return null
      ids = userGroups.map(g => g.USER_GROUP_ID).join(',')
    } else {
      if (selectedGroupId === null) return null
      ids = String(selectedGroupId)
    }

    return {
      APPLICATION_NAME: debouncedSearchValue,
      APPLICATION_CODE: '',
      USER_GROUP_ID: ids,
      USER_ID: getUserData().USER_ID || '',
      INUSE: '',
      Start: 0,
      Limit: '',
      Order: [{ id: 'APPLICATION_NAME', desc: false }]
    }
  }, [debouncedSearchValue, selectedGroup, selectedGroupId, userGroups, isMergeMenu])

  const { data: applicationData, isLoading: isSearchLoading } = useSearchApplicationMergeByUserIdAndUserGroupId(
    searchPayload,
    open && !!searchPayload
  )

  const underDevelopmentSearchPayload = useMemo(() => {
    if (!canViewUnderDevelopment || !smartAdminGroup) return null

    return {
      APPLICATION_NAME: debouncedSearchValue,
      APPLICATION_CODE: '',
      USER_GROUP_ID: String(smartAdminGroup.USER_GROUP_ID),
      USER_ID: getUserData().USER_ID || '',
      INUSE: '',
      Start: 0,
      Limit: 1000,
      Order: [{ id: 'APPLICATION_NAME', desc: false }]
    }
  }, [canViewUnderDevelopment, debouncedSearchValue, smartAdminGroup])

  const { data: underDevelopmentApplicationData, isLoading: isUnderDevelopmentSearchLoading } =
    useSearchApplicationByUserIdAndUserGroupId(underDevelopmentSearchPayload, open && !!underDevelopmentSearchPayload)

  const searchResults = useMemo<ApplicationType[]>(() => {
    const applications = (applicationData?.data?.ResultOnDb ?? []) as ApplicationType[]

    return applications.filter(application => !isUnderDevelopmentApplication(application))
  }, [applicationData])

  const underDevelopmentResults = useMemo<ApplicationType[]>(() => {
    if (!canViewUnderDevelopment) return []

    const applications = (underDevelopmentApplicationData?.data?.ResultOnDb ?? []) as ApplicationType[]

    return applications.filter(isUnderDevelopmentApplication)
  }, [canViewUnderDevelopment, underDevelopmentApplicationData])

  const loading = isUserGroupLoading || isSearchLoading || isUnderDevelopmentSearchLoading
  const hasSearchResults = searchResults.length > 0 || underDevelopmentResults.length > 0

  const handleClose = () => {
    setOpen(false)
    setSearchValue('')
  }

  const handleAppClick = (app: ApplicationType) => {
    const url = app.APPLICATION_URL || '#'
    if (url.startsWith('http')) {
      window.open(url, '_blank')
    } else {
      if (url.startsWith('/')) {
        navigate(url)
      } else {
        window.location.href = url
      }
    }
    handleClose()
  }

  const renderApplicationGrid = (applications: ApplicationType[], showEnvironment = false) => (
    <Grid container spacing={6}>
      {applications.map((app, index) => {
        const environment = getUnderDevelopmentEnvironment(app.DESCRIPTION)

        return (
          <Grid
            size={{ xs: 6, md: 3, sm: 3 }}
            key={app.APPLICATION_ID ?? `${app.APPLICATION_NAME ?? 'application'}-${index}`}
            onClick={() => handleAppClick(app)}
          >
            <Box
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: 1,
                border: '1px solid',
                borderColor: settings.mode === 'dark' ? 'oklch(44.6% 0.043 257.281)' : 'grey.300',
                width: '100%',
                height: '100%',
                gap: 4,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <CustomAvatar size={50} skin='light' color={showEnvironment ? 'warning' : 'primary'}>
                <i className={classnames('text-[1.625rem]', 'tabler-apps')} />
              </CustomAvatar>
              <Box display='flex' flexDirection='column' alignItems='center' gap={2} textAlign='center'>
                <Typography variant='h6' sx={{ wordBreak: 'break-word' }}>
                  {app.APPLICATION_NAME || app.name}
                </Typography>
                {showEnvironment && (
                  <Chip
                    size='small'
                    variant='tonal'
                    color={environment === 'UAT' ? 'info' : 'warning'}
                    label={environment}
                  />
                )}
              </Box>
            </Box>
          </Grid>
        )
      })}
    </Grid>
  )

  return (
    <>
      {isBreakpointReached || settings.layout === 'horizontal' ? (
        <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
          <i className='tabler-search text-2xl' />
        </IconButton>
      ) : (
        <div className='flex items-center gap-2 cursor-pointer' onClick={() => setOpen(true)}>
          <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
            <i className='tabler-search text-2xl' />
          </IconButton>
          <div className='whitespace-nowrap select-none text-textDisabled'>Search ⌘K</div>
        </div>
      )}

      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth='lg'
        scroll='paper'
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'flex-start'
          },
          '& .MuiDialog-paper': {
            mt: 6,
            borderRadius: 2,
            overflow: 'visible'
          }
        }}
      >
        <DialogTitle
          sx={{
            // px: 20,
            pt: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'transparent'
          }}
        >
          {/* Left: Title */}
          <Typography variant='h4'>My Apps</Typography>

          {/* Right: Small Search */}
          <TextField
            size='small'
            placeholder='Search app...'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            sx={{
              mr: 6,
              width: 260,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='tabler-search' />
                </InputAdornment>
              )
            }}
          />
          <DialogCloseButton
            onClick={handleClose}
            sx={{
              backgroundColor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.9) !important',
              color: 'var(--mui-palette-textPrimary) !important'
            }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent sx={{ p: 8 }}>
          {loading ? (
            <Box display='flex' justifyContent='center' alignItems='center' height='100%'>
              <Typography>Loading...</Typography>
            </Box>
          ) : !hasSearchResults ? (
            <Box display='flex' justifyContent='center' alignItems='center' height='100%'>
              <Typography color='textSecondary'>No applications found.</Typography>
            </Box>
          ) : (
            <>
              {searchResults.length > 0 && renderApplicationGrid(searchResults)}
              {underDevelopmentResults.length > 0 && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      mt: searchResults.length > 0 ? 8 : 0,
                      mb: 6
                    }}
                  >
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant='h5' color='warning.main'>
                      Under Development
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Box>
                  {renderApplicationGrid(underDevelopmentResults, true)}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant='tonal' color='secondary'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default NavSearch
