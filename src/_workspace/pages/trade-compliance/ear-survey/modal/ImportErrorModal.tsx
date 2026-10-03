import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import Transition from '@/components/TransitionDialog'
import type { EarSurveyImportErrorI } from '@/_workspace/types/trade-compliance/EarSurvey'

interface Props {
  open: boolean
  errors: EarSurveyImportErrorI[]
  onClose: () => void
}

const ImportErrorModal = ({ open, errors, onClose }: Props) => (
  <Dialog
    open={open}
    onClose={(_event, reason) => {
      if (reason !== 'backdropClick') onClose()
    }}
    fullWidth
    maxWidth='md'
    TransitionComponent={Transition}
    keepMounted
    sx={{
      '& .MuiDialog-paper': { overflow: 'visible' },
      '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'flex-start' }
    }}
    PaperProps={{ sx: { top: 30, m: 0 } }}
  >
    <DialogTitle id='max-width-dialog-title'>
      <Typography variant='h5' component='span'>
        EAR Survey Import Error
      </Typography>
      <DialogCloseButton onClick={onClose} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
    </DialogTitle>
    <DialogContent>
      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 100 }}>Excel Row</TableCell>
              <TableCell sx={{ width: 220 }}>Field</TableCell>
              <TableCell>รายละเอียด</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errors.map((error, index) => (
              <TableRow key={`${error.ROW_NO}-${error.FIELD}-${index}`}>
                <TableCell>{error.ROW_NO ?? '-'}</TableCell>
                <TableCell>{error.FIELD}</TableCell>
                <TableCell>{error.MESSAGE}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant='tonal' color='secondary'>
        Close
      </Button>
    </DialogActions>
  </Dialog>
)

export default ImportErrorModal
