import type { AxiosRequestConfig } from 'axios'

export interface ResultDataResponseI<T> {
  Message: string
  MethodOnDb: string
  ResultOnDb: T[] // Must extends to your Components
  Status: boolean
  TotalCountOnDb: number
  ResultOnDbRawData?: T[] //Optional for transform data
}

export default interface AxiosResponseI<T = null> {
  data: ResultDataResponseI<T>
  status: number
  statusText: string
  headers: any
  config: AxiosRequestConfig
  request?: any
}

export interface AxiosResponseWithErrorI {
  message?: string
  code?: string
}
