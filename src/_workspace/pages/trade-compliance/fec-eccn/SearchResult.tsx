import { useEffect, useMemo, useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import { Button, Card, CardHeader, Chip } from '@mui/material'
import type {
  MRT_ColumnDef,
  MRT_ColumnFilterFnsState,
  MRT_ColumnFiltersState,
  MRT_ColumnOrderState,
  MRT_ColumnPinningState,
  MRT_DensityState,
  MRT_Row,
  MRT_SortingState,
  MRT_VisibilityState
} from 'material-react-table'
import { useFormContext } from 'react-hook-form'
import { useUpdateEffect } from 'react-use'

import ActionsMenu from '@/libs/material-react-table/components/ActionsMenu'
import StatusColumn from '@/libs/material-react-table/components/StatusOption'
import { useCheckPermission } from '@/_template/CheckPermission'
import { useDxContext } from '@/_template/DxContextProvider'
import { DxMRTTable } from '@/_template/DxMRTTable'
import { useFecEccnSearch } from '@/_workspace/react-query/hooks/useFecEccn'
import type { FecEccnI } from '@/_workspace/types/trade-compliance/FecEccn'

import { MENU_ID } from './env'
import AddEditViewModal from './modal/AddEditViewModal'
import DeleteModal from './modal/DeleteModal'
import type { FormDataPage } from './validationSchema'

const SearchResult = () => {
  const { isEnableFetching, setIsEnableFetching, pagination, setPagination } = useDxContext()
  const { getValues, setValue } = useFormContext<FormDataPage>()
  const checkPermission = useCheckPermission()
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(getValues('searchResults.columnVisibility'))
  const [columnOrder, setColumnOrder] = useState<MRT_ColumnOrderState>(getValues('searchResults.columnOrder'))
  const [columnPinning, setColumnPinning] = useState<MRT_ColumnPinningState>(getValues('searchResults.columnPinning'))
  const [density, setDensity] = useState<MRT_DensityState>(getValues('searchResults.density'))
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(getValues('searchResults.columnFilters'))
  const [sorting, setSorting] = useState<MRT_SortingState>(getValues('searchResults.sorting'))
  const [columnFilterFns, setColumnFilterFns] = useState<MRT_ColumnFilterFnsState>(getValues('searchResults.columnFilterFns'))
  const [rowSelected, setRowSelected] = useState<MRT_Row<FecEccnI> | null>(null)
  const [openFormModal, setOpenFormModal] = useState(false)
  const [formMode, setFormMode] = useState<'Add' | 'Edit' | 'View'>('View')
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const searchFilters = getValues('searchFilters')
  const params = {
    SearchFilters: [
      { id: 'FEC_ECCN_FULL_CODE', value: searchFilters.fecEccn },
      { id: 'STATUS', value: searchFilters.status?.value ?? '' },
      { id: 'INCLUDING_CANCELLED', value: searchFilters.includingCancelled }
    ],
    ColumnFilters: columnFilters.map(item => ({ columnFns: columnFilterFns[item.id], column: item.id, value: item.value })),
    Order: sorting,
    Start: pagination.pageIndex,
    Limit: pagination.pageSize
  }
  const { data, isError, isFetching, isLoading, isRefetching } = useFecEccnSearch(params, isEnableFetching)

  useEffect(() => {
    if (!isFetching) setIsEnableFetching(false)
  }, [isFetching, setIsEnableFetching])

  useUpdateEffect(() => setIsEnableFetching(true), [JSON.stringify([columnFilters, columnFilterFns, sorting, pagination])])

  useEffect(() => {
    setValue('searchResults.columnFilters', columnFilters)
    setValue('searchResults.sorting', sorting)
    setValue('searchResults.density', density)
    setValue('searchResults.columnVisibility', columnVisibility)
    setValue('searchResults.columnPinning', columnPinning)
    setValue('searchResults.columnOrder', columnOrder)
    setValue('searchResults.columnFilterFns', columnFilterFns)
  }, [columnFilters, sorting, density, columnVisibility, columnPinning, columnOrder, columnFilterFns, setValue])

  const openView = (row: MRT_Row<FecEccnI>) => {
    setRowSelected(row)
    setFormMode('View')
    setOpenFormModal(true)
  }

  const openAdd = () => {
    if (checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_CREATE')) {
      setRowSelected(null)
      setFormMode('Add')
      setOpenFormModal(true)
    }
  }

  const columns = useMemo<MRT_ColumnDef<FecEccnI>[]>(
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
      { accessorKey: 'FEC_ECCN_CODE', header: 'FEC ECCN CODE', filterFn: 'contains', size: 180 },
      { accessorKey: 'FEC_ECCN_SUB_CODE', header: 'FEC ECCN SUB CODE', filterFn: 'contains', size: 210 },
      { accessorKey: 'FEC_ECCN_FULL_CODE', header: 'FEC ECCN FULL CODE', filterFn: 'contains', size: 210 },
      { accessorKey: 'CREATE_DATE', header: 'CREATE DATE', filterFn: 'equals', size: 200 },
      { accessorKey: 'CREATE_BY', header: 'CREATE BY', filterFn: 'contains', size: 160 },
      { accessorKey: 'UPDATE_DATE', header: 'UPDATE DATE', filterFn: 'equals', size: 200 },
      { accessorKey: 'UPDATE_BY', header: 'UPDATE BY', filterFn: 'contains', size: 160 }
    ],
    []
  )

  return (
    <>
      <Card>
        <CardHeader
          title='Search result'
          action={
            <Button variant='contained' color='success' startIcon={<AddIcon />} onClick={openAdd} className='rounded-3xl'>
              Add New
            </Button>
          }
        />
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
          state={{ columnFilters, pagination, showAlertBanner: isError, isLoading, showProgressBars: isRefetching, sorting, density, columnVisibility, columnPinning, columnOrder, columnFilterFns }}
          isError={isError}
          renderRowActions={({ row }) => (
            <ActionsMenu
              row={row}
              setOpenModalEdit={open => { setRowSelected(row); setFormMode('Edit'); setOpenFormModal(open) }}
              setOpenModalDelete={setOpenDeleteModal}
              rowSelected={rowSelected}
              setRowSelected={setRowSelected}
              MENU_ID={MENU_ID}
              isNeedEdit
              isNeedDelete
              isNeedViewEyeIcon
              handleClickOpenModalView={openView}
            />
          )}
        />
      </Card>
      {openFormModal && (
        <AddEditViewModal
          open
          mode={formMode}
          rowSelected={rowSelected}
          onClose={() => { setOpenFormModal(false); setRowSelected(null) }}
        />
      )}
      {openDeleteModal && (
        <DeleteModal
          open
          rowSelected={rowSelected}
          onClose={() => { setOpenDeleteModal(false); setRowSelected(null) }}
        />
      )}
    </>
  )
}

export default SearchResult
