import EarSurveyAPI from '@/_workspace/api/trade-compliance/EarSurveyAPI'
import type {
  EarSurveyActivatePreTradePayloadI,
  EarSurveyCancelPreTradePayloadI,
  EarSurveyI,
  EarSurveyImportPayloadI,
  EarSurveyPreTradeImportPayloadI,
  ManufacturingItemLookupI
} from '@/_workspace/types/trade-compliance/EarSurvey'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'

export default class EarSurveyServices {
  static getManufacturingItemByCode(itemCode: string) {
    return axiosRequest<ResultDataResponseI<ManufacturingItemLookupI>>({
      url: `${EarSurveyAPI.API_ROOT_URL}/manufacturing-item`,
      params: { ITEM_CODE: itemCode },
      method: 'GET'
    })
  }
  static search(params: object) {
    return axiosRequest<ResultDataResponseI<EarSurveyI>>({
      url: `${EarSurveyAPI.API_ROOT_URL}/search`,
      data: params,
      method: 'POST'
    })
  }

  static getByEarSurveyHeaderId(params: { EAR_SURVEY_HEADER_ID: number }) {
    return axiosRequest<ResultDataResponseI<EarSurveyI>>({
      url: `${EarSurveyAPI.API_ROOT_URL}/getByEarSurveyHeaderId`,
      data: params,
      method: 'POST'
    })
  }

  static createByImportFile(payload: EarSurveyImportPayloadI) {
    return axiosRequest({
      url: `${EarSurveyAPI.API_ROOT_URL}/createByImportFile`,
      data: payload,
      method: 'POST'
    })
  }

  static searchPreTrade(params: object) {
    return axiosRequest<ResultDataResponseI<EarSurveyI>>({
      url: `${EarSurveyAPI.API_ROOT_URL}/searchPreTrade`,
      data: params,
      method: 'POST'
    })
  }

  static createPreTradeByImportFile(payload: EarSurveyPreTradeImportPayloadI) {
    return axiosRequest({
      url: `${EarSurveyAPI.API_ROOT_URL}/createPreTradeByImportFile`,
      data: payload,
      method: 'POST'
    })
  }

  static activatePreTrade(payload: EarSurveyActivatePreTradePayloadI) {
    return axiosRequest({
      url: `${EarSurveyAPI.API_ROOT_URL}/activatePreTrade`,
      data: payload,
      method: 'POST'
    })
  }

  static cancelPreTrade(payload: EarSurveyCancelPreTradePayloadI) {
    return axiosRequest({
      url: `${EarSurveyAPI.API_ROOT_URL}/cancelPreTrade`,
      data: payload,
      method: 'POST'
    })
  }
}
