import UserProfileSettingAPI from '@/api/common-system/UserProfileSettingAPI'
import axiosRequest_CommonSystem from '@/libs/axios/common-system/axiosRequest_CommonSystem'

export default class UserProfileSettingServices {
  static create(dataItem: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingAPI.API_ROOT_URL}/create`,
      method: 'POST',
      data: dataItem
    })
  }

  static search(params: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingAPI.API_ROOT_URL}/search`,
      params: { data: params },
      method: 'GET'
    })
  }

  static get(dataItem: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingAPI.API_ROOT_URL}/get`,
      params: { data: JSON.stringify(dataItem) },
      method: 'GET'
    })
  }

  static update(dataItem: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingAPI.API_ROOT_URL}/update`,
      method: 'PATCH',
      data: dataItem
    })
  }

  static delete(dataItem: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingAPI.API_ROOT_URL}/delete`,
      data: dataItem,
      method: 'DELETE'
    })
  }

  static getByUserId<T>(dataItem: { USER_ID: string }) {
    return axiosRequest_CommonSystem<T>({
      url: `${UserProfileSettingAPI.API_ROOT_URL}/getByUserId`,
      data: dataItem,
      method: 'POST'
    })
  }
}
