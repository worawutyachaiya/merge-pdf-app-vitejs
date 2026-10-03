import { forwardRef, ReactElement, Ref } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { Box, Slide, SlideProps, Typography } from '@mui/material'

const Transition = forwardRef(function Transition(
  props: SlideProps & { children?: ReactElement<any, any> },

  ref: Ref<unknown>
) {
  return <Slide direction='down' ref={ref} {...props} />
})

const ConfirmChangeProductTypeModal = ({ show, onConfirmClick, onCloseClick, isLoading, isDelete }: any) => {
  let imageConfirm

  if (isDelete) {
    imageConfirm = '/images/common/undraw_clean_up_re_504g.svg'
  } else {
    imageConfirm = '/images/common/undraw_notify_re_65on.svg'
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
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            onCloseClick
          }
        }}
        sx={{
          '& .MuiDialog-paper': { overflow: 'visible' },
          '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
        }}
      >
        <DialogContent>
          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
            <image src={imageConfirm} height={120} width={150} alt='' />
          </Box>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant='h5'>Are You Sure?</Typography>
            <Typography variant='h5' sx={{ mb: 3, color: 'text.secondary' }}>
              ยืนยันการเปลี่ยน Product Type ?
            </Typography>
            {/* <Typography sx={{ color: 'text.secondary' }}>{`You won't be able to revert this!`}</Typography> */}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Button
            variant='contained'
            color={isDelete ? 'error' : 'success'}
            disabled={isLoading}
            sx={{ mr: 1 }}
            onClick={onConfirmClick}
          >
            Confirm
          </Button>
          <Button variant='tonal' color='secondary' onClick={onCloseClick}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmChangeProductTypeModal
