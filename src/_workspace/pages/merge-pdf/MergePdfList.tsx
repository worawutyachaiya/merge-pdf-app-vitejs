import { useEffect } from 'react'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import Grid from '@mui/material/Grid'
import { FormProvider, useForm, useFormState, useWatch } from 'react-hook-form'

import { DxProvider, useDxContext } from '@/_template/DxContextProvider'
import DxWatchSearchFilters from '@/_template/DxWatchSearchFilters'
import SkeletonCustom from '@/components/SkeletonCustom'

import { MENU_ID } from './env'
import MergePdfSearchFilters from './MergePdfSearchFilters'
import MergePdfDashboard from './MergePdfDashboard'
import MergePdfSearchResult from './MergePdfSearchResult'
import {
  fetchMergePdfListValues,
  mergePdfListSchema,
  type MergePdfListValues
} from './validationSchema'

interface Props {
  onOpen: (jobId: number) => void
  onAdd: () => void
  refreshVersion: number
}

const InnerList = ({ onOpen, onAdd, refreshVersion }: Props) => {
  const { setIsEnableFetching } = useDxContext()
  const [appliedSearchFilters, setAppliedSearchFilters] = useState<MergePdfListValues['searchFilters'] | null>(null)
  const methods = useForm<MergePdfListValues>({
    resolver: zodResolver(mergePdfListSchema),
    defaultValues: async () => {
      const values = await fetchMergePdfListValues(MENU_ID)
      setAppliedSearchFilters(values.searchFilters)
      return values
    }
  })
  const { control } = methods
  const { isLoading } = useFormState({ control })
  const searchFilters = useWatch({ control, name: 'searchFilters' })

  useEffect(() => {
    if (!isLoading) setIsEnableFetching(true)
  }, [isLoading, setIsEnableFetching])

  return (
    <FormProvider {...methods}>
      {!isLoading && MENU_ID > 0 && (
        <DxWatchSearchFilters
          MENU_ID={MENU_ID}
          searchFiltersData={searchFilters}
          searchResultsMetadata={{ columnOrderVersion: 1 }}
          saveOnMount={methods.getValues('searchResults.needsColumnOrderMigration') === true}
        />
      )}
      <Grid container spacing={6}>
        {!isLoading && (
          <Grid size={12}>
            {appliedSearchFilters && <MergePdfDashboard onOpen={onOpen} searchFilters={appliedSearchFilters} />}
          </Grid>
        )}
        <Grid size={12}>
          <MergePdfSearchFilters onSearch={setAppliedSearchFilters} />
        </Grid>
        <Grid size={12}>
          {isLoading ? (
            <SkeletonCustom />
          ) : (
            <MergePdfSearchResult onOpen={onOpen} onAdd={onAdd} refreshVersion={refreshVersion} />
          )}
        </Grid>
      </Grid>
    </FormProvider>
  )
}

const MergePdfList = (props: Props) => (
  <DxProvider>
    <InnerList {...props} />
  </DxProvider>
)

export default MergePdfList
