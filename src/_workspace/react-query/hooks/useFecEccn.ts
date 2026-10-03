import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import FecEccnServices from '@/_workspace/services/trade-compliance/FecEccnServices'
import type { FecEccnI } from '@/_workspace/types/trade-compliance/FecEccn'
import AxiosResponseI, { type AxiosResponseWithErrorI } from '@/libs/axios/types/AxiosResponseInterface'

export const PREFIX_QUERY_KEY = 'FEC_ECCN'

export const useFecEccnSearch = (params: object, isFetchData: boolean) =>
  useQuery<AxiosResponseI<FecEccnI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => FecEccnServices.search(params),
    placeholderData: keepPreviousData,
    enabled: isFetchData
  })

export const useFecEccnCreate = (onSuccess: (response: AxiosResponseI) => void, onError: (error: AxiosResponseWithErrorI) => void) =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => FecEccnServices.create(data), onSuccess, onError })

export const useFecEccnUpdate = (onSuccess: (response: AxiosResponseI) => void, onError: (error: AxiosResponseWithErrorI) => void) =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => FecEccnServices.update(data), onSuccess, onError })

export const useFecEccnDelete = (onSuccess: (response: AxiosResponseI) => void, onError: (error: AxiosResponseWithErrorI) => void) =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => FecEccnServices.delete(data), onSuccess, onError })
