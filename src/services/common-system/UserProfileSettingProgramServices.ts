import UserProfileSettingProgramAPI from '@/api/common-system/UserProfileSettingProgramAPI'
import axiosRequest_CommonSystem from '@/libs/axios/common-system/axiosRequest_CommonSystem'

export default class UserProfileSettingProgramServices {
  static create(dataItem: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingProgramAPI.API_ROOT_URL}/create`,
      method: 'POST',
      data: dataItem
    })
  }

  static createUserGroupApplication(dataItem: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingProgramAPI.API_ROOT_URL}/createUserGroupApplication`,
      method: 'POST',
      data: dataItem
    })
  }

  static search(params: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingProgramAPI.API_ROOT_URL}/search`,
      params: { data: params },
      method: 'GET'
    })
  }
  static getUserGroupByUserIdAndApplicationId(params: object) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingProgramAPI.API_ROOT_URL}/getUserGroupByUserIdAndApplicationId`,
      params: { data: JSON.stringify(params) },
      method: 'GET'
    })
  }

  static get(dataItem: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingProgramAPI.API_ROOT_URL}/get`,
      params: { data: JSON.stringify(dataItem) },
      method: 'GET'
    })
  }

  static update(dataItem: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingProgramAPI.API_ROOT_URL}/update`,
      method: 'PATCH',
      data: dataItem
    })
  }

  static delete(dataItem: string) {
    return axiosRequest_CommonSystem({
      url: `${UserProfileSettingProgramAPI.API_ROOT_URL}/delete`,
      data: dataItem,
      method: 'DELETE'
    })
  }

  static getByUserIdAndApplicationIdAndMenuId<T>(dataItem: string) {
    return axiosRequest_CommonSystem<T>({
      url: `${UserProfileSettingProgramAPI.API_ROOT_URL}/getByUserIdAndApplicationIdAndMenuId`,
      params: { data: dataItem },
      method: 'GET'
    })
  }
}
