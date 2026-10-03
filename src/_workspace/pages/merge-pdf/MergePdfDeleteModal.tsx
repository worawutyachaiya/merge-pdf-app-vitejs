import { useState } from 'react'
import { AxiosError } from 'axios'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

import { useMergePdfActions } from '@/_workspace/react-query/hooks/useMergePdf'
import type { MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import ConfirmModal from '@/components/ConfirmModal'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import Transition from '@/components/TransitionDialog'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'

interface Props {
  job: MergePdfJob
  onClose: () => void
  onDeleted: () => void
}

const MergePdfDeleteModal = ({ job, onClose, onDeleted }: Props) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const actions = useMergePdfActions()
  const remove = async () => {
    try {
      await actions.deleteDraft.mutateAsync({ jobId: job.JOB_ID, rowVersion: job.ROW_VERSION })
      ToastMessageSuccess({ title: 'Delete Draft', message: 'Draft deleted' })
      onDeleted()
      onClose()
    } catch (error: unknown) {
      setConfirmOpen(false)
      const response: unknown = error instanceof AxiosError ? error.response?.data : null
      const message =
        response && typeof response === 'object' && 'Message' in response && typeof response.Message === 'string'
          ? response.Message
          : error instanceof Error
            ? error.message
            : 'Unable to delete draft'
      ToastMessageError({ title: 'Delete Draft', message })
    }
  }

  return (
    <>
      <Dialog
        open
        maxWidth='sm'
        fullWidth
        TransitionComponent={Transition}
        onClose={(_, reason) => !actions.deleteDraft.isPending && reason !== 'backdropClick' && onClose()}
        sx={{
          '& .MuiDialog-paper': { overflow: 'visible' },
          '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
        }}
        PaperProps={{ sx: { top: 30, m: 0 } }}
      >
        <DialogTitle>
          <Typography variant='h5' component='span'>
            Delete Draft
          </Typography>
          <DialogCloseButton onClick={onClose} disabled={actions.deleteDraft.isPending} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent>
          <Typography>Delete draft "{job.JOB_TITLE}" and remove it from search results?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant='contained'
            color='error'
            disabled={actions.deleteDraft.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            Delete
          </Button>
          <Button variant='tonal' color='secondary' disabled={actions.deleteDraft.isPending} onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmModal
        show={confirmOpen}
        onConfirmClick={() => void remove()}
        onCloseClick={() => setConfirmOpen(false)}
        isDelete
        isLoading={actions.deleteDraft.isPending}
      />
    </>
  )
}

export default MergePdfDeleteModal
