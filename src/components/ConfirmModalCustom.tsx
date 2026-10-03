import type { ReactElement, Ref } from 'react'
import React, { forwardRef, useEffect, useState } from 'react'

// ** MUI Imports

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import type { SlideProps } from '@mui/material'
import { Alert, Box, Slide, Stack, Typography } from '@mui/material'
import LoadingButton from '@mui/lab/LoadingButton'
import CustomTextField from '@/components/mui/TextField'

const Transition = forwardRef(function Transition(
  props: SlideProps & { children?: ReactElement<any, any> },

  ref: Ref<unknown>
) {
  return <Slide direction='down' ref={ref} {...props} />
})

interface Props {
  show: boolean
  onConfirmClick: () => void
  onCloseClick: () => void
  isLoading: boolean
  isDelete: boolean
  menu: 'Import Fee' | 'Exchange Rate'
}

const ConfirmModalCustom = ({ show, onConfirmClick, onCloseClick, isLoading, isDelete, menu }: Props) => {
  const [inputValue, setInputValue] = useState('') // state to store the input value
  const [isConfirmCorrect, setIsConfirmCorrect] = useState(false) // state to check if the input is "Confirm"
  let imageConfirm

  if (isDelete) {
    imageConfirm = '/images/common/undraw_clean_up_re_504g.svg'
  } else {
    imageConfirm = '/images/common/undraw_notify_re_65on.svg'
  }

  const handleInputChange = (e: any) => {
    const value = e.target.value
    setInputValue(value)
    setIsConfirmCorrect(value === 'Confirm') // check if input is exactly "Confirm"
  }

  const handleClose = (event: any, reason: any) => {
    if (onCloseClick && reason !== 'backdropClick') {
      setInputValue('')
      setIsConfirmCorrect(false)
      onCloseClick()
    }
  }

  useEffect(() => {
    if (!show) {
      setInputValue('')
      setIsConfirmCorrect(false)
    }
  }, [show])

  return (
    <>
      <Dialog
        maxWidth='sm'
        fullWidth={true}
        open={show}
        disableEscapeKeyDown
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        TransitionComponent={Transition}
        onClose={handleClose}
        sx={{
          '& .MuiDialog-paper': { overflow: 'visible' },
          '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
        }}
      >
        <DialogContent>
          <Stack spacing={4}>
            <Typography variant='h5'>{`Type "Confirm" to Create ${menu}`}</Typography>
            <Alert severity='error'>
              {menu === 'Exchange Rate'
                ? 'ถ้าเพิ่ม Exchange Rate ใหม่ ระบบจะ "สร้างราคาใหม่" ให้กับ Item Code ทุกตัวอัตโนมัติ (ถ้ามีข้อมูลราคาอยู่แล้วก่อนหน้า)'
                : 'ถ้าเพิ่ม Import Fee ใหม่ ระบบจะ "สร้างราคาใหม่" ให้กับ Item Code ทุกตัวอัตโนมัติ (ถ้ามีข้อมูลราคาอยู่แล้วก่อนหน้า)'}
            </Alert>
            <CustomTextField
              fullWidth
              placeholder='Enter ...'
              autoComplete='off'
              value={inputValue}
              onChange={handleInputChange}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'center',
            borderTop: 'none'
          }}
        >
          <Button
            onClick={onConfirmClick}
            loading={isLoading}
            loadingPosition='start'
            //loadingIndicator={isDelete ? 'Deleting...' : 'Saving...'}
            variant='contained'
            color={isDelete ? 'error' : 'success'}
            sx={{ mr: 1 }}
            disabled={!isConfirmCorrect}
          >
            <span>Yes, {isDelete ? 'Delete' : 'Save'} !</span>
          </Button>
          <Button variant='tonal' color='secondary' onClick={() => handleClose('', '')} disabled={isLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmModalCustom
