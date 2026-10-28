import { useEffect, useRef, useState, type PointerEvent } from 'react'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box, Checkbox, IconButton, Typography } from '@mui/material'

import { MERGE_PDF_CATEGORIES, type MergePdfDocument, type MergePdfPage } from '@/_workspace/types/merge-pdf/MergePdf'

import MergePdfPageThumbnail from './MergePdfPageThumbnail'

interface Props {
  jobId: number
  page: MergePdfPage
  document: MergePdfDocument | undefined
  selected: boolean
  disabled: boolean
  onSelect: () => void
  onRotate: (delta: 90 | 270) => void
  onRemove: () => void
  checked: boolean
  onCheck: (checked: boolean) => void
  onPaintStart: (event: PointerEvent<HTMLButtonElement>) => void
  localImage?: string
}

const SortablePage = ({
  jobId,
  page,
  document,
  selected,
  disabled,
  onSelect,
  onRotate,
  onRemove,
  checked,
  onCheck,
  onPaintStart,
  localImage
}: Props) => {
  const [visible, setVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const category = MERGE_PDF_CATEGORIES.find(item => item.id === page.CATEGORY_ID)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: page.PAGE_ID,
    disabled
  })

  useEffect(() => {
    const node = cardRef.current
    if (!node) return
    const observer = new IntersectionObserver(entries => setVisible(entries[0]?.isIntersecting ?? false), {
      rootMargin: '180px'
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Box
      id={`merge-pdf-page-${page.PAGE_ID}`}
      ref={node => {
        setNodeRef(node as HTMLElement | null)
        cardRef.current = node as HTMLDivElement | null
      }}
      data-select-page-id={page.PAGE_ID}
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        position: 'relative',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: selected || checked ? 'primary.main' : 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: isDragging ? 6 : 1,
        minWidth: 0,
        cursor: 'default',
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, gap: 0.5 }}>
        <Checkbox
          data-page-action
          size='small'
          checked={checked}
          disabled={disabled}
          onChange={(_, value) => onCheck(value)}
          inputProps={{ 'aria-label': `Select page ${page.SORT_ORDER}` }}
          sx={{ p: 0.5 }}
        />
        <IconButton
          ref={setActivatorNodeRef}
          size='small'
          aria-label={`Drag page ${page.SORT_ORDER}`}
          title='Drag to reorder'
          disabled={disabled}
          {...attributes}
          {...listeners}
          sx={{ cursor: disabled ? 'default' : 'move', touchAction: 'none' }}
        >
          <i className='tabler-grip-vertical' />
        </IconButton>
        <Box data-page-action sx={{ display: 'flex' }}>
          <IconButton
            size='small'
            aria-label={`Rotate page ${page.SORT_ORDER} left`}
            title='Rotate left'
            disabled={disabled}
            onClick={() => onRotate(270)}
          >
            <i className='tabler-rotate-2' />
          </IconButton>
          <IconButton
            size='small'
            aria-label={`Rotate page ${page.SORT_ORDER} right`}
            title='Rotate right'
            disabled={disabled}
            onClick={() => onRotate(90)}
          >
            <i className='tabler-rotate-clockwise-2' />
          </IconButton>
          <IconButton
            size='small'
            color='error'
            aria-label={`Remove page ${page.SORT_ORDER}`}
            title='Remove page'
            disabled={disabled}
            onClick={onRemove}
          >
            <i className='tabler-x' />
          </IconButton>
        </Box>
      </Box>
      <Box
        component='button'
        type='button'
        onPointerDown={onPaintStart}
        onClick={onSelect}
        aria-label={`Preview page ${page.SORT_ORDER}`}
        sx={{
          display: 'block',
          width: '100%',
          p: 1,
          border: 0,
          bgcolor: 'transparent',
          cursor: disabled ? 'default' : 'pointer',
          textAlign: 'left'
        }}
      >
        <Box
          sx={{
            height: 195,
            bgcolor: 'grey.100',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <MergePdfPageThumbnail
            jobId={jobId}
            pageId={page.PAGE_ID}
            rotation={page.ROTATION_DEGREES}
            deskew={page.DESKEW_DEGREES ?? 0}
            enabled={visible}
            label={`Page ${page.SORT_ORDER} preview`}
            localImage={localImage}
          />
        </Box>
        <Typography variant='body2' sx={{ mt: 1 }} noWrap>
          {page.SORT_ORDER}.{' '}
          {page.CLASSIFICATION_SOURCE === 'UNKNOWN' ? 'Type not selected' : (category?.name ?? 'Document')}
        </Typography>
        <Typography
          variant='caption'
          color='text.secondary'
          display='block'
          noWrap
          title={document?.ORIGINAL_FILE_NAME}
        >
          {document?.ORIGINAL_FILE_NAME ?? ''} · page {page.SOURCE_PAGE_NUMBER}
        </Typography>
        {page.CATEGORY_ID === 10 && page.DESCRIPTION && (
          <Typography variant='caption' display='block' noWrap title={page.DESCRIPTION}>
            {page.DESCRIPTION}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default SortablePage
