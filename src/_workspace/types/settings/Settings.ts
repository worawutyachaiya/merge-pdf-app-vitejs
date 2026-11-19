export interface DocumentOrderCategory {
  CATEGORY_ID: number
  CATEGORY_NAME: string
  SORT_ORDER: number
  REVISION_NO: number
  IS_ENABLED: number
  REQUIRED_FOR_COMPLETE: number
}

export type DocumentOrderItem = { name: string; enabled: boolean } &
  ({ categoryId: number; revisionNo: number } | { categoryId: null })
