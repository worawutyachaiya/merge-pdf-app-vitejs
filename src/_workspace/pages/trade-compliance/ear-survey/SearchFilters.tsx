import { useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Collapse,
  FormControlLabel,
  Grid,
  IconButton,
  Typography
} from '@mui/material'
import classNames from 'classnames'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'

import CustomTextField from '@/components/mui/TextField'
import SelectCustom from '@/components/react-select/SelectCustom'
import StatusOption from '@/libs/react-select/option/StatusOption'
import SkeletonCustom from '@/components/SkeletonCustom'
import { ToastMessageError } from '@/components/ToastMessage'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { useCreate } from '@/libs/react-query/hooks/common-system/useUserProfileSettingProgram'
import { useDxContext } from '@/_template/DxContextProvider'
import { PREFIX_QUERY_KEY } from '@/_workspace/react-query/hooks/useEarSurvey'

import { MENU_ID, MENU_NAME } from './env'
import type { FormDataPage } from './validationSchema'

const statusOptions = StatusOption.filter(option => option.value === 1 || option.value === 0)

const SearchFilters = () => {
  const [collapse, setCollapse] = useState(false)
  const { control, getValues, handleSubmit, setValue } = useFormContext<FormDataPage>()
  const { isLoading } = useFormState()
  const { setIsEnableFetching, setPagination } = useDxContext()
  const queryClient = useQueryClient()

  const { mutate, isError, error } = useCreate(
    () => undefined,
    () => undefined
  )

  const saveProfile = () => {
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
    setValue(
      'searchFilters',
      {
        revisionCode: '',
        requestDateFrom: null,
        requestDateTo: null,
        supplierCode: '',
        supplierName: '',
        itemCode: '',
        status: null,
        includingCancelled: false
      },
      { shouldDirty: true, shouldTouch: true, shouldValidate: true }
    )
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
        sx={{ '& .MuiCardHeader-avatar': { mr: 3 } }}
      />
      <Collapse in={!collapse}>
        <CardContent>
          {isError && <div>An error occurred: {error.message}</div>}
          {isLoading ? (
            <SkeletonCustom />
          ) : (
            <Grid container sx={{ position: 'relative', top: 0 }} spacing={4}>
              {/* <Grid size={12}>
                <Divider textAlign='left'>
                  <Typography variant='body2' color='primary' sx={{ color: 'var(--primary-color)' }}>
                    Survey
                  </Typography>
                </Divider>
              </Grid> */}
              <Grid container spacing={4} size={12}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Controller
                        name='searchFilters.requestDateFrom'
                        control={control}
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <AppReactDatepicker
                            {...fieldProps}
                            isClearable
                            selected={value}
                            placeholderText='Select ...'
                            id='ear-request-date-from'
                            dateFormat='yyyy-MMM-dd'
                            onChange={(date: Date | null) => {
                              onChange(date)
                              const requestDateTo = getValues('searchFilters.requestDateTo')

                              if (date && requestDateTo && requestDateTo < date) {
                                setValue('searchFilters.requestDateTo', null)
                              }
                            }}
                            customInput={<CustomTextField label='Request Date [From]' fullWidth />}
                          />
                        )}
                      />
                    </Box>
                    <Typography sx={{ mt: 4 }}>-</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Controller
                        name='searchFilters.requestDateTo'
                        control={control}
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <AppReactDatepicker
                            {...fieldProps}
                            isClearable
                            selected={value}
                            minDate={getValues('searchFilters.requestDateFrom') ?? undefined}
                            placeholderText='Select ...'
                            id='ear-request-date-to'
                            dateFormat='yyyy-MMM-dd'
                            onChange={(date: Date | null) => onChange(date)}
                            customInput={<CustomTextField label='Request Date [To]' fullWidth />}
                          />
                        )}
                      />
                    </Box>
                  </Box>
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
                <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', alignItems: 'center', pt: { sm: 3.5 } }}>
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
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Controller
                    name='searchFilters.revisionCode'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        label='Revision Code'
                        placeholder='Enter ...'
                        autoComplete='off'
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Controller
                    name='searchFilters.supplierCode'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        label='Supplier Code'
                        placeholder='Enter ...'
                        autoComplete='off'
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Controller
                    name='searchFilters.supplierName'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        label='Supplier Name'
                        placeholder='Enter ...'
                        autoComplete='off'
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Controller
                    name='searchFilters.itemCode'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        label='Item Code'
                        placeholder='Enter ...'
                        autoComplete='off'
                      />
                    )}
                  />
                </Grid>
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
          )}
        </CardContent>
      </Collapse>
    </Card>
  )
}

export default SearchFilters
