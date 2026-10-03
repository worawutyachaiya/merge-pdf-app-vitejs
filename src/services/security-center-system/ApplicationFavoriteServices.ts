import axiosRequest_SecurityCenterSystem from '@/libs/axios/security-center-system/axiosRequest_SecurityCenterSystem'
import ApplicationFavoriteAPI from '@/api/securtity-center-system/ApplicationFavoriteAPI'

export default class ApplicationFavoriteServices {
  static searchApplicationFavoriteByUserId(params: string) {
    return axiosRequest_SecurityCenterSystem({
      url: `${ApplicationFavoriteAPI.API_ROOT_URL}/searchApplicationFavoriteByUserId`,
      params: { data: params },
      method: 'POST'
    })
  }

  static updateUserApplicationFavorite(params: {
    USER_APPLICATION_FAVORITE_ID: number
    isFavorite: boolean
    APPLICATION_ID: number
    USER_ID: number
  }) {
    return axiosRequest_SecurityCenterSystem({
      url: `${ApplicationFavoriteAPI.API_ROOT_URL}/updateUserApplicationFavorite`,
      params: { data: JSON.stringify(params) },
      method: 'POST'
    })
  }
}
