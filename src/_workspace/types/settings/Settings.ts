export interface DocumentOrderCategory {
  CATEGORY_ID: number
  CATEGORY_NAME: string
  SORT_ORDER: number
  REVISION_NO: number
}

export interface DocumentOrderItem {
  categoryId: number
  revisionNo: number
}
