import type { MRT_Row } from 'material-react-table'

import { useQueryClient } from '@tanstack/react-query'

import ConfirmModal from '@components/ConfirmModal'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import { ToastMessageError, ToastMessageSuccess } from '@components/ToastMessage'

import { useDxContext } from '@/_template/DxContextProvider'
import { PREFIX_QUERY_KEY, useFecEccnDelete } from '@/_workspace/react-query/hooks/useFecEccn'
import type { FecEccnI } from '@/_workspace/types/trade-compliance/FecEccn'
import AxiosResponseI, { AxiosResponseWithErrorI } from '@/libs/axios/types/AxiosResponseInterface'

interface Props {
  open: boolean
  rowSelected: MRT_Row<FecEccnI> | null
  onClose: () => void
}

const DeleteModal = ({ open, rowSelected, onClose }: Props) => {
  const { setIsEnableFetching } = useDxContext()
  const queryClient = useQueryClient()

  const handleClose = () => {
    onClose()
  }

  const handleCancel = () => {
    const dataItem = {
      ECCN_FEC_ID: rowSelected?.original.ECCN_FEC_ID,
      UPDATE_BY: getUserData()?.EMPLOYEE_CODE
    }

    mutate(dataItem)
  }

  const onMutateSuccess = (data: AxiosResponseI<null>) => {
    if (data.data && data.data.Status == true) {
      const message = {
        message: data.data.Message,
        title: 'Cancel FEC ECCN'
      }

      ToastMessageSuccess(message)
      setIsEnableFetching(true)
      queryClient.invalidateQueries({ queryKey: [PREFIX_QUERY_KEY] })

      handleClose()
    } else {
      const message = {
        title: 'Cancel FEC ECCN',
        message: data.data.Message
      }

      ToastMessageError(message)
    }
  }

  const onMutateError = (error: AxiosResponseWithErrorI) => {
    const message = {
      title: 'Cancel FEC ECCN',
      message: error.message
    }

    ToastMessageError(message)
  }

  const { mutate, isPending } = useFecEccnDelete(onMutateSuccess, onMutateError)

  return (
    <ConfirmModal
      show={open}
      onConfirmClick={handleCancel}
      onCloseClick={handleClose}
      isDelete={true}
      isLoading={isPending}
    />
  )
}

export default DeleteModal
