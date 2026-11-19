import { useRef, useState } from 'react'
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
  IconButton,
  Stack,
  TextField,
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
  disabled,
  onRename,
  onRemove
}: {
  category: DocumentOrderCategory
  index: number
  disabled: boolean
  onRename: (name: string) => void
  onRemove: () => void
}) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: category.CATEGORY_ID,
    disabled
  })

  return (
    <Stack
      ref={setNodeRef}
      direction='row'
      alignItems='center'
      spacing={3}
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
        '&:hover': { bgcolor: disabled ? undefined : 'action.hover' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
      }}
    >
      <IconButton
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${category.CATEGORY_NAME || 'new document type'}`}
        disabled={disabled}
        sx={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <i className='tabler-grip-vertical' />
      </IconButton>
      <Chip label={index + 1} size='small' variant='tonal' sx={{ minWidth: 30, flexShrink: 0 }} />
      <TextField
        size='small'
        disabled={disabled}
        value={category.CATEGORY_NAME}
        placeholder='Document type name'
        slotProps={{ htmlInput: { 'aria-label': `Document type name ${index + 1}`, maxLength: 100 } }}
        onChange={event => onRename(event.target.value)}
        sx={{ flex: 1, minWidth: 0 }}
      />
      {category.CATEGORY_ID !== 10 && (
        <IconButton disabled={disabled} color='error' aria-label={`Remove ${category.CATEGORY_NAME || 'new document type'}`} onClick={onRemove}>
          <i className='tabler-trash' />
        </IconButton>
      )}
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
  const nextTemporaryId = useRef(-1)
  const enabled = order.filter(item => item.IS_ENABLED === 1)
  const removed = order.filter(item => item.IS_ENABLED === 0)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const checkPermission = useCheckPermission()
  const canUpdate = Boolean(checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_UPDATE', false))
  const changed = order.length !== initialOrder.length || order.some((item, index) =>
    item.CATEGORY_ID !== initialOrder[index]?.CATEGORY_ID ||
    item.CATEGORY_NAME.trim() !== initialOrder[index]?.CATEGORY_NAME ||
    item.IS_ENABLED !== initialOrder[index]?.IS_ENABLED
  )
  const names = enabled.map(item => item.CATEGORY_NAME.trim().toLowerCase())
  const invalidNames = names.some(name => !name) || new Set(names).size !== names.length
  const mutation = useSaveDocumentOrder(
    response => {
      if (response.data.Status) ToastMessageSuccess({ message: 'Document order saved' })
      else ToastMessageError({ message: response.data.Message || 'Unable to save document order' })
    },
    error => ToastMessageError({ message: saveErrorMessage(error) })
  )
  const disabled = !canUpdate || mutation.isPending
  const editCategory = (id: number, fields: Partial<DocumentOrderCategory>) =>
    setOrder(current => current.map(item => item.CATEGORY_ID === id ? { ...item, ...fields } : item))

  const addCategory = () => {
    const id = nextTemporaryId.current--
    setOrder(current => [...current, {
      CATEGORY_ID: id,
      CATEGORY_NAME: '',
      SORT_ORDER: 0,
      REVISION_NO: 0,
      IS_ENABLED: 1,
      REQUIRED_FOR_COMPLETE: 0
    }])
  }

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
        <SortableContext items={enabled.map(item => item.CATEGORY_ID)} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {enabled.map((category, index) => (
              <SortableCategory
                key={category.CATEGORY_ID}
                category={category}
                index={index}
                disabled={disabled}
                onRename={name => editCategory(category.CATEGORY_ID, { CATEGORY_NAME: name })}
                onRemove={() => {
                  if (category.CATEGORY_ID < 0)
                    setOrder(current => current.filter(item => item.CATEGORY_ID !== category.CATEGORY_ID))
                  else editCategory(category.CATEGORY_ID, {
                    IS_ENABLED: 0,
                    CATEGORY_NAME: category.CATEGORY_NAME.trim() ||
                      initialOrder.find(item => item.CATEGORY_ID === category.CATEGORY_ID)!.CATEGORY_NAME
                  })
                }}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>
      <Box>
        <Button variant='outlined' disabled={disabled || order.length >= 255} onClick={addCategory}>
          Add document type
        </Button>
      </Box>
      {!!removed.length && (
        <Stack spacing={1}>
          <Typography variant='subtitle2'>Removed document types</Typography>
          {removed.map(category => (
            <Stack key={category.CATEGORY_ID} direction='row' spacing={2} alignItems='center'>
              <Typography variant='body2'>{category.CATEGORY_NAME}</Typography>
              <Button size='small' disabled={disabled} onClick={() => editCategory(category.CATEGORY_ID, { IS_ENABLED: 1 })}>
                Restore
              </Button>
            </Stack>
          ))}
        </Stack>
      )}
      {invalidNames && <Alert severity='warning'>Enter a different name for each enabled document type.</Alert>}
      <Stack direction='row' spacing={2}>
        <Button
          variant='contained'
          color='success'
          disabled={disabled || !changed || invalidNames || draggingId !== null}
          startIcon={
            mutation.isPending ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-device-floppy' />
          }
          onClick={() => {
            if (!checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_UPDATE')) return
            mutation.mutate(order.map(item => ({
              ...(item.CATEGORY_ID < 0
                ? { categoryId: null }
                : { categoryId: item.CATEGORY_ID, revisionNo: item.REVISION_NO }),
              name: item.CATEGORY_NAME.trim(),
              enabled: item.IS_ENABLED === 1
            })))
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
        subheader='Manage the document types and order used in Combination.'
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
