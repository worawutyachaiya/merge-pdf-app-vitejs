import axios from 'axios'

const axiosInstance = (() => {
  return axios.create({
    baseURL: `${import.meta.env.VITE_COMMON_SYSTEM_API_URL}`,
    headers: {
      'Content-Type': 'application/json'
    }
  })
})()

async function axiosRequestCommonSystem<T>(options: any) {
  const onSuccess = function (response: T) {
    return response
  }

  const onError = function (error: any) {
    return Promise.reject(error)
  }

  return axiosInstance(options).then(onSuccess).catch(onError)
}

export default axiosRequestCommonSystem
