import { useEffect, useMemo, useState } from 'react'

import { Card, CardHeader, Chip } from '@mui/material'
import type {
  MRT_ColumnDef,
  MRT_ColumnFilterFnsState,
  MRT_ColumnFiltersState,
  MRT_ColumnOrderState,
  MRT_ColumnPinningState,
  MRT_DensityState,
  MRT_SortingState,
  MRT_VisibilityState
} from 'material-react-table'
import { useFormContext } from 'react-hook-form'
import { useUpdateEffect } from 'react-use'

import { useDxContext } from '@/_template/DxContextProvider'
import { DxMRTTable } from '@/_template/DxMRTTable'
import { useEarStatusSearch } from '@/_workspace/react-query/hooks/useEarStatus'
import type { EarStatusI } from '@/_workspace/types/trade-compliance/EarStatus'
import StatusColumn from '@/libs/material-react-table/components/StatusOption'

import ViewModal from './modal/ViewModal'

import type { FormDataPage } from './validationSchema'

const SearchResult = () => {
  const { isEnableFetching, setIsEnableFetching, pagination, setPagination } = useDxContext()
  const { getValues, setValue } = useFormContext<FormDataPage>()
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    getValues('searchResults.columnVisibility')
  )
  const [columnOrder, setColumnOrder] = useState<MRT_ColumnOrderState>(getValues('searchResults.columnOrder'))
  const [columnPinning, setColumnPinning] = useState<MRT_ColumnPinningState>(getValues('searchResults.columnPinning'))
  const [density, setDensity] = useState<MRT_DensityState>(getValues('searchResults.density'))
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(getValues('searchResults.columnFilters'))
  const [sorting, setSorting] = useState<MRT_SortingState>(getValues('searchResults.sorting'))
  const [columnFilterFns, setColumnFilterFns] = useState<MRT_ColumnFilterFnsState>(
    getValues('searchResults.columnFilterFns')
  )
  const [selected, setSelected] = useState<EarStatusI | null>(null)
  const searchFilters = getValues('searchFilters')
  const params = {
    SearchFilters: [
      { id: 'EAR_SURVEY_STATUS_NAME', value: searchFilters.earStatusName },
      { id: 'STATUS', value: searchFilters.status?.value ?? '' },
      { id: 'INCLUDING_CANCELLED', value: searchFilters.includingCancelled }
    ],
    ColumnFilters: columnFilters.map(item => ({
      columnFns: columnFilterFns[item.id],
      column: item.id,
      value: item.value
    })),
    Order: sorting,
    Start: pagination.pageIndex,
    Limit: pagination.pageSize
  }
  const { data, isError, isFetching, isLoading, isRefetching } = useEarStatusSearch(params, isEnableFetching)

  useEffect(() => {
    if (!isFetching) setIsEnableFetching(false)
  }, [isFetching, setIsEnableFetching])

  useUpdateEffect(
    () => setIsEnableFetching(true),
    [JSON.stringify([columnFilters, columnFilterFns, sorting, pagination])]
  )

  useEffect(() => {
    setValue('searchResults.columnFilters', columnFilters)
    setValue('searchResults.sorting', sorting)
    setValue('searchResults.density', density)
    setValue('searchResults.columnVisibility', columnVisibility)
    setValue('searchResults.columnPinning', columnPinning)
    setValue('searchResults.columnOrder', columnOrder)
    setValue('searchResults.columnFilterFns', columnFilterFns)
  }, [columnFilters, sorting, density, columnVisibility, columnPinning, columnOrder, columnFilterFns, setValue])

  const columns = useMemo<MRT_ColumnDef<EarStatusI>[]>(
    () => [
      {
        accessorKey: 'INUSE',
        header: 'STATUS',
        size: 140,
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          const status = StatusColumn.find(option => option.value === cell.getValue<number>())

          return <Chip size='small' color={status?.color ?? 'primary'} label={status?.label ?? '-'} variant='tonal' />
        }
      },
      // { size: 220, accessorKey: 'EAR_SURVEY_STATUS_CODE', header: 'EAR STATUS CODE', filterFn: 'contains' },
      { size: 180,accessorKey: 'EAR_SURVEY_STATUS_NAME', header: 'EAR STATUS', filterFn: 'contains'},
      { accessorKey: 'CREATE_DATE', header: 'CREATE DATE', filterFn: 'equals'},
      { accessorKey: 'CREATE_BY', header: 'CREATE BY', filterFn: 'contains'},
      { accessorKey: 'UPDATE_DATE', header: 'UPDATE DATE', filterFn: 'equals'},
      { accessorKey: 'UPDATE_BY', header: 'UPDATE BY', filterFn: 'contains'}
    ],
    []
  )

  return (
    <>
      <Card>
        <CardHeader title='Search result' />
        <DxMRTTable
          columns={columns}
          data={data?.data.ResultOnDb ?? []}
          onColumnFiltersChange={setColumnFilters}
          onColumnFilterFnsChange={setColumnFilterFns}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          onColumnVisibilityChange={setColumnVisibility}
          onDensityChange={setDensity}
          onColumnPinningChange={setColumnPinning}
          onColumnOrderChange={setColumnOrder}
          rowCount={data?.data.TotalCountOnDb ?? 0}
          state={{
            columnFilters,
            pagination,
            showAlertBanner: isError,
            isLoading,
            showProgressBars: isRefetching,
            sorting,
            density,
            columnVisibility,
            columnPinning,
            columnOrder,
            columnFilterFns
          }}
          isError={isError}
        />
      </Card>
      <ViewModal open={selected !== null} data={selected} onClose={() => setSelected(null)} />{' '}
    </>
  )
}

export default SearchResult
