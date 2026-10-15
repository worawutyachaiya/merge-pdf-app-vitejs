import { AxiosError } from 'axios'

import { useMergePdfActions } from '@/_workspace/react-query/hooks/useMergePdf'
import type { MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import ConfirmModal from '@/components/ConfirmModal'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'

interface Props {
  job: MergePdfJob
  onClose: () => void
  onDeleted: () => void
}

const MergePdfDeleteModal = ({ job, onClose, onDeleted }: Props) => {
  const actions = useMergePdfActions()
  const remove = async () => {
    try {
      await actions.deleteJob.mutateAsync({ jobId: job.JOB_ID, rowVersion: job.ROW_VERSION })
      ToastMessageSuccess({ title: 'Delete Document', message: 'Document and shared PDF deleted' })
      onDeleted()
      onClose()
    } catch (error: unknown) {
      const response: unknown = error instanceof AxiosError ? error.response?.data : null
      const message =
        response && typeof response === 'object' && 'Message' in response && typeof response.Message === 'string'
          ? response.Message
          : error instanceof Error
            ? error.message
            : 'Unable to delete document'
      ToastMessageError({ title: 'Delete Document', message })
    }
  }

  return (
    <ConfirmModal
      show
      onConfirmClick={() => void remove()}
      onCloseClick={onClose}
      isDelete
      isLoading={actions.deleteJob.isPending}
      title='Delete document'
      description={`Delete "${job.OUTPUT_FILE_NAME ?? job.JOB_TITLE}" and its PDF from the shared folder? This also removes the document from search results.`}
      confirmLabel='Delete'
    />
  )
}

export default MergePdfDeleteModal
