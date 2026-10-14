import { MERGE_PDF_CATEGORIES } from '@/_workspace/types/merge-pdf/MergePdf'

export const documentStatusColumns = [
  { categoryId: 1, label: 'ใบขน' },
  { categoryId: 2, label: 'Inv' },
  { categoryId: 3, label: 'P.L' },
  { categoryId: 4, label: 'HAWB' },
  { categoryId: 7, label: 'ใบเสร็จ' },
  { categoryId: 6, label: 'TISI' },
  { categoryId: 5, label: 'MAWB' },
  { categoryId: 8, label: 'D.O' },
  { categoryId: 9, label: 'D.N' },
  { categoryId: 10, label: 'Other' }
].map(column => ({
  ...column,
  id: `DOC_CATEGORY_${column.categoryId}`,
  name: MERGE_PDF_CATEGORIES.find(category => category.id === column.categoryId)!.name
}))

export const documentStatusColumnIds = documentStatusColumns.map(column => column.id)
