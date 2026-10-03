import { keepPreviousData, useQuery } from '@tanstack/react-query'

import EarStatusServices from '@/_workspace/services/trade-compliance/EarStatusServices'
import type { EarStatusI } from '@/_workspace/types/trade-compliance/EarStatus'
import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'

export const PREFIX_QUERY_KEY = 'EAR_SURVEY_STATUS'

export const useEarStatusSearch = (params: object, isFetchData: boolean) =>
  useQuery<AxiosResponseI<EarStatusI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => EarStatusServices.search(params),
    placeholderData: keepPreviousData,
    enabled: isFetchData
  })
