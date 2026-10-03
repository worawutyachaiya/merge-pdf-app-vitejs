import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { MergePdfServices } from '@/_workspace/services/merge-pdf/MergePdfServices'
import type { MergePdfDetail } from '@/_workspace/types/merge-pdf/MergePdf'
import type { ResultDataResponseI } from '@/libs/axios/types/AxiosResponseInterface'
import type { AxiosResponse } from 'axios'

const key = 'MERGE_PDF'
export const useMergePdfJobs = (params: Parameters<typeof MergePdfServices.list>[0], enabled = true) =>
  useQuery({
    queryKey: [key, 'jobs', params],
    queryFn: () => MergePdfServices.list(params),
    placeholderData: keepPreviousData,
    enabled
  })
export const useMergePdfDetail = (jobId: number | null) =>
  useQuery({
    queryKey: [key, 'detail', jobId],
    queryFn: () => MergePdfServices.detail(jobId ?? 0),
    enabled: jobId !== null
  })
export const useMergePdfPreview = (documentId: number | null) =>
  useQuery({
    queryKey: [key, 'preview', documentId],
    queryFn: () => MergePdfServices.preview(documentId ?? 0),
    enabled: documentId !== null,
    staleTime: 60_000
  })

export const useMergePdfActions = () => {
  const queryClient = useQueryClient()
  const accept = (response: AxiosResponse<ResultDataResponseI<MergePdfDetail>>) => {
    if (!response.data.Status || !response.data.ResultOnDb[0]) {
      throw new Error(response.data.Message || 'Merge PDF operation failed')
    }
    const detail = response.data.ResultOnDb[0]
    queryClient.setQueryData([key, 'detail', detail.job.JOB_ID], response)
    void queryClient.invalidateQueries({ queryKey: [key, 'jobs'] })
    return detail
  }
  return {
    create: useMutation({ mutationFn: MergePdfServices.create, onSuccess: accept }),
    saveDraft: useMutation({
      mutationFn: (input: { jobId: number; rowVersion: number; title: string; reference: string | null }) =>
        MergePdfServices.saveDraft(input.jobId, input.rowVersion, { title: input.title, reference: input.reference }),
      onSuccess: accept
    }),
    upload: useMutation({
      mutationFn: (input: {
        jobId: number
        rowVersion: number
        categoryId: number
        entryStatusCode: string | null
        file: File
      }) => MergePdfServices.upload(input.jobId, input.rowVersion, input.categoryId, input.entryStatusCode, input.file),
      onSuccess: accept
    }),
    combinedUpload: useMutation({
      mutationFn: (input: { jobId: number; rowVersion: number; file: File }) =>
        MergePdfServices.combinedUpload(input.jobId, input.rowVersion, input.file),
      onSuccess: accept
    }),
    updatePageCategory: useMutation({
      mutationFn: (input: { jobId: number; pageId: number; rowVersion: number; categoryId: number }) =>
        MergePdfServices.updatePageCategory(input.jobId, input.pageId, input.rowVersion, input.categoryId),
      onSuccess: accept
    }),
    rotatePage: useMutation({
      mutationFn: (input: { jobId: number; pageId: number; rowVersion: number; delta: 90 | 270 }) =>
        MergePdfServices.rotatePage(input.jobId, input.pageId, input.rowVersion, input.delta),
      onSuccess: accept
    }),
    removePage: useMutation({
      mutationFn: (input: { jobId: number; pageId: number; rowVersion: number }) =>
        MergePdfServices.removePage(input.jobId, input.pageId, input.rowVersion),
      onSuccess: accept
    }),
    remove: useMutation({
      mutationFn: (input: { jobId: number; documentId: number; rowVersion: number }) =>
        MergePdfServices.removeDocument(input.jobId, input.documentId, input.rowVersion),
      onSuccess: accept
    }),
    updateEntryStatus: useMutation({
      mutationFn: (input: { jobId: number; documentId: number; rowVersion: number; statusCode: string | null }) =>
        MergePdfServices.updateEntryStatus(input.jobId, input.documentId, input.rowVersion, input.statusCode),
      onSuccess: accept
    }),
    reorder: useMutation({
      mutationFn: (input: { jobId: number; rowVersion: number; pageIds: number[] }) =>
        MergePdfServices.reorder(input.jobId, input.rowVersion, input.pageIds),
      onSuccess: accept
    }),
    complete: useMutation({
      mutationFn: (input: { jobId: number; rowVersion: number }) =>
        MergePdfServices.complete(input.jobId, input.rowVersion),
      onSuccess: accept
    })
  }
}
