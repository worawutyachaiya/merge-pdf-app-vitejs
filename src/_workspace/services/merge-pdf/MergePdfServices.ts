import MergePdfAPI from '@/_workspace/api/merge-pdf/MergePdfAPI'
import type { MergePdfDetail, MergePdfForm, MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
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

export const MergePdfServices = {
  list: (params: {
    search: string
    status: 'ALL' | 'DRAFT' | 'COMPLETED'
    page: number
    pageSize: number
    titleFilter: string
    updateByFilter: string
    sortBy: 'JOB_TITLE' | 'STATUS' | 'DOCUMENT_COUNT' | 'PAGE_COUNT' | 'UPDATE_DATE' | 'UPDATE_BY'
    sortDesc: boolean
  }) =>
    axiosRequest<ResultDataResponseI<MergePdfJob>>({
      url: `${root}/jobs/search`,
      method: 'POST',
      data: params
    }),
  detail: (jobId: number) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/detail`,
      method: 'POST'
    }),
  create: (fields: MergePdfForm) =>
    auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/create`,
      method: 'POST',
      data: fields
    }),
  saveDraft: (jobId: number, rowVersion: number, fields: MergePdfForm) =>
    auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/save-draft`,
      method: 'POST',
      data: { ...fields, rowVersion }
    }),
  deleteDraft: (jobId: number, rowVersion: number) =>
    auditRequest<ResultDataResponseI<{ JOB_ID: number }>>({
      url: `${root}/jobs/${jobId}/delete-draft`,
      method: 'POST',
      data: { rowVersion }
    }),
  deleteJob: (jobId: number, rowVersion: number) =>
    auditRequest<ResultDataResponseI<{ JOB_ID: number }>>({
      url: `${root}/jobs/${jobId}/delete`, method: 'POST', data: { rowVersion }
    }),
  source: (jobId: number, documentId: number) =>
    axiosRequest<Blob>({
      url: `${root}/jobs/${jobId}/documents/${documentId}/source`, method: 'POST', responseType: 'blob'
    }),
  upload: (jobId: number, rowVersion: number, categoryId: number, entryStatusCode: string | null, file: File) => {
    const form = new FormData()
    form.append('rowVersion', String(rowVersion))
    form.append('categoryId', String(categoryId))
    if (entryStatusCode) form.append('entryStatusCode', entryStatusCode)
    form.append('file', file)
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/documents`,
      method: 'POST',
      data: form,
      // The shared client defaults to JSON; let the browser add the multipart boundary.
      headers: { 'Content-Type': false }
    })
  },
  combinedUpload: (jobId: number, rowVersion: number, file: File) => {
    const form = new FormData()
    form.append('rowVersion', String(rowVersion))
    form.append('file', file)
    return auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/combined-documents`,
      method: 'POST',
      data: form,
      headers: { 'Content-Type': false }
    })
  },
  updatePageCategory: (jobId: number, pageId: number, rowVersion: number, categoryId: number) =>
    auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/category`,
      method: 'POST',
      data: { rowVersion, categoryId }
    }),
  rotatePage: (jobId: number, pageId: number, rowVersion: number, delta: 90 | 270) =>
    auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/rotation`,
      method: 'POST',
      data: { rowVersion, delta }
    }),
  removePage: (jobId: number, pageId: number, rowVersion: number) =>
    auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/remove`,
      method: 'POST',
      data: { rowVersion }
    }),
  pagePreview: (jobId: number, pageId: number, signal?: AbortSignal) =>
    axiosRequest<Blob>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/preview`,
      method: 'POST',
      responseType: 'blob',
      signal
    }),
  pageThumbnail: (jobId: number, pageId: number, signal?: AbortSignal) =>
    axiosRequest<Blob>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/thumbnail`,
      method: 'POST',
      responseType: 'blob',
      signal
    }),
  removeDocument: (jobId: number, documentId: number, rowVersion: number) =>
    auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/documents/${documentId}/remove`,
      method: 'POST',
      data: { rowVersion }
    }),
  updateEntryStatus: (jobId: number, documentId: number, rowVersion: number, statusCode: string | null) =>
    auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/documents/${documentId}/status`,
      method: 'POST',
      data: { rowVersion, statusCode }
    }),
  reorder: (jobId: number, rowVersion: number, pageIds: number[]) =>
    auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/reorder`,
      method: 'POST',
      data: { rowVersion, pageIds }
    }),
  complete: (jobId: number, rowVersion: number, fields?: MergePdfForm) =>
    auditRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/complete`,
      method: 'POST',
      data: { rowVersion, fields }
    }),
  preview: (documentId: number) =>
    axiosRequest<Blob>({
      url: `${root}/documents/${documentId}/preview`,
      method: 'POST',
      responseType: 'blob'
    }),
  download: (jobId: number, publicationId: number, signal?: AbortSignal) =>
    axiosRequest<Blob>({
      url: `${root}/jobs/${jobId}/publications/${publicationId}/pdf`,
      method: 'POST',
      responseType: 'blob',
      signal
    })
}
