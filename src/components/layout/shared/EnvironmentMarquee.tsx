import Box from '@mui/material/Box'
import GlobalStyles from '@mui/material/GlobalStyles'
import Typography from '@mui/material/Typography'

const STATUS_LABEL_BY_ENV: Partial<Record<string, string>> = {
  // DEV: 'Testing',
  SIT: 'Testing',
  UAT: 'UAT'
}

const EnvironmentMarquee = () => {
  const envName = import.meta.env.VITE_ENV_NAME?.toUpperCase()
  const statusLabel = STATUS_LABEL_BY_ENV[envName]

  if (!statusLabel) return null

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes environment-marquee-left-to-right': {
            from: { transform: 'translateX(-100%)' },
            to: { transform: 'translateX(100vw)' }
          }
        }}
      />
      <Box
        aria-hidden='true'
        sx={{
          position: 'fixed',
          insetInline: 0,
          insetBlockEnd: 0,
          zIndex: 2147483647,
          pointerEvents: 'none',
          overflow: 'hidden',
          backgroundColor: '#ff2d2d',
          color: '#fff',
          minBlockSize: 30,
          opacity: 0.88,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Typography
          component='span'
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            color: 'inherit',
            fontSize: '1rem',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 0,
            textTransform: 'uppercase',
            animation: 'environment-marquee-left-to-right 25s linear infinite'
          }}
        >
          {`เว็บไซต์นี้ใช้สำหรับทดสอบเท่านั้น กรุณาตรวจสอบความถูกต้องของข้อมูลทุกครั้งก่อนใช้งาน`}
        </Typography>
      </Box>
    </>
  )
}

export default EnvironmentMarquee
