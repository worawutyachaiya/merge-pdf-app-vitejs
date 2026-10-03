import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Slide,
  SlideProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@/components/mui/TextField'
import StatusColumn from '@/libs/material-react-table/components/StatusOption'
import { useHsCodeEccnRelations } from '@/_workspace/react-query/hooks/useHsCode'
import type { HsCodeI } from '@/_workspace/types/trade-compliance/HsCode'
import { forwardRef, ReactElement, Ref } from 'react'

const Transition = forwardRef(function Transition(props: SlideProps & { children?: ReactElement }, ref: Ref<unknown>) {
  return <Slide direction='up' ref={ref} {...props} />
})

interface ViewModalProps {
  open: boolean
  data: HsCodeI | null
  onClose: () => void
}

const ViewModal = ({ open, data, onClose }: ViewModalProps) => {
  const { data: relationData, isError, isLoading } = useHsCodeEccnRelations(data?.HS_CODE_ID ?? null, open)
  const relations = relationData?.data.ResultOnDb ?? []

  return (
    <Dialog
      maxWidth='md'
      fullWidth
      open={open}
      TransitionComponent={Transition}
      onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
      sx={{
        '& .MuiDialog-paper': { overflow: 'visible' },
        '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          View HS Code
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth disabled label='HS Code' value={data?.HS_CODE ?? ''} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              disabled
              label='Status'
              value={StatusColumn.find(status => status.value === data?.INUSE)?.label ?? ''}
            />
          </Grid>
          <Grid size={12}>
            {isLoading && <Typography color='text.secondary'>Loading...</Typography>}
            {isError && <Typography color='error'>Error loading ECCN relations</Typography>}
            {!isLoading && !isError && relations.length === 0 && (
              <Typography color='text.secondary'>No ECCN found</Typography>
            )}
            {!isLoading && !isError && relations.length > 0 && (
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                <Table
                  size='small'
                  sx={{
                    minWidth: 600,
                    tableLayout: 'fixed',
                    '& th, & td': {
                      width: '33.33%',
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
                      <TableCell>ECCN Code</TableCell>
                      <TableCell>ECCN Sub Code</TableCell>
                      <TableCell>ECCN Full Code</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {relations.map(relation => (
                      <TableRow key={relation.ECCN_ID}>
                        <TableCell>{relation.ECCN_CODE}</TableCell>
                        <TableCell>{relation.ECCN_SUB_CODE || '-'}</TableCell>
                        <TableCell>{relation.ECCN_FULL_CODE}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewModal
