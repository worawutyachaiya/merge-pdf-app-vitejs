import { useState } from 'react'
import { AxiosError } from 'axios'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { useCheckPermission } from '@/_template/CheckPermission'
import { useDocumentOrder, useSaveDocumentOrder } from '@/_workspace/react-query/hooks/useSettings'
import type { DocumentOrderCategory } from '@/_workspace/types/settings/Settings'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'
import { MENU_ID } from './env'

const saveErrorMessage = (error: Error) => {
  if (error instanceof AxiosError && typeof error.response?.data?.Message === 'string')
    return error.response.data.Message as string
  return error.message || 'Unable to save document order'
}

const DocumentOrderForm = ({
  initialOrder,
  onReload
}: {
  initialOrder: DocumentOrderCategory[]
  onReload: () => void
}) => {
  const [order, setOrder] = useState(initialOrder)
  const checkPermission = useCheckPermission()
  const canUpdate = Boolean(checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_UPDATE', false))
  const changed = order.some((item, index) => item.CATEGORY_ID !== initialOrder[index]?.CATEGORY_ID)
  const mutation = useSaveDocumentOrder(
    response => {
      if (response.data.Status) ToastMessageSuccess({ message: 'Document order saved' })
      else ToastMessageError({ message: response.data.Message || 'Unable to save document order' })
    },
    error => ToastMessageError({ message: saveErrorMessage(error) })
  )
  const disabled = !canUpdate || mutation.isPending

  const move = (index: number, delta: -1 | 1) => {
    setOrder(current => {
      const next = [...current]
      const target = index + delta
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  return (
    <Stack spacing={4}>
      {mutation.isError && (
        <Alert
          severity='error'
          action={
            <Button color='inherit' onClick={onReload}>
              Reload
            </Button>
          }
        >
          {saveErrorMessage(mutation.error)}
        </Alert>
      )}
      <Typography variant='body2' color='text.secondary'>
        Used when importing files and choosing Sort by document type. Pages within the same type keep their order.
      </Typography>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        {order.map((category, index) => (
          <Stack
            key={category.CATEGORY_ID}
            direction='row'
            alignItems='center'
            spacing={3}
            sx={{
              px: 3,
              py: 1.5,
              borderBottom: index < order.length - 1 ? '1px solid' : undefined,
              borderColor: 'divider'
            }}
          >
            <Chip label={index + 1} size='small' variant='tonal' sx={{ minWidth: 32 }} />
            <Typography sx={{ flex: 1 }}>{category.CATEGORY_NAME}</Typography>
            <Stack direction='row' spacing={1}>
              <Tooltip title='Move up'>
                <span>
                  <IconButton
                    size='small'
                    disabled={disabled || index === 0}
                    aria-label={`Move ${category.CATEGORY_NAME} up`}
                    onClick={() => move(index, -1)}
                  >
                    <i className='tabler-arrow-up' />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title='Move down'>
                <span>
                  <IconButton
                    size='small'
                    disabled={disabled || index === order.length - 1}
                    aria-label={`Move ${category.CATEGORY_NAME} down`}
                    onClick={() => move(index, 1)}
                  >
                    <i className='tabler-arrow-down' />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        ))}
      </Box>
      <Stack direction='row' spacing={2}>
        <Button
          variant='contained'
          color='success'
          disabled={disabled || !changed}
          startIcon={
            mutation.isPending ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-device-floppy' />
          }
          onClick={() => {
            if (!checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_UPDATE')) return
            mutation.mutate(order.map(item => ({ categoryId: item.CATEGORY_ID, revisionNo: item.REVISION_NO })))
          }}
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant='tonal'
          color='secondary'
          disabled={mutation.isPending || !changed}
          onClick={() => setOrder(initialOrder)}
        >
          Reset
        </Button>
      </Stack>
    </Stack>
  )
}

const DocumentOrderSettings = () => {
  const query = useDocumentOrder()
  const order = query.data?.data.Status ? query.data.data.ResultOnDb : undefined
  return (
    <Card>
      <CardHeader title='Document order' titleTypographyProps={{ variant: 'h5' }} />
      <CardContent>
        {query.isLoading ? (
          <CircularProgress size={24} />
        ) : !query.isError && order?.length ? (
          <DocumentOrderForm
            key={order.map(item => `${item.CATEGORY_ID}:${item.REVISION_NO}`).join(',')}
            initialOrder={order}
            onReload={() => void query.refetch()}
          />
        ) : (
          <Alert
            severity='error'
            action={
              <Button color='inherit' disabled={query.isFetching} onClick={() => void query.refetch()}>
                Retry
              </Button>
            }
          >
            Unable to load document order. Please try again.
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default DocumentOrderSettings
