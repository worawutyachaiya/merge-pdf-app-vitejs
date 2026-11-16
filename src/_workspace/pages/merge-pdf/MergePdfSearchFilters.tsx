import { useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Grid,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  Typography,
  Box
} from '@mui/material'
import classNames from 'classnames'
import { Controller, useFormContext } from 'react-hook-form'

import { useDxContext } from '@/_template/DxContextProvider'
import { useCreate } from '@/libs/react-query/hooks/common-system/useUserProfileSettingProgram'
import CustomTextField from '@/components/mui/TextField'
import SelectCustom from '@/components/react-select/SelectCustom'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

import { MENU_ID } from './env'
import { mergePdfStatusOptions, type MergePdfListValues } from './validationSchema'

interface Props {
  onSearch: (filters: MergePdfListValues['searchFilters']) => void
}

const MergePdfSearchFilters = ({ onSearch }: Props) => {
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
    onSearch(getValues('searchFilters'))
    setPagination({ pageIndex: 0, pageSize: getValues('searchResults.pageSize') ?? 10 })
    setIsEnableFetching(true)
    saveProfile()
  }

  const clear = () => {
    setValue(
      'searchFilters',
      {
        documentName: '',
        status: null,
        includingCancelled: false,
        createdBy: '',
        createDateFrom: null,
        createDateTo: null,
        updatedBy: '',
        updateDateFrom: null,
        updateDateTo: null
      },
      { shouldValidate: true }
    )
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
            <Grid size={12}>
              <Divider textAlign='left'>
                <Typography variant='body2' color='primary' sx={{ color: 'var(--primary-color)' }}>
                  Document
                </Typography>
              </Divider>
            </Grid>
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
            <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Controller
                name='searchFilters.includingCancelled'
                control={control}
                render={({ field: { value, ...field } }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={!!value} color='warning' />}
                    label='Including Cancelled'
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <Divider textAlign='left'>
                <Typography variant='body2' color='primary' sx={{ color: 'var(--primary-color)' }}>
                  Date range
                </Typography>
              </Divider>
            </Grid>
            {(
              [
                {
                  title: 'Created',
                  by: 'createdBy',
                  from: 'createDateFrom',
                  to: 'createDateTo'
                },
                {
                  title: 'Updated',
                  by: 'updatedBy',
                  from: 'updateDateFrom',
                  to: 'updateDateTo'
                }
              ] as const
            ).map(group => (
              <Grid key={group.title} size={{ xs: 12, lg: 6 }}>
                <Box sx={{ border: '1px solid var(--mui-palette-divider)', borderRadius: 1, p: 3, height: '100%' }}>
                  <Typography variant='body2' sx={{ mb: 3 }}>
                    {group.title}
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Controller
                        name={`searchFilters.${group.by}`}
                        control={control}
                        render={({ field }) => (
                          <CustomTextField
                            {...field}
                            fullWidth
                            label={`${group.title} By`}
                            placeholder='Enter ...'
                            autoComplete='off'
                          />
                        )}
                      />
                    </Grid>
                    {(['From', 'To'] as const).map(bound => {
                      const fieldName = group[bound === 'From' ? 'from' : 'to']
                      const otherFieldName = group[bound === 'From' ? 'to' : 'from']

                      return (
                        <Grid key={fieldName} size={{ xs: 12, sm: 4 }}>
                          <Controller
                            name={`searchFilters.${fieldName}`}
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                              <AppReactDatepicker
                                {...field}
                                id={`merge-pdf-${fieldName}`}
                                selected={value}
                                onChange={(date: Date | null) => {
                                  if (!date) {
                                    onChange(null)
                                    if (bound === 'From') {
                                      setValue(`searchFilters.${otherFieldName}`, null, {
                                        shouldDirty: true,
                                        shouldValidate: true
                                      })
                                    }
                                    return
                                  }
                                  const nextDate = new Date(date)
                                  if (!value)
                                    nextDate.setHours(bound === 'From' ? 8 : 20, bound === 'From' ? 0 : 30, 0, 0)
                                  const otherDate = getValues(`searchFilters.${otherFieldName}`)
                                  if (otherDate && (bound === 'From' ? nextDate > otherDate : nextDate < otherDate)) {
                                    setValue(`searchFilters.${otherFieldName}`, null, {
                                      shouldDirty: true,
                                      shouldValidate: true
                                    })
                                  }
                                  onChange(nextDate)
                                }}
                                isClearable
                                showTimeSelect
                                timeFormat='HH:mm'
                                timeIntervals={15}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode='select'
                                dateFormat='yyyy-MMM-dd HH:mm'
                                placeholderText='Select ...'
                                customInput={<CustomTextField fullWidth label={`${group.title} Date [${bound}]`} />}
                              />
                            )}
                          />
                        </Grid>
                      )
                    })}
                  </Grid>
                </Box>
              </Grid>
            ))}
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
