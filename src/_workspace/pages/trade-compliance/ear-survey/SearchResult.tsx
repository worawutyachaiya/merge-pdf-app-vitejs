import { useEffect, useMemo, useRef, useState } from 'react'

import PublishIcon from '@mui/icons-material/Publish'
import { Card, CardHeader, Chip, IconButton } from '@mui/material'
import LoadingButton from '@mui/lab/LoadingButton'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import dayjs from 'dayjs'
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
import * as XLSX from 'xlsx'

import { ToastMessageError, ToastMessageSuccess } from '@/components/ToastMessage'
import { useCheckPermission } from '@/_template/CheckPermission'
import { useDxContext } from '@/_template/DxContextProvider'
import { DxMRTTable } from '@/_template/DxMRTTable'
import {
  PREFIX_QUERY_KEY,
  useCreateEarSurveyByImportFile,
  useEarSurveySearch
} from '@/_workspace/react-query/hooks/useEarSurvey'
import type {
  EarSurveyI,
  EarSurveyImportErrorI,
  EarSurveyImportPayloadI,
  EarSurveyImportRowI
} from '@/_workspace/types/trade-compliance/EarSurvey'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import StatusColumn from '@/libs/material-react-table/components/StatusOption'

import { MENU_ID, MENU_NAME } from './env'
import ImportErrorModal from './modal/ImportErrorModal'
import ViewModal from './modal/ViewModal'
import type { FormDataPage } from './validationSchema'

const SHEET_NAME = 'EAR Survey'
const ITEM_ROWS = [
  ...Array.from({ length: 20 }, (_, index) => index + 31),
  ...Array.from({ length: 45 }, (_, index) => index + 58)
]

const readTextCell = (sheet: XLSX.WorkSheet, address: string): string => {
  const cell = sheet[address]

  if (!cell) return ''

  return String(cell.w ?? cell.v ?? '').trim()
}

const readDateCell = (sheet: XLSX.WorkSheet, address: string): string => {
  const cell = sheet[address]

  if (!cell) return ''

  if (cell.v instanceof Date) return dayjs(cell.v).format('YYYY-MM-DD')

  if (typeof cell.v === 'number') {
    const parsed = XLSX.SSF.parse_date_code(cell.v)

    if (parsed) {
      return dayjs(new Date(parsed.y, parsed.m - 1, parsed.d)).format('YYYY-MM-DD')
    }
  }

  const parsed = dayjs(String(cell.w ?? cell.v ?? '').trim())

  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

const readItemRow = (sheet: XLSX.WorkSheet, rowNumber: number): EarSurveyImportRowI => ({
  EXCEL_ROW_NO: rowNumber,
  ITEM_CODE: readTextCell(sheet, `C${rowNumber}`),
  DESCRIPTION: readTextCell(sheet, `F${rowNumber}`),
  MODEL: readTextCell(sheet, `I${rowNumber}`),
  EAR_SURVEY_STATUS_NAME: readTextCell(sheet, `L${rowNumber}`),
  ECCN_FULL_CODE: readTextCell(sheet, `N${rowNumber}`),
  REASON_FOR_CONTROL: readTextCell(sheet, `P${rowNumber}`),
  COUNTRY_NAME: readTextCell(sheet, `S${rowNumber}`),
  HS_CODE: readTextCell(sheet, `V${rowNumber}`),
  COMPONENT_OF_PRODUCT: readTextCell(sheet, `X${rowNumber}`),
  REMARK: readTextCell(sheet, `AA${rowNumber}`)
})

const parseEarWorkbook = async (file: File, createBy: string): Promise<EarSurveyImportPayloadI> => {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: false
  })
  const sheet = workbook.Sheets[SHEET_NAME]

  if (!sheet) {
    throw new Error(`ไม่พบ Sheet "${SHEET_NAME}"`)
  }

  const rows = ITEM_ROWS.map(rowNumber => readItemRow(sheet, rowNumber)).filter(
    row => row.ITEM_CODE !== '' || row.EAR_SURVEY_STATUS_NAME !== '' || row.DESCRIPTION !== '' || row.MODEL !== ''
  )

  if (rows.length === 0) {
    throw new Error('ไม่พบ Item Code ในรายการสินค้า')
  }

  return {
    HEADER: {
      REQUEST_DATE: readDateCell(sheet, 'E17'),
      SUPPLIER_CODE: readTextCell(sheet, 'E19'),
      SUPPLIER_NAME: readTextCell(sheet, 'E21'),
      CONTACT_TEL: readTextCell(sheet, 'E23'),
      CONTACT_NAME: readTextCell(sheet, 'L17'),
      POSITION_NAME: readTextCell(sheet, 'L19'),
      DEPARTMENT_NAME: readTextCell(sheet, 'L21'),
      CONTACT_EMAIL: readTextCell(sheet, 'L23')
    },
    ROWS: rows,
    CREATE_BY: createBy
  }
}

interface ApiErrorResponse {
  Message?: string
  ResultOnDb?: EarSurveyImportErrorI[]
}

const SearchResult = () => {
  const { isEnableFetching, setIsEnableFetching, pagination, setPagination } = useDxContext()
  const { getValues, setValue } = useFormContext<FormDataPage>()
  const queryClient = useQueryClient()
  const hiddenFileInput = useRef<HTMLInputElement>(null)

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
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null)
  const [importErrors, setImportErrors] = useState<EarSurveyImportErrorI[]>([])

  const searchFilters = getValues('searchFilters')
  const params = {
    SearchFilters: [
      { id: 'REVISION_CODE', value: searchFilters.revisionCode },
      {
        id: 'REQUEST_DATE_FROM',
        value: searchFilters.requestDateFrom ? dayjs(searchFilters.requestDateFrom).format('YYYY-MM-DD') : ''
      },
      {
        id: 'REQUEST_DATE_TO',
        value: searchFilters.requestDateTo ? dayjs(searchFilters.requestDateTo).format('YYYY-MM-DD') : ''
      },
      { id: 'SUPPLIER_CODE', value: searchFilters.supplierCode },
      { id: 'SUPPLIER_NAME', value: searchFilters.supplierName },
      { id: 'ITEM_CODE', value: searchFilters.itemCode },
      { id: 'STATUS', value: searchFilters.status?.value ?? '' },
      { id: 'INCLUDING_CANCELLED', value: searchFilters.includingCancelled }
    ],
    ColumnFilters: columnFilters.map(item => ({
      columnFns: columnFilterFns[item.id],
      column: item.id,
      value:
        item.value && typeof item.value === 'object' && 'format' in item.value
          ? (item.value as { format: (format: string) => string }).format('YYYY-MM-DD')
          : item.value
    })),
    Order: sorting,
    Start: pagination.pageIndex,
    Limit: pagination.pageSize
  }

  const { data, isError, isFetching, isLoading, isRefetching } = useEarSurveySearch(params, isEnableFetching)
  const importMutation = useCreateEarSurveyByImportFile()
  const checkPermission = useCheckPermission()
  const hasCreatePermission =
    MENU_ID > 0
      ? Boolean(checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_CREATE', false))
      : import.meta.env.DEV

  useEffect(() => {
    if (!isFetching) setIsEnableFetching(false)
  }, [isFetching, setIsEnableFetching])

  useUpdateEffect(() => {
    setIsEnableFetching(true)
  }, [JSON.stringify([columnFilters, columnFilterFns, sorting, pagination])])

  useEffect(() => {
    setValue('searchResults.columnFilters', columnFilters)
    setValue('searchResults.sorting', sorting)
    setValue('searchResults.density', density)
    setValue('searchResults.columnVisibility', columnVisibility)
    setValue('searchResults.columnPinning', columnPinning)
    setValue('searchResults.columnOrder', columnOrder)
    setValue('searchResults.columnFilterFns', columnFilterFns)
  }, [columnFilters, sorting, density, columnVisibility, columnPinning, columnOrder, columnFilterFns, setValue])

  const resetFileInput = () => {
    if (hiddenFileInput.current) hiddenFileInput.current.value = ''
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      const payload = await parseEarWorkbook(file, getUserData().EMPLOYEE_CODE || getUserData().USER_NAME)
      const response = await importMutation.mutateAsync(payload)

      if (response.data.Status) {
        ToastMessageSuccess({ title: MENU_NAME, message: response.data.Message })
        queryClient.invalidateQueries({ queryKey: [PREFIX_QUERY_KEY] })
        setIsEnableFetching(true)
      } else {
        const errors = (response.data.ResultOnDb ?? []) as EarSurveyImportErrorI[]

        if (errors.length > 0) setImportErrors(errors)
        ToastMessageError({ title: MENU_NAME, message: response.data.Message })
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      const apiErrors = axiosError.response?.data?.ResultOnDb ?? []

      if (apiErrors.length > 0) setImportErrors(apiErrors)
      ToastMessageError({
        title: MENU_NAME,
        message:
          axiosError.response?.data?.Message ?? (error instanceof Error ? error.message : 'ไม่สามารถนำเข้าข้อมูลได้')
      })
    } finally {
      resetFileInput()
    }
  }

  const columns = useMemo<MRT_ColumnDef<EarSurveyI>[]>(
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
      {
        accessorKey: 'REVISION_CODE',
        header: 'REVISION CODE',
        filterVariant: 'text',
        filterFn: 'contains',
        columnFilterModeOptions: ['endsWith', 'startsWith', 'contains', 'equals', 'notEquals'],
        size: 350,
        Cell: ({ cell }) => cell.getValue<string | null>() || '-'
      },
      {
        accessorKey: 'REVISION_NO',
        header: 'REVISION NO.',
        filterVariant: 'text',
        filterFn: 'equals',
        columnFilterModeOptions: [
          'equals',
          'notEquals',
          'greaterThan',
          'greaterThanOrEqualTo',
          'lessThan',
          'lessThanOrEqualTo'
        ],
        size: 180,
        Cell: ({ cell }) => cell.getValue<number | null>() ?? '-'
      },
      {
        accessorKey: 'REQUEST_DATE',
        header: 'REQUEST DATE',
        filterVariant: 'date',
        filterFn: 'equals',
        columnFilterModeOptions: [
          'equals',
          'notEquals',
          'greaterThan',
          'greaterThanOrEqualTo',
          'lessThan',
          'lessThanOrEqualTo'
        ],
        size: 200,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          return value ? dayjs(value).format('DD-MMM-YYYY') : '-'
        }
      },
      {
        accessorKey: 'SUPPLIER_CODE',
        header: 'SUPPLIER CODE',
        filterVariant: 'text',
        filterFn: 'contains',
        columnFilterModeOptions: ['endsWith', 'startsWith', 'contains', 'equals', 'notEquals'],
        size: 220
      },
      {
        accessorKey: 'SUPPLIER_NAME',
        header: 'SUPPLIER NAME',
        filterVariant: 'text',
        filterFn: 'contains',
        columnFilterModeOptions: ['endsWith', 'startsWith', 'contains', 'equals', 'notEquals'],
        size: 350
      },
      {
        accessorKey: 'CONTACT_NAME',
        header: 'CONTACT NAME',
        filterVariant: 'text',
        filterFn: 'contains',
        columnFilterModeOptions: ['endsWith', 'startsWith', 'contains', 'equals', 'notEquals'],
        size: 220
      },
      {
        accessorKey: 'ITEM_COUNT',
        header: 'ITEMS',
        filterVariant: 'text',
        filterFn: 'equals',
        columnFilterModeOptions: [
          'equals',
          'notEquals',
          'greaterThan',
          'greaterThanOrEqualTo',
          'lessThan',
          'lessThanOrEqualTo'
        ],
        size: 150
      },
      {
        accessorKey: 'ECCN_COUNT',
        header: 'ECCN',
        filterVariant: 'text',
        filterFn: 'equals',
        columnFilterModeOptions: [
          'equals',
          'notEquals',
          'greaterThan',
          'greaterThanOrEqualTo',
          'lessThan',
          'lessThanOrEqualTo'
        ],
        size: 150
      },
      {
        accessorKey: 'CREATE_DATE',
        header: 'CREATE DATE',
        filterVariant: 'date',
        filterFn: 'equals',
        columnFilterModeOptions: [
          'equals',
          'notEquals',
          'greaterThan',
          'greaterThanOrEqualTo',
          'lessThan',
          'lessThanOrEqualTo'
        ],
        size: 200
      },
      {
        accessorKey: 'CREATE_BY',
        header: 'CREATE BY',
        filterVariant: 'text',
        filterFn: 'contains',
        columnFilterModeOptions: ['endsWith', 'startsWith', 'contains', 'equals', 'notEquals'],
        size: 160
      },
      {
        accessorKey: 'UPDATE_DATE',
        header: 'UPDATE DATE',
        filterVariant: 'date',
        filterFn: 'equals',
        columnFilterModeOptions: [
          'equals',
          'notEquals',
          'greaterThan',
          'greaterThanOrEqualTo',
          'lessThan',
          'lessThanOrEqualTo'
        ],
        size: 200
      },
      {
        accessorKey: 'UPDATE_BY',
        header: 'UPDATE BY',
        filterVariant: 'text',
        filterFn: 'contains',
        columnFilterModeOptions: ['endsWith', 'startsWith', 'contains', 'equals', 'notEquals'],
        size: 160
      }
    ],
    []
  )

  return (
    <>
      <Card>
        <CardHeader
          title='Search result'
          action={
            <>
              <LoadingButton
                loading={importMutation.isPending}
                variant='tonal'
                color='success'
                startIcon={<PublishIcon />}
                className='rounded-3xl'
                disabled={!hasCreatePermission}
                onClick={() => hiddenFileInput.current?.click()}
              >
                Import Data
              </LoadingButton>
              <input
                ref={hiddenFileInput}
                type='file'
                accept='.xlsx'
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </>
          }
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
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
            renderRowActions={({ row }) => (
              <div className='flex items-center'>
                <IconButton
                  aria-label='View detail'
                  onClick={() => setSelectedHeaderId(row.original.EAR_SURVEY_HEADER_ID)}
                >
                  <i className='tabler-eye text-[22px] text-textSecondary' />
                </IconButton>
              </div>
            )}
          />
        </LocalizationProvider>
      </Card>
      <ViewModal
        open={selectedHeaderId !== null}
        earSurveyHeaderId={selectedHeaderId}
        onClose={() => setSelectedHeaderId(null)}
      />
      <ImportErrorModal open={importErrors.length > 0} errors={importErrors} onClose={() => setImportErrors([])} />
    </>
  )
}

export default SearchResult
