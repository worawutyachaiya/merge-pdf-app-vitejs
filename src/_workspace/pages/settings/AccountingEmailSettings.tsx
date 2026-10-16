import { Alert, Button, Card, CardContent, CardHeader, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { useDeferredValue, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import SelectCustom from '@/components/react-select/SelectCustom'

import { useCheckPermission } from '@/_template/CheckPermission'
import CustomTextField from '@/components/mui/TextField'
import {
  useAccountingPeople,
  useEmailSettings,
  useSaveEmailSettings
} from '@/_workspace/react-query/hooks/useEmailSettings'
import EmailSettingsServices from '@/_workspace/services/email-settings/EmailSettingsServices'
import type { AccountingPerson, EmailSettings } from '@/_workspace/types/email-settings/EmailSettings'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'

import { MENU_ID } from './env'
import { validationSchema, type FormDataPage } from './validationSchema'

const defaultScheduleTime = '17:00'
const personOption = (person: AccountingPerson) => ({
  value: person.employeeCode,
  label: `${person.employeeCode} - ${person.name} (${person.email})`,
  person
})

const EmailSettingsForm = ({ initialSettings }: { initialSettings: EmailSettings }) => {
  const checkPermission = useCheckPermission()
  const { control, handleSubmit, reset } = useForm<FormDataPage>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      scheduleTime: initialSettings.scheduleTime || defaultScheduleTime,
      recipients: initialSettings.recipients || []
    }
  })
  const recipients = useWatch({ control, name: 'recipients' })
  const canUpdate = Boolean(checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_UPDATE', false))
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const peopleQuery = useAccountingPeople(deferredSearch)

  const options = useMemo(() => {
    if (peopleQuery.isFetching || peopleQuery.isError || !peopleQuery.isSuccess) return []
    const byCode = new Map<string, AccountingPerson>()
    for (const person of [...recipients, ...(peopleQuery.data?.data.ResultOnDb ?? [])])
      byCode.set(person.employeeCode, person)
    return [...byCode.values()]
  }, [peopleQuery.data, peopleQuery.isFetching, peopleQuery.isError, peopleQuery.isSuccess, recipients])

  const handleSuccess = (response: Awaited<ReturnType<typeof EmailSettingsServices.save>>) => {
    if (response.data.Status) {
      ToastMessageSuccess({ message: 'Accounting email settings saved' })
      return
    }
    ToastMessageError({ message: response.data.Message || 'Unable to save email settings' })
  }

  const saveMutation = useSaveEmailSettings(handleSuccess, error =>
    ToastMessageError({ message: error.message || 'Unable to save email settings' })
  )
  const isBusy = saveMutation.isPending

  const save = (values: FormDataPage) => {
    if (!checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_UPDATE')) return
    saveMutation.mutate({
      scheduleTime: values.scheduleTime,
      employeeCodes: values.recipients.map(person => person.employeeCode)
    })
  }

  return (
    <Card>
      <CardHeader
        title='Accounting email settings'
        // subheader='Completed PDFs saved to the Server Share are collected and sent at the scheduled time.'
        titleTypographyProps={{ variant: 'h5' }}
        // action={<Chip size='small' variant='tonal' label={`Revision ${initialSettings.revisionNo}`} />}
      />
      <CardContent>
        <Stack spacing={4}>
          {peopleQuery.isError && (
            <Alert
              severity='error'
              action={
                <Button
                  color='inherit'
                  disabled={peopleQuery.isFetching}
                  onClick={() => {
                    void peopleQuery.refetch()
                  }}
                >
                  Retry
                </Button>
              }
            >
              Unable to load Accounting employees. Please try again or contact the system administrator.
            </Alert>
          )}
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='scheduleTime'
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Daily send time (Thailand)'
                    type='time'
                    disabled={isBusy || !canUpdate}
                    error={Boolean(fieldState.error)}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 60 } }}
                    helperText={
                      fieldState.error?.message || 'Default: 17:00'
                      // 'Default: 17:00 Thailand time. Changing the time allows another batch of unsent PDFs today.'
                    }
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                name='recipients'
                control={control}
                render={({ field, fieldState }) => (
                  <SelectCustom<ReturnType<typeof personOption>, true>
                    isMulti
                    inputId='email-settings-recipients'
                    name={field.name}
                    label='Accounting recipients'
                    options={options.map(personOption)}
                    value={field.value.map(personOption)}
                    onChange={value => field.onChange(value.map(option => option.person))}
                    onBlur={field.onBlur}
                    onInputChange={(value, action) => {
                      if (action.action === 'input-change') setSearch(value)
                    }}
                    isLoading={peopleQuery.isFetching}
                    isDisabled={isBusy || !canUpdate || peopleQuery.isError}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder='Search by employee code, name or email'
                    noOptionsMessage={() =>
                      peopleQuery.isError ? 'Unable to load Accounting employees' : 'No Accounting employees found'
                    }
                    filterOption={() => true}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Typography variant='body2' color='text.secondary'>
            {/* Configured recipients: {recipients.length} | Time zone: Asia/Bangkok */}
            Configured recipients: {recipients.length}
          </Typography>
          <Stack direction='row' spacing={2}>
            <Button
              color='success'
              variant='contained'
              onClick={() => {
                void handleSubmit(save)()
              }}
              disabled={isBusy || !canUpdate || peopleQuery.isFetching || !peopleQuery.isSuccess || peopleQuery.isError}
              startIcon={
                saveMutation.isPending ? (
                  <CircularProgress size={18} color='inherit' />
                ) : (
                  <i className='tabler-device-floppy' />
                )
              }
            >
              {saveMutation.isPending ? 'Saving...' : 'Save & Complete'}
            </Button>
            <Button
              variant='tonal'
              color='secondary'
              disabled={isBusy}
              onClick={() => {
                reset({
                  scheduleTime: initialSettings.scheduleTime || defaultScheduleTime,
                  recipients: initialSettings.recipients || []
                })
              }}
            >
              Reset
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

const AccountingEmailSettings = () => {
  const settingsQuery = useEmailSettings()
  const settings = settingsQuery.data?.data.ResultOnDb?.[0]

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        {settings && !settingsQuery.isError ? (
          <EmailSettingsForm key={settings.revisionNo} initialSettings={settings} />
        ) : (
          <Card>
            <CardHeader title='Accounting email settings' titleTypographyProps={{ variant: 'h5' }} />
            <CardContent>
              {settingsQuery.isLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Alert
                  severity='error'
                  action={
                    <Button
                      color='inherit'
                      disabled={settingsQuery.isFetching}
                      onClick={() => {
                        void settingsQuery.refetch()
                      }}
                    >
                      Retry
                    </Button>
                  }
                >
                  Unable to load email settings. Please try again or contact the system administrator.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  )
}

export default AccountingEmailSettings
