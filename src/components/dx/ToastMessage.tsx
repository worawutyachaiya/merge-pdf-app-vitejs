// MUI Imports

// Third-party Imports
import { toast } from 'react-toastify'

const ToastMessageSuccess = ({ message }: any) => {
  return toast.success(message, {
    hideProgressBar: false
  })
}

const ToastMessageError = ({ message }: any) => {
  return toast.error(message, {
    hideProgressBar: false
  })
}

export { ToastMessageError, ToastMessageSuccess }
