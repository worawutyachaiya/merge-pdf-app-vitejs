import MenuAPI from '@/api/securtity-center-system/MenuAPI'
import UserGroupAPI from '@/api/securtity-center-system/UserGroupAPI'
import AxiosRequest from '@/libs/axios/axiosRequest'
import axiosRequest_SecurityCenterSystem from '@/libs/axios/security-center-system/axiosRequest_SecurityCenterSystem'

export default class UserGroupService {
  static create(ProductMainProperty: string) {
    return AxiosRequest({
      url: `${UserGroupAPI.API_ROOT_URL}/create`,
      method: 'POST',
      data: ProductMainProperty
    })
  }

  static search(params: string) {
    return AxiosRequest({
      url: `${UserGroupAPI.API_ROOT_URL}/search`,
      params: { data: params },
      method: 'GET'
    })
  }

  static get(ProductMainProperty: string) {
    return AxiosRequest({
      url: `${UserGroupAPI.API_ROOT_URL}/get`,
      params: { data: JSON.stringify(ProductMainProperty) },
      method: 'GET'
    })
  }

  static update(ProductMainProperty: string) {
    return AxiosRequest({
      url: `${UserGroupAPI.API_ROOT_URL}/update`,
      method: 'PATCH',
      data: ProductMainProperty
    })
  }

  static delete(ProductMainProperty: string) {
    return AxiosRequest({
      url: `${UserGroupAPI.API_ROOT_URL}/delete`,
      data: ProductMainProperty,
      method: 'DELETE'
    })
  }

  static getUserGroupByUsernameAndLikeUserGroupName(params: object) {
    return axiosRequest_SecurityCenterSystem({
      url: `${MenuAPI.API_ROOT_URL}/getUserGroupByUsernameAndLikeUserGroupName`,
      params: { data: JSON.stringify(params) },
      method: 'GET'
    })
  }
  static getUserGroupByUsernameAndApplication(params: object) {
    return axiosRequest_SecurityCenterSystem({
      url: `${MenuAPI.API_ROOT_URL}/getUserGroupByUsernameAndApplication`,
      params: { data: JSON.stringify(params) },
      method: 'GET'
    })
  }

  static searchApplicationAndUserGroup(application: string) {
    return AxiosRequest({
      url: `${UserGroupAPI.API_ROOT_URL}/searchApplicationAndUserGroup`,
      data: application,
      method: 'POST'
    })
  }
}
