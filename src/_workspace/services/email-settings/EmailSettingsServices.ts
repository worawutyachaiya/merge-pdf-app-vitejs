import EmailSettingsAPI from '@/_workspace/api/email-settings/EmailSettingsAPI'
import type { AccountingPerson, EmailSettings } from '@/_workspace/types/email-settings/EmailSettings'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

const root = EmailSettingsAPI.API_ROOT_URL

const auditRequest = <T>(options: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  const user = getUserData()
  const employeeCode = String(user.EMPLOYEE_CODE ?? '').trim()
  if (!String(user.USER_ID ?? '').trim() || !employeeCode || employeeCode.length > 30)
    return Promise.reject(new Error('Employee code is missing. Please sign in again.'))
  return axiosRequest<T>({ ...options, data: { ...options.data, CREATE_BY: employeeCode, UPDATE_BY: employeeCode } })
}

export default class EmailSettingsServices {
  static settings() {
    return axiosRequest<ResultDataResponseI<EmailSettings>>({ url: `${root}/get`, method: 'GET' })
  }

  static accountingPeople(search: string) {
    return axiosRequest<ResultDataResponseI<AccountingPerson>>({
      url: `${root}/accounting-people`,
      method: 'GET',
      params: { search }
    })
  }

  static save(scheduleTime: string, employeeCodes: string[]) {
    return auditRequest<ResultDataResponseI<EmailSettings>>({
      url: `${root}/update`,
      method: 'PATCH',
      data: { scheduleTime, employeeCodes }
    })
  }
}
