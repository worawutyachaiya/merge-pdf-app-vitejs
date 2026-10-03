import { useMutation, useQuery } from '@tanstack/react-query'

import CalDeMinimisServices from '@/_workspace/services/trade-compliance/CalDeMinimisServices'
import type {
  CalDeMinimisCalculationRequest,
  CalDeMinimisThresholdSettingsUpdate
} from '@/_workspace/types/trade-compliance/CalDeMinimis'

export const CAL_DE_MINIMIS_QUERY_KEY = 'CAL_DE_MINIMIS'

export const useCalDeMinimisSctRevisions = (productTypeId: number | null) =>
  useQuery({
    queryKey: [CAL_DE_MINIMIS_QUERY_KEY, 'SCT_REVISIONS', productTypeId],
    queryFn: () => CalDeMinimisServices.getSctRevisions(productTypeId ?? 0),
    enabled: typeof productTypeId === 'number'
  })

export const useCalDeMinimisCalculation = () =>
  useMutation({
    mutationFn: (payload: CalDeMinimisCalculationRequest) => CalDeMinimisServices.calculate(payload)
  })

export const useCalDeMinimisThresholdSettings = () =>
  useQuery({
    queryKey: [CAL_DE_MINIMIS_QUERY_KEY, 'THRESHOLD_SETTINGS'],
    queryFn: () => CalDeMinimisServices.getThresholdSettings()
  })

export const useUpdateCalDeMinimisThresholdSettings = (
  onSuccess: (response: Awaited<ReturnType<typeof CalDeMinimisServices.updateThresholdSettings>>) => void,
  onError: (error: Error) => void
) =>
  useMutation({
    mutationFn: (payload: CalDeMinimisThresholdSettingsUpdate) => CalDeMinimisServices.updateThresholdSettings(payload),
    onSuccess,
    onError
  })
