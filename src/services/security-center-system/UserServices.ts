//import UserAPI from '../../api/Security Center System/UserAPI';

import UserAPI from '@/api/securtity-center-system/UserAPI'
import AxiosRequest from '@/libs/axios/axiosRequest'

export default class UserServices {
  static search(params: string) {
    return AxiosRequest({
      url: `${UserAPI.API_ROOT_URL}/login`,
      params: { data: params },
      method: 'GET'
    })
  }
}
