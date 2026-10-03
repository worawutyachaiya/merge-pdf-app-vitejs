import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import Grid from '@mui/material/Grid'
import { FormProvider, useForm, useFormState, useWatch } from 'react-hook-form'

import { DxProvider, useDxContext } from '@/_template/DxContextProvider'
import DxWatchSearchFilters from '@/_template/DxWatchSearchFilters'
import SkeletonCustom from '@/components/SkeletonCustom'

import { MENU_ID } from './env'
import MergePdfSearchFilters from './MergePdfSearchFilters'
import MergePdfSearchResult from './MergePdfSearchResult'
import { fetchMergePdfListValues, mergePdfListSchema, type MergePdfListValues } from './validationSchema'

interface Props {
  onOpen: (jobId: number) => void
}

const InnerList = ({ onOpen }: Props) => {
  const { setIsEnableFetching } = useDxContext()
  const methods = useForm<MergePdfListValues>({
    resolver: zodResolver(mergePdfListSchema),
    defaultValues: async () => fetchMergePdfListValues(MENU_ID)
  })
  const { control } = methods
  const { isLoading } = useFormState({ control })
  const searchFilters = useWatch({ control, name: 'searchFilters' })

  useEffect(() => {
    if (!isLoading) setIsEnableFetching(true)
  }, [isLoading, setIsEnableFetching])

  return (
    <FormProvider {...methods}>
      {!isLoading && MENU_ID > 0 && <DxWatchSearchFilters MENU_ID={MENU_ID} searchFiltersData={searchFilters} />}
      <Grid container spacing={6}>
        <Grid size={12}>
          <MergePdfSearchFilters />
        </Grid>
        <Grid size={12}>{isLoading ? <SkeletonCustom /> : <MergePdfSearchResult onOpen={onOpen} />}</Grid>
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
