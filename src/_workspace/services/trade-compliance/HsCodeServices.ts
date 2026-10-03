import HsCodeAPI from '@/_workspace/api/trade-compliance/HsCodeAPI'
import type { HsCodeEccnRelationI, HsCodeI } from '@/_workspace/types/trade-compliance/HsCode'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'

export default class HsCodeServices {
  static search(params: object) {
    return axiosRequest<ResultDataResponseI<HsCodeI>>({
      url: `${HsCodeAPI.API_ROOT_URL}/search`,
      data: params,
      method: 'POST'
    })
  }

  static getEccnRelationsByHsCodeId(params: { HS_CODE_ID: number }) {
    return axiosRequest<ResultDataResponseI<HsCodeEccnRelationI>>({
      url: `${HsCodeAPI.API_ROOT_URL}/getEccnRelationsByHsCodeId`,
      data: params,
      method: 'POST'
    })
  }
}
