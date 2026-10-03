import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import Transition from '@/components/TransitionDialog'
import { useEarSurveyDetail } from '@/_workspace/react-query/hooks/useEarSurvey'

interface Props {
  open: boolean
  earSurveyHeaderId: number | null
  onClose: () => void
}

const ViewModal = ({ open, earSurveyHeaderId, onClose }: Props) => {
  const { data, isLoading, isError } = useEarSurveyDetail(earSurveyHeaderId, open)
  const survey = data?.data.ResultOnDb?.[0]

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') onClose()
      }}
      fullWidth
      maxWidth='lg'
      TransitionComponent={Transition}
      keepMounted
      sx={{
        '& .MuiDialog-paper': { overflow: 'visible' },
        '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
      }}
      PaperProps={{ sx: { top: 30, m: 0 } }}
    >
      <DialogTitle id='max-width-dialog-title'>
        <Typography variant='h5' component='span' color='primary'>
          {survey?.SURVEY_STAGE === 'PRE_TRADE' ? 'View EAR Survey Pre-Trade' : 'View EAR Survey'}
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        {isLoading && <Typography>Loading...</Typography>}
        {isError && <Typography color='error'>ไม่สามารถโหลดข้อมูลได้</Typography>}
        {survey && (
          <>
            <Grid container spacing={4} className='mb-5'>
              <Grid size={12}>
                <Divider color='primary'>
                  <Typography color='primary.main' className='font-bold'>
                    Company Information
                  </Typography>
                </Divider>
              </Grid>
              <Grid size={12}>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 3, md: 2 }}>
                    <CustomTextField fullWidth disabled label='Request Date' value={survey.REQUEST_DATE ?? ''} />
                  </Grid>
                  {survey.SURVEY_STAGE === 'ACTIVE' && (
                    <>
                      <Grid size={{ xs: 12, sm: 3, md: 3 }}>
                        <CustomTextField fullWidth disabled label='Revision Code' value={survey.REVISION_CODE ?? ''} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3, md: 3 }}>
                        <CustomTextField fullWidth disabled label='Supplier Code' value={survey.SUPPLIER_CODE ?? ''} />
                      </Grid>
                    </>
                  )}
                  <Grid size={{ xs: 12, sm: 6, md: survey.SURVEY_STAGE === 'PRE_TRADE' ? 6 : 4 }}>
                    <CustomTextField fullWidth disabled label='Supplier Name' value={survey.SUPPLIER_NAME ?? ''} />
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={12}>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <CustomTextField fullWidth disabled label='Contact Name' value={survey.CONTACT_NAME ?? ''} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <CustomTextField fullWidth disabled label='Contact Tel.' value={survey.CONTACT_TEL ?? ''} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <CustomTextField fullWidth disabled label='Contact Email' value={survey.CONTACT_EMAIL ?? ''} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <CustomTextField fullWidth disabled label='Position' value={survey.POSITION_NAME ?? ''} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <CustomTextField fullWidth disabled label='Department' value={survey.DEPARTMENT_NAME ?? ''} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Grid container spacing={4}>
              <Grid size={12}>
                <Divider color='primary'>
                  <Typography color='primary.main' className='font-bold'>
                    Survey Items
                  </Typography>
                </Divider>
              </Grid>

              {(survey.ITEMS ?? []).map(item => {
                const isApplicable = item.EAR_SURVEY_STATUS_CODE === 'APPLICABLE'

                return (
                  <Grid size={12} key={item.EAR_SURVEY_ITEM_ID}>
                    <Stack direction='row' spacing={2} alignItems='center'>
                      <Typography variant='subtitle1' color='text.primary' fontWeight={700}>
                        {item.ITEM_CODE ?? item.PRE_TRADE_REFERENCE_NO ?? '-'}
                      </Typography>
                      <Chip
                        size='small'
                        label={item.EAR_SURVEY_STATUS_NAME}
                        color={isApplicable ? 'success' : 'warning'}
                        variant='tonal'
                      />
                    </Stack>

                    <Grid container spacing={4} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <CustomTextField fullWidth disabled label='HS Code' value={item.HS_CODE ?? ''} />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <CustomTextField fullWidth disabled label='Model' value={item.MODEL ?? ''} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <CustomTextField fullWidth disabled label='Description' value={item.DESCRIPTION ?? ''} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <CustomTextField fullWidth disabled label='Country of Origin' value={item.COUNTRY_NAME ?? ''} />
                      </Grid>

                      <Grid size={12}>
                        {isApplicable ? (
                          (item.CONTROLS ?? []).length > 0 ? (
                            <TableContainer
                              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}
                            >
                              <Table
                                size='small'
                                sx={{
                                  minWidth: 760,
                                  tableLayout: 'fixed',
                                  '& th, & td': {
                                    width: '25%',
                                    borderRight: 1,
                                    borderRightColor: 'divider',
                                    overflowWrap: 'anywhere',
                                    verticalAlign: 'top'
                                  },
                                  '& th:last-of-type, & td:last-of-type': { borderRight: 0 }
                                }}
                              >
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                  <TableRow>
                                    <TableCell>ECCN</TableCell>
                                    <TableCell>Reason for Control</TableCell>
                                    <TableCell>Component of Product</TableCell>
                                    <TableCell>Remark</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(item.CONTROLS ?? []).map(control => (
                                    <TableRow key={control.EAR_SURVEY_ITEM_CONTROL_ID}>
                                      <TableCell>{control.ECCN_FULL_CODE || '-'}</TableCell>
                                      <TableCell>{control.REASON_FOR_CONTROL || '-'}</TableCell>
                                      <TableCell>{control.COMPONENT_OF_PRODUCT || '-'}</TableCell>
                                      <TableCell>{control.REMARK || '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <CustomTextField fullWidth disabled label='ECCN / Control' value='No ECCN control found' />
                          )
                        ) : (
                          <Stack spacing={1}>
                            <Typography variant='body2' color='text.secondary'>
                              ECCN / Control Not required for Not Applicable items
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              <Typography component='span' variant='body2' fontWeight={600} color='text.primary'>
                                Remark:{' '}
                              </Typography>
                              {item.REMARK || '-'}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                )
              })}
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          px: 4,
          py: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Button onClick={onClose} variant='tonal' color='secondary'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewModal
