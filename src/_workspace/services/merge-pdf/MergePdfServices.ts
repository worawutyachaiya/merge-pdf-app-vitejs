import MergePdfAPI from '@/_workspace/api/merge-pdf/MergePdfAPI'
import type { BatchPageAction, MergePdfDetail, MergePdfForm, MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

const root = MergePdfAPI.API_ROOT_URL

const auditRequest = <T>(options: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  const user = getUserData()
  const employeeCode = String(user.EMPLOYEE_CODE ?? '').trim()
  if (!String(user.USER_ID ?? '').trim() || !employeeCode || employeeCode.length > 30) {
    return Promise.reject(new Error('Employee code is missing. Please sign in again.'))
  }
  if (options.data instanceof FormData) {
    options.data.set('CREATE_BY', employeeCode)
    options.data.set('UPDATE_BY', employeeCode)
    return axiosRequest<T>(options)
  }
  return axiosRequest<T>({ ...options, data: { ...options.data, CREATE_BY: employeeCode, UPDATE_BY: employeeCode } })
}

export default class MergePdfServices {
  static detectDocumentType(file: File) {
    const data = new FormData()
    data.append('file', file)
    data.append('fileName', file.name)
    return auditRequest<
      ResultDataResponseI<{
        categoryId: number
        source: 'FILENAME' | 'AUTO_TEXT' | 'UNKNOWN'
        confidence: number | null
      }>
    >({
      url: `${root}/editor/detect-document-type`,
      method: 'POST',
      data,
      headers: { 'Content-Type': false }
    })
  }

  static prepareFile(file: File, combined: boolean, categoryId = 10) {
    const data = new FormData()
    data.append('file', file)
    data.append('combined', String(combined))
    data.append('categoryId', String(categoryId))
    return auditRequest<
      ResultDataResponseI<{
        sourceType: 'PDF' | 'EXCEL' | 'IMAGE'
        pageCount: number
        pdf: string
        thumbnails: string[]
        classifications: { categoryId: number; source: 'AUTO_TEXT' | 'UNKNOWN'; confidence: number | null }[] | null
        entryStatusCode: '04' | null
        entryStatusSource: 'DOCUMENT' | null
      }>
    >({
      url: `${root}/editor/prepare`,
      method: 'POST',
      data,
      headers: { 'Content-Type': false }
    })
  }

  static preparedPagePreview(file: Blob, page: number, rotation: number, deskew: number, signal?: AbortSignal) {
    const data = new FormData()
    data.append('file', file, 'preview.pdf')
    data.append('page', String(page))
    data.append('rotation', String(rotation))
    data.append('deskew', String(deskew))
    return auditRequest<Blob>({
      url: `${root}/editor/page-preview`,
      method: 'POST',
      data,
      headers: { 'Content-Type': false },
      responseType: 'blob',
      signal
    })
  }

  static saveEditor(jobId: number, rowVersion: number, changes: unknown, files: File[], mode: 'draft' | 'complete') {
    const data = new FormData()
    data.append('payload', JSON.stringify({ rowVersion, changes }))
    files.forEach(file => data.append('files', file))
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/editor/${mode}`,
      method: 'POST',
      data,
      headers: { 'Content-Type': false }
    })
  }

  static nextCode(month?: string) {
    return axiosRequest<ResultDataResponseI<{ code: string }>>({ url: `${root}/jobs/next-code`, params: { month }, method: 'GET' })
  }

  static batchPages(jobId: number, rowVersion: number, pageIds: number[], action: BatchPageAction) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/batch`,
      method: 'PATCH',
      data: { rowVersion, pageIds, action }
    })
  }

  static list(params: {
    search: string
    status: 'ALL' | 'DRAFT' | 'COMPLETED'
    page: number
    pageSize: number
    titleFilter: string
    updateByFilter: string
    sortBy: 'JOB_TITLE' | 'STATUS' | 'DOCUMENT_COUNT' | 'PAGE_COUNT' | 'UPDATE_DATE' | 'UPDATE_BY'
    sortDesc: boolean
  }) {
    return axiosRequest<ResultDataResponseI<MergePdfJob>>({
      url: `${root}/jobs/search`,
      method: 'POST',
      data: params
    })
  }

  static detail(jobId: number) {
    return axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/detail`,
      method: 'GET'
    })
  }

  static create(fields: MergePdfForm) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/create`,
      method: 'POST',
      data: fields
    })
  }

  static saveDraft(jobId: number, rowVersion: number, fields: MergePdfForm) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/save-draft`,
      method: 'PATCH',
      data: { ...fields, rowVersion }
    })
  }

  static deleteDraft(jobId: number, rowVersion: number) {
    return auditRequest<ResultDataResponseI<{ JOB_ID: number }>>({
      url: `${root}/jobs/${jobId}/delete-draft`,
      method: 'DELETE',
      data: { rowVersion }
    })
  }

  static deleteJob(jobId: number, rowVersion: number) {
    return auditRequest<ResultDataResponseI<{ JOB_ID: number }>>({
      url: `${root}/jobs/${jobId}/delete`,
      method: 'DELETE',
      data: { rowVersion }
    })
  }

  static source(jobId: number, documentId: number) {
    return axiosRequest<Blob>({
      url: `${root}/jobs/${jobId}/documents/${documentId}/source`,
      method: 'GET',
      responseType: 'blob'
    })
  }

  static upload(
    jobId: number,
    rowVersion: number,
    categoryId: number,
    entryStatusCode: string | null,
    file: File,
    description?: string
  ) {
    const form = new FormData()
    form.append('rowVersion', String(rowVersion))
    form.append('categoryId', String(categoryId))
    if (entryStatusCode) form.append('entryStatusCode', entryStatusCode)
    if (description) form.append('description', description)
    form.append('file', file)
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/documents`,
      method: 'POST',
      data: form,
      // The shared client defaults to JSON; let the browser add the multipart boundary.
      headers: { 'Content-Type': false }
    })
  }

  static combinedUpload(jobId: number, rowVersion: number, file: File, description?: string) {
    const form = new FormData()
    form.append('rowVersion', String(rowVersion))
    if (description) form.append('description', description)
    form.append('file', file)
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/combined-documents`,
      method: 'POST',
      data: form,
      headers: { 'Content-Type': false }
    })
  }

  static updatePageCategory(jobId: number, pageId: number, rowVersion: number, categoryId: number) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/category`,
      method: 'PATCH',
      data: { rowVersion, categoryId }
    })
  }

  static rotatePage(jobId: number, pageId: number, rowVersion: number, delta: 90 | 270) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/rotation`,
      method: 'PATCH',
      data: { rowVersion, delta }
    })
  }

  static removePage(jobId: number, pageId: number, rowVersion: number) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/remove`,
      method: 'DELETE',
      data: { rowVersion }
    })
  }

  static pagePreview(jobId: number, pageId: number, signal?: AbortSignal, rotation?: number, deskew?: number) {
    return axiosRequest<Blob>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/preview`,
      method: 'POST',
      responseType: 'blob',
      signal,
      data: { rotation, deskew }
    })
  }

  static pageThumbnail(jobId: number, pageId: number, signal?: AbortSignal, rotation?: number) {
    return axiosRequest<Blob>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/thumbnail`,
      method: 'POST',
      responseType: 'blob',
      signal,
      data: { rotation }
    })
  }

  static removeDocument(jobId: number, documentId: number, rowVersion: number) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/documents/${documentId}/remove`,
      method: 'DELETE',
      data: { rowVersion }
    })
  }

  static updateEntryStatus(jobId: number, documentId: number, rowVersion: number, statusCode: string | null) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/documents/${documentId}/status`,
      method: 'PATCH',
      data: { rowVersion, statusCode }
    })
  }

  static reorder(jobId: number, rowVersion: number, pageIds: number[]) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/reorder`,
      method: 'PATCH',
      data: { rowVersion, pageIds }
    })
  }

  static complete(jobId: number, rowVersion: number, fields?: MergePdfForm) {
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/complete`,
      method: 'POST',
      data: { rowVersion, fields }
    })
  }

  static preview(documentId: number) {
    return axiosRequest<Blob>({
      url: `${root}/documents/${documentId}/preview`,
      method: 'GET',
      responseType: 'blob'
    })
  }

  static download(jobId: number, publicationId: number, signal?: AbortSignal) {
    return axiosRequest<Blob>({
      url: `${root}/jobs/${jobId}/publications/${publicationId}/pdf`,
      method: 'GET',
      responseType: 'blob',
      signal
    })
  }
}
