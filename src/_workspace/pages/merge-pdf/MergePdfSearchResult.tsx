import { useEffect, useMemo, useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import { Button, Card, CardHeader, Chip, IconButton, Tooltip, Stack } from '@mui/material'
import dayjs from 'dayjs'
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
import CategoryPdfPreviewModal from './CategoryPdfPreviewModal'
import MergePdfRestoreModal from './MergePdfRestoreModal'

import { MENU_ID } from './env'
import MergePdfDeleteModal from './MergePdfDeleteModal'
import MergePdfViewModal from './MergePdfViewModal'
import MergePdfPreviewModal from './MergePdfPreviewModal'
import { mergePdfDefaultColumnOrder, type MergePdfListValues } from './validationSchema'
import { documentStatusColumns } from './documentStatus'
import DocumentStatusIndicator from './DocumentStatusIndicator'

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
  const [restoreJob, setRestoreJob] = useState<MergePdfJob | null>(null)
  const [categoryPreview, setCategoryPreview] = useState<{ job: MergePdfJob; categoryId: number; name: string } | null>(
    null
  )
  const [previewJob, setPreviewJob] = useState<MergePdfJob | null>(null)
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
      includingCancelled: filters.includingCancelled,
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
        minSize: 140,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <Chip
            size='small'
            variant='tonal'
            color={row.original.INUSE === 0 ? 'error' : row.original.STATUS === 'COMPLETED' ? 'success' : 'warning'}
            label={
              row.original.INUSE === 0
                ? 'Cancelled'
                : row.original.STATUS === 'COMPLETED'
                  ? 'Completed'
                  : row.original.STATUS === 'DRAFT'
                    ? 'Draft'
                    : 'Completing'
            }
          />
        )
      },
      {
        accessorKey: 'OUTPUT_FILE_NAME',
        header: 'PDF FILE',
        size: 180,
        minSize: 180,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) =>
          row.original.OUTPUT_FILE_NAME ? (
            <Button
              onClick={() => {
                setPreviewJob(row.original)
              }}
              size='small'
              disabled={row.original.INUSE === 0}
              startIcon={<i className='tabler-folder-open' />}
            >
              {row.original.OUTPUT_FILE_NAME}
            </Button>
          ) : (
            '-'
          )
      },
      {
        accessorKey: 'JOB_TITLE',
        header: 'DOCUMENT NAME',
        size: 240,
        minSize: 220,
        filterVariant: 'text',
        columnFilterModeOptions: ['contains'],
        filterFn: 'contains',
        Cell: ({ row }) =>
          /^I\d{2}-\d{4,}$/.test(row.original.JOB_CODE) ? row.original.JOB_CODE : row.original.JOB_TITLE
      },
      ...documentStatusColumns.map<MRT_ColumnDef<MergePdfJob>>(category => ({
        id: category.id,
        header: category.label,
        accessorFn: job => job.DOCUMENT_PAGE_COUNTS?.[category.categoryId],
        size: category.categoryId === 7 ? 75 : 65,
        minSize: 55,
        grow: false,
        enableSorting: false,
        enableColumnFilter: false,
        enableColumnActions: false,
        enableColumnOrdering: false,
        muiTableHeadCellProps: { align: 'center' },
        muiTableBodyCellProps: { align: 'center' },
        Cell: ({ row }) => {
          const counts = row.original.DOCUMENT_PAGE_COUNTS
          const count = counts ? (counts[category.categoryId] ?? 0) : undefined
          const indicator = (
            <DocumentStatusIndicator categoryId={category.categoryId} name={category.name} pageCount={count} />
          )
          return (count ?? 0) > 0 && row.original.INUSE === 1 ? (
            <IconButton
              size='small'
              aria-label={`View ${category.name} for ${row.original.JOB_TITLE}`}
              onClick={() =>
                setCategoryPreview({ job: row.original, categoryId: category.categoryId, name: category.name })
              }
            >
              {indicator}
            </IconButton>
          ) : (
            indicator
          )
        }
      })),
      {
        accessorKey: 'REVISION_NO',
        header: 'REVISION',
        size: 150,
        minSize: 150,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (row.original.REVISION_NO > 0 ? row.original.REVISION_NO : '-')
      },
      { accessorKey: 'DOCUMENT_COUNT', header: 'FILES', size: 155, minSize: 150, enableColumnFilter: false },
      { accessorKey: 'PAGE_COUNT', header: 'PAGES', size: 155, minSize: 150, enableColumnFilter: false },
      {
        accessorKey: 'UPDATE_DATE',
        header: 'UPDATE DATE',
        size: 190,
        minSize: 190,
        enableColumnFilter: false,
        Cell: ({ row }) => dayjs(row.original.UPDATE_DATE).format('DD-MMM-YYYY HH:mm:ss')
      },
      {
        accessorKey: 'UPDATE_BY',
        header: 'UPDATE BY',
        size: 160,
        minSize: 160,
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
              size: 135,
              grow: false,
              muiTableHeadCellProps: { align: 'center' },
              muiTableBodyCellProps: { align: 'center' }
            }
          }}
          initialState={{ showColumnFilters: columnFilters.length > 0, columnOrder: [...mergePdfDefaultColumnOrder] }}
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
            <Stack direction='row' justifyContent='center' spacing={0.5}>
              {row.original.INUSE === 0 ? (
                <Tooltip title='Restore'>
                  <IconButton
                    color='success'
                    aria-label='Restore document'
                    onClick={() => {
                      if (checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_UPDATE'))
                        setRestoreJob(row.original)
                    }}
                  >
                    <i className='tabler-restore' />
                  </IconButton>
                </Tooltip>
              ) : (
                <>
                  <Tooltip title='View'>
                    <IconButton
                      aria-label='View document'
                      onClick={() => {
                        setRowSelected(row)
                        setOpenView(true)
                      }}
                    >
                      <i className='tabler-eye' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Edit'>
                    <span>
                      <IconButton
                        color='primary'
                        aria-label='Edit document'
                        disabled={row.original.STATUS === 'COMPLETING'}
                        onClick={() => {
                          if (checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_UPDATE'))
                            onOpen(row.original.JOB_ID)
                        }}
                      >
                        <i className='tabler-edit' />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title='Delete'>
                    <span>
                      <IconButton
                        color='error'
                        aria-label='Delete document'
                        disabled={row.original.STATUS === 'COMPLETING'}
                        onClick={() => {
                          if (checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_DELETE')) {
                            setRowSelected(row)
                            setOpenDelete(true)
                          }
                        }}
                      >
                        <i className='tabler-trash' />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </Stack>
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
      {categoryPreview && (
        <CategoryPdfPreviewModal
          job={categoryPreview.job}
          categoryId={categoryPreview.categoryId}
          categoryName={categoryPreview.name}
          onClose={() => setCategoryPreview(null)}
        />
      )}
      {restoreJob && (
        <MergePdfRestoreModal
          job={restoreJob}
          onClose={() => setRestoreJob(null)}
          onRestored={() => setIsEnableFetching(true)}
        />
      )}
      {previewJob && <MergePdfPreviewModal open job={previewJob} onClose={() => setPreviewJob(null)} />}
    </>
  )
}

export default MergePdfSearchResult
