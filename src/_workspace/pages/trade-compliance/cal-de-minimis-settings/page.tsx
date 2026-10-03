import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Card, CardContent, CardHeader, CircularProgress, Grid, InputAdornment, Stack, Typography } from '@mui/material'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import DxBreadCrumbs from '@/_template/DxBreadCrumbs'
import {
  useCalDeMinimisThresholdSettings,
  useUpdateCalDeMinimisThresholdSettings,
} from '@/_workspace/react-query/hooks/useCalDeMinimis'
import type { CalDeMinimisThresholdSettingsUpdate } from '@/_workspace/types/trade-compliance/CalDeMinimis'
import CustomTextField from '@/components/mui/TextField'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'
import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

import { breadcrumbNavigation, MENU_NAME } from './env'

const percentage = z.coerce.number().finite().min(0, 'Value must be at least 0%').max(100, 'Value must not exceed 100%')

const formSchema = z.object({
  US_ORIGIN_THRESHOLD_PERCENT: percentage,
  FEC_CONTROLLED_THRESHOLD_PERCENT: percentage,
})

type FormData = z.infer<typeof formSchema>

const defaultValues: FormData = {
  US_ORIGIN_THRESHOLD_PERCENT: 25,
  FEC_CONTROLLED_THRESHOLD_PERCENT: 10,
}

const DeMinimisSettingsPage = () => {
  const settingsQuery = useCalDeMinimisThresholdSettings()
  const { control, handleSubmit, reset, formState } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  useEffect(() => {
    const settings = settingsQuery.data?.data.ResultOnDb?.[0]

    if (settings) {
      reset({
        US_ORIGIN_THRESHOLD_PERCENT: settings.US_ORIGIN_THRESHOLD_PERCENT,
        FEC_CONTROLLED_THRESHOLD_PERCENT: settings.FEC_CONTROLLED_THRESHOLD_PERCENT,
      })
    }
  }, [reset, settingsQuery.data])

  const handleSuccess = (response: AxiosResponseI) => {
    if (response.data.Status) {
      ToastMessageSuccess({ message: response.data.Message || 'De-minimis settings saved' })
      void settingsQuery.refetch()
      return
    }

    ToastMessageError({ message: response.data.Message || 'Unable to save De-minimis settings' })
  }

  const handleError = (error: Error) => {
    ToastMessageError({ message: error.message || 'Unable to save De-minimis settings' })
  }

  const updateSettings = useUpdateCalDeMinimisThresholdSettings(handleSuccess, handleError)
  const isBusy = settingsQuery.isLoading || updateSettings.isPending
  const currentSettings = settingsQuery.data?.data.ResultOnDb?.[0]
  const currentValues: FormData = currentSettings
    ? {
        US_ORIGIN_THRESHOLD_PERCENT: currentSettings.US_ORIGIN_THRESHOLD_PERCENT,
        FEC_CONTROLLED_THRESHOLD_PERCENT: currentSettings.FEC_CONTROLLED_THRESHOLD_PERCENT,
      }
    : defaultValues

  const submit = (values: FormData) => {
    const payload: CalDeMinimisThresholdSettingsUpdate = {
      ...values,
      UPDATE_BY: getUserData().EMPLOYEE_CODE || 'SYSTEM',
    }

    updateSettings.mutate(payload)
  }

  return (
    <Grid container spacing={6}>
      <Grid size={12} sx={{ display: 'flex', alignItems: 'center' }}>
        <DxBreadCrumbs menuName={MENU_NAME} breadcrumbNavigation={breadcrumbNavigation} />
      </Grid>

      <Grid size={12}>
        <Card>
          <CardHeader
            title='De-minimis thresholds'
            subheader='Set the maximum percentage allowed for each calculation layer.'
            titleTypographyProps={{ variant: 'h5' }}
          />
          <CardContent>
            <Stack spacing={4}>
              <Alert severity='info' icon={<i className='tabler-info-circle' />}>
                These values are applied to every new De-minimis calculation. A ratio at or below its threshold passes that layer.
              </Alert>

              {settingsQuery.isError && (
                <Alert severity='error'>Unable to load De-minimis settings. Please check that the database migration has been applied.</Alert>
              )}

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name='US_ORIGIN_THRESHOLD_PERCENT'
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        type='number'
                        label='Layer 1 - U.S. Origin threshold'
                        helperText={fieldState.error?.message || 'Default: 25.00%'}
                        error={Boolean(fieldState.error)}
                        disabled={isBusy}
                        slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                        onChange={event => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
                        InputProps={{ endAdornment: <InputAdornment position='end'>%</InputAdornment> }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name='FEC_CONTROLLED_THRESHOLD_PERCENT'
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        type='number'
                        label='Layer 2 - FEC controlled threshold'
                        helperText={fieldState.error?.message || 'Default: 10.00%'}
                        error={Boolean(fieldState.error)}
                        disabled={isBusy}
                        slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                        onChange={event => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
                        InputProps={{ endAdornment: <InputAdornment position='end'>%</InputAdornment> }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {currentSettings && (
                <Typography variant='body2' color='text.secondary'>
                  Last updated {currentSettings.UPDATE_DATE} by {currentSettings.UPDATE_BY}
                </Typography>
              )}

              <Stack direction='row' spacing={2}>
                <Button
                  variant='contained'
                  startIcon={updateSettings.isPending ? <CircularProgress color='inherit' size={18} /> : <i className='tabler-device-floppy' />}
                  disabled={isBusy}
                  onClick={() => handleSubmit(submit)()}
                >
                  {updateSettings.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button variant='tonal' color='secondary' disabled={isBusy} onClick={() => reset(currentValues)}>
                  Reset
                </Button>
              </Stack>
              {formState.isDirty && <Typography variant='caption' color='warning.main'>Unsaved changes</Typography>}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default DeMinimisSettingsPage
