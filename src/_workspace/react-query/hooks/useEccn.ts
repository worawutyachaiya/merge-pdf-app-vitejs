import { keepPreviousData, useQuery } from '@tanstack/react-query'

import EccnServices from '@/_workspace/services/trade-compliance/EccnServices'
import type { EccnHsCodeRelationI, EccnI } from '@/_workspace/types/trade-compliance/Eccn'
import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'

export const PREFIX_QUERY_KEY = 'ECCN'

export const useEccnHsCodeRelations = (eccnId: number | null, isOpen: boolean) =>
  useQuery<AxiosResponseI<EccnHsCodeRelationI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, 'HS_CODE_RELATIONS', eccnId],
    queryFn: () => EccnServices.getHsCodeRelationsByEccnId({ ECCN_ID: eccnId as number }),
    enabled: isOpen && eccnId !== null
  })

export const useEccnSearch = (params: object, isFetchData: boolean) =>
  useQuery<AxiosResponseI<EccnI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => EccnServices.search(params),
    placeholderData: keepPreviousData,
    enabled: isFetchData
  })
