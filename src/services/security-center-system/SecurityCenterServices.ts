import MenuAPI from '@/api/securtity-center-system/MenuAPI'
import SecurityCenterAPI from '@/api/securtity-center-system/SecurityCenterAPI'
import axiosRequestSecurityCenter from '@/libs/axios/axiosRequestSecurityCenter'
import axiosRequest_SecurityCenterSystem from '@/libs/axios/security-center-system/axiosRequest_SecurityCenterSystem'

export default class SecurityCenterServices {
  static searchApplicationFavoriteByUserId(params: string) {
    return axiosRequestSecurityCenter({
      url: `${SecurityCenterAPI.API_ROOT_URL}/searchApplicationFavoriteByUserId`,
      params: { data: params },
      method: 'POST'
    })
  }

  static getUserGroupByUsernameAndLikeUserGroupName(params: object) {
    return axiosRequest_SecurityCenterSystem({
      url: `${MenuAPI.API_ROOT_URL}/getUserGroupByUsernameAndLikeUserGroupName`,
      params: { data: JSON.stringify(params) },
      method: 'POST'
    })
  }
  static getUserGroupByUsernameAndApplication(params: object) {
    return axiosRequest_SecurityCenterSystem({
      url: `${MenuAPI.API_ROOT_URL}/getUserGroupByUsernameAndApplication`,
      params: { data: JSON.stringify(params) },
      method: 'POST'
    })
  }

  static updateUserApplicationFavorite(params: {
    USER_APPLICATION_FAVORITE_ID: number
    isFavorite: boolean
    APPLICATION_ID: number
    USER_ID: number
  }) {
    return axiosRequestSecurityCenter({
      url: `${SecurityCenterAPI.API_ROOT_URL}/updateUserApplicationFavorite`,
      params: { data: JSON.stringify(params) },
      method: 'POST'
    })
  }
}
