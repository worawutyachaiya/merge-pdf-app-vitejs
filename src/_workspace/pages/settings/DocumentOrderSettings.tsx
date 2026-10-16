import { useState } from 'react'
import { AxiosError } from 'axios'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Stack,
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

const SortableCategory = ({
  category,
  index,
  disabled
}: {
  category: DocumentOrderCategory
  index: number
  disabled: boolean
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.CATEGORY_ID,
    disabled
  })

  return (
    <Stack
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      direction='row'
      alignItems='center'
      spacing={3}
      aria-label={`${index + 1}. ${category.CATEGORY_NAME}. Drag to reorder`}
      sx={{
        px: 3,
        py: 2.5,
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        position: 'relative',
        zIndex: isDragging ? 1 : 0,
        boxShadow: isDragging ? 3 : undefined,
        transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
        transition,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        touchAction: disabled ? 'auto' : 'none',
        userSelect: 'none',
        '&:hover': { bgcolor: disabled ? undefined : 'action.hover' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
      }}
    >
      <i
        className='tabler-grip-vertical'
        aria-hidden='true'
        style={{ color: 'var(--mui-palette-text-disabled)', flexShrink: 0 }}
      />
      <Chip label={index + 1} size='small' variant='tonal' sx={{ minWidth: 30, flexShrink: 0 }} />
      <Typography variant='body2' sx={{ flex: 1, minWidth: 0 }}>
        {category.CATEGORY_NAME}
      </Typography>
    </Stack>
  )
}

const DocumentOrderForm = ({
  initialOrder,
  onReload
}: {
  initialOrder: DocumentOrderCategory[]
  onReload: () => void
}) => {
  const [order, setOrder] = useState(initialOrder)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
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

  const move = ({ active, over }: DragEndEvent) => {
    setDraggingId(null)
    if (disabled || !over || active.id === over.id) return
    setOrder(current => {
      const from = current.findIndex(item => item.CATEGORY_ID === active.id)
      const to = current.findIndex(item => item.CATEGORY_ID === over.id)
      return from < 0 || to < 0 ? current : arrayMove(current, from, to)
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setDraggingId(Number(active.id))}
        onDragEnd={move}
        onDragCancel={() => setDraggingId(null)}
      >
        <SortableContext items={order.map(item => item.CATEGORY_ID)} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {order.map((category, index) => (
              <SortableCategory key={category.CATEGORY_ID} category={category} index={index} disabled={disabled} />
            ))}
          </Box>
        </SortableContext>
      </DndContext>
      <Stack direction='row' spacing={2}>
        <Button
          variant='contained'
          color='success'
          disabled={disabled || !changed || draggingId !== null}
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
          disabled={mutation.isPending || !changed || draggingId !== null}
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
      <CardHeader
        title='Document order'
        subheader='Drag to reorder documents for Import and Sort by document type.'
        titleTypographyProps={{ variant: 'h5' }}
      />
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
