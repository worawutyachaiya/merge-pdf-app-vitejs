import MergePdfAPI from '@/_workspace/api/merge-pdf/MergePdfAPI'
import type { MergePdfDetail, MergePdfForm, MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import axiosRequest from '@/libs/axios/axiosRequest'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'

const root = MergePdfAPI.API_ROOT_URL
const directRoot = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}${root}`

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
      url: `${root}/jobs`,
      method: 'GET',
      params
    }),
  detail: (jobId: number) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}`,
      method: 'GET'
    }),
  create: (fields: MergePdfForm) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs`,
      method: 'POST',
      data: fields
    }),
  saveDraft: (jobId: number, rowVersion: number, fields: MergePdfForm) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}`,
      method: 'PATCH',
      data: { ...fields, rowVersion }
    }),
  upload: (jobId: number, rowVersion: number, categoryId: number, entryStatusCode: string | null, file: File) => {
    const form = new FormData()
    form.append('rowVersion', String(rowVersion))
    form.append('categoryId', String(categoryId))
    if (entryStatusCode) form.append('entryStatusCode', entryStatusCode)
    form.append('file', file)
    return axiosRequest<ResultDataResponseI<MergePdfDetail>>({
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
    return axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/combined-documents`,
      method: 'POST',
      data: form,
      headers: { 'Content-Type': false }
    })
  },
  updatePageCategory: (jobId: number, pageId: number, rowVersion: number, categoryId: number) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/category`,
      method: 'PATCH',
      data: { rowVersion, categoryId }
    }),
  rotatePage: (jobId: number, pageId: number, rowVersion: number, delta: 90 | 270) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/${pageId}/rotation`,
      method: 'PATCH',
      data: { rowVersion, delta }
    }),
  removePage: (jobId: number, pageId: number, rowVersion: number) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages/${pageId}`,
      method: 'DELETE',
      data: { rowVersion }
    }),
  pagePreviewUrl: (jobId: number, pageId: number, rotationDegrees: number) =>
    `${directRoot}/jobs/${jobId}/pages/${pageId}/preview?rotation=${rotationDegrees}`,
  pageThumbnailUrl: (jobId: number, pageId: number, rotationDegrees: number) =>
    `${directRoot}/jobs/${jobId}/pages/${pageId}/thumbnail?rotation=${rotationDegrees}`,
  removeDocument: (jobId: number, documentId: number, rowVersion: number) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/documents/${documentId}`,
      method: 'DELETE',
      data: { rowVersion }
    }),
  updateEntryStatus: (jobId: number, documentId: number, rowVersion: number, statusCode: string | null) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/documents/${documentId}/status`,
      method: 'PATCH',
      data: { rowVersion, statusCode }
    }),
  reorder: (jobId: number, rowVersion: number, pageIds: number[]) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/pages`,
      method: 'PUT',
      data: { rowVersion, pageIds }
    }),
  complete: (jobId: number, rowVersion: number) =>
    axiosRequest<ResultDataResponseI<MergePdfDetail>>({
      url: `${root}/jobs/${jobId}/complete`,
      method: 'POST',
      data: { rowVersion }
    }),
  preview: (documentId: number) =>
    axiosRequest<Blob>({
      url: `${root}/documents/${documentId}/preview`,
      method: 'GET',
      responseType: 'blob'
    }),
  download: (jobId: number, publicationId: number) =>
    axiosRequest<Blob>({
      url: `${root}/jobs/${jobId}/publications/${publicationId}/pdf`,
      method: 'GET',
      responseType: 'blob'
    })
}
