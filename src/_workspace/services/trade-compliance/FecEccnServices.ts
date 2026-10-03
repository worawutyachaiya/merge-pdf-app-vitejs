import FecEccnAPI from '@/_workspace/api/trade-compliance/FecEccnAPI'
import type { FecEccnI } from '@/_workspace/types/trade-compliance/FecEccn'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'

export default class FecEccnServices {
  static search(params: object) {
    return axiosRequest<ResultDataResponseI<FecEccnI>>({
      url: `${FecEccnAPI.API_ROOT_URL}/search`,
      data: params,
      method: 'POST'
    })
  }

  static create(data: object) {
    return axiosRequest({
      url: `${FecEccnAPI.API_ROOT_URL}/create`,
      data,
      method: 'POST'
    })
  }

  static update(data: object) {
    return axiosRequest({
      url: `${FecEccnAPI.API_ROOT_URL}/update`,
      data,
      method: 'PATCH'
    })
  }

  static delete(data: object) {
    return axiosRequest({
      url: `${FecEccnAPI.API_ROOT_URL}/delete`,
      data,
      method: 'DELETE'
    })
  }
}
