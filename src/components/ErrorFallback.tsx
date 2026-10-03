import Button from '@mui/material/Button'
import { FallbackProps } from 'react-error-boundary'

// Optional fallback UI
export default function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role='alert' style={{ padding: '1rem', color: 'red' }}>
      <h2>เกิดข้อผิดพลาดบางอย่าง</h2>
      <p>
        <strong>{error.name}:</strong> {error.message}
      </p>
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', fontSize: '0.85rem' }}>{error.stack}</pre>
      <Button variant={'contained'} color='primary' onClick={resetErrorBoundary} style={{ marginTop: '1rem' }}>
        ลองโหลดใหม่
      </Button>
    </div>
  )
}
