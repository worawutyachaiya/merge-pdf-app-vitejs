import { keepPreviousData, useQuery } from '@tanstack/react-query'

import CountryServices from '@/_workspace/services/trade-compliance/CountryServices'
import type { CountryI } from '@/_workspace/types/trade-compliance/Country'
import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'

export const PREFIX_QUERY_KEY = 'COUNTRY'

export const useCountrySearch = (params: object, isFetchData: boolean) =>
  useQuery<AxiosResponseI<CountryI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => CountryServices.search(params),
    placeholderData: keepPreviousData,
    enabled: isFetchData
  })
