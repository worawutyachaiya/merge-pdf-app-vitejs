import ConfirmModal from '@/components/ConfirmModal'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import { useCancelPreTrade } from '@/_workspace/react-query/hooks/useEarSurvey'

import { MENU_NAME } from '../env'

interface Props {
  open: boolean
  earSurveyHeaderId: number | null
  onClose: () => void
  onCancelled: () => void
}

const DeleteModal = ({ open, earSurveyHeaderId, onClose, onCancelled }: Props) => {
  const cancelMutation = useCancelPreTrade()

  const cancel = async () => {
    if (!earSurveyHeaderId) return

    try {
      const response = await cancelMutation.mutateAsync({
        EAR_SURVEY_HEADER_ID: earSurveyHeaderId,
        UPDATE_BY: getUserData().EMPLOYEE_CODE || getUserData().USER_NAME
      })
      if (!response.data.Status) {
        ToastMessageError({ title: MENU_NAME, message: response.data.Message })
        return
      }
      ToastMessageSuccess({ title: MENU_NAME, message: response.data.Message })
      onCancelled()
      onClose()
    } catch (error) {
      ToastMessageError({
        title: MENU_NAME,
        message: error instanceof Error ? error.message : 'Unable to cancel Pre-Trade EAR Survey'
      })
    }
  }

  return <ConfirmModal show={open} onConfirmClick={cancel} onCloseClick={onClose} isDelete={true} />
}

export default DeleteModal
