import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'

const axiosInstance = (() => {
  return axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}`,
    headers: {
      'Content-Type': 'application/json'
    }
  })
})()

async function AxiosRequest<T>(options: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const onSuccess = (response: AxiosResponse<T>) => {
    return response
  }

  const onError = (error: AxiosError) => {
    return Promise.reject(error)
  }

  return axiosInstance(options).then(onSuccess).catch(onError)
}

export default AxiosRequest
