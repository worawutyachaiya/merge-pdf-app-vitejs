import { useEffect, useMemo, useRef, useState } from 'react'
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
import { AxiosError, type AxiosResponse } from 'axios'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  GlobalStyles,
  Tab,
  Stack,
  Tabs,
  Typography
} from '@mui/material'
import { useDropzone } from 'react-dropzone'

import DxBreadCrumbs from '@/_template/DxBreadCrumbs'
import {
  useMergePdfActions,
  useMergePdfDetail,
  useMergePdfPagePreview
} from '@/_workspace/react-query/hooks/useMergePdf'
import { useDocumentOrder } from '@/_workspace/react-query/hooks/useSettings'
import MergePdfServices from '@/_workspace/services/merge-pdf/MergePdfServices'
import SettingsServices from '@/_workspace/services/settings/SettingsServices'
import {
  type MergePdfDetail,
  type MergePdfDocument
} from '@/_workspace/types/merge-pdf/MergePdf'
import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'
import CustomTextField from '@/components/mui/TextField'
import SelectCustom from '@/components/react-select/SelectCustom'
import ConfirmModal from '@/components/ConfirmModal'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import Transition from '@/components/TransitionDialog'

import SortablePage from './SortablePage'
import PreviewThumbnail from './PreviewThumbnail'
import FitPagePreview from './FitPagePreview'
import type { CoverAnnotation } from './pageAnnotations'
import { jobStampCoordinates } from './stampPlacement'
import MergePdfList from './MergePdfList'
import MergePdfPageThumbnail from './MergePdfPageThumbnail'
import { breadcrumbNavigation, MENU_NAME } from './env'
import { categoryRanks, insertPagesByCategory, movePagesToPosition, sortPagesByCategory } from './pageOrder'
import { useObjectUrl } from './useObjectUrl'
import { updateDraftPages, reorderDraftPages, base64Pdf } from './editorDraft'

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

const loadCategoryRanks = async () => {
  const response = await SettingsServices.documentOrder()
  if (!response.data.Status || !response.data.ResultOnDb.length)
    throw new Error(response.data.Message || 'Unable to load document order')
  return categoryRanks(response.data.ResultOnDb.filter(category => category.IS_ENABLED === 1))
}

type Confirmation = { kind: 'complete' } | { kind: 'document'; id: number } | null

const standardImportTypes = [1, 2, 4, 9]

const EntryStatusCheckbox = ({ source, disabled, onToggle, confirmLabel = 'Confirm Status 04' }: {
  source?: MergePdfDocument
  disabled: boolean
  onToggle: () => void
  confirmLabel?: string
}) => {
  const checked = source?.ENTRY_STATUS_CODE === '04'
  return (
    <FormControlLabel
      label={checked ? 'Confirmed Status 04' : confirmLabel}
      sx={{ m: 0, whiteSpace: 'nowrap' }}
      control={<Checkbox size='small' color='success' checked={checked} disabled={disabled} onChange={onToggle} />}
    />
  )
}

interface ImportFile {
  id: number
  file: File
  categoryId: number
  isDetecting: boolean
  typeSelected: boolean
  description: string
}

const MergePdfPage = () => {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const categoryQuery = useDocumentOrder()
  const categories = categoryQuery.data?.data.Status ? categoryQuery.data.data.ResultOnDb : undefined
  const enabledCategories = categories?.filter(category => category.IS_ENABLED === 1) ?? []
  const categoryNames = new Map(categories?.map(category => [category.CATEGORY_ID, category.CATEGORY_NAME]))
  const categoryPositions = categoryRanks(categories ?? [])
  const [editorMode, setEditorMode] = useState<'Add' | 'Edit' | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)
  const [importMode, setImportMode] = useState<'manual' | 'combined'>('manual')
  const [files, setFiles] = useState<ImportFile[]>([])
  const [busy, setBusy] = useState(false)
  const [confirmAction, setConfirmAction] = useState<Confirmation>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const coverClipboard = useRef<CoverAnnotation | null>(null)
  const [deskewInput, setDeskewInput] = useState('0')
  const [movePosition, setMovePosition] = useState('')
  const [checkedPageIds, setCheckedPageIds] = useState<number[]>([])
  const [batchCategoryId, setBatchCategoryId] = useState<number | null>(null)
  const painted = useRef(false)
  const paintGesture = useRef<{ pointerId: number; startId: number; x: number; y: number; lastX: number; lastY: number } | null>(null)
  const pendingPaintIds = useRef(new Set<number>())
  const paintFrame = useRef<number | null>(null)
  useEffect(() => {
    const flush = () => {
      paintFrame.current = null
      const additions = [...pendingPaintIds.current]
      pendingPaintIds.current.clear()
      if (additions.length) setCheckedPageIds(ids => {
        const selected = new Set(ids)
        let changed = false
        for (const id of additions) if (!selected.has(id)) { selected.add(id); changed = true }
        return changed ? [...selected] : ids
      })
    }
    const move = (event: PointerEvent) => {
      const gesture = paintGesture.current
      if (!gesture || event.pointerId !== gesture.pointerId) return
      if (!painted.current && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 6) return
      if (!painted.current) pendingPaintIds.current.add(gesture.startId)
      painted.current = true
      const distance = Math.hypot(event.clientX - gesture.lastX, event.clientY - gesture.lastY)
      const steps = Math.max(1, Math.ceil(distance / 24))
      for (let i = 1; i <= steps; i++) {
        const x = gesture.lastX + (event.clientX - gesture.lastX) * i / steps
        const y = gesture.lastY + (event.clientY - gesture.lastY) * i / steps
        const card = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-select-page-id]')
        if (card?.dataset.selectPageId) pendingPaintIds.current.add(Number(card.dataset.selectPageId))
      }
      gesture.lastX = event.clientX
      gesture.lastY = event.clientY
      if (paintFrame.current === null) paintFrame.current = requestAnimationFrame(flush)
    }
    const stop = (event: PointerEvent) => {
      if (paintGesture.current?.pointerId !== event.pointerId) return
      paintGesture.current = null
      if (paintFrame.current !== null) cancelAnimationFrame(paintFrame.current)
      flush()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      if (paintFrame.current !== null) cancelAnimationFrame(paintFrame.current)
    }
  }, [])
  const [bulkPosition, setBulkPosition] = useState('')
  const [jumpPosition, setJumpPosition] = useState('')
  const [draggedPageId, setDraggedPageId] = useState<number | null>(null)
  const listScrollPosition = useRef(0)
  const detailQuery = useMergePdfDetail(selectedJobId)
  const serverActions = useMergePdfActions()
  const [workingDetail, setWorkingDetail] = useState<MergePdfDetail | null>(null)
  const draftRef = useRef<MergePdfDetail | null>(null)
  const [pendingUploads, setPendingUploads] = useState<Record<number, { file: File; pdf: Blob; thumbnails: string[] }>>(
    {}
  )
  const temporaryId = useRef(-1)
  const nextImportFileId = useRef(0)
  const detail = workingDetail ?? detailQuery.data?.data.ResultOnDb[0]
  const changeDraft = (change: (current: MergePdfDetail) => MergePdfDetail) => {
    const current = draftRef.current ?? detail
    if (!current) throw new Error('Document not loaded')
    const updated = change(current)
    draftRef.current = updated
    setWorkingDetail(updated)
    return Promise.resolve({ data: { Status: true, Message: 'Updated', ResultOnDb: [updated] } } as AxiosResponse<
      ResultDataResponseI<MergePdfDetail>
    >)
  }
  const saveWork = async (mode: 'draft' | 'complete') => {
    const current = draftRef.current ?? detail
    if (!current) throw new Error('Document not loaded')
    const uploads = current.documents.filter(doc => doc.DOCUMENT_ID < 0)
    const response = await serverActions.saveEditor.mutateAsync({
      jobId: current.job.JOB_ID,
      rowVersion: current.job.ROW_VERSION,
      changes: {
        stampCoordinates: jobStampCoordinates(current.job),
        pages: current.pages.map(page => ({ ...page, DESCRIPTION: page.CATEGORY_ID === 10 ? page.DESCRIPTION : null })),
        documents: current.documents.map(doc => ({
          ...doc,
          DESCRIPTION:
            doc.CATEGORY_ID === 10 &&
            current.pages.some(page => page.DOCUMENT_ID === doc.DOCUMENT_ID && page.CATEGORY_ID === 10)
              ? doc.DESCRIPTION ||
                current.pages
                  .find(page => page.DOCUMENT_ID === doc.DOCUMENT_ID && page.CATEGORY_ID === 10)
                  ?.DESCRIPTION?.trim() ||
                null
              : null,
          uploadIndex: doc.DOCUMENT_ID < 0 ? uploads.findIndex(item => item.DOCUMENT_ID === doc.DOCUMENT_ID) : undefined
        }))
      },
      files: uploads.map(doc => pendingUploads[doc.DOCUMENT_ID].file),
      mode
    })
    draftRef.current = firstDetail(response)
    setWorkingDetail(draftRef.current)
    setPendingUploads({})
    return response
  }
  const actions = {
    ...serverActions,
    saveDraft: { ...serverActions.saveDraft, mutateAsync: () => saveWork('draft') },
    complete: {
      ...serverActions.complete,
      mutateAsync: () => saveWork('complete')
    },
    updatePageCategory: {
      ...serverActions.updatePageCategory,
      mutateAsync: (input: Parameters<typeof serverActions.updatePageCategory.mutateAsync>[0]) =>
        changeDraft(current =>
          updateDraftPages(current, [input.pageId], { kind: 'category', categoryId: input.categoryId })
        )
    },
    rotatePage: {
      ...serverActions.rotatePage,
      mutateAsync: (input: Parameters<typeof serverActions.rotatePage.mutateAsync>[0]) =>
        changeDraft(current => updateDraftPages(current, [input.pageId], { kind: 'rotate', delta: input.delta }))
    },
    batchPages: {
      ...serverActions.batchPages,
      mutateAsync: (input: Parameters<typeof serverActions.batchPages.mutateAsync>[0]) =>
        changeDraft(current => updateDraftPages(current, input.pageIds, input.action))
    },
    remove: {
      ...serverActions.remove,
      mutateAsync: (input: Parameters<typeof serverActions.remove.mutateAsync>[0]) =>
        changeDraft(current =>
          updateDraftPages(
            current,
            current.pages.filter(page => page.DOCUMENT_ID === input.documentId).map(page => page.PAGE_ID),
            { kind: 'remove' }
          )
        )
    },
    reorder: {
      ...serverActions.reorder,
      mutateAsync: (input: Parameters<typeof serverActions.reorder.mutateAsync>[0]) =>
        changeDraft(current => reorderDraftPages(current, input.pageIds))
    },
    updateEntryStatus: {
      ...serverActions.updateEntryStatus,
      mutateAsync: (input: Parameters<typeof serverActions.updateEntryStatus.mutateAsync>[0]) =>
        changeDraft(current => ({
          ...current,
          documents: current.documents.map(doc =>
            doc.DOCUMENT_ID === input.documentId
              ? { ...doc, ENTRY_STATUS_CODE: input.statusCode, ENTRY_STATUS_SOURCE: input.statusCode ? 'USER' : null }
              : doc
          )
        }))
    }
  }
  const selectedPage = detail?.pages.find(page => page.PAGE_ID === selectedPageId) ?? detail?.pages[0]
  useEffect(() => { setDeskewInput(String(selectedPage?.DESKEW_DEGREES ?? 0)) }, [selectedPage?.PAGE_ID, selectedPage?.DESKEW_DEGREES, previewOpen])
  const selectedPageIndex = detail?.pages.findIndex(page => page.PAGE_ID === selectedPage?.PAGE_ID) ?? -1
  const previewQuery = useMergePdfPagePreview(
    detail?.job.JOB_ID ?? null,
    selectedPage?.PAGE_ID ?? null,
    selectedPage?.ROTATION_DEGREES ?? 0,
    selectedPage?.DESKEW_DEGREES ?? 0,
    previewOpen,
    selectedPage ? pendingUploads[selectedPage.DOCUMENT_ID]?.pdf : undefined,
    selectedPage?.SOURCE_PAGE_NUMBER
  )
  const previewUrl = useObjectUrl(previewOpen ? previewQuery.data : undefined)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  const documentsById = useMemo(
    () => new Map(detail?.documents.map(document => [document.DOCUMENT_ID, document]) ?? []),
    [detail?.documents]
  )
  const importEntryDocumentIds = new Set(
    detail?.pages.filter(page => page.CATEGORY_ID === 1).map(page => page.DOCUMENT_ID) ?? []
  )
  const canComplete =
    !!detail?.pages.length &&
    !!categories &&
    enabledCategories.every(category => !category.REQUIRED_FOR_COMPLETE || detail.pages.some(page => page.CATEGORY_ID === category.CATEGORY_ID)) &&
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
  const categoryOptions = enabledCategories.map(category => ({ value: category.CATEGORY_ID, label: category.CATEGORY_NAME }))
  const categoryOption = (id: number) => ({ value: id, label: categoryNames.get(id) ?? `Document type ${id}` })
  const presetNames = standardImportTypes.map(id => categoryOptions.find(option => option.value === id)?.label)
  const sourceDocuments = detail?.documents.slice().sort((a, b) =>
    (categoryPositions.get(a.CATEGORY_ID) ?? Number.MAX_SAFE_INTEGER) -
    (categoryPositions.get(b.CATEGORY_ID) ?? Number.MAX_SAFE_INTEGER) || a.UPLOAD_ORDER - b.UPLOAD_ORDER
  ) ?? []

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
    setWorkingDetail(null)
    draftRef.current = null
    setPendingUploads({})
    setConfirmAction(null)
    setEditorMode(null)
    setSelectedJobId(null)
    setPreviewOpen(false)
    setRefreshVersion(value => value + 1)
    window.requestAnimationFrame(() => window.scrollTo({ top: listScrollPosition.current }))
  }

  const startEditor = (jobId: number, mode: 'Add' | 'Edit' = 'Edit') => {
    setWorkingDetail(null)
    draftRef.current = null
    setPendingUploads({})
    listScrollPosition.current = window.scrollY
    setSelectedJobId(jobId)
    setEditorMode(mode)
    setSelectedPageId(null)
    setCheckedPageIds([])
    setBatchCategoryId(null)
    setBulkPosition('')
    setJumpPosition('')
    setMovePosition('')
    setImportMode('manual')
    setFiles([])
    setPreviewOpen(false)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }

  const createDraft = (month: string) => {
    if (busy) return
    void run(async () => {
      const created = firstDetail(await actions.create.mutateAsync({ title: '', reference: null, month }))
      startEditor(created.job.JOB_ID, 'Add')
    }, 'Draft created')
  }

  const saveDraft = () =>
    run(async () => {
      if (!detail) return
      firstDetail(await actions.saveDraft.mutateAsync())
      closeEditor()
    }, 'Draft saved')

  const returnToResults = () => {
    if (busy) return
    closeEditor()
  }

  const importFiles = () =>
    run(async () => {
      if (!detail || !categories || !files.length || files.some(file => file.isDetecting)) return
      const ranks = await loadCategoryRanks()
      const preparedFiles: {
        upload: ImportFile
        prepared: Awaited<ReturnType<typeof MergePdfServices.prepareFile>>['data']['ResultOnDb'][number]
      }[] = []
      let pageCount = (draftRef.current ?? detail).pages.length
      // Validate the whole batch before inserting any pages into the working document.
      for (const upload of files) {
        const response = await MergePdfServices.prepareFile(upload.file, importMode === 'combined', upload.categoryId)
        const prepared = response.data.ResultOnDb[0]
        if (!response.data.Status || !prepared) throw new Error(response.data.Message)
        pageCount += prepared.pageCount
        if (pageCount > 500) throw new Error('Document exceeds 500 pages')
        preparedFiles.push({ upload, prepared })
      }
      let completed = 0
      try {
        for (const { upload, prepared } of preparedFiles) {
          const description = upload.description.trim() || null
          const { file } = upload
          const documentId = temporaryId.current--
          const documentCategory = importMode === 'combined' ? 10 : upload.categoryId
          const pages = Array.from({ length: prepared.pageCount }, (_, index) => ({
            PAGE_ID: temporaryId.current--,
            DOCUMENT_ID: documentId,
            SOURCE_PAGE_NUMBER: index + 1,
            SORT_ORDER: 0,
            ROTATION_DEGREES: 0,
            DESKEW_DEGREES: 0,
            CATEGORY_ID: prepared.classifications?.[index].categoryId ?? documentCategory,
            CLASSIFICATION_SOURCE: prepared.classifications?.[index].source ?? ('USER' as const),
            CLASSIFICATION_CONFIDENCE: prepared.classifications?.[index].confidence ?? null,
            DESCRIPTION: (prepared.classifications?.[index].categoryId ?? documentCategory) === 10 ? description : null
          }))
          setPendingUploads(current => ({
            ...current,
            [documentId]: { file, pdf: base64Pdf(prepared.pdf), thumbnails: prepared.thumbnails }
          }))
          await changeDraft(current => {
            const ordered = insertPagesByCategory(current.pages, pages, ranks)
            return {
              ...current,
              pages: ordered.map((page, index) => ({ ...page, SORT_ORDER: index + 1 })),
              documents: [
                ...current.documents,
                {
                  DOCUMENT_ID: documentId,
                  JOB_ID: current.job.JOB_ID,
                  CATEGORY_ID: documentCategory,
                  CATEGORY_NAME: categoryOption(documentCategory).label,
                  ORIGINAL_FILE_NAME: file.name,
                  SOURCE_TYPE: prepared.sourceType,
                  PDF_PAGE_COUNT: prepared.pageCount,
                  ENTRY_STATUS_CODE: prepared.entryStatusCode,
                  ENTRY_STATUS_SOURCE: prepared.entryStatusSource,
                  DESCRIPTION: pages.some(page => page.CATEGORY_ID === 10) ? description : null,
                  UPLOAD_ORDER: current.documents.length + 1
                }
              ],
              job: { ...current.job, PAGE_COUNT: ordered.length, DOCUMENT_COUNT: current.documents.length + 1 }
            }
          })
          completed++
        }
      } finally {
        const importedIds = new Set(preparedFiles.slice(0, completed).map(item => item.upload.id))
        setFiles(current => current.filter(file => !importedIds.has(file.id)))
        const input = document.getElementById('merge-pdf-file-input') as HTMLInputElement | null
        if (input) input.value = ''
      }
    })
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
      setCheckedPageIds([])
    })

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
      setCheckedPageIds([])
    })

  const updateCheckedPages = (action: Parameters<typeof MergePdfServices.batchPages>[3]) =>
    run(async () => {
      if (!detail || !activeCheckedIds.length) return
      firstDetail(
        await actions.batchPages.mutateAsync({
          jobId: detail.job.JOB_ID,
          rowVersion: detail.job.ROW_VERSION,
          pageIds: activeCheckedIds,
          action
        })
      )
      setCheckedPageIds([])
    })

  const sortByCategory = () => {
    if (!detail) return
    void run(async () => {
      const ranks = await loadCategoryRanks()
      const pageIds = sortPagesByCategory(detail.pages, ranks).map(page => page.PAGE_ID)
      firstDetail(
        await actions.reorder.mutateAsync({
          jobId: detail.job.JOB_ID,
          rowVersion: detail.job.ROW_VERSION,
          pageIds
        })
      )
      setCheckedPageIds([])
    })
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
    })
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
    })
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
      setCheckedPageIds([])
    })
  }

  const removePages = (ids: number[]) => {
    if (!detail || !ids.length) return
    void run(async () => {
      const updated = firstDetail(
        await actions.batchPages.mutateAsync({
          jobId: detail.job.JOB_ID,
          rowVersion: detail.job.ROW_VERSION,
          pageIds: ids,
          action: { kind: 'remove' }
        })
      )
      setCheckedPageIds([])
      if (selectedPage && ids.includes(selectedPage.PAGE_ID)) {
        const removed = new Set(ids)
        const nextIndex = detail.pages.slice(0, selectedPageIndex).filter(page => !removed.has(page.PAGE_ID)).length
        const next = updated.pages[Math.min(nextIndex, updated.pages.length - 1)]
        setSelectedPageId(next?.PAGE_ID ?? null)
        if (!next) setPreviewOpen(false)
      }
    })
  }

  const confirm = () =>
    run(
      async () => {
        if (!detail || confirmAction === null) return
        if (confirmAction.kind === 'complete') {
          firstDetail(await actions.complete.mutateAsync())
          closeEditor()
        } else {
          firstDetail(
            await actions.remove.mutateAsync({
              jobId: detail.job.JOB_ID,
              documentId: confirmAction.id,
              rowVersion: detail.job.ROW_VERSION
            })
          )
        }
        setConfirmAction(null)
      },
      confirmAction?.kind === 'complete' ? 'Merged PDF saved' : undefined
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
      const file =
        pendingUploads[documentId]?.file ?? (await MergePdfServices.source(detail.job.JOB_ID, documentId)).data
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    })

  const saveEntryStatus = (documentId: number) =>
    run(
      async () => {
        if (!detail) return
        firstDetail(
          await actions.updateEntryStatus.mutateAsync({
            jobId: detail.job.JOB_ID,
            documentId,
            rowVersion: detail.job.ROW_VERSION,
            statusCode:
              documentsById.get(documentId)?.ENTRY_STATUS_CODE === '04'
                ? null
                : '04'
          })
        )
        setCheckedPageIds([])
      },
      documentsById.get(documentId)?.ENTRY_STATUS_CODE === '04'
        ? 'Status 04 cleared in current edits. Save to apply.'
        : 'Status 04 confirmed in current edits. Save to apply.'
    )

  const detectImportTypes = async (uploads: ImportFile[]) => {
    // Process the queue sequentially to avoid parsing many large PDFs at once.
    for (const upload of uploads) {
      let categoryId = 10
      try {
        const response = await MergePdfServices.detectDocumentType(upload.file)
        const detected = response.data.ResultOnDb?.[0]
        if (response.data.Status && detected && categoryOptions.some(option => option.value === detected.categoryId)) {
          categoryId = detected.categoryId
        }
      } catch {
        // Detection is a suggestion; an unavailable reader must not block manual selection.
      }
      setFiles(current =>
        current.map(item =>
          item.id === upload.id && item.file === upload.file
            ? { ...item, categoryId: item.typeSelected ? item.categoryId : categoryId, isDetecting: false }
            : item
        )
      )
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept:
      importMode === 'combined'
        ? { 'application/pdf': ['.pdf'] }
        : {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/webp': ['.webp'],
            'image/tiff': ['.tif', '.tiff']
          },
    disabled: busy || !categories,
    multiple: true,
    onDrop: (acceptedFiles, fileRejections) => {
      if (acceptedFiles.length) {
        const uploads = acceptedFiles.map(file => ({
          id: nextImportFileId.current++,
          file,
          categoryId: 10,
          isDetecting: importMode === 'manual',
          typeSelected: false,
          description: ''
        }))
        setFiles(current => [...current, ...uploads])
        if (importMode === 'manual') void detectImportTypes(uploads)
      }
      if (fileRejections.length) {
        const names = fileRejections
          .slice(0, 3)
          .map(rejection => rejection.file.name)
          .join(', ')
        const remaining = fileRejections.length > 3 ? ` and ${fileRejections.length - 3} more` : ''
        ToastMessageError({
          message: `${names}${remaining} could not be added. ${
            importMode === 'combined' ? 'Only PDF files are supported.' : 'Use PDF, Excel or image files.'
          }`
        })
      }
    }
  })

  return (
    <Grid container spacing={6}>
      <Grid size={12} sx={{ display: 'flex', alignItems: 'center' }}>
        <DxBreadCrumbs menuName={MENU_NAME} breadcrumbNavigation={breadcrumbNavigation} />
      </Grid>
      <Grid size={12} sx={{ display: editorMode === null ? 'block' : 'none' }}>
        <MergePdfList
          onOpen={jobId => {
            if (!busy) startEditor(jobId)
          }}
          onAdd={createDraft}
          creatingDraft={busy && editorMode === null}
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
              {/* {editorMode} Merge PDF{detail ? ` · ${detail.job.JOB_TITLE}` : ''} */}
              {editorMode} Merge PDF{detail ? '' : ''}
            </Typography>
          </Box>
          <Stack spacing={6}>
            <Card>
              <CardHeader
                title={detail?.job.JOB_TITLE ?? 'Loading...'}
                titleTypographyProps={{ variant: 'h5' }}
                action={
                  detail && (
                    <Chip
                      size='small'
                      variant='tonal'
                      label={`Revision ${detail.job.REVISION_NO > 0 ? detail.job.REVISION_NO : '-'}`}
                    />
                  )
                }
              />
              <CardContent>
                <Grid container spacing={4} alignItems='flex-start'>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <CustomTextField
                      label='Document name (Auto)'
                      disabled
                      fullWidth
                      slotProps={{ input: { sx: { height: 44 } } }}
                      value={detail ? (/^I\d{2}-\d{4,}$/.test(detail.job.JOB_CODE) ? detail.job.JOB_CODE : detail.job.JOB_TITLE) : ''}
                    />
                  </Grid>
                  {currentPublication && (
                    <Grid size={{ xs: 12, md: 5 }} sx={{ alignSelf: 'flex-end' }}>
                      <Button
                        variant='outlined'
                        sx={{ height: 44 }}
                        disabled={busy}
                        onClick={() =>
                          void download(currentPublication.PUBLICATION_ID, currentPublication.OUTPUT_FILE_NAME)
                        }
                      >
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
                    {!categories && (
                      <Alert
                        severity={categoryQuery.isFetching ? 'info' : 'error'}
                        sx={{ mb: 3 }}
                        action={!categoryQuery.isFetching && <Button onClick={() => void categoryQuery.refetch()}>Retry</Button>}
                      >
                        {categoryQuery.isFetching ? 'Loading document types…' : 'Could not load document types.'}
                      </Alert>
                    )}
                    <Tabs
                      value={importMode}
                      aria-label='Import mode'
                      onChange={(_, value) => {
                        setImportMode(value)
                        setFiles([])
                      }}
                      sx={{ mb: 4 }}
                    >
                      <Tab value='manual' label='Choose document type' disabled={busy} />
                      <Tab value='combined' label='Combined file' disabled={busy} />
                    </Tabs>
                    <Stack spacing={4}>
                      <Box
                        {...getRootProps()}
                        sx={{
                          width: '100%',
                          minHeight: 148,
                          p: { xs: 3, sm: 4 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          border: '2px dashed',
                          borderColor: isDragActive ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          bgcolor: isDragActive ? 'action.hover' : 'background.default',
                          cursor: busy ? 'default' : 'pointer',
                          transition: theme =>
                            theme.transitions.create(['border-color', 'background-color', 'box-shadow']),
                          ...(isDragActive && { boxShadow: theme => `0 0 0 3px ${theme.palette.primary.main}22` }),
                          '&:hover': {
                            borderColor: busy ? 'divider' : 'primary.main',
                            bgcolor: busy ? 'background.default' : 'action.hover'
                          },
                          '&:focus-visible': {
                            outline: '2px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: 2
                          }
                        }}
                      >
                        <input {...getInputProps({ id: 'merge-pdf-file-input' })} />
                        <Stack spacing={1} alignItems='center'>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: '50%',
                              color: 'primary.main',
                              bgcolor: 'action.hover'
                            }}
                          >
                            <i className={isDragActive ? 'tabler-download' : 'tabler-cloud-upload'} />
                          </Box>
                          <Typography variant='subtitle1' fontWeight={600}>
                            {isDragActive
                              ? 'Drop files here'
                              : files.length
                                ? `${files.length} file(s) ready to import`
                                : 'Drag and drop files here'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {importMode === 'combined' ? 'PDF files only' : 'PDF, Excel or images'} · Click to browse
                          </Typography>
                        </Stack>
                      </Box>
                      {!!files.length && (
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                            <Typography variant='subtitle2'>Files to import ({files.length})</Typography>
                            <Stack direction='row' spacing={1} flexWrap='wrap'>
                              {importMode === 'manual' && presetNames.slice(0, files.length).some(Boolean) && (
                                <Tooltip title={presetNames.filter(Boolean).join(', ')}>
                                  <span>
                                    <Button
                                      size='small'
                                      disabled={busy}
                                      onClick={() =>
                                        setFiles(current =>
                                          current.map((file, index) =>
                                            presetNames[index]
                                              ? { ...file, categoryId: standardImportTypes[index], typeSelected: true, isDetecting: false }
                                              : file
                                          )
                                        )
                                      }
                                    >
                                      Set first 4 types
                                    </Button>
                                  </span>
                                </Tooltip>
                              )}
                              <Button size='small' color='inherit' disabled={busy} onClick={() => setFiles([])}>
                                Clear all
                              </Button>
                            </Stack>
                          </Box>
                          {files.map(upload => {
                            const showDescription = importMode === 'combined' ||
                              (upload.categoryId === 10 && (!upload.isDetecting || upload.typeSelected))
                            const extension = upload.file.name.split('.').pop()?.toUpperCase() ?? 'FILE'
                            const fileSize =
                              upload.file.size < 1024
                                ? `${upload.file.size} B`
                                : `${(upload.file.size / 1024 / 1024).toFixed(upload.file.size < 1024 * 1024 ? 1 : 2)} MB`
                            return (
                              <Box
                                key={upload.id}
                                sx={{
                                  p: 2,
                                  border: 1,
                                  borderColor: 'divider',
                                  borderRadius: 1.5,
                                  bgcolor: 'background.paper'
                                }}
                              >
                                <Grid container spacing={2} alignItems='center'>
                                  <Grid size={{ xs: 12, sm: showDescription ? 4 : importMode === 'manual' ? 5 : 8 }}>
                                    <Stack direction='row' spacing={2} alignItems='center' sx={{ minWidth: 0 }}>
                                      <Box
                                        sx={{
                                          width: 42,
                                          height: 42,
                                          flexShrink: 0,
                                          display: 'grid',
                                          placeItems: 'center',
                                          borderRadius: 1,
                                          color: 'primary.main',
                                          bgcolor: 'action.hover'
                                        }}
                                      >
                                        <i className='tabler-file-description' />
                                      </Box>
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                          variant='body2'
                                          fontWeight={600}
                                          title={upload.file.name}
                                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        >
                                          {upload.file.name}
                                        </Typography>
                                        <Typography variant='caption' color='text.secondary'>
                                          {extension} · {fileSize}
                                          {upload.isDetecting ? ' · Detecting type...' : ''}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Grid>
                                  <Grid
                                    size={{
                                      xs: showDescription ? 12 : 10,
                                      sm: showDescription ? 3 : importMode === 'manual' ? 6 : 3
                                    }}
                                  >
                                    {importMode === 'manual' ? (
                                      <SelectCustom
                                        inputId={`merge-pdf-document-type-${upload.id}`}
                                        name={`documentType-${upload.id}`}
                                        label='Document type'
                                        placeholder='Select ...'
                                        classNamePrefix='select'
                                        options={categoryOptions}
                                        value={categoryOptions.find(option => option.value === upload.categoryId)}
                                        isDisabled={busy}
                                        onChange={option => {
                                          if (option) {
                                            setFiles(current =>
                                              current.map(item =>
                                                item.id === upload.id
                                                  ? { ...item, categoryId: option.value, typeSelected: true }
                                                  : item
                                              )
                                            )
                                          }
                                        }}
                                      />
                                    ) : (
                                      <Chip
                                        size='small'
                                        variant='tonal'
                                        color='primary'
                                        label='Auto-detect page types'
                                      />
                                    )}
                                  </Grid>
                                  {showDescription && (
                                    <Grid size={{ xs: 10, sm: 4 }}>
                                      <CustomTextField
                                        id={`merge-pdf-import-description-${upload.id}`}
                                        label='Description (optional)'
                                        fullWidth
                                        placeholder={importMode === 'combined'
                                          ? `Applies to ${categoryOption(10).label} pages`
                                          : `Describe this ${categoryOption(10).label} document`}
                                        value={upload.description}
                                        disabled={busy}
                                        inputProps={{ maxLength: 1000 }}
                                        onChange={event => {
                                          const description = event.target.value
                                          setFiles(current =>
                                            current.map(item =>
                                              item.id === upload.id ? { ...item, description } : item
                                            )
                                          )
                                        }}
                                      />
                                    </Grid>
                                  )}
                                  <Grid size={{ xs: 2, sm: 1 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <IconButton
                                      aria-label={`Remove ${upload.file.name}`}
                                      disabled={busy}
                                      color='error'
                                      onClick={() => {
                                        setFiles(current => current.filter(item => item.id !== upload.id))
                                      }}
                                    >
                                      <i className='tabler-x' />
                                    </IconButton>
                                  </Grid>
                                </Grid>
                              </Box>
                            )
                          })}
                        </Stack>
                      )}
                      <Box>
                        <Button
                          variant='contained'
                          color='primary'
                          disabled={busy || !categories || !files.length || files.some(file => file.isDetecting)}
                          onClick={() => void importFiles()}
                        >
                          {busy ? 'Importing ...' : 'Import'}
                        </Button>
                      </Box>
                    </Stack>
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
                        disabled={busy || !categories || detail.pages.length < 2}
                        onClick={sortByCategory}
                      >
                        Sort by document type
                      </Button>
                    }
                  />
                  <CardContent>
                    <Box
                      sx={{
                        mb: 4,
                        position: { xs: 'static', md: 'sticky' },
                        top: 80,
                        bgcolor: 'background.paper',
                        zIndex: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={3}
                        sx={{ p: 3, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
                      >
                        <Stack direction='row' spacing={2} alignItems='flex-end'>
                          <CustomTextField
                            type='number'
                            label={`Go to page (1–${detail.pages.length})`}
                            placeholder='Page'
                            value={jumpPosition}
                            onChange={event => setJumpPosition(event.target.value)}
                            sx={{ width: 160 }}
                          />
                          <Button
                            variant='outlined'
                            sx={{ height: 40 }}
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
                        </Stack>
                        <Stack direction='row' spacing={1} alignItems='center' sx={{ flexWrap: 'wrap', gap: 1 }}>
                          <Chip
                            size='small'
                            variant='tonal'
                            color={activeCheckedIds.length ? 'primary' : 'secondary'}
                            label={`${activeCheckedIds.length} selected`}
                          />
                          <Button
                            size='small'
                            color='secondary'
                            disabled={busy || !detail.pages.length}
                            onClick={() => setCheckedPageIds(detail.pages.map(page => page.PAGE_ID))}
                          >
                            Select all
                          </Button>
                          <Button
                            size='small'
                            color='secondary'
                            disabled={busy || !activeCheckedIds.length}
                            onClick={() => setCheckedPageIds([])}
                          >
                            Clear
                          </Button>
                        </Stack>
                      </Stack>
                      {activeCheckedIds.length > 0 && (
                        <Box
                          sx={{
                            borderTop: 1,
                            borderColor: 'divider',
                            p: 3,
                            display: 'grid',
                            gridTemplateColumns: {
                              xs: '1fr',
                              md: '1fr 1fr',
                              xl: 'minmax(240px, 1fr) minmax(320px, 1.3fr) auto'
                            },
                            gap: 4,
                            alignItems: 'end'
                          }}
                        >
                          <Stack direction='row' spacing={2} alignItems='flex-end'>
                            <CustomTextField
                              type='number'
                              label={`Move to position (1–${maxBulkPosition})`}
                              placeholder='Position'
                              value={bulkPosition}
                              onChange={event => setBulkPosition(event.target.value)}
                              disabled={busy}
                              sx={{ flex: 1, minWidth: 120 }}
                            />
                            <Tooltip title='Start the selected pages at this position, keeping their current order.'>
                              <span>
                                <Button
                                  variant='contained'
                                  sx={{ height: 40 }}
                                  disabled={
                                    busy ||
                                    !Number.isInteger(Number(bulkPosition)) ||
                                    Number(bulkPosition) < 1 ||
                                    Number(bulkPosition) > maxBulkPosition
                                  }
                                  onClick={moveCheckedPages}
                                >
                                  Move
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                          <Stack direction='row' spacing={2} alignItems='flex-end'>
                            <Box sx={{ flex: 1, minWidth: 180 }}>
                              <SelectCustom
                                inputId='merge-pdf-batch-type'
                                name='batchType'
                                label='Change document type'
                                placeholder='Select ...'
                                classNamePrefix='select'
                                options={categoryOptions}
                                value={categoryOptions.find(option => option.value === batchCategoryId) ?? null}
                                isDisabled={busy}
                                onChange={option => setBatchCategoryId(option?.value ?? null)}
                              />
                            </Box>
                            <Button
                              variant='outlined'
                              sx={{ height: 40 }}
                              disabled={busy || batchCategoryId === null}
                              onClick={() =>
                                batchCategoryId !== null &&
                                void updateCheckedPages({ kind: 'category', categoryId: batchCategoryId })
                              }
                            >
                              Apply
                            </Button>
                          </Stack>
                          <Stack
                            direction='row'
                            spacing={2}
                            alignItems='center'
                            sx={{
                              gridColumn: { md: '1 / -1', xl: 'auto' },
                              justifyContent: { xs: 'flex-start', md: 'flex-end' }
                            }}
                          >
                            <Tooltip title='Rotate selected pages left'>
                              <span>
                                <IconButton
                                  aria-label='Rotate selected pages left'
                                  disabled={busy}
                                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, width: 40, height: 40 }}
                                  onClick={() => void updateCheckedPages({ kind: 'rotate', delta: 270 })}
                                >
                                  <i className='tabler-rotate-2' />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title='Rotate selected pages right'>
                              <span>
                                <IconButton
                                  aria-label='Rotate selected pages right'
                                  disabled={busy}
                                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, width: 40, height: 40 }}
                                  onClick={() => void updateCheckedPages({ kind: 'rotate', delta: 90 })}
                                >
                                  <i className='tabler-rotate-clockwise-2' />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Button
                              color='error'
                              variant='outlined'
                              sx={{ height: 40 }}
                              startIcon={<i className='tabler-trash' />}
                              disabled={busy}
                              onClick={() => removePages(activeCheckedIds)}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </Box>
                      )}
                    </Box>
                    <Typography variant='caption' color='text.secondary'>Drag across page previews to select multiple pages. Use the grip to reorder.</Typography>
                    {draggedPageId !== null && <GlobalStyles styles={{ '*': { cursor: 'move !important' } }} />}
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
                              localImage={pendingUploads[page.DOCUMENT_ID]?.thumbnails[page.SOURCE_PAGE_NUMBER - 1]}
                              selected={previewOpen && page.PAGE_ID === selectedPage?.PAGE_ID}
                              disabled={busy}
                              checked={activeCheckedIds.includes(page.PAGE_ID)}
                              onCheck={checked =>
                                setCheckedPageIds(ids =>
                                  checked ? [...ids, page.PAGE_ID] : ids.filter(id => id !== page.PAGE_ID)
                                )
                              }
                              onPaintStart={event => {
                                if (busy || event.button !== 0 || event.pointerType !== 'mouse') return
                                painted.current = false
                                paintGesture.current = { pointerId: event.pointerId, startId: page.PAGE_ID, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY }
                              }}
                              onSelect={() => {
                                if (painted.current) { painted.current = false; return }
                                setSelectedPageId(page.PAGE_ID)
                                setPreviewOpen(true)
                              }}
                              onRotate={delta => void rotatePage(page.PAGE_ID, delta)}
                              onRemove={() => removePages([page.PAGE_ID])}
                              onCategoryChange={categoryId => void changePageCategory(page.PAGE_ID, categoryId)}
                              categoryOptions={categoryOptions}
                              categoryValue={categoryOption(page.CATEGORY_ID)}
                            />
                          ))}
                        </Box>
                      </SortableContext>
                      <DragOverlay style={{ pointerEvents: 'none' }}>
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
                      {sourceDocuments.map(document => (
                        <Box
                          key={document.DOCUMENT_ID}
                          sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
                        >
                          <Typography sx={{ flex: 1, minWidth: 200, overflowWrap: 'anywhere' }}>
                            {categoryNames.get(document.CATEGORY_ID) ?? document.CATEGORY_NAME}:{' '}
                            <Button
                              disabled={busy}
                              onClick={() => void downloadSource(document.DOCUMENT_ID, document.ORIGINAL_FILE_NAME)}
                              aria-label={`Download ${document.ORIGINAL_FILE_NAME}`}
                              sx={{
                                p: 0,
                                minWidth: 0,
                                font: 'inherit',
                                verticalAlign: 'baseline',
                                display: 'inline',
                                textTransform: 'none',
                                textAlign: 'left',
                                overflowWrap: 'anywhere',
                                textDecoration: 'underline',
                                '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' }
                              }}
                            >
                              {document.ORIGINAL_FILE_NAME}
                            </Button>{' '}
                            ({document.PDF_PAGE_COUNT} page(s))
                            {document.ENTRY_STATUS_CODE === '04'
                              ? document.ENTRY_STATUS_SOURCE === 'DOCUMENT'
                                ? ' · Status 04 confirmed automatically'
                                : ' · Status 04 confirmed'
                              : ''}
                            {document.CATEGORY_ID === 10 && document.DESCRIPTION && (
                              <Typography
                                component='span'
                                variant='caption'
                                display='block'
                                sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                              >
                                {document.DESCRIPTION}
                              </Typography>
                            )}
                          </Typography>
                          {importEntryDocumentIds.has(document.DOCUMENT_ID) && (
                            <EntryStatusCheckbox
                              source={document}
                              disabled={busy}
                              onToggle={() => void saveEntryStatus(document.DOCUMENT_ID)}
                            />
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
            {detail && (
              <>
                <Typography variant='body2' sx={{ mr: 'auto' }}>
                  {detail.pages.length} pages ·{' '}
                  {hasCompleted ? 'Save Changes updates the shared PDF' : 'Changes are saved when you choose Save'}
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
      <Dialog
        open={previewOpen && !!selectedPage}
        onClose={(_, reason) => {
          if (!busy && reason !== 'backdropClick') setPreviewOpen(false)
        }}
        disableEscapeKeyDown={busy}
        TransitionComponent={Transition}
        fullWidth
        maxWidth={false}
        sx={{
          '& .MuiDialog-paper': { overflow: 'visible' },
          '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'center' }
        }}
        PaperProps={{ sx: { width: '96vw', maxWidth: 'none', maxHeight: '96vh', m: 1 } }}
      >
        <DialogTitle>
          <Typography variant='h5' component='span'>
            {selectedPage
              ? `Page ${selectedPage.SORT_ORDER} · ${documentsById.get(selectedPage.DOCUMENT_ID)?.ORIGINAL_FILE_NAME ?? ''}`
              : 'Page preview'}
          </Typography>
          <DialogCloseButton
            onClick={() => setPreviewOpen(false)}
            disabled={busy}
            aria-label='Close page preview'
            disableRipple
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent>
          {selectedPage && detail && (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 1 }}>
                <Box sx={{ maxHeight: '76vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {detail.pages.map(page => <PreviewThumbnail key={page.PAGE_ID} jobId={detail.job.JOB_ID} page={page}
                    localImage={pendingUploads[page.DOCUMENT_ID]?.thumbnails[page.SOURCE_PAGE_NUMBER - 1]}
                    selected={page.PAGE_ID === selectedPage.PAGE_ID} onClick={() => setSelectedPageId(page.PAGE_ID)} />)}
                </Box>
              </Grid>
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
                  <FitPagePreview
                    key={`${selectedPage.PAGE_ID}-${selectedPage.ROTATION_DEGREES}`}
                    pageNumber={selectedPage.SORT_ORDER}
                    previewUrl={previewUrl}
                    annotations={selectedPage.EDITOR_ANNOTATIONS ?? []}
                    coverClipboard={coverClipboard}
                    onAnnotationBusyChange={setBusy}
                    onAnnotationsChange={busy ? undefined : annotations => {
                      void changeDraft(current => ({ ...current, pages: current.pages.map(page =>
                        page.PAGE_ID === selectedPage.PAGE_ID ? { ...page, EDITOR_ANNOTATIONS: annotations } : page
                      ) }))
                    }}
                    visualDeskew={deskewInput.trim() !== '' && Number.isFinite(Number(deskewInput)) && Math.abs(Number(deskewInput)) <= 15
                      ? Number(deskewInput) - (selectedPage.DESKEW_DEGREES ?? 0) : 0}
                    stamp={selectedPageIndex === 0 ? {
                      name: detail.job.JOB_CODE,
                      coordinates: jobStampCoordinates(detail.job),
                      fontSize: detail.job.STAMP_FONT_SIZE ?? 10,
                      style: detail.job.STAMP_STYLE ?? undefined
                    } : undefined}
                    onStampStyleChange={busy ? undefined : fields => {
                      void changeDraft(current => ({
                        ...current,
                        job: { ...current.job, STAMP_STYLE: { ...current.job.STAMP_STYLE, ...fields } }
                      }))
                    }}
                    onStampSizeChange={busy ? undefined : (fontSize, coordinates) => {
                      void changeDraft(current => ({ ...current, job: {
                        ...current.job, STAMP_FONT_SIZE: fontSize,
                        ...(coordinates ? { STAMP_X: coordinates.x, STAMP_Y: coordinates.y } : {})
                      } }))
                    }}
                    onStampMove={busy ? undefined : coordinates => {
                      void changeDraft(current => ({ ...current, job: { ...current.job, STAMP_X: coordinates.x, STAMP_Y: coordinates.y } }))
                    }}
                  />
                ) : (
                  <Box
                    sx={{ height: '76vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <CircularProgress aria-label='Loading page preview' />
                  </Box>
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack spacing={3} sx={{ maxHeight: '76vh', overflowY: 'auto', pr: 1 }}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 3 }}>
                    <Stack spacing={3}>
                      <Typography variant='subtitle1' fontWeight={600}>Page details</Typography>
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
                  <Typography variant='body2' color='text.secondary'>
                    Source page {selectedPage.SOURCE_PAGE_NUMBER} · Rotation {selectedPage.ROTATION_DEGREES}°
                  </Typography>
                  {selectedPage.CATEGORY_ID === 10 && (
                    <CustomTextField
                      label='Page description (optional)'
                      fullWidth
                      multiline
                      minRows={3}
                      maxRows={6}
                      value={selectedPage.DESCRIPTION ?? ''}
                      disabled={busy}
                      inputProps={{ maxLength: 1000 }}
                      onChange={event => {
                        const value = event.target.value
                        void changeDraft(current => ({
                          ...current,
                          pages: current.pages.map(page =>
                            page.PAGE_ID === selectedPage.PAGE_ID ? { ...page, DESCRIPTION: value || null } : page
                          )
                        }))
                      }}
                    />
                  )}
                    </Stack>
                  </Box>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 3 }}>
                    <Stack spacing={3}>
                      <Typography variant='subtitle1' fontWeight={600}>Adjust page</Typography>
                  <Box>
                    <Stack spacing={2}>
                      <CustomTextField
                        fullWidth
                        type='number'
                        label='Deskew (degrees)'
                        value={deskewInput}
                        disabled={busy}
                        onChange={event => setDeskewInput(event.target.value)}
                        inputProps={{ min: -15, max: 15, step: 0.1 }}
                      />
                      <Stack direction='row' spacing={2}>
                      <Button
                        variant='contained'
                        sx={{ flex: 1 }}
                        disabled={busy || deskewInput.trim() === '' || !Number.isFinite(Number(deskewInput)) || Math.abs(Number(deskewInput)) > 15}
                        onClick={() => {
                          const angle = Number(deskewInput)
                          setCheckedPageIds([])
                          void changeDraft(current => ({
                            ...current,
                            pages: current.pages.map(page => page.PAGE_ID === selectedPage.PAGE_ID ? { ...page, DESKEW_DEGREES: angle } : page)
                          }))
                        }}
                      >
                        Apply
                      </Button>
                      <Button variant='outlined' sx={{ flex: 1 }} disabled={busy || (!(selectedPage.DESKEW_DEGREES ?? 0) && deskewInput === '0')} onClick={() => {
                        setDeskewInput('0')
                        setCheckedPageIds([])
                        void changeDraft(current => ({
                          ...current,
                          pages: current.pages.map(page => page.PAGE_ID === selectedPage.PAGE_ID ? { ...page, DESKEW_DEGREES: 0 } : page)
                        }))
                      }}>Reset</Button>
                      </Stack>
                    </Stack>
                    <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 1.5 }}>-15 to 15 degrees &middot; positive rotates left</Typography>
                  </Box>
                  <Stack direction='row' spacing={2}>
                    <Button
                      variant='outlined'
                      sx={{ flex: 1 }}
                      disabled={busy}
                      onClick={() => void rotatePage(selectedPage.PAGE_ID, 270)}
                    >
                      Rotate left
                    </Button>
                    <Button
                      variant='outlined'
                      sx={{ flex: 1 }}
                      disabled={busy}
                      onClick={() => void rotatePage(selectedPage.PAGE_ID, 90)}
                    >
                      Rotate right
                    </Button>
                  </Stack>
                    </Stack>
                  </Box>
                  <Stack direction='row' alignItems='center' sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {selectedPage.CATEGORY_ID === 1 && (
                      <EntryStatusCheckbox
                        source={documentsById.get(selectedPage.DOCUMENT_ID)}
                        disabled={busy}
                        onToggle={() => void saveEntryStatus(selectedPage.DOCUMENT_ID)}
                        confirmLabel='Confirm status 04'
                      />
                    )}
                    <Button
                      variant='text'
                      size='small'
                      color='error'
                      sx={{ ml: 'auto' }}
                      disabled={busy}
                      startIcon={<i className='tabler-trash' />}
                      onClick={() => removePages([selectedPage.PAGE_ID])}
                    >
                      Remove this page
                    </Button>
                  </Stack>
                  <SelectCustom
                    inputId='merge-pdf-page-type'
                    name='merge-pdf-page-type'
                    label='Page document type'
                    placeholder='Select ...'
                    classNamePrefix='select'
                    menuPlacement='auto'
                    options={categoryOptions}
                    value={
                      selectedPage.CLASSIFICATION_SOURCE === 'UNKNOWN'
                        ? null
                        : categoryOption(selectedPage.CATEGORY_ID)
                    }
                    isDisabled={busy || !categories}
                    onChange={option => {
                      if (option) void changePageCategory(selectedPage.PAGE_ID, option.value)
                    }}
                  />
                  <Stack direction='row' spacing={1} alignItems='center' aria-label='Page navigation'>
                    <Tooltip title='First page'>
                      <span><IconButton color='primary' aria-label='First page' disabled={busy || selectedPageIndex <= 0}
                        onClick={() => setSelectedPageId(detail.pages[0].PAGE_ID)}>
                        <i className='tabler-chevrons-left' />
                      </IconButton></span>
                    </Tooltip>
                    <Button
                      variant='contained'
                      fullWidth
                      disabled={busy || selectedPageIndex <= 0}
                      onClick={() => setSelectedPageId(detail.pages[selectedPageIndex - 1].PAGE_ID)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant='contained'
                      fullWidth
                      disabled={busy || selectedPageIndex >= detail.pages.length - 1}
                      onClick={() => setSelectedPageId(detail.pages[selectedPageIndex + 1].PAGE_ID)}
                    >
                      Next
                    </Button>
                    <Tooltip title='Last page'>
                      <span><IconButton color='primary' aria-label='Last page' disabled={busy || selectedPageIndex >= detail.pages.length - 1}
                        onClick={() => setSelectedPageId(detail.pages[detail.pages.length - 1].PAGE_ID)}>
                        <i className='tabler-chevrons-right' />
                      </IconButton></span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant='tonal' color='secondary' disabled={busy} onClick={() => setPreviewOpen(false)}>
            Save and Close
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmModal
        show={confirmAction !== null}
        onConfirmClick={() => void confirm()}
        onCloseClick={() => setConfirmAction(null)}
        isLoading={busy}
        isDelete={confirmAction?.kind !== 'complete'}
        confirmDisabled={confirmAction?.kind === 'complete' && !canComplete}
        title={confirmAction?.kind === 'complete' ? (hasCompleted ? 'Save Changes' : 'Save & Complete') : 'Remove document'}
        confirmLabel={
          confirmAction?.kind === 'complete' ? (hasCompleted ? 'Save Changes' : 'Save & Complete') : 'Remove'
        }
      />
    </Grid>
  )
}

export default MergePdfPage
