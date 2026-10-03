import EarStatusAPI from '@/_workspace/api/trade-compliance/EarStatusAPI'
import type { EarStatusI } from '@/_workspace/types/trade-compliance/EarStatus'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'

export default class EarStatusServices {
  static search(params: object) {
    return axiosRequest<ResultDataResponseI<EarStatusI>>({
      url: `${EarStatusAPI.API_ROOT_URL}/search`,
      data: params,
      method: 'POST'
    })
  }
}
