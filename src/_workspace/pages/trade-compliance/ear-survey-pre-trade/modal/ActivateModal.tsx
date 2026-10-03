import { forwardRef, ReactElement, Ref, useState } from 'react'

import LoadingButton from '@mui/lab/LoadingButton'
import {
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Slide,
  SlideProps,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import { useActivatePreTrade, useEarSurveyDetail } from '@/_workspace/react-query/hooks/useEarSurvey'
import EarSurveyServices from '@/_workspace/services/trade-compliance/EarSurveyServices'
import type { ManufacturingItemLookupI } from '@/_workspace/types/trade-compliance/EarSurvey'

import { MENU_NAME } from '../env'

const Transition = forwardRef(function Transition(props: SlideProps & { children?: ReactElement }, ref: Ref<unknown>) {
  return <Slide direction='up' ref={ref} {...props} />
})

interface Props {
  open: boolean
  earSurveyHeaderId: number | null
  onClose: () => void
  onActivated: () => void
}

interface FormErrors {
  supplierCode?: string
  itemCodes: Record<number, string>
}

const normalize = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toUpperCase()

const findManufacturingItem = async (itemCode: string): Promise<ManufacturingItemLookupI> => {
  const response = await EarSurveyServices.getManufacturingItemByCode(itemCode.trim())
  const rows = response.data.ResultOnDb ?? []
  const exactRows = rows.filter(row => normalize(row.ITEM_CODE_FOR_SUPPORT_MES) === normalize(itemCode))

  if (exactRows.length === 0) {
    throw new Error(`Item Code ${itemCode} was not found in current active Manufacturing Item`)
  }
  if (exactRows.length > 1) {
    throw new Error(`Item Code ${itemCode} has more than one current active Manufacturing Item`)
  }
  return exactRows[0]
}

const ActivateModal = ({ open, earSurveyHeaderId, onClose, onActivated }: Props) => {
  const { data, isLoading, isError } = useEarSurveyDetail(earSurveyHeaderId, open)
  const activateMutation = useActivatePreTrade()
  const survey = data?.data.ResultOnDb?.[0]
  const [supplierCode, setSupplierCode] = useState('')
  const [itemCodes, setItemCodes] = useState<Record<number, string>>({})
  const [formErrors, setFormErrors] = useState<FormErrors>({ itemCodes: {} })

  const handleClose = () => {
    setSupplierCode('')
    setItemCodes({})
    setFormErrors({ itemCodes: {} })
    onClose()
  }

  const activate = async () => {
    if (!survey) return

    const items = survey.ITEMS ?? []
    const validationErrors: FormErrors = { itemCodes: {} }

    if (!supplierCode.trim()) validationErrors.supplierCode = 'Supplier Code is required'
    for (const item of items) {
      if (!itemCodes[item.EAR_SURVEY_ITEM_ID]?.trim()) {
        validationErrors.itemCodes[item.EAR_SURVEY_ITEM_ID] = 'Manufacturing Item Code is required'
      }
    }

    if (validationErrors.supplierCode || Object.keys(validationErrors.itemCodes).length > 0) {
      setFormErrors(validationErrors)
      return
    }

    try {
      const resolvedItems = await Promise.all(
        items.map(async item => ({
          EAR_SURVEY_ITEM_ID: item.EAR_SURVEY_ITEM_ID,
          manufacturingItem: await findManufacturingItem(itemCodes[item.EAR_SURVEY_ITEM_ID])
        }))
      )

      const duplicatedId = resolvedItems.find(
        (item, index) =>
          resolvedItems.findIndex(
            compared =>
              compared.manufacturingItem.ITEM_MANUFACTURING_ID === item.manufacturingItem.ITEM_MANUFACTURING_ID
          ) !== index
      )
      if (duplicatedId) {
        throw new Error(
          `Item Code ${duplicatedId.manufacturingItem.ITEM_CODE_FOR_SUPPORT_MES} is mapped more than once`
        )
      }

      const response = await activateMutation.mutateAsync({
        EAR_SURVEY_HEADER_ID: survey.EAR_SURVEY_HEADER_ID,
        SUPPLIER_CODE: supplierCode.trim(),
        ITEM_MAPPINGS: resolvedItems.map(item => ({
          EAR_SURVEY_ITEM_ID: item.EAR_SURVEY_ITEM_ID,
          ITEM_MANUFACTURING_ID: item.manufacturingItem.ITEM_MANUFACTURING_ID
        })),
        UPDATE_BY: getUserData().EMPLOYEE_CODE || getUserData().USER_NAME
      })

      if (!response.data.Status) {
        ToastMessageError({ title: MENU_NAME, message: response.data.Message })
        return
      }

      ToastMessageSuccess({ title: MENU_NAME, message: response.data.Message })
      onActivated()
      handleClose()
    } catch (error) {
      ToastMessageError({
        title: MENU_NAME,
        message: error instanceof Error ? error.message : 'Unable to activate Pre-Trade EAR Survey'
      })
    }
  }

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick' && !activateMutation.isPending) handleClose()
      }}
      fullWidth
      TransitionComponent={Transition}
      maxWidth='md'
      keepMounted
      sx={{
        '& .MuiDialog-paper': { overflow: 'visible' },
        '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span' color='primary'>
          Activate
        </Typography>
        <DialogCloseButton onClick={handleClose} disableRipple disabled={activateMutation.isPending}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        {isLoading && <Typography>Loading...</Typography>}
        {isError && <Typography color='error'>Unable to load EAR Survey data</Typography>}
        {survey && (
          <Stack spacing={4}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField fullWidth disabled label='Supplier Name' value={survey.SUPPLIER_NAME} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  required
                  label='Supplier Code'
                  placeholder='Enter ...'
                  value={supplierCode}
                  error={Boolean(formErrors.supplierCode)}
                  helperText={formErrors.supplierCode}
                  onChange={event => {
                    setSupplierCode(event.target.value)
                    if (formErrors.supplierCode) {
                      setFormErrors(current => ({ ...current, supplierCode: undefined }))
                    }
                  }}
                />
              </Grid>
            </Grid>

            <Divider>
              <Typography color='primary.main' fontWeight={600}>
                Manufacturing Item Mapping
              </Typography>
            </Divider>

            {(survey.ITEMS ?? []).map(item => (
              <Grid container spacing={4} key={item.EAR_SURVEY_ITEM_ID} alignItems='end'>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    disabled
                    label={
                      <>
                        Pre-Trade Reference
                        <Tooltip
                          arrow
                          placement='top'
                          title={
                            <Stack spacing={0.25}>
                              <Typography variant='caption' color='inherit'>
                                Description: {item.DESCRIPTION || '-'}
                              </Typography>
                              <Typography variant='caption' color='inherit'>
                                Model: {item.MODEL || '-'}
                              </Typography>
                              <Typography variant='caption' color='inherit'>
                                HS Code: {item.HS_CODE || '-'}
                              </Typography>
                            </Stack>
                          }
                        >
                          <Box
                            component='span'
                            aria-label='View item details'
                            sx={{ display: 'inline-flex', ml: 1, cursor: 'help', verticalAlign: 'middle' }}
                          >
                            <i className='tabler-info-circle text-sm' />
                          </Box>
                        </Tooltip>
                      </>
                    }
                    value={item.PRE_TRADE_REFERENCE_NO ?? ''}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    required
                    label='Manufacturing Item Code'
                    placeholder='Enter ...'
                    value={itemCodes[item.EAR_SURVEY_ITEM_ID] ?? ''}
                    error={Boolean(formErrors.itemCodes[item.EAR_SURVEY_ITEM_ID])}
                    helperText={formErrors.itemCodes[item.EAR_SURVEY_ITEM_ID]}
                    onChange={event => {
                      setItemCodes(current => ({
                        ...current,
                        [item.EAR_SURVEY_ITEM_ID]: event.target.value
                      }))
                      if (formErrors.itemCodes[item.EAR_SURVEY_ITEM_ID]) {
                        setFormErrors(current => {
                          const nextItemCodes = { ...current.itemCodes }
                          delete nextItemCodes[item.EAR_SURVEY_ITEM_ID]
                          return { ...current, itemCodes: nextItemCodes }
                        })
                      }
                    }}
                  />
                </Grid>
              </Grid>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant='tonal' color='secondary' disabled={activateMutation.isPending}>
          Close
        </Button>
        <LoadingButton
          loading={activateMutation.isPending}
          variant='contained'
          color='success'
          onClick={activate}
          disabled={!survey}
        >
          Save & Complete
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}

export default ActivateModal
