import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material'
import type { MRT_Row } from 'material-react-table'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { z } from 'zod'

import ConfirmModal from '@components/ConfirmModal'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import Transition from '@/components/TransitionDialog'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import StatusColumn from '@/libs/material-react-table/components/StatusOption'
import { useDxContext } from '@/_template/DxContextProvider'
import { PREFIX_QUERY_KEY, useFecEccnCreate, useFecEccnUpdate } from '@/_workspace/react-query/hooks/useFecEccn'
import type { FecEccnI } from '@/_workspace/types/trade-compliance/FecEccn'
import { useQueryClient } from '@tanstack/react-query'
import AxiosResponseI, { type AxiosResponseWithErrorI } from '@/libs/axios/types/AxiosResponseInterface'

const formSchema = z.object({
  FEC_ECCN_FULL_CODE: z.string().trim().min(1, 'FEC ECCN Full Code is required').max(125, 'FEC ECCN Full Code must not exceed 125 characters')
})

type FormData = z.infer<typeof formSchema>
type Mode = 'Add' | 'Edit' | 'View'

interface Props {
  open: boolean
  mode: Mode
  rowSelected: MRT_Row<FecEccnI> | null
  onClose: () => void
}

const AddEditViewModal = ({ open, mode, rowSelected, onClose }: Props) => {
  const isView = mode === 'View'
  const [openConfirmModal, setOpenConfirmModal] = useState(false)
  const queryClient = useQueryClient()
  const { setIsEnableFetching } = useDxContext()
  const defaults: FormData = {
    FEC_ECCN_FULL_CODE: rowSelected?.original.FEC_ECCN_FULL_CODE ?? ''
  }
  const { control, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults
  })

  const handleSuccess = (response: AxiosResponseI) => {
    if (response?.data?.Status) {
      ToastMessageSuccess({ title: mode === 'Add' ? 'Add FEC ECCN' : 'Edit FEC ECCN', message: response.data.Message })
      queryClient.invalidateQueries({ queryKey: [PREFIX_QUERY_KEY] })
      setIsEnableFetching(true)
      setOpenConfirmModal(false)
      onClose()
      return
    }

    ToastMessageError({ title: mode === 'Add' ? 'Add FEC ECCN' : 'Edit FEC ECCN', message: response?.data?.Message ?? 'Unable to save FEC ECCN' })
  }

  const handleError = (error: AxiosResponseWithErrorI) => {
    ToastMessageError({ title: mode === 'Add' ? 'Add FEC ECCN' : 'Edit FEC ECCN', message: error?.message ?? 'Unable to save FEC ECCN' })
    setOpenConfirmModal(false)
  }

  const createMutation = useFecEccnCreate(handleSuccess, handleError)
  const updateMutation = useFecEccnUpdate(handleSuccess, handleError)
  const isSaving = createMutation.isPending || updateMutation.isPending

  const submit = () => {
    const employeeCode = getUserData()?.EMPLOYEE_CODE
    const payload = {
      FEC_ECCN_FULL_CODE: getValues('FEC_ECCN_FULL_CODE').trim(),
      CREATE_BY: employeeCode,
      UPDATE_BY: employeeCode,
      INUSE: 1
    }

    if (mode === 'Add') createMutation.mutate(payload)
    if (mode === 'Edit') updateMutation.mutate({ ...payload, ECCN_FEC_ID: rowSelected?.original.ECCN_FEC_ID })
  }

  const onSubmit = () => {
    setOpenConfirmModal(true)
  }

  return (
    <>
      <Dialog
      maxWidth='xs'
      fullWidth
      open={open}
      TransitionComponent={Transition}
      onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' }, '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' } }}
      PaperProps={{ sx: { top: 30, m: 0 } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>{mode} FEC ECCN</Typography>
        <DialogCloseButton onClick={onClose} disableRipple><i className='tabler-x' /></DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={4}>
          {isView ? (
            <>
              <Grid size={{ xs: 12 }}>
                <CustomTextField fullWidth disabled label='FEC ECCN Code' value={rowSelected?.original.FEC_ECCN_CODE ?? ''} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField fullWidth disabled label='FEC ECCN Sub Code' value={rowSelected?.original.FEC_ECCN_SUB_CODE ?? ''} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField fullWidth disabled label='FEC ECCN Full Code' value={rowSelected?.original.FEC_ECCN_FULL_CODE ?? ''} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField fullWidth disabled label='Status' value={StatusColumn.find(status => status.value === rowSelected?.original.INUSE)?.label ?? ''} />
              </Grid>
            </>
          ) : (
            <Grid size={{ xs: 12 }}>
              <Controller name='FEC_ECCN_FULL_CODE' control={control} render={({ field }) => (
                <CustomTextField {...field} fullWidth label='FEC ECCN Full Code' placeholder='Enter ...' error={Boolean(errors.FEC_ECCN_FULL_CODE)} helperText={errors.FEC_ECCN_FULL_CODE?.message} />
              )} />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={onClose} disabled={isSaving}>Close</Button>
        {!isView && <Button variant='contained' color='success' onClick={handleSubmit(onSubmit)} disabled={isSaving}>Save &amp; Complete</Button>}
      </DialogActions>
      </Dialog>
      <ConfirmModal
        show={openConfirmModal}
        onConfirmClick={submit}
        onCloseClick={() => setOpenConfirmModal(false)}
        isDelete={false}
        isLoading={isSaving}
      />
    </>
  )
}

export default AddEditViewModal
