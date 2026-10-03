import CountryAPI from '@/_workspace/api/trade-compliance/CountryAPI'
import type { CountryI } from '@/_workspace/types/trade-compliance/Country'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'

export default class CountryServices {
  static search(params: object) {
    return axiosRequest<ResultDataResponseI<CountryI>>({
      url: `${CountryAPI.API_ROOT_URL}/search`,
      data: params,
      method: 'POST'
    })
  }
}
