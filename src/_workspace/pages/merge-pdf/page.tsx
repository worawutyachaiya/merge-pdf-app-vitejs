import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  DndContext,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Pagination,
  Tab,
  Stack,
  Tabs,
  Typography
} from '@mui/material'
import { useForm } from 'react-hook-form'

import DxBreadCrumbs from '@/_template/DxBreadCrumbs'
import { useMergePdfActions, useMergePdfDetail } from '@/_workspace/react-query/hooks/useMergePdf'
import { MergePdfServices } from '@/_workspace/services/merge-pdf/MergePdfServices'
import {
  MERGE_PDF_CATEGORIES,
  REQUIRED_MERGE_PDF_CATEGORY_IDS,
  type MergePdfDetail
} from '@/_workspace/types/merge-pdf/MergePdf'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'
import CustomTextField from '@/components/mui/TextField'
import SelectCustom from '@/components/react-select/SelectCustom'

import SortablePage from './SortablePage'
import MergePdfList from './MergePdfList'
import { breadcrumbNavigation, MENU_NAME } from './env'
import { mergePdfFormDefaults, mergePdfFormSchema, type MergePdfFormValues } from './validationSchema'

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
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState(1)
  const [importMode, setImportMode] = useState<'manual' | 'combined'>('manual')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [confirmAction, setConfirmAction] = useState<Confirmation>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [statusEditId, setStatusEditId] = useState<number | null>(null)
  const [pageBatch, setPageBatch] = useState(1)
  const [movePosition, setMovePosition] = useState('')
  const lastSyncedJobId = useRef<number | null>(null)
  const detailQuery = useMergePdfDetail(selectedJobId)
  const actions = useMergePdfActions()
  const detail = detailQuery.data?.data.ResultOnDb[0]
  const selectedPage = detail?.pages.find(page => page.PAGE_ID === selectedPageId) ?? detail?.pages[0]
  const selectedPageIndex = detail?.pages.findIndex(page => page.PAGE_ID === selectedPage?.PAGE_ID) ?? -1
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isDirty }
  } = useForm<MergePdfFormValues>({
    resolver: zodResolver(mergePdfFormSchema),
    defaultValues: mergePdfFormDefaults
  })

  useEffect(() => {
    if (detail && (lastSyncedJobId.current !== detail.job.JOB_ID || !isDirty)) {
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
  const unknownPageCount = detail?.pages.filter(page => page.CLASSIFICATION_SOURCE === 'UNKNOWN').length ?? 0
  const batchSize = 24
  const batchCount = Math.max(1, Math.ceil((detail?.pages.length ?? 0) / batchSize))
  const visiblePages =
    detail?.pages.slice(
      (Math.min(pageBatch, batchCount) - 1) * batchSize,
      Math.min(pageBatch, batchCount) * batchSize
    ) ?? []
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

  const saveDraft = handleSubmit(values =>
    run(async () => {
      if (!detail) return
      if (!isDirty) {
        setSelectedJobId(null)
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
      setSelectedJobId(null)
    }, 'Draft saved')
  )

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
    const ids = detail.pages.map(page => page.PAGE_ID)
    const oldIndex = ids.indexOf(selectedPage.PAGE_ID)
    ids.splice(position - 1, 0, ids.splice(oldIndex, 1)[0])
    void run(async () => {
      firstDetail(
        await actions.reorder.mutateAsync({
          jobId: detail.job.JOB_ID,
          rowVersion: detail.job.ROW_VERSION,
          pageIds: ids
        })
      )
      setPageBatch(Math.ceil(position / batchSize))
      setMovePosition('')
    }, 'Page order saved')
  }

  const onDragEnd = (event: DragEndEvent) => {
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
          const saved = firstDetail(
            await actions.saveDraft.mutateAsync({
              jobId: detail.job.JOB_ID,
              rowVersion: detail.job.ROW_VERSION,
              title: values.title,
              reference: detail.job.JOB_REFERENCE
            })
          )
          firstDetail(
            await actions.complete.mutateAsync({ jobId: detail.job.JOB_ID, rowVersion: saved.job.ROW_VERSION })
          )
          setSelectedJobId(null)
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
      confirmAction?.kind === 'complete' ? 'Merged PDF saved and completed' : 'Removed from draft'
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
      {selectedJobId === null && (
        <Grid size={12}>
          <MergePdfList
            onOpen={jobId => {
              setSelectedJobId(jobId)
              setSelectedPageId(null)
              setPageBatch(1)
              setPreviewOpen(false)
            }}
          />
        </Grid>
      )}
      {selectedJobId !== null && (
        <Grid size={12}>
          <Stack spacing={6}>
            <Card>
              <CardHeader
                title={detail?.job.JOB_TITLE ?? 'Loading...'}
                titleTypographyProps={{ variant: 'h5' }}
                action={
                  <Button
                    variant='tonal'
                    color='secondary'
                    disabled={busy}
                    onClick={() => {
                      if (detail && isDirty) {
                        void saveDraft()
                      } else {
                        setSelectedJobId(null)
                        setPreviewOpen(false)
                      }
                    }}
                  >
                    Back to results
                  </Button>
                }
              />
              <CardContent>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <CustomTextField
                      label='Document name'
                      placeholder='Enter ...'
                      autoComplete='off'
                      fullWidth
                      {...register('title')}
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  </Grid>
                  {detail && (
                    <Grid size={12}>
                      <Alert severity='info'>
                        Files, page order, rotation, document types and status confirmation save automatically. The
                        document name is saved when you leave the editor or complete the document.
                      </Alert>
                      {!canComplete && (
                        <Alert severity='warning' sx={{ mt: 2 }}>
                          To complete: add Import entry, Invoice and HAWB or AWB pages, then confirm status 04 for the
                          Import entry.
                        </Alert>
                      )}
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
                    subheader='Import PDF or images and review the page order before completion.'
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
                          {files.length ? `${files.length} file(s) selected` : 'Choose PDF or image'}
                          <input
                            id='merge-pdf-file-input'
                            type='file'
                            hidden
                            multiple
                            accept={importMode === 'combined' ? '.pdf' : '.pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff'}
                            onChange={onFilesChange}
                          />
                        </Button>
                      </Grid>
                      {importMode === 'combined' && (
                        <Grid size={12}>
                          <Alert severity='info'>
                            Import a PDF with mixed pages, preview each page, then drag pages into order. Select the
                            document type for required pages before completing.
                          </Alert>
                        </Grid>
                      )}
                      {importMode === 'manual' && (
                        <Grid size={12}>
                          <Alert severity='info'>
                            Excel files are not supported yet. Export them to PDF before importing.
                          </Alert>
                        </Grid>
                      )}
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
                {unknownPageCount > 0 && (
                  <Alert severity='warning'>
                    {unknownPageCount} page(s) in combined files have no document type yet. Select a page to set its
                    type when needed.
                  </Alert>
                )}
                <Card>
                  <CardHeader
                    title={`Pages (${detail.pages.length})`}
                    subheader='Drag within this group. Open a page to move it to any position, rotate it or remove it.'
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
                    {detail.pages.length > batchSize && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          flexWrap: 'wrap',
                          mb: 3
                        }}
                      >
                        <Typography variant='body2'>
                          Showing {(Math.min(pageBatch, batchCount) - 1) * batchSize + 1}–
                          {Math.min(Math.min(pageBatch, batchCount) * batchSize, detail.pages.length)} of{' '}
                          {detail.pages.length} pages
                        </Typography>
                        <Pagination
                          count={batchCount}
                          page={Math.min(pageBatch, batchCount)}
                          onChange={(_, value) => setPageBatch(value)}
                          color='primary'
                          shape='rounded'
                        />
                      </Box>
                    )}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                      <SortableContext items={visiblePages.map(page => page.PAGE_ID)} strategy={rectSortingStrategy}>
                        <Box
                          sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 3 }}
                        >
                          {visiblePages.map(page => (
                            <SortablePage
                              key={page.PAGE_ID}
                              jobId={detail.job.JOB_ID}
                              page={page}
                              document={documentsById.get(page.DOCUMENT_ID)}
                              selected={previewOpen && page.PAGE_ID === selectedPage?.PAGE_ID}
                              disabled={busy}
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
                    </DndContext>
                    {detail.pages.length === 0 && <Typography>No pages yet</Typography>}
                    {detail.pages.length > batchSize && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Pagination
                          count={batchCount}
                          page={Math.min(pageBatch, batchCount)}
                          onChange={(_, value) => setPageBatch(value)}
                          color='primary'
                          shape='rounded'
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title='Source documents' titleTypographyProps={{ variant: 'h5' }} />
                  <CardContent>
                    <Stack spacing={2}>
                      {detail.documents.map(document => (
                        <Box key={document.DOCUMENT_ID} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography sx={{ flex: 1 }}>
                            {document.CATEGORY_ID === 10 ? 'Other / mixed file' : document.CATEGORY_NAME}:{' '}
                            {document.ORIGINAL_FILE_NAME} ({document.PDF_PAGE_COUNT} page(s))
                            {document.ENTRY_STATUS_CODE === '04' ? ' · Status 04 confirmed' : ''}
                          </Typography>
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
                <Card>
                  <CardHeader title='Completed PDFs' titleTypographyProps={{ variant: 'h5' }} />
                  <CardContent>
                    <Stack spacing={2}>
                      {detail.publications
                        .filter(publication => publication.STATUS === 'PUBLISHED')
                        .map(publication => (
                          <Box key={publication.PUBLICATION_ID} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ flex: 1 }}>
                              Version {publication.PUBLICATION_VERSION} · {publication.OUTPUT_FILE_NAME}
                            </Typography>
                            <Button
                              variant='outlined'
                              onClick={() => void download(publication.PUBLICATION_ID, publication.OUTPUT_FILE_NAME)}
                            >
                              Download
                            </Button>
                          </Box>
                        ))}
                      {detail.publications.length === 0 && <Typography>No completed PDFs yet</Typography>}
                    </Stack>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Stack spacing={3}>
                      <Typography variant='body2' color='text.secondary'>
                        File and page changes are already saved. Save Draft &amp; Close saves the document name and
                        returns to search results.
                      </Typography>
                      <Box className='flex flex-wrap gap-3'>
                        <Button variant='contained' color='primary' disabled={busy} onClick={saveDraft}>
                          Save Draft &amp; Close
                        </Button>
                        <Button
                          variant='contained'
                          color='success'
                          disabled={busy || !canComplete}
                          onClick={() => setConfirmAction({ kind: 'complete' })}
                        >
                          Save &amp; Complete
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </>
            )}
            {selectedJobId !== null && detailQuery.isError && (
              <Alert severity='error'>Could not load this document.</Alert>
            )}
          </Stack>
        </Grid>
      )}
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
                <Box
                  component='iframe'
                  key={`${selectedPage.PAGE_ID}-${selectedPage.ROTATION_DEGREES}`}
                  title={`Preview page ${selectedPage.SORT_ORDER}`}
                  src={`${MergePdfServices.pagePreviewUrl(detail.job.JOB_ID, selectedPage.PAGE_ID, selectedPage.ROTATION_DEGREES)}#toolbar=0&navpanes=0&view=Fit`}
                  sx={{ width: '100%', height: 'min(72vh, 720px)', border: '1px solid', borderColor: 'divider' }}
                />
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
              setPageBatch(Math.ceil(selectedPageIndex / batchSize))
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
              setPageBatch(Math.ceil((selectedPageIndex + 2) / batchSize))
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
            ? 'Save & Complete'
            : confirmAction?.kind === 'page'
              ? 'Remove page'
              : 'Remove document'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmAction?.kind === 'complete'
              ? 'Merge the pages in this order and save the PDF to the development shared folder?'
              : confirmAction?.kind === 'page'
                ? 'Remove this page from the current draft?'
                : 'Remove this document and all of its pages from the current draft?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant='contained'
            color={confirmAction?.kind === 'complete' ? 'success' : 'error'}
            disabled={busy}
            onClick={() => void confirm()}
          >
            {confirmAction?.kind === 'complete' ? 'Save & Complete' : 'Remove'}
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
