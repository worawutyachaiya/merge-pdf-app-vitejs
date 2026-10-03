import CalDeMinimisAPI from '@/_workspace/api/trade-compliance/CalDeMinimisAPI'
import type {
  CalDeMinimisCalculationRequest,
  CalDeMinimisCalculationResult,
  CalDeMinimisProductTypeOption,
  CalDeMinimisSctOption,
  CalDeMinimisThresholdSettings,
  CalDeMinimisThresholdSettingsUpdate
} from '@/_workspace/types/trade-compliance/CalDeMinimis'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'

export default class CalDeMinimisServices {
  static getProductTypes(search = '') {
    return axiosRequest<ResultDataResponseI<CalDeMinimisProductTypeOption>>({
      url: `${CalDeMinimisAPI.API_ROOT_URL}/product-types`,
      params: { SEARCH: search },
      method: 'GET'
    })
  }

  static getSctRevisions(productTypeId: number) {
    return axiosRequest<ResultDataResponseI<CalDeMinimisSctOption>>({
      url: `${CalDeMinimisAPI.API_ROOT_URL}/sct-revisions`,
      params: { PRODUCT_TYPE_ID: productTypeId },
      method: 'GET'
    })
  }

  static getThresholdSettings() {
    return axiosRequest<ResultDataResponseI<CalDeMinimisThresholdSettings>>({
      url: `${CalDeMinimisAPI.API_ROOT_URL}/settings`,
      method: 'GET'
    })
  }

  static updateThresholdSettings(data: CalDeMinimisThresholdSettingsUpdate) {
    return axiosRequest<ResultDataResponseI<CalDeMinimisThresholdSettings>>({
      url: `${CalDeMinimisAPI.API_ROOT_URL}/settings`,
      data,
      method: 'PATCH'
    })
  }

  static calculate(payload: CalDeMinimisCalculationRequest) {
    return axiosRequest<ResultDataResponseI<CalDeMinimisCalculationResult>>({
      url: `${CalDeMinimisAPI.API_ROOT_URL}/calculate`,
      data: payload,
      method: 'POST'
    })
  }
}
