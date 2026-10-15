import type { ReactElement, ReactNode, Ref } from 'react'
import { forwardRef } from 'react'

// ** MUI Imports
//import Image from 'next/image'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import type { SlideProps } from '@mui/material'
import { Box, Slide, Typography } from '@mui/material'

import undraw_clean_up_re_504g from '@assets/images/common/undraw_clean_up_re_504g.svg'
import undraw_notify_re_65on from '@assets/images/common/undraw_notify_re_65on.svg'

const Transition = forwardRef(function Transition(
  props: SlideProps & { children?: ReactElement },

  ref: Ref<unknown>
) {
  return <Slide direction='down' ref={ref} {...props} />
})

interface ConfirmModalProps {
  show: boolean
  onConfirmClick: () => void
  onCloseClick: () => void
  isLoading?: boolean
  isDelete?: boolean
  title?: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  confirmDisabled?: boolean
}

const ConfirmModal = ({
  show,
  onConfirmClick,
  onCloseClick,
  isLoading,
  isDelete,
  title = 'Are You Sure ?',
  description,
  confirmLabel,
  confirmDisabled = false
}: ConfirmModalProps) => {
  let imageConfirm

  if (isDelete) {
    imageConfirm = undraw_clean_up_re_504g
  } else {
    imageConfirm = undraw_notify_re_65on
  }

  return (
    <>
      <Dialog
        maxWidth='xs'
        fullWidth={true}
        open={show}
        disableEscapeKeyDown
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        TransitionComponent={Transition}
        onClose={(_, reason) => {
          if (!isLoading && reason !== 'backdropClick') onCloseClick()
        }}
        sx={{
          '& .MuiDialog-paper': { overflow: 'visible' },
          '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
        }}
        PaperProps={{ sx: { top: 30, m: 0 } }}
      >
        <DialogContent>
          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
            <img src={imageConfirm} height={120} width={150} alt='' />
          </Box>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography id='alert-dialog-title' variant='h5'>
              {title}
            </Typography>
            {description ? (
              <Typography id='alert-dialog-description' variant='body1' sx={{ mt: 2, color: 'text.secondary' }}>
                {description}
              </Typography>
            ) : (
              <Typography id='alert-dialog-description' variant='h5' sx={{ color: 'text.secondary' }}>
                ยืนยัน การ{isDelete ? 'ลบ' : 'บันทึก'}ข้อมูลหรือไม่ ?
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'center',
            borderTop: 'none',
            mb: 4
          }}
        >
          <Button
            onClick={() => {
              if (!isLoading && !confirmDisabled) onConfirmClick()
            }}
            disabled={isLoading || confirmDisabled}
            loading={isLoading}
            //loadingIndicator={isDelete ? 'Deleting...' : 'Saving...'}
            loadingPosition='start'
            //startIcon={<SaveIcon />}
            variant='contained'
            color={isDelete ? 'error' : 'success'}
            sx={{ mr: 4 }}
          >
            {confirmLabel ?? `Yes, ${isDelete ? 'Delete' : 'Save'} !`}
          </Button>
          <Button variant='tonal' color='secondary' onClick={() => !isLoading && onCloseClick()} disabled={isLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmModal
