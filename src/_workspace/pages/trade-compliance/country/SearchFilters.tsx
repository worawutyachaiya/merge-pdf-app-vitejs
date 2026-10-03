import { useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Collapse,
  FormControlLabel,
  Grid,
  IconButton
} from '@mui/material'
import classNames from 'classnames'
import { Controller, useFormContext } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'

import CustomTextField from '@/components/mui/TextField'
import SelectCustom from '@/components/react-select/SelectCustom'
import StatusOption from '@/libs/react-select/option/StatusOption'
import { ToastMessageError } from '@/components/ToastMessage'
import { useCreate } from '@/libs/react-query/hooks/common-system/useUserProfileSettingProgram'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import { useDxContext } from '@/_template/DxContextProvider'
import { PREFIX_QUERY_KEY } from '@/_workspace/react-query/hooks/useCountry'

import { MENU_ID, MENU_NAME } from './env'
import type { FormDataPage } from './validationSchema'

const statusOptions = StatusOption.filter(option => option.value === 1 || option.value === 0)

const SearchFilters = () => {
  const [collapse, setCollapse] = useState(false)
  const { control, getValues, handleSubmit, setValue } = useFormContext<FormDataPage>()
  const { setIsEnableFetching, setPagination } = useDxContext()
  const queryClient = useQueryClient()
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
    queryClient.invalidateQueries({ queryKey: [PREFIX_QUERY_KEY] })
    saveProfile()
  }

  const clear = () => {
    setValue('searchFilters', { countryName: '', status: null, includingCancelled: false }, { shouldValidate: true })
    search()
  }

  return (
    <Card style={{ overflow: 'visible', zIndex: 4 }}>
      <CardHeader
        title='Search filters'
        action={
          <IconButton size='small' aria-label='collapse' onClick={() => setCollapse(value => !value)}>
            <i className={classNames(collapse ? 'tabler-chevron-down' : 'tabler-chevron-up', 'text-xl')} />
          </IconButton>
        }
        titleTypographyProps={{ variant: 'h5' }}
      />
      <Collapse in={!collapse}>
        <CardContent>
          <Grid container spacing={4}>
            {/* <Grid size={12}>
              <Divider textAlign='left'>
                <Typography variant='body2' color='primary' sx={{ color: 'var(--primary-color)' }}>
                  Trade Information
                </Typography>
              </Divider>
            </Grid> */}
            <Grid size={{ xs: 12, sm: 3 }}>
              <Controller
                name='searchFilters.countryName'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Country of Origin'
                    placeholder='Enter ...'
                    autoComplete='off'
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <Controller
                name='searchFilters.status'
                control={control}
                render={({ field }) => (
                  <SelectCustom
                    {...field}
                    options={statusOptions}
                    isClearable
                    label='Status'
                    placeholder='Select ...'
                    classNamePrefix='select'
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }} sx={{ display: 'flex', alignItems: 'center', pt: { sm: 3.5 } }}>
              <Controller
                name='searchFilters.includingCancelled'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={<Checkbox checked={value} onChange={event => onChange(event.target.checked)} />}
                    label='Including Cancelled'
                  />
                )}
              />
            </Grid>
            <Grid className='flex gap-4' size={12}>
              <Button
                onClick={() =>
                  handleSubmit(search, errors =>
                    ToastMessageError({ title: MENU_NAME, message: JSON.stringify(errors) })
                  )()
                }
                variant='contained'
                type='button'
              >
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

export default SearchFilters
