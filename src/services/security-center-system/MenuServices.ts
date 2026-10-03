import MenuAPI from '@/api/securtity-center-system/MenuAPI'
import axiosRequest_SecurityCenterSystem from '@/libs/axios/security-center-system/axiosRequest_SecurityCenterSystem'

export default class MenuService {
  static getMenuMergeUserGroup(params: string) {
    return axiosRequest_SecurityCenterSystem({
      url: `${MenuAPI.API_ROOT_URL}/getMenuMergeUserGroup`,
      params: { data: params },
      method: 'GET'
    })
  }

  static getMenuMergeUserGroupByUserNameAndApplicationId(params: string) {
    return axiosRequest_SecurityCenterSystem({
      url: `${MenuAPI.API_ROOT_URL}/getMenuMergeUserGroupByUserNameAndApplicationId`,
      params: { data: params },
      method: 'GET'
    })
  }
}
