import ApplicationAPI from '@/api/securtity-center-system/ApplicationAPI'
import axiosRequest_SecurityCenterSystem from '@/libs/axios/security-center-system/axiosRequest_SecurityCenterSystem'

export default class ProductMainServices {
  static searchApplicationByUserIdAndUserGroupId(params: string) {
    return axiosRequest_SecurityCenterSystem({
      url: `${ApplicationAPI.API_ROOT_URL}/searchApplicationAndUserGroup`,
      params: { data: params },
      method: 'POST'
    })
  }

  static searchApplicationMergeByUserIdAndUserGroupId(params: string) {
    return axiosRequest_SecurityCenterSystem({
      url: `${ApplicationAPI.API_ROOT_URL}/searchApplicationAndUserGroupMerge`,
      data: params,
      method: 'POST'
    })
  }
}
