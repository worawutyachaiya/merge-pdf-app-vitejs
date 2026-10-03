import Grid from '@mui/material/Grid'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useFormState } from 'react-hook-form'
import { useUpdateEffect } from 'react-use'

import SkeletonCustom from '@components/SkeletonCustom'
import DxBreadCrumbs from '@/_template/DxBreadCrumbs'
import { DxProvider, useDxContext } from '@/_template/DxContextProvider'
import DxWatchSearchFilters from '@/_template/DxWatchSearchFilters'

import { breadcrumbNavigation, MENU_ID, MENU_NAME } from './env'
import SearchFilters from './SearchFilters'
import SearchResult from './SearchResult'
import type { FormDataPage } from './validationSchema'
import { fetchDefaultValues, validationSchemaPage } from './validationSchema'

const InnerPage = () => {
  const { setIsEnableFetching } = useDxContext()
  const methods = useForm<FormDataPage>({
    resolver: zodResolver(validationSchemaPage),
    defaultValues: async () => fetchDefaultValues(MENU_ID)
  })
  const { control, getValues } = methods
  const { isLoading } = useFormState({ control })

  useUpdateEffect(() => {
    setIsEnableFetching(true)
  }, [isLoading])

  return (
    <Grid container spacing={6}>
      <FormProvider {...methods}>
        <Grid size={12} sx={{ display: 'flex', alignItems: 'center' }}>
          <DxBreadCrumbs menuName={MENU_NAME} breadcrumbNavigation={breadcrumbNavigation} />
          {!isLoading && (
            <DxWatchSearchFilters
              MENU_ID={MENU_ID}
              searchFiltersData={{
                requestDateFrom: getValues('searchFilters.requestDateFrom'),
                requestDateTo: getValues('searchFilters.requestDateTo'),
                supplierName: getValues('searchFilters.supplierName'),
                preTradeReference: getValues('searchFilters.preTradeReference'),
                status: getValues('searchFilters.status'),
                includingCancelled: getValues('searchFilters.includingCancelled')
              }}
            />
          )}
        </Grid>
        <Grid size={12}>
          <SearchFilters />
        </Grid>
        <Grid size={12}>{isLoading ? <SkeletonCustom /> : <SearchResult />}</Grid>
      </FormProvider>
    </Grid>
  )
}

const EarSurveyPreTradePage = () => (
  <DxProvider>
    <InnerPage />
  </DxProvider>
)

export default EarSurveyPreTradePage
