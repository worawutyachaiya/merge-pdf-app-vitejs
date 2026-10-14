import type { BatchPageAction, MergePdfDetail } from '@/_workspace/types/merge-pdf/MergePdf'

export const updateDraftPages = (detail: MergePdfDetail, ids: number[], action: BatchPageAction): MergePdfDetail => {
  const selected = new Set(ids)
  const pages = detail.pages
    .filter(page => action.kind !== 'remove' || !selected.has(page.PAGE_ID))
    .map(page => {
      if (!selected.has(page.PAGE_ID)) return page
      if (action.kind === 'category')
        return {
          ...page,
          CATEGORY_ID: action.categoryId,
          CLASSIFICATION_SOURCE: 'USER' as const,
          CLASSIFICATION_CONFIDENCE: null
        }
      if (action.kind === 'rotate') return { ...page, ROTATION_DEGREES: (page.ROTATION_DEGREES + action.delta) % 360 }
      return page
    })
    .map((page, index) => ({ ...page, SORT_ORDER: index + 1 }))
  const documents = detail.documents
    .filter(doc => pages.some(page => page.DOCUMENT_ID === doc.DOCUMENT_ID))
    .map(doc =>
      pages.some(page => page.DOCUMENT_ID === doc.DOCUMENT_ID && page.CATEGORY_ID === 1)
        ? doc
        : { ...doc, ENTRY_STATUS_CODE: null, ENTRY_STATUS_SOURCE: null }
    )
  return {
    ...detail,
    pages,
    documents,
    job: { ...detail.job, PAGE_COUNT: pages.length, DOCUMENT_COUNT: documents.length }
  }
}

export const reorderDraftPages = (detail: MergePdfDetail, ids: number[]): MergePdfDetail => ({
  ...detail,
  pages: ids.map((id, index) => ({ ...detail.pages.find(page => page.PAGE_ID === id)!, SORT_ORDER: index + 1 }))
})

export const base64Pdf = (base64: string): Blob => {
  const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0))
  return new Blob([bytes], { type: 'application/pdf' })
}
