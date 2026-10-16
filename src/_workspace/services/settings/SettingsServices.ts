import SettingsAPI from '@/_workspace/api/settings/SettingsAPI'
import type { DocumentOrderCategory, DocumentOrderItem } from '@/_workspace/types/settings/Settings'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

const root = SettingsAPI.API_ROOT_URL

export default class SettingsServices {
  static documentOrder() {
    return axiosRequest<ResultDataResponseI<DocumentOrderCategory>>({
      url: `${root}/document-order/get`,
      method: 'GET'
    })
  }

  static saveDocumentOrder(order: DocumentOrderItem[]) {
    const user = getUserData()
    const employeeCode = String(user.EMPLOYEE_CODE ?? '').trim()
    if (!String(user.USER_ID ?? '').trim() || !employeeCode || employeeCode.length > 30)
      return Promise.reject(new Error('Employee code is missing. Please sign in again.'))
    return axiosRequest<ResultDataResponseI<DocumentOrderCategory>>({
      url: `${root}/document-order/update`,
      method: 'PATCH',
      data: { order, CREATE_BY: employeeCode, UPDATE_BY: employeeCode }
    })
  }
}
