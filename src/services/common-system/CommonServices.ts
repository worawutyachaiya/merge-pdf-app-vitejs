import CommonAPI from '@/api/common-system/CommonAPI'
import axiosRequest from '@/libs/axios/common-system/axiosRequest_CommonSystem'

export default class CommonServices {
  static getImageFromUrl(URL: object) {
    return axiosRequest({
      url: `${CommonAPI.API_ROOT_URL}/getImageEmployee`,
      data: URL,
      method: 'POST',
      responseType: 'blob'
    })
  }
  static getByLikeMonthShortNameEnglish(property: any) {
    return axiosRequest({
      url: `${CommonAPI.API_ROOT_URL}/GetByLikeMonthShortNameEnglish`,
      data: property,
      method: 'POST'
    })
  }
  // static getImageArrayFromUrl(URL: any) {
  //   return axiosRequest({
  //     url: `${CommonAPI.API_ROOT_URL}/getImageArrayFromUrl`,
  //     data: URL,
  //     method: 'POST',
  //     responseType: 'blob'
  //   })
  // }
}
