import axios from 'axios'

const axiosInstance = (() => {
  return axios.create({
    baseURL: `${import.meta.env.VITE_SECURITY_CENTER_SYSTEM_API_URL}`,
    headers: {
      'Content-Type': 'application/json'
    }
  })
})()

async function axiosRequestSecurityCenter(options: any) {
  const onSuccess = function (response: any) {
    // console.log(response);

    return response
  }

  const onError = function (error: any) {
    return Promise.reject(error)
  }

  return axiosInstance(options).then(onSuccess).catch(onError)
}

export default axiosRequestSecurityCenter
