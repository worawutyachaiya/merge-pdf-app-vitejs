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

import { useCheckPermission } from '@/_template/CheckPermission'
import { useDxContext } from '@/_template/DxContextProvider'
import { DxMRTTable } from '@/_template/DxMRTTable'
import { useMergePdfJobs } from '@/_workspace/react-query/hooks/useMergePdf'
import type { MergePdfJob } from '@/_workspace/types/merge-pdf/MergePdf'
import ActionsMenu from '@/libs/material-react-table/components/ActionsMenu'

import { MENU_ID } from './env'
import MergePdfDeleteModal from './MergePdfDeleteModal'
import MergePdfViewModal from './MergePdfViewModal'
import type { MergePdfListValues } from './validationSchema'

interface Props {
  onOpen: (jobId: number) => void
  onAdd: () => void
  refreshVersion: number
}

const MergePdfSearchResult = ({ onOpen, onAdd, refreshVersion }: Props) => {
  const { isEnableFetching, setIsEnableFetching, pagination, setPagination } = useDxContext()
  const { getValues, setValue } = useFormContext<MergePdfListValues>()
  const checkPermission = useCheckPermission()
  const [openView, setOpenView] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [rowSelected, setRowSelected] = useState<MRT_Row<MergePdfJob> | null>(null)
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

  useEffect(() => {
    setPagination(previous => ({ ...previous, pageSize: getValues('searchResults.pageSize') }))
  }, [getValues, setPagination])
  useUpdateEffect(() => setValue('searchResults.pageSize', pagination.pageSize), [pagination.pageSize, setValue])

  const filters = getValues('searchFilters')
  const titleFilter = String(columnFilters.find(filter => filter.id === 'JOB_TITLE')?.value ?? '')
  const updateByFilter = String(columnFilters.find(filter => filter.id === 'UPDATE_BY')?.value ?? '')
  const firstSort = sorting[0]
  const sortableColumns = ['JOB_TITLE', 'STATUS', 'DOCUMENT_COUNT', 'PAGE_COUNT', 'UPDATE_DATE', 'UPDATE_BY'] as const
  type SortColumn = (typeof sortableColumns)[number]
  const sortBy: SortColumn = sortableColumns.includes(firstSort?.id as SortColumn)
    ? (firstSort.id as SortColumn)
    : 'UPDATE_DATE'
  const jobs = useMergePdfJobs(
    {
      search: filters.documentName,
      status: filters.status?.value ?? 'ALL',
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      titleFilter,
      updateByFilter,
      sortBy,
      sortDesc: firstSort?.desc ?? true
    },
    isEnableFetching
  )

  useEffect(() => {
    if (!jobs.isFetching) setIsEnableFetching(false)
  }, [jobs.isFetching, setIsEnableFetching])
  useUpdateEffect(() => setIsEnableFetching(true), [JSON.stringify([columnFilters, sorting, pagination])])
  useUpdateEffect(() => setIsEnableFetching(true), [refreshVersion])
  useEffect(() => {
    setValue('searchResults.columnFilters', columnFilters)
    setValue('searchResults.sorting', sorting)
    setValue('searchResults.density', density)
    setValue('searchResults.columnVisibility', columnVisibility)
    setValue('searchResults.columnPinning', columnPinning)
    setValue('searchResults.columnOrder', columnOrder)
    setValue('searchResults.columnFilterFns', columnFilterFns)
  }, [columnFilters, sorting, density, columnVisibility, columnPinning, columnOrder, columnFilterFns, setValue])

  const columns = useMemo<MRT_ColumnDef<MergePdfJob>[]>(
    () => [
      {
        accessorKey: 'STATUS',
        header: 'STATUS',
        size: 140,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <Chip
            size='small'
            variant='tonal'
            color={row.original.STATUS === 'COMPLETED' ? 'success' : 'warning'}
            label={
              row.original.STATUS === 'COMPLETED'
                ? 'Completed'
                : row.original.STATUS === 'DRAFT'
                  ? 'Draft'
                  : 'Completing'
            }
          />
        )
      },
      {
        accessorKey: 'JOB_TITLE',
        header: 'DOCUMENT NAME',
        filterVariant: 'text',
        columnFilterModeOptions: ['contains'],
        filterFn: 'contains'
      },
      { accessorKey: 'DOCUMENT_COUNT', header: 'FILES', size: 100, enableColumnFilter: false },
      { accessorKey: 'PAGE_COUNT', header: 'PAGES', size: 100, enableColumnFilter: false },
      {
        accessorKey: 'UPDATE_DATE',
        header: 'UPDATE DATE',
        size: 190,
        enableColumnFilter: false,
        Cell: ({ row }) => new Date(row.original.UPDATE_DATE).toLocaleString('en-GB')
      },
      {
        accessorKey: 'UPDATE_BY',
        header: 'UPDATE BY',
        size: 160,
        filterVariant: 'text',
        columnFilterModeOptions: ['contains'],
        filterFn: 'contains'
      }
    ],
    []
  )

  return (
    <>
      <Card>
        <CardHeader
          title='Search result'
          titleTypographyProps={{ variant: 'h5' }}
          action={
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              color='success'
              className='rounded-3xl'
              onClick={() => {
                if (checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_CREATE')) onAdd()
              }}
            >
              Add New
            </Button>
          }
        />
        <DxMRTTable
          columns={columns}
          data={jobs.data?.data.ResultOnDb ?? []}
          rowCount={jobs.data?.data.TotalCountOnDb ?? 0}
          onColumnFiltersChange={setColumnFilters}
          onColumnFilterFnsChange={setColumnFilterFns}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          onColumnVisibilityChange={setColumnVisibility}
          onDensityChange={setDensity}
          onColumnPinningChange={setColumnPinning}
          onColumnOrderChange={setColumnOrder}
          layoutMode='grid'
          displayColumnDefOptions={{
            'mrt-row-actions': {
              header: 'Actions',
              size: 100,
              grow: false,
              muiTableHeadCellProps: { align: 'center' },
              muiTableBodyCellProps: { align: 'center' }
            }
          }}
          initialState={{ showColumnFilters: columnFilters.length > 0 }}
          state={{
            columnFilters,
            pagination,
            showAlertBanner: jobs.isError || jobs.data?.data.Status === false,
            isLoading: jobs.isLoading,
            showProgressBars: jobs.isRefetching,
            sorting,
            density,
            columnVisibility,
            columnPinning,
            columnOrder,
            columnFilterFns
          }}
          renderRowActions={({ row }) => (
            <div className='flex items-center justify-center'>
              <ActionsMenu
                row={row}
                rowSelected={rowSelected}
                setRowSelected={setRowSelected}
                setOpenModalEdit={value => {
                  const shouldOpen = typeof value === 'function' ? value(false) : value
                  if (shouldOpen) onOpen(row.original.JOB_ID)
                }}
                setOpenModalDelete={setOpenDelete}
                MENU_ID={MENU_ID}
                isNeedViewEyeIcon
                isNeedDelete={row.original.STATUS === 'DRAFT'}
                handleClickOpenModalView={selected => {
                  setRowSelected(selected)
                  setOpenView(true)
                }}
              />
            </div>
          )}
          isError={jobs.isError}
        />
      </Card>
      {openDelete && rowSelected && (
        <MergePdfDeleteModal
          job={rowSelected.original}
          onClose={() => {
            setOpenDelete(false)
            setRowSelected(null)
          }}
          onDeleted={() => {
            setPagination(previous => ({ ...previous, pageIndex: 0 }))
            setIsEnableFetching(true)
          }}
        />
      )}
      {openView && (
        <MergePdfViewModal
          open={openView}
          job={rowSelected?.original ?? null}
          onClose={() => {
            setOpenView(false)
            setRowSelected(null)
          }}
        />
      )}
    </>
  )
}

export default MergePdfSearchResult
