import { Box, Skeleton } from '@mui/material'

function SkeletonCustom() {
  return (
    <Box sx={{ pt: 0.1 }}>
      <Skeleton width='60%' />
      <Skeleton width='30%' />
    </Box>
  )
}

export default SkeletonCustom
