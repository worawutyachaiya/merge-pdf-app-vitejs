import { AxiosError } from 'axios'
import { useMergePdfActions } from '@/_workspace/react-query/hooks/useMergePdf'
import type { MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import ConfirmModal from '@/components/ConfirmModal'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'

export default function MergePdfRestoreModal({
  job,
  onClose,
  onRestored
}: {
  job: MergePdfJob
  onClose: () => void
  onRestored: () => void
}) {
  const actions = useMergePdfActions()
  return (
    <ConfirmModal
      show
      title='Restore document'
      description={`Restore "${job.JOB_TITLE}" and its saved PDF?`}
      isDelete={false}
      isLoading={actions.restoreJob.isPending}
      confirmLabel='Restore'
      onCloseClick={onClose}
      onConfirmClick={() =>
        void (async () => {
          try {
            await actions.restoreJob.mutateAsync({ jobId: job.JOB_ID, rowVersion: job.ROW_VERSION })
            ToastMessageSuccess({ message: 'Document restored' })
            onRestored()
            onClose()
          } catch (error) {
            ToastMessageError({
              message:
                error instanceof AxiosError
                  ? (error.response?.data?.Message ?? 'Unable to restore document')
                  : 'Unable to restore document'
            })
          }
        })()
      }
    />
  )
}
