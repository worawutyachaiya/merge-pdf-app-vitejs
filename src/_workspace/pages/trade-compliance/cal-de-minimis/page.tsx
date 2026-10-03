import { useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Collapse,
  Grid,
  IconButton
} from '@mui/material'
import { AxiosError } from 'axios'
import classNames from 'classnames'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { SingleValue } from 'react-select'

import DxBreadCrumbs from '@/_template/DxBreadCrumbs'
import { useCalDeMinimisCalculation, useCalDeMinimisSctRevisions } from '@/_workspace/react-query/hooks/useCalDeMinimis'
import { fetchCalDeMinimisProductTypes } from '@/_workspace/react-select/async-promise-load-options/fetchCalDeMinimisProductType'
import type { CalDeMinimisProductTypeOption } from '@/_workspace/types/trade-compliance/CalDeMinimis'
import { ToastMessageError } from '@/components/ToastMessage'
import AsyncSelectCustom from '@/components/react-select/AsyncSelectCustom'
import SelectCustom from '@/components/react-select/SelectCustom'

import CalculationResult from './CalculationResult'
import { breadcrumbNavigation, MENU_NAME } from './env'
import {
  calDeMinimisDefaultValues,
  calDeMinimisFormSchema,
  type CalDeMinimisFormData,
  type CalDeMinimisFormInput
} from './validationSchema'

interface SelectOption<T> {
  value: T
  label: string
}

const getRequestErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.message
  }
  return error instanceof Error ? error.message : 'Unable to calculate De-minimis'
}

const CalDeMinimisPage = () => {
  const methods = useForm<CalDeMinimisFormInput, unknown, CalDeMinimisFormData>({
    resolver: zodResolver(calDeMinimisFormSchema),
    defaultValues: calDeMinimisDefaultValues
  })
  const { control, handleSubmit, setValue } = methods
  const [collapse, setCollapse] = useState(false)
  const [selectedProductType, setSelectedProductType] = useState<CalDeMinimisProductTypeOption | null>(null)
  const productTypeId = useWatch({ control, name: 'PRODUCT_TYPE_ID' })
  const sctRevisionsQuery = useCalDeMinimisSctRevisions(typeof productTypeId === 'number' ? productTypeId : null)
  const calculation = useCalDeMinimisCalculation()

  const sctOptions = useMemo<SelectOption<string>[]>(
    () =>
      (sctRevisionsQuery.data?.data.ResultOnDb ?? []).map(sct => ({
        value: sct.SCT_ID,
        label: sct.SCT_REVISION_CODE
      })),
    [sctRevisionsQuery.data]
  )
  const result = calculation.data?.data.Status ? calculation.data.data.ResultOnDb[0] : undefined
  const lookupError = sctRevisionsQuery.error

  const calculate = async (values: CalDeMinimisFormData) => {
    try {
      const response = await calculation.mutateAsync(values)
      if (!response.data.Status) {
        ToastMessageError({ title: MENU_NAME, message: response.data.Message })
      }
    } catch (error: unknown) {
      ToastMessageError({ title: MENU_NAME, message: getRequestErrorMessage(error) })
    }
  }

  const clear = () => {
    setSelectedProductType(null)
    setValue('PRODUCT_TYPE_ID', null, { shouldValidate: false })
    setValue('SCT_ID', null, { shouldValidate: false })
    calculation.reset()
  }

  return (
    <Grid container spacing={6}>
      <Grid size={12} sx={{ display: 'flex', alignItems: 'center' }}>
        <DxBreadCrumbs menuName={MENU_NAME} breadcrumbNavigation={breadcrumbNavigation} />
      </Grid>

      <Grid size={12}>
        <Card sx={{ overflow: 'visible', zIndex: 4 }}>
          <CardHeader
            title='Calculation criteria'
            action={
              <IconButton size='small' aria-label='collapse' onClick={() => setCollapse(value => !value)}>
                <i className={classNames(collapse ? 'tabler-chevron-down' : 'tabler-chevron-up', 'text-xl')} />
              </IconButton>
            }
            titleTypographyProps={{ variant: 'h5' }}
          />
          <Collapse in={!collapse}>
            <CardContent>
              <Grid container spacing={4} alignItems='flex-start'>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name='PRODUCT_TYPE_ID'
                    control={control}
                    render={({ field, fieldState }) => (
                      <AsyncSelectCustom<CalDeMinimisProductTypeOption>
                        name={field.name}
                        label='Product Type Code (Finished Goods)'
                        placeholder='Select ...'
                        cacheOptions
                        defaultOptions
                        loadOptions={fetchCalDeMinimisProductTypes}
                        value={selectedProductType}
                        getOptionLabel={option => option.PRODUCT_TYPE_CODE}
                        getOptionValue={option => option.PRODUCT_TYPE_ID.toString()}
                        onBlur={field.onBlur}
                        onChange={(option: SingleValue<CalDeMinimisProductTypeOption>) => {
                          setSelectedProductType(option ?? null)
                          field.onChange(option?.PRODUCT_TYPE_ID ?? null)
                          setValue('SCT_ID', null, { shouldValidate: false })
                          calculation.reset()
                        }}
                        isDisabled={calculation.isPending}
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                        noOptionsMessage={() => 'No Finished Goods Product Type'}
                        isClearable
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name='SCT_ID'
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectCustom<SelectOption<string>>
                        name={field.name}
                        label='SCT Revision Code (Status: Can use)'
                        placeholder='Select ...'
                        options={sctOptions}
                        value={sctOptions.find(option => option.value === field.value) ?? null}
                        onBlur={field.onBlur}
                        onChange={(option: SingleValue<SelectOption<string>>) => {
                          field.onChange(option?.value ?? null)
                          calculation.reset()
                        }}
                        isLoading={sctRevisionsQuery.isFetching}
                        isDisabled={productTypeId === null || sctRevisionsQuery.isFetching || calculation.isPending}
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                        noOptionsMessage={() =>
                          productTypeId === null ? 'Select Product Type first' : 'No Can use SCT'
                        }
                        isClearable
                      />
                    )}
                  />
                </Grid>

                <Grid className='flex gap-4' size={12}>
                  <Button
                    variant='contained'
                    type='button'
                    disabled={calculation.isPending}
                    startIcon={
                      calculation.isPending ? (
                        <CircularProgress color='inherit' size={18} />
                      ) : (
                        <i className='tabler-calculator' />
                      )
                    }
                    onClick={() => handleSubmit(calculate)()}
                  >
                    {calculation.isPending ? 'Calculating...' : 'Cal De-minimis'}
                  </Button>
                  <Button
                    variant='tonal'
                    color='secondary'
                    type='button'
                    disabled={calculation.isPending}
                    onClick={clear}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>

              {lookupError && (
                <Alert severity='error' sx={{ mt: 4 }}>
                  Unable to load Master Data or Standard Cost options. Please try again.
                </Alert>
              )}
            </CardContent>
          </Collapse>
        </Card>
      </Grid>

      {result && (
        <Grid size={12}>
          <CalculationResult key={result.SCT_ID} result={result} />
        </Grid>
      )}
    </Grid>
  )
}

export default CalDeMinimisPage
