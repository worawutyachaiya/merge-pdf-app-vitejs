import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { Box, Tooltip } from '@mui/material'

interface Props {
  required: boolean
  name: string
  pageCount: number | undefined
}

const DocumentStatusIndicator = ({ required, name, pageCount }: Props) => {
  const present = (pageCount ?? 0) > 0
  const label =
    pageCount === undefined
      ? `${name}: กำลังโหลดสถานะ`
      : present
        ? `${name}: มีเอกสาร ${pageCount} หน้า`
        : required
          ? `${name}: ยังขาดเอกสารที่จำเป็นสำหรับ Complete`
          : `${name}: ยังไม่มีเอกสารเพิ่มเติมประเภทนี้`

  return (
    <Tooltip title={label} arrow>
      <Box component='span' role='img' aria-label={label} sx={{ display: 'inline-flex', alignItems: 'center' }}>
        {pageCount === undefined ? (
          <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
        ) : present ? (
          <CheckCircleIcon color='success' sx={{ fontSize: 20 }} />
        ) : required ? (
          <CancelIcon color='error' sx={{ fontSize: 20 }} />
        ) : (
          <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
        )}
      </Box>
    </Tooltip>
  )
}

export default DocumentStatusIndicator
