import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'

import { useMergePdfActions } from '@/_workspace/react-query/hooks/useMergePdf'
import type { MergePdfDetail } from '@/_workspace/types/merge-pdf/MergePdf'
import ConfirmModal from '@/components/ConfirmModal'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import Transition from '@/components/TransitionDialog'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'

import { mergePdfFormDefaults, mergePdfFormSchema, type MergePdfFormValues } from './validationSchema'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (detail: MergePdfDetail) => void
}

const MergePdfAddModal = ({ open, onClose, onCreated }: Props) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const actions = useMergePdfActions()
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<MergePdfFormValues>({ resolver: zodResolver(mergePdfFormSchema), defaultValues: mergePdfFormDefaults })

  const create = async () => {
    try {
      const response = await actions.create.mutateAsync({ title: getValues('title').trim(), reference: null })
      const detail = response.data.ResultOnDb[0]
      if (!response.data.Status || !detail) throw new Error(response.data.Message)
      ToastMessageSuccess({ title: 'Add Merge PDF', message: 'Draft created' })
      setConfirmOpen(false)
      onCreated(detail)
    } catch (error: unknown) {
      setConfirmOpen(false)
      ToastMessageError({
        title: 'Add Merge PDF',
        message: error instanceof Error ? error.message : 'Unable to create draft'
      })
    }
  }

  return (
    <>
      <Dialog
        maxWidth='sm'
        fullWidth
        open={open}
        TransitionComponent={Transition}
        onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
        sx={{
          '& .MuiDialog-paper': { overflow: 'visible' },
          '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
        }}
        PaperProps={{ sx: { top: 30, m: 0 } }}
      >
        <DialogTitle>
          <Typography variant='h5' component='span'>
            Add Merge PDF
          </Typography>
          <DialogCloseButton onClick={onClose} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={4}>
            <Grid size={12}>
              <Controller
                name='title'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    autoFocus
                    label='Document Name'
                    placeholder='Enter ...'
                    autoComplete='off'
                    error={Boolean(errors.title)}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            variant='contained'
            color='success'
            disabled={actions.create.isPending}
            onClick={handleSubmit(() => setConfirmOpen(true))}
          >
            Save &amp; Continue
          </Button>
          <Button variant='tonal' color='secondary' disabled={actions.create.isPending} onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmModal
        show={confirmOpen}
        onConfirmClick={() => void create()}
        onCloseClick={() => setConfirmOpen(false)}
        isDelete={false}
        isLoading={actions.create.isPending}
      />
    </>
  )
}

export default MergePdfAddModal
