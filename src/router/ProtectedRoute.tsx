import { Outlet, useLocation } from 'react-router'
import Cookies from 'js-cookie'

// แนะนำให้เก็บ auth จริงใน context หรือ redux
const isAuthenticated = () => {
  const userData = Cookies.get('userData')

  if (!userData) {
    return false
  }

  return true
  // return localStorage.getItem('token') !== null
}

const ProtectedRoute = () => {
  const pathname = useLocation()

  return isAuthenticated() ? (
    <Outlet />
  ) : (
    (window.location.href =
      import.meta.env.VITE_BASE_WEB_APP_LOGIN_URL +
      '?continue=' +
      import.meta.env.VITE_BASE_WEB_APP_URL +
      pathname.pathname)
  )
}

export default ProtectedRoute
