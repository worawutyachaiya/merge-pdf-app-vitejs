import type { MRT_ColumnFilterFnsState, MRT_ColumnFiltersState, MRT_FilterOption } from 'material-react-table'

export interface SearchResultTableI {
  queryPageIndex: number
  queryPageSize: number
  totalCount: number
  querySortBy: Array<{ id: string; desc: boolean }>
  withRowBorders: boolean
  withTableBorder: boolean
  withColumnBorders: boolean
  striped: boolean
}

export interface ParamApiSearchResultTableI {
  queryPageIndex: number
  queryPageSize: number
  querySortBy: Array<{ id: string; desc: boolean }>
  queryColumnFilterFns: MRT_ColumnFilterFnsState
  queryColumnFilters: MRT_ColumnFiltersState
  SearchFilters: Array<{ id: string; value: unknown }>
  ColumnFilters: Array<{ columnFns: MRT_FilterOption; column: string; value: unknown }>
  Start: number
  Limit: number
  Order: Array<{ id: string; desc: boolean }>
  INUSE?: number | null
  CREATE_BY?: string
  CREATE_DATE?: string
  DESCRIPTION?: string
  UPDATE_BY?: string
  UPDATE_DATE?: string
  inuseForSearch?: number | string
}
export interface ParamApiSearchResultTableI_V2 {
  // queryPageIndex: number
  // queryPageSize: number
  // querySortBy: Array<{ id: string; desc: boolean }>
  // queryColumnFilterFns: MRT_ColumnFilterFnsState
  // ColumnFilterFns: MRT_ColumnFilterFnsState
  // ColumnFilters: MRT_ColumnFiltersState

  ColumnFilters: Array<{ columnFns: MRT_FilterOption; column: string; value: unknown }>
  SearchFilters: Array<{ id: string; value: unknown }>

  // .map(item => ({
  //   columnFns: queryColumnFilterFns[item.id],
  //   column: item.id.replaceAll('MODIFIED_DATE', 'UPDATE_DATE').replaceAll('inuseForSearch', 'INUSE'),
  //   value: item.value
  // })

  Start: number
  Limit: number
  Order: Array<{ id: string; desc: boolean }>

  INUSE?: number | null
  CREATE_BY?: string
  CREATE_DATE?: string
  DESCRIPTION?: string
  UPDATE_BY?: string
  UPDATE_DATE?: string

  inuseForSearch?: number | string
}
