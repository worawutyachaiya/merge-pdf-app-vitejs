import EccnAPI from '@/_workspace/api/trade-compliance/EccnAPI'
import type { EccnHsCodeRelationI, EccnI } from '@/_workspace/types/trade-compliance/Eccn'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'

export default class EccnServices {
  static search(params: object) {
    return axiosRequest<ResultDataResponseI<EccnI>>({
      url: `${EccnAPI.API_ROOT_URL}/search`,
      data: params,
      method: 'POST'
    })
  }

  static getHsCodeRelationsByEccnId(params: { ECCN_ID: number }) {
    return axiosRequest<ResultDataResponseI<EccnHsCodeRelationI>>({
      url: `${EccnAPI.API_ROOT_URL}/getHsCodeRelationsByEccnId`,
      data: params,
      method: 'POST'
    })
  }
}
