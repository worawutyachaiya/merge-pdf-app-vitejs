import Typography from '@mui/material/Typography'

const STATUS_LABEL_BY_ENV: Partial<Record<string, string>> = {
  DEV: 'Testing',
  SIT: 'Testing',
  UAT: 'UAT'
}

const EnvironmentStatus = () => {
  const envName = import.meta.env.VITE_ENV_NAME?.toUpperCase()
  const statusLabel = STATUS_LABEL_BY_ENV[envName]

  if (!statusLabel) return null

  return (
    <div className='flex items-center min-is-0'>
      <div className='flex justify-between items-center gap-4 is-full flex-wrap'>
        <Typography sx={{fontWeight: 800}} color='error.main'>{`Status: ${statusLabel}`}</Typography>
      </div>
    </div>
  )
}

export default EnvironmentStatus
