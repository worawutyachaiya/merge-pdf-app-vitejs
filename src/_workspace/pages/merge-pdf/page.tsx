import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Tab,
  Stack,
  Tabs,
  Typography
} from '@mui/material'
import { useForm } from 'react-hook-form'

import DxBreadCrumbs from '@/_template/DxBreadCrumbs'
import {
  useMergePdfActions,
  useMergePdfDetail,
  useMergePdfPagePreview
} from '@/_workspace/react-query/hooks/useMergePdf'
import { MergePdfServices } from '@/_workspace/services/merge-pdf/MergePdfServices'
import {
  MERGE_PDF_CATEGORIES,
  REQUIRED_MERGE_PDF_CATEGORY_IDS,
  type MergePdfDetail
} from '@/_workspace/types/merge-pdf/MergePdf'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'
import CustomTextField from '@/components/mui/TextField'
import SelectCustom from '@/components/react-select/SelectCustom'
import ConfirmModal from '@/components/ConfirmModal'

import SortablePage from './SortablePage'
import MergePdfList from './MergePdfList'
import MergePdfPageThumbnail from './MergePdfPageThumbnail'
import { breadcrumbNavigation, MENU_NAME } from './env'
import { mergePdfFormDefaults, mergePdfFormSchema, type MergePdfFormValues } from './validationSchema'
import { movePagesToPosition } from './pageOrder'
import { useObjectUrl } from './useObjectUrl'

const firstDetail = (response: {
  data: { Status: boolean; Message: string; ResultOnDb: MergePdfDetail[] }
}): MergePdfDetail => {
  if (!response.data.Status || !response.data.ResultOnDb[0]) throw new Error(response.data.Message)
  return response.data.ResultOnDb[0]
}

const errorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const response: unknown = error.response?.data
    if (response && typeof response === 'object' && 'Message' in response && typeof response.Message === 'string') {
      return response.Message
    }
  }
  return error instanceof Error ? error.message : 'Operation failed'
}

type Confirmation = { kind: 'complete' } | { kind: 'document'; id: number } | { kind: 'page'; id: number } | null

const MergePdfPage = () => {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [editorMode, setEditorMode] = useState<'Add' | 'Edit' | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState(1)
  const [importMode, setImportMode] = useState<'manual' | 'combined'>('manual')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [confirmAction, setConfirmAction] = useState<Confirmation>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [statusEditId, setStatusEditId] = useState<number | null>(null)
  const [movePosition, setMovePosition] = useState('')
  const [checkedPageIds, setCheckedPageIds] = useState<number[]>([])
  const [bulkPosition, setBulkPosition] = useState('')
  const [jumpPosition, setJumpPosition] = useState('')
  const [draggedPageId, setDraggedPageId] = useState<number | null>(null)
  const lastSyncedJobId = useRef<number | null>(null)
  const editorStartVersion = useRef<number | null>(null)
  const listScrollPosition = useRef(0)
  const detailQuery = useMergePdfDetail(selectedJobId)
  const actions = useMergePdfActions()
  const detail = detailQuery.data?.data.ResultOnDb[0]
  const selectedPage = detail?.pages.find(page => page.PAGE_ID === selectedPageId) ?? detail?.pages[0]
  const selectedPageIndex = detail?.pages.findIndex(page => page.PAGE_ID === selectedPage?.PAGE_ID) ?? -1
  const previewQuery = useMergePdfPagePreview(
    detail?.job.JOB_ID ?? null,
    selectedPage?.PAGE_ID ?? null,
    selectedPage?.ROTATION_DEGREES ?? 0,
    previewOpen
  )
  const previewUrl = useObjectUrl(previewOpen ? previewQuery.data : undefined)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  const {
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty }
  } = useForm<MergePdfFormValues>({
    resolver: zodResolver(mergePdfFormSchema),
    defaultValues: mergePdfFormDefaults
  })

  useEffect(() => {
    if (detail && (lastSyncedJobId.current !== detail.job.JOB_ID || !isDirty)) {
      if (lastSyncedJobId.current !== detail.job.JOB_ID) editorStartVersion.current = detail.job.ROW_VERSION
      reset({ title: detail.job.JOB_TITLE })
      lastSyncedJobId.current = detail.job.JOB_ID
    }
  }, [detail, isDirty, reset])

  const documentsById = useMemo(
    () => new Map(detail?.documents.map(document => [document.DOCUMENT_ID, document]) ?? []),
    [detail?.documents]
  )
  const importEntryDocumentIds = new Set(
    detail?.pages.filter(page => page.CATEGORY_ID === 1).map(page => page.DOCUMENT_ID) ?? []
  )
  const canComplete =
    !!detail?.pages.length &&
    REQUIRED_MERGE_PDF_CATEGORY_IDS.every(id => detail.pages.some(page => page.CATEGORY_ID === id)) &&
    detail.documents
      .filter(document => importEntryDocumentIds.has(document.DOCUMENT_ID))
      .every(document => document.ENTRY_STATUS_CODE === '04')
  const hasCompleted =
    !!detail &&
    (detail.job.STATUS === 'COMPLETED' ||
      !!detail.job.LAST_COMPLETED_AT ||
      detail.publications.some(publication => publication.STATUS === 'PUBLISHED'))
  const currentPublication = detail?.publications.find(publication => publication.STATUS === 'PUBLISHED')
  const activeCheckedIds = checkedPageIds.filter(id => detail?.pages.some(page => page.PAGE_ID === id))
  const maxBulkPosition = (detail?.pages.length ?? 0) - activeCheckedIds.length + 1
  const categoryOptions = MERGE_PDF_CATEGORIES.map(category => ({ value: category.id, label: category.name }))

  const run = async (action: () => Promise<void>, success?: string) => {
    setBusy(true)
    try {
      await action()
      if (success) ToastMessageSuccess({ message: success })
    } catch (error: unknown) {
      ToastMessageError({ message: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  const closeEditor = () => {
    setEditorMode(null)
    setSelectedJobId(null)
    setPreviewOpen(false)
    setRefreshVersion(value => value + 1)
    window.requestAnimationFrame(() => window.scrollTo({ top: listScrollPosition.current }))
  }

  const startEditor = (jobId: number | null) => {
    listScrollPosition.current = window.scrollY
    reset(mergePdfFormDefaults)
    lastSyncedJobId.current = null
    setSelectedJobId(jobId)
    setEditorMode(jobId === null ? 'Add' : 'Edit')
    setSelectedPageId(null)
    setCheckedPageIds([])
    setBulkPosition('')
    setJumpPosition('')
    setMovePosition('')
    setCategoryId(1)
    setImportMode('manual')
    setFiles([])
    setPreviewOpen(false)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }

  const createDraft = () =>
    run(async () => {
      const values = mergePdfFormSchema.parse(getValues())
      const created = firstDetail(await actions.create.mutateAsync({ title: values.title, reference: null }))
      reset(values)
      setSelectedJobId(created.job.JOB_ID)
      setCreateConfirmOpen(false)
    }, 'Draft created')

  const saveDraft = handleSubmit(values =>
    run(async () => {
      if (!detail) return
      if (!isDirty) {
        closeEditor()
        return
      }
      firstDetail(
        await actions.saveDraft.mutateAsync({
          jobId: detail.job.JOB_ID,
          rowVersion: detail.job.ROW_VERSION,
          title: values.title,
          reference: detail.job.JOB_REFERENCE
        })
      )
      reset(values)
      closeEditor()
    }, 'Draft saved')
  )

  const returnToResults = () => {
    if (busy) return
    if (detail && hasCompleted && (isDirty || detail.job.ROW_VERSION !== editorStartVersion.current)) {
      setConfirmAction({ kind: 'complete' })
    } else if (detail && isDirty) void saveDraft()
    else closeEditor()
  }

  const importFiles = () =>
    run(
      async () => {
        if (!detail || files.length === 0) return
        let version = detail.job.ROW_VERSION
        let completed = 0
        try {
          for (const file of files) {
            const response =
              importMode === 'combined'
                ? await actions.combinedUpload.mutateAsync({ jobId: detail.job.JOB_ID, rowVersion: version, file })
                : await actions.upload.mutateAsync({
                    jobId: detail.job.JOB_ID,
                    rowVersion: version,
                    categoryId,
                    entryStatusCode: null,
                    file
                  })
            const result = firstDetail(response)
            version = result.job.ROW_VERSION
            completed += 1
          }
        } finally {
          setFiles(files.slice(completed))
          const input = document.getElementById('merge-pdf-file-input') as HTMLInputElement | null
          if (input) input.value = ''
        }
      },
      importMode === 'combined' ? 'Combined file imported' : 'Document imported'
    )

  const changePageCategory = (pageId: number, nextCategoryId: number) =>
    run(async () => {
      if (!detail) return
      firstDetail(
        await actions.updatePageCategory.mutateAsync({
          jobId: detail.job.JOB_ID,
          pageId,
          rowVersion: detail.job.ROW_VERSION,
          categoryId: nextCategoryId
        })
      )
    }, 'Page category saved')

  const rotatePage = (pageId: number, delta: 90 | 270) =>
    run(async () => {
      if (!detail) return
      firstDetail(
        await actions.rotatePage.mutateAsync({
          jobId: detail.job.JOB_ID,
          pageId,
          rowVersion: detail.job.ROW_VERSION,
          delta
        })
      )
    }, 'Page rotated')

  const sortByCategory = () => {
    if (!detail) return
    const pageIds = [...detail.pages]
      .sort((a, b) => a.CATEGORY_ID - b.CATEGORY_ID || a.SORT_ORDER - b.SORT_ORDER)
      .map(page => page.PAGE_ID)
    void run(async () => {
      firstDetail(
        await actions.reorder.mutateAsync({
          jobId: detail.job.JOB_ID,
          rowVersion: detail.job.ROW_VERSION,
          pageIds
        })
      )
    }, 'Pages sorted by document type')
  }

  const movePage = () => {
    if (!detail || !selectedPage) return
    const position = Number(movePosition)
    if (!Number.isInteger(position) || position < 1 || position > detail.pages.length) return
    const ids = movePagesToPosition(
      detail.pages.map(page => page.PAGE_ID),
      [selectedPage.PAGE_ID],
      position
    )
    void run(async () => {
      firstDetail(
        await actions.reorder.mutateAsync({
          jobId: detail.job.JOB_ID,
          rowVersion: detail.job.ROW_VERSION,
          pageIds: ids
        })
      )
      setMovePosition('')
    }, 'Page order saved')
  }

  const moveCheckedPages = () => {
    if (!detail || !activeCheckedIds.length) return
    const position = Number(bulkPosition)
    if (!Number.isInteger(position) || position < 1 || position > maxBulkPosition) return
    const ids = movePagesToPosition(
      detail.pages.map(page => page.PAGE_ID),
      activeCheckedIds,
      position
    )
    void run(async () => {
      firstDetail(
        await actions.reorder.mutateAsync({
          jobId: detail.job.JOB_ID,
          rowVersion: detail.job.ROW_VERSION,
          pageIds: ids
        })
      )
      setCheckedPageIds([])
      setBulkPosition('')
      window.requestAnimationFrame(() =>
        document
          .getElementById(`merge-pdf-page-${ids[position - 1]}`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      )
    }, 'Selected pages moved')
  }

  const onDragEnd = (event: DragEndEvent) => {
    setDraggedPageId(null)
    if (!detail || !event.over || event.active.id === event.over.id) return
    const ids = detail.pages.map(page => page.PAGE_ID)
    const oldIndex = ids.indexOf(Number(event.active.id))
    const newIndex = ids.indexOf(Number(event.over.id))
    if (oldIndex < 0 || newIndex < 0) return
    ids.splice(newIndex, 0, ids.splice(oldIndex, 1)[0])
    void run(async () => {
      firstDetail(
        await actions.reorder.mutateAsync({
          jobId: detail.job.JOB_ID,
          rowVersion: detail.job.ROW_VERSION,
          pageIds: ids
        })
      )
    }, 'Page order saved')
  }

  const confirm = () =>
    run(
      async () => {
        if (!detail || confirmAction === null) return
        if (confirmAction.kind === 'complete') {
          const values = mergePdfFormSchema.parse(getValues())
          firstDetail(
            await actions.complete.mutateAsync({
              jobId: detail.job.JOB_ID,
              rowVersion: detail.job.ROW_VERSION,
              fields: { title: values.title, reference: detail.job.JOB_REFERENCE }
            })
          )
          closeEditor()
        } else if (confirmAction.kind === 'document') {
          firstDetail(
            await actions.remove.mutateAsync({
              jobId: detail.job.JOB_ID,
              documentId: confirmAction.id,
              rowVersion: detail.job.ROW_VERSION
            })
          )
        } else {
          firstDetail(
            await actions.removePage.mutateAsync({
              jobId: detail.job.JOB_ID,
              pageId: confirmAction.id,
              rowVersion: detail.job.ROW_VERSION
            })
          )
          if (selectedPageId === confirmAction.id) {
            setPreviewOpen(false)
            setSelectedPageId(null)
          }
        }
        setConfirmAction(null)
      },
      confirmAction?.kind === 'complete' ? 'Merged PDF saved' : 'Removed from document'
    )

  const download = (publicationId: number, fileName: string) =>
    run(async () => {
      if (!detail) return
      const response = await MergePdfServices.download(detail.job.JOB_ID, publicationId)
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    })

  const downloadSource = (documentId: number, fileName: string) =>
    run(async () => {
      if (!detail) return
      const response = await MergePdfServices.source(detail.job.JOB_ID, documentId)
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    })

  const saveEntryStatus = () =>
    run(async () => {
      if (!detail || statusEditId === null) return
      firstDetail(
        await actions.updateEntryStatus.mutateAsync({
          jobId: detail.job.JOB_ID,
          documentId: statusEditId,
          rowVersion: detail.job.ROW_VERSION,
          statusCode:
            detail.documents.find(document => document.DOCUMENT_ID === statusEditId)?.ENTRY_STATUS_CODE === '04'
              ? null
              : '04'
        })
      )
      setStatusEditId(null)
    }, 'Import entry status saved')

  const onFilesChange = (event: ChangeEvent<HTMLInputElement>) => setFiles(Array.from(event.target.files ?? []))

  return (
    <Grid container spacing={6}>
      <Grid size={12} sx={{ display: 'flex', alignItems: 'center' }}>
        <DxBreadCrumbs menuName={MENU_NAME} breadcrumbNavigation={breadcrumbNavigation} />
      </Grid>
      <Grid size={12} sx={{ display: editorMode === null ? 'block' : 'none' }}>
        <MergePdfList
          onOpen={jobId => startEditor(jobId)}
          onAdd={() => startEditor(null)}
          refreshVersion={refreshVersion}
        />
      </Grid>
      {editorMode !== null && (
        <Grid size={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, mb: 6 }}>
            <Button
              variant='tonal'
              color='secondary'
              startIcon={<i className='tabler-arrow-left' />}
              disabled={busy}
              onClick={returnToResults}
            >
              Back to results
            </Button>
            <Typography variant='h5'>
              {editorMode} Merge PDF{detail ? ` · ${detail.job.JOB_TITLE}` : ''}
            </Typography>
          </Box>
          <Stack spacing={6}>
            <Card>
              <CardHeader
                title={detail?.job.JOB_TITLE ?? (editorMode === 'Add' ? 'New document' : 'Loading...')}
                titleTypographyProps={{ variant: 'h5' }}
              />
              <CardContent>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <CustomTextField
                      label='Document name'
                      placeholder='Generated automatically when the draft is created'
                      fullWidth
                      value={detail ? (/^I\d{2}-\d{4,}$/.test(detail.job.JOB_CODE) ? detail.job.JOB_CODE : detail.job.JOB_TITLE) : ''}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                  {currentPublication && (
                    <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button variant='outlined' disabled={busy}
                        onClick={() => void download(currentPublication.PUBLICATION_ID, currentPublication.OUTPUT_FILE_NAME)}>
                        Download {currentPublication.OUTPUT_FILE_NAME}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
            {detail && (
              <>
                <Card>
                  <CardHeader
                    title='Import documents'
                    subheader='Import PDF, Excel or images and review the page order before completion.'
                    titleTypographyProps={{ variant: 'h5' }}
                  />
                  <CardContent>
                    <Tabs
                      value={importMode}
                      onChange={(_, value) => {
                        setImportMode(value)
                        setFiles([])
                      }}
                      sx={{ mb: 4 }}
                    >
                      <Tab value='manual' label='Choose document type' />
                      <Tab value='combined' label='Combined file' />
                    </Tabs>
                    <Grid container spacing={4}>
                      {importMode === 'manual' && (
                        <Grid size={{ xs: 12, md: 5 }}>
                          <SelectCustom
                            inputId='merge-pdf-document-type'
                            name='documentType'
                            label='Document type'
                            placeholder='Select ...'
                            classNamePrefix='select'
                            options={categoryOptions}
                            value={categoryOptions.find(option => option.value === categoryId)}
                            onChange={option => setCategoryId(option?.value ?? 1)}
                          />
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, md: 7 }}>
                        <Button component='label' variant='outlined' color='primary' fullWidth sx={{ mt: 3.5 }}>
                          {files.length
                            ? `${files.length} file(s) selected`
                            : importMode === 'combined'
                              ? 'Choose PDF'
                              : 'Choose PDF, Excel or image'}
                          <input
                            id='merge-pdf-file-input'
                            type='file'
                            hidden
                            multiple
                            accept={
                              importMode === 'combined' ? '.pdf' : '.pdf,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.tif,.tiff'
                            }
                            onChange={onFilesChange}
                          />
                        </Button>
                      </Grid>
                      <Grid size={12}>
                        <Button
                          variant='contained'
                          color='primary'
                          disabled={busy || files.length === 0}
                          onClick={() => void importFiles()}
                        >
                          {busy ? 'Importing ...' : 'Import'}
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                <Card sx={{ overflow: 'visible' }}>
                  <CardHeader
                    title={`Pages (${detail.pages.length})`}
                    subheader='Drag to any page; move near the edge to scroll. Select pages to move a group to a position.'
                    titleTypographyProps={{ variant: 'h5' }}
                    action={
                      <Button
                        variant='outlined'
                        color='primary'
                        size='small'
                        disabled={busy || detail.pages.length < 2}
                        onClick={sortByCategory}
                      >
                        Sort by document type
                      </Button>
                    }
                  />
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-end',
                        gap: 3,
                        mb: 4,
                        position: 'sticky',
                        top: 80,
                        bgcolor: 'background.paper',
                        zIndex: 2,
                        py: 2
                      }}
                    >
                      <CustomTextField
                        type='number'
                        label={`Go to page (1–${detail.pages.length})`}
                        placeholder='Enter ...'
                        value={jumpPosition}
                        onChange={event => setJumpPosition(event.target.value)}
                        sx={{ width: 190 }}
                      />
                      <Button
                        variant='tonal'
                        disabled={
                          busy ||
                          !Number.isInteger(Number(jumpPosition)) ||
                          Number(jumpPosition) < 1 ||
                          Number(jumpPosition) > detail.pages.length
                        }
                        onClick={() => {
                          const target = detail.pages[Number(jumpPosition) - 1]
                          if (target)
                            document
                              .getElementById(`merge-pdf-page-${target.PAGE_ID}`)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}
                      >
                        Go
                      </Button>
                      <Typography sx={{ alignSelf: 'center' }}>{activeCheckedIds.length} selected</Typography>
                      <CustomTextField
                        type='number'
                        label={`Move selected to position (1–${maxBulkPosition})`}
                        placeholder='Enter ...'
                        value={bulkPosition}
                        onChange={event => setBulkPosition(event.target.value)}
                        disabled={!activeCheckedIds.length || busy}
                        sx={{ width: 240 }}
                      />
                      <Button
                        variant='contained'
                        disabled={
                          busy ||
                          !activeCheckedIds.length ||
                          !Number.isInteger(Number(bulkPosition)) ||
                          Number(bulkPosition) < 1 ||
                          Number(bulkPosition) > maxBulkPosition
                        }
                        onClick={moveCheckedPages}
                      >
                        Move selected
                      </Button>
                      <Button
                        variant='tonal'
                        color='secondary'
                        disabled={busy || !activeCheckedIds.length}
                        onClick={() => setCheckedPageIds([])}
                      >
                        Clear selection
                      </Button>
                    </Box>
                    {activeCheckedIds.length > 1 && (
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                        The destination is the first page of the moved group. Selected pages keep their current order.
                      </Typography>
                    )}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={event => setDraggedPageId(Number(event.active.id))}
                      onDragCancel={() => setDraggedPageId(null)}
                      onDragEnd={onDragEnd}
                    >
                      <SortableContext items={detail.pages.map(page => page.PAGE_ID)} strategy={rectSortingStrategy}>
                        <Box
                          sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 3 }}
                        >
                          {detail.pages.map(page => (
                            <SortablePage
                              key={page.PAGE_ID}
                              jobId={detail.job.JOB_ID}
                              page={page}
                              document={documentsById.get(page.DOCUMENT_ID)}
                              selected={previewOpen && page.PAGE_ID === selectedPage?.PAGE_ID}
                              disabled={busy}
                              checked={activeCheckedIds.includes(page.PAGE_ID)}
                              onCheck={checked =>
                                setCheckedPageIds(ids =>
                                  checked ? [...ids, page.PAGE_ID] : ids.filter(id => id !== page.PAGE_ID)
                                )
                              }
                              onSelect={() => {
                                setSelectedPageId(page.PAGE_ID)
                                setPreviewOpen(true)
                              }}
                              onRotate={delta => void rotatePage(page.PAGE_ID, delta)}
                              onRemove={() => setConfirmAction({ kind: 'page', id: page.PAGE_ID })}
                            />
                          ))}
                        </Box>
                      </SortableContext>
                      <DragOverlay>
                        {draggedPageId !== null && (
                          <Box sx={{ width: 185, p: 3, bgcolor: 'background.paper', boxShadow: 8, borderRadius: 1 }}>
                            <Box sx={{ height: 195, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MergePdfPageThumbnail
                                jobId={detail.job.JOB_ID}
                                pageId={draggedPageId}
                                rotation={
                                  detail.pages.find(page => page.PAGE_ID === draggedPageId)?.ROTATION_DEGREES ?? 0
                                }
                                label='Moving page'
                              />
                            </Box>
                            <Typography>
                              Moving page {detail.pages.find(page => page.PAGE_ID === draggedPageId)?.SORT_ORDER}
                            </Typography>
                          </Box>
                        )}
                      </DragOverlay>
                    </DndContext>
                    {detail.pages.length === 0 && <Typography>No pages yet</Typography>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title='Source documents' titleTypographyProps={{ variant: 'h5' }} />
                  <CardContent>
                    <Stack spacing={2}>
                      {detail.documents.map(document => (
                        <Box key={document.DOCUMENT_ID} sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Typography sx={{ flex: 1, minWidth: 200, overflowWrap: 'anywhere' }}>
                            {document.CATEGORY_ID === 10 ? 'Other / mixed file' : document.CATEGORY_NAME}:{' '}
                            {document.ORIGINAL_FILE_NAME} ({document.PDF_PAGE_COUNT} page(s))
                            {document.ENTRY_STATUS_CODE === '04' ? ' · Status 04 confirmed' : ''}
                          </Typography>
                          <Button size='small' disabled={busy}
                            onClick={() => void downloadSource(document.DOCUMENT_ID, document.ORIGINAL_FILE_NAME)}>
                            Download source
                          </Button>
                          {importEntryDocumentIds.has(document.DOCUMENT_ID) && (
                            <Button
                              size='small'
                              disabled={busy}
                              onClick={() => {
                                setStatusEditId(document.DOCUMENT_ID)
                              }}
                            >
                              {document.ENTRY_STATUS_CODE === '04' ? 'Clear status 04' : 'Confirm status 04'}
                            </Button>
                          )}
                          <Button
                            color='error'
                            size='small'
                            disabled={busy}
                            onClick={() => setConfirmAction({ kind: 'document', id: document.DOCUMENT_ID })}
                          >
                            Remove
                          </Button>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </>
            )}
            {selectedJobId !== null && detailQuery.isError && (
              <Alert severity='error'>Could not load this document.</Alert>
            )}
          </Stack>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'sticky',
              bottom: 0,
              zIndex: 5,
              bgcolor: 'background.paper',
              boxShadow: 3,
              borderRadius: 1,
              mt: 6,
              p: 3,
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            {detail ? (
              <>
                <Typography variant='body2' sx={{ mr: 'auto' }}>
                  {detail.pages.length} pages ·{' '}
                  {hasCompleted ? 'Save Changes updates the shared PDF' : 'File and page changes save automatically'}
                </Typography>
                {!hasCompleted && (
                  <Button variant='contained' disabled={busy} onClick={saveDraft}>
                    Save Draft &amp; Return
                  </Button>
                )}
                <Button
                  variant='contained'
                  color='success'
                  disabled={busy || !canComplete}
                  onClick={() => setConfirmAction({ kind: 'complete' })}
                >
                  {hasCompleted ? 'Save Changes' : 'Save & Complete'}
                </Button>
              </>
            ) : (
              editorMode === 'Add' && (
                <Button
                  variant='contained'
                  color='success'
                  disabled={busy}
                  onClick={handleSubmit(() => setCreateConfirmOpen(true))}
                >
                  Create Draft &amp; Continue
                </Button>
              )
            )}
            <Button
              variant='tonal'
              color='secondary'
              disabled={busy}
              startIcon={<i className='tabler-arrow-left' />}
              onClick={returnToResults}
            >
              Back to results
            </Button>
          </Box>
        </Grid>
      )}
      <ConfirmModal
        show={createConfirmOpen}
        onConfirmClick={() => void createDraft()}
        onCloseClick={() => setCreateConfirmOpen(false)}
        isDelete={false}
        isLoading={busy}
      />
      <Dialog open={previewOpen && !!selectedPage} onClose={() => setPreviewOpen(false)} fullWidth maxWidth='lg'>
        <DialogTitle>
          {selectedPage
            ? `Page ${selectedPage.SORT_ORDER} · ${documentsById.get(selectedPage.DOCUMENT_ID)?.ORIGINAL_FILE_NAME ?? ''}`
            : 'Page preview'}
        </DialogTitle>
        <DialogContent>
          {selectedPage && detail && (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 8 }}>
                {previewQuery.isError ? (
                  <Alert
                    severity='error'
                    action={
                      <Button color='inherit' size='small' onClick={() => void previewQuery.refetch()}>
                        Retry
                      </Button>
                    }
                  >
                    Could not load this page preview.
                  </Alert>
                ) : previewUrl ? (
                  <Box
                    component='iframe'
                    key={`${selectedPage.PAGE_ID}-${selectedPage.ROTATION_DEGREES}`}
                    title={`Preview page ${selectedPage.SORT_ORDER}`}
                    src={`${previewUrl}#toolbar=0&navpanes=0&view=Fit`}
                    sx={{ width: '100%', height: 'min(72vh, 720px)', border: '1px solid', borderColor: 'divider' }}
                  />
                ) : (
                  <Box
                    sx={{ height: 'min(72vh, 720px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <CircularProgress aria-label='Loading page preview' />
                  </Box>
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={4}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label={`Move to position (1–${detail.pages.length})`}
                      placeholder='Enter ...'
                      value={movePosition}
                      onChange={event => setMovePosition(event.target.value)}
                      inputProps={{ min: 1, max: detail.pages.length }}
                    />
                    <Button
                      variant='contained'
                      disabled={
                        busy ||
                        !Number.isInteger(Number(movePosition)) ||
                        Number(movePosition) < 1 ||
                        Number(movePosition) > detail.pages.length
                      }
                      onClick={movePage}
                    >
                      Move
                    </Button>
                  </Box>
                  <SelectCustom
                    inputId='merge-pdf-page-type'
                    name='pageType'
                    label='Page document type'
                    placeholder='Select ...'
                    classNamePrefix='select'
                    options={categoryOptions}
                    value={categoryOptions.find(option => option.value === selectedPage.CATEGORY_ID)}
                    isDisabled={busy}
                    onChange={option => {
                      if (option) void changePageCategory(selectedPage.PAGE_ID, option.value)
                    }}
                  />
                  <Typography variant='body2' color='text.secondary'>
                    Source page {selectedPage.SOURCE_PAGE_NUMBER} · Rotation {selectedPage.ROTATION_DEGREES}°
                  </Typography>
                  <Box className='flex flex-wrap gap-2'>
                    <Button
                      variant='outlined'
                      disabled={busy}
                      onClick={() => void rotatePage(selectedPage.PAGE_ID, 270)}
                    >
                      Rotate left
                    </Button>
                    <Button
                      variant='outlined'
                      disabled={busy}
                      onClick={() => void rotatePage(selectedPage.PAGE_ID, 90)}
                    >
                      Rotate right
                    </Button>
                  </Box>
                  {selectedPage.CATEGORY_ID === 1 && (
                    <Button
                      variant='tonal'
                      disabled={busy}
                      onClick={() => {
                        setStatusEditId(selectedPage.DOCUMENT_ID)
                      }}
                    >
                      {documentsById.get(selectedPage.DOCUMENT_ID)?.ENTRY_STATUS_CODE === '04'
                        ? 'Clear status 04'
                        : 'Confirm status 04'}
                    </Button>
                  )}
                  <Button
                    variant='outlined'
                    color='error'
                    disabled={busy}
                    onClick={() => setConfirmAction({ kind: 'page', id: selectedPage.PAGE_ID })}
                  >
                    Remove this page
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant='tonal'
            color='secondary'
            disabled={busy || selectedPageIndex <= 0}
            onClick={() => {
              setSelectedPageId(detail?.pages[selectedPageIndex - 1]?.PAGE_ID ?? null)
            }}
          >
            Previous
          </Button>
          <Button
            variant='tonal'
            color='secondary'
            disabled={busy || !detail || selectedPageIndex >= detail.pages.length - 1}
            onClick={() => {
              setSelectedPageId(detail?.pages[selectedPageIndex + 1]?.PAGE_ID ?? null)
            }}
          >
            Next
          </Button>
          <Button variant='contained' onClick={() => setPreviewOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmAction !== null}
        onClose={(_, reason) => {
          if (!busy && reason !== 'backdropClick') setConfirmAction(null)
        }}
      >
        <DialogTitle>
          {confirmAction?.kind === 'complete'
            ? hasCompleted
              ? 'Save Changes'
              : 'Save & Complete'
            : confirmAction?.kind === 'page'
              ? 'Remove page'
              : 'Remove document'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmAction?.kind === 'complete'
              ? hasCompleted
                ? `Save changes to ${currentPublication?.OUTPUT_FILE_NAME ?? detail?.job.JOB_CODE} at the same shared path?`
                : 'Merge the pages in this order and save the PDF to the shared folder?'
              : confirmAction?.kind === 'page'
                ? 'Remove this page from this document?'
                : 'Remove this source document and all of its pages?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant='contained'
            color={confirmAction?.kind === 'complete' ? 'success' : 'error'}
            disabled={busy || (confirmAction?.kind === 'complete' && !canComplete)}
            onClick={() => void confirm()}
          >
            {confirmAction?.kind === 'complete' ? (hasCompleted ? 'Save Changes' : 'Save & Complete') : 'Remove'}
          </Button>
          <Button variant='tonal' color='secondary' disabled={busy} onClick={() => setConfirmAction(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={statusEditId !== null}
        onClose={(_, reason) => {
          if (!busy && reason !== 'backdropClick') setStatusEditId(null)
        }}
      >
        <DialogTitle>Import entry status 04</DialogTitle>
        <DialogContent>
          <Typography>
            {detail?.documents.find(document => document.DOCUMENT_ID === statusEditId)?.ENTRY_STATUS_CODE === '04'
              ? 'Clear the status 04 confirmation for this source document?'
              : 'Have you checked the source document and confirmed that the Import entry status is 04?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant='contained' color='success' disabled={busy} onClick={() => void saveEntryStatus()}>
            Confirm
          </Button>
          <Button variant='tonal' color='secondary' disabled={busy} onClick={() => setStatusEditId(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default MergePdfPage
