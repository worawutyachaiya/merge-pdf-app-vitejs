import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import EarSurveyServices from '@/_workspace/services/trade-compliance/EarSurveyServices'
import type {
  EarSurveyActivatePreTradePayloadI,
  EarSurveyCancelPreTradePayloadI,
  EarSurveyI,
  EarSurveyImportPayloadI,
  EarSurveyPreTradeImportPayloadI
} from '@/_workspace/types/trade-compliance/EarSurvey'
import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'

export const PREFIX_QUERY_KEY = 'EAR_SURVEY'

export const useEarSurveySearch = (params: object, isFetchData: boolean) =>
  useQuery<AxiosResponseI<EarSurveyI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => EarSurveyServices.search(params),
    placeholderData: keepPreviousData,
    enabled: isFetchData
  })

export const useEarSurveyDetail = (earSurveyHeaderId: number | null, isOpen: boolean) =>
  useQuery<AxiosResponseI<EarSurveyI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, 'DETAIL', earSurveyHeaderId],
    queryFn: () =>
      EarSurveyServices.getByEarSurveyHeaderId({
        EAR_SURVEY_HEADER_ID: earSurveyHeaderId as number
      }),
    enabled: isOpen && earSurveyHeaderId !== null
  })

export const useCreateEarSurveyByImportFile = () =>
  useMutation({
    mutationFn: (payload: EarSurveyImportPayloadI) => EarSurveyServices.createByImportFile(payload)
  })

export const useEarSurveyPreTradeSearch = (params: object, isFetchData: boolean) =>
  useQuery<AxiosResponseI<EarSurveyI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, 'PRE_TRADE', params],
    queryFn: () => EarSurveyServices.searchPreTrade(params),
    placeholderData: keepPreviousData,
    enabled: isFetchData
  })

export const useCreatePreTradeByImportFile = () =>
  useMutation({
    mutationFn: (payload: EarSurveyPreTradeImportPayloadI) => EarSurveyServices.createPreTradeByImportFile(payload)
  })

export const useActivatePreTrade = () =>
  useMutation({
    mutationFn: (payload: EarSurveyActivatePreTradePayloadI) => EarSurveyServices.activatePreTrade(payload)
  })

export const useCancelPreTrade = () =>
  useMutation({
    mutationFn: (payload: EarSurveyCancelPreTradePayloadI) => EarSurveyServices.cancelPreTrade(payload)
  })
