import CommonAPI from '@/_workspace/api/common/commonApi'
import { default as axiosRequest, default as AxiosRequest } from '@/libs/axios/axiosRequest'

export default class CommonServices {
  static getByLikeMonthShortNameEnglish(property: Record<string, unknown>) {
    return AxiosRequest({
      url: `${CommonAPI.API_ROOT_URL}/GetByLikeMonthShortNameEnglish`,
      data: property,
      method: 'POST'
    })
  }
  static getImageFromUrl(URL: { URL_PATH: string }) {
    return AxiosRequest({
      url: `${CommonAPI.API_ROOT_URL}/getImageFromUrl`,
      data: URL,
      method: 'POST',
      responseType: 'blob'
    })
  }
  static getImageArrayFromUrl(URL: { URL_PATH: string }) {
    return axiosRequest({
      url: `${CommonAPI.API_ROOT_URL}/getImageArrayFromUrl`,
      data: URL,
      method: 'POST'
      // responseType: 'blob'
    })
  }
  static getImageEmployeeFromUrl(URL: { URL_PATH: string }) {
    return AxiosRequest({
      url: `${CommonAPI.API_ROOT_URL}/getImageEmployeeFromUrl`,
      data: URL,
      method: 'POST',
      responseType: 'blob'
    })
  }
}
