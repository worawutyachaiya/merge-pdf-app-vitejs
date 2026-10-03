import { keepPreviousData, useQuery } from '@tanstack/react-query'

import HsCodeServices from '@/_workspace/services/trade-compliance/HsCodeServices'
import type { HsCodeEccnRelationI, HsCodeI } from '@/_workspace/types/trade-compliance/HsCode'
import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'

export const PREFIX_QUERY_KEY = 'HS_CODE'

export const useHsCodeEccnRelations = (hsCodeId: number | null, isOpen: boolean) =>
  useQuery<AxiosResponseI<HsCodeEccnRelationI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, 'ECCN_RELATIONS', hsCodeId],
    queryFn: () => HsCodeServices.getEccnRelationsByHsCodeId({ HS_CODE_ID: hsCodeId as number }),
    enabled: isOpen && hsCodeId !== null
  })

export const useHsCodeSearch = (params: object, isFetchData: boolean) =>
  useQuery<AxiosResponseI<HsCodeI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => HsCodeServices.search(params),
    placeholderData: keepPreviousData,
    enabled: isFetchData
  })
