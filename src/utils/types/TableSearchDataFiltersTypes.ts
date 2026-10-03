export interface TableSearchDataFiltersTypes {
  queryPageIndex: number
  queryPageSize: number
  totalCount?: number
  querySortBy: Array<{ id: string; desc: boolean }>
}
