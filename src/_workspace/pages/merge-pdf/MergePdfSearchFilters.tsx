import { useState } from 'react'

import { Button, Card, CardContent, CardHeader, Collapse, Grid, IconButton } from '@mui/material'
import classNames from 'classnames'
import { Controller, useFormContext } from 'react-hook-form'

import { useDxContext } from '@/_template/DxContextProvider'
import { useCreate } from '@/libs/react-query/hooks/common-system/useUserProfileSettingProgram'
import CustomTextField from '@/components/mui/TextField'
import SelectCustom from '@/components/react-select/SelectCustom'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

import { MENU_ID } from './env'
import { mergePdfStatusOptions, type MergePdfListValues } from './validationSchema'

const MergePdfSearchFilters = () => {
  const [collapse, setCollapse] = useState(false)
  const { control, getValues, handleSubmit, setValue } = useFormContext<MergePdfListValues>()
  const { setIsEnableFetching, setPagination } = useDxContext()
  const { mutate } = useCreate(
    () => undefined,
    () => undefined
  )

  const saveProfile = () => {
    if (MENU_ID <= 0) return
    mutate({
      USER_ID: getUserData().USER_ID,
      APPLICATION_ID: import.meta.env.VITE_APPLICATION_ID,
      MENU_ID: MENU_ID.toString(),
      USER_PROFILE_SETTING_PROGRAM_DATA: getValues()
    })
  }

  const search = () => {
    setPagination({ pageIndex: 0, pageSize: getValues('searchResults.pageSize') ?? 10 })
    setIsEnableFetching(true)
    saveProfile()
  }

  const clear = () => {
    setValue('searchFilters', { documentName: '', status: null }, { shouldValidate: true })
    search()
  }

  return (
    <Card style={{ overflow: 'visible', zIndex: 4 }}>
      <CardHeader
        title='Search filters'
        titleTypographyProps={{ variant: 'h5' }}
        action={
          <IconButton size='small' aria-label='collapse' onClick={() => setCollapse(value => !value)}>
            <i className={classNames(collapse ? 'tabler-chevron-down' : 'tabler-chevron-up', 'text-xl')} />
          </IconButton>
        }
      />
      <Collapse in={!collapse}>
        <CardContent>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <Controller
                name='searchFilters.documentName'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Document Name'
                    placeholder='Enter ...'
                    autoComplete='off'
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Controller
                name='searchFilters.status'
                control={control}
                render={({ field }) => (
                  <SelectCustom
                    {...field}
                    isClearable
                    label='Status'
                    options={mergePdfStatusOptions}
                    placeholder='Select ...'
                    classNamePrefix='select'
                  />
                )}
              />
            </Grid>
            <Grid className='flex gap-4' size={12}>
              <Button variant='contained' type='button' onClick={() => handleSubmit(search)()}>
                Search
              </Button>
              <Button variant='tonal' color='secondary' type='reset' onClick={clear}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  )
}

export default MergePdfSearchFilters
