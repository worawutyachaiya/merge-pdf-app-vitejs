import { useEffect, useMemo, useState } from 'react'

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import type {
  MRT_ColumnDef,
  MRT_ColumnFilterFnsState,
  MRT_ColumnFiltersState,
  MRT_ColumnOrderState,
  MRT_ColumnPinningState,
  MRT_DensityState,
  MRT_PaginationState,
  MRT_SortingState,
  MRT_VisibilityState
} from 'material-react-table'
import { FormProvider, useForm } from 'react-hook-form'

import { DxMRTTable } from '@/_template/DxMRTTable'
import { useCreate } from '@/libs/react-query/hooks/common-system/useUserProfileSettingProgram'
import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'
import UserProfileSettingProgramServices from '@/services/common-system/UserProfileSettingProgramServices'
import type { UserProfileSettingProgramI } from '@/types/common-system/UserProfileSettingProgram'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

import type {
  CalDeMinimisBomDetail,
  CalDeMinimisCalculationResult,
  CalDeMinimisLayerResult
} from '@/_workspace/types/trade-compliance/CalDeMinimis'

import { MENU_ID } from './env'

type BomTableForm = {
  searchResults: {
    pageSize: number
  }
}

type BomTableSettings = {
  pageSize: number
  columnFilters: MRT_ColumnFiltersState
  sorting: MRT_SortingState
  density: MRT_DensityState
  columnVisibility: MRT_VisibilityState
  columnPinning: MRT_ColumnPinningState
  columnOrder: MRT_ColumnOrderState
  columnFilterFns: MRT_ColumnFilterFnsState
}

type CalDeMinimisProfile = {
  searchResults?: Partial<BomTableSettings>
}

const bomColumns = [
  'BOM_LEVEL',
  'ITEM_CODE',
  'ITEM_CATEGORY_NAME',
  'PRICE_WITHOUT_IMPORT_FEE',
  'USAGE_QUANTITY',
  'EFFECTIVE_USAGE_QUANTITY',
  'USAGE_UNIT',
  'YIELD_ACCUMULATION',
  'AMOUNT_WITHOUT_IMPORT_FEE',
  'PURCHASE_PRICE',
  'PURCHASE_PRICE_CURRENCY',
  'EXCHANGE_RATE_VALUE',
  'PURCHASE_UNIT',
  'PURCHASE_UNIT_RATIO',
  'USAGE_UNIT_RATIO',
  'IMPORT_FEE_RATE',
  'AMOUNT_WITH_IMPORT_FEE',
  'COUNTRY_OF_ORIGINS',
  'ECCN_CODES',
  'EAR_STATUS_CODES',
  'IS_FEC_CONTROLLED',
  'IS_US_ORIGIN',
  'BOM_PATHS'
] as const

const defaultBomTableSettings = (): BomTableSettings => ({
  pageSize: 10,
  columnFilters: [],
  sorting: [],
  density: 'compact',
  columnVisibility: Object.fromEntries(bomColumns.map(column => [column, true])),
  columnPinning: { left: [], right: [] },
  columnOrder: Array.from(bomColumns),
  columnFilterFns: {
    BOM_LEVEL: 'equals',
    ITEM_CODE: 'contains',
    ITEM_CATEGORY_NAME: 'contains',
    PRICE_WITHOUT_IMPORT_FEE: 'betweenInclusive',
    USAGE_QUANTITY: 'betweenInclusive',
    EFFECTIVE_USAGE_QUANTITY: 'betweenInclusive',
    USAGE_UNIT: 'contains',
    YIELD_ACCUMULATION: 'betweenInclusive',
    AMOUNT_WITHOUT_IMPORT_FEE: 'betweenInclusive',
    PURCHASE_PRICE: 'betweenInclusive',
    PURCHASE_PRICE_CURRENCY: 'contains',
    EXCHANGE_RATE_VALUE: 'betweenInclusive',
    PURCHASE_UNIT: 'contains',
    PURCHASE_UNIT_RATIO: 'betweenInclusive',
    USAGE_UNIT_RATIO: 'betweenInclusive',
    IMPORT_FEE_RATE: 'betweenInclusive',
    AMOUNT_WITH_IMPORT_FEE: 'betweenInclusive',
    COUNTRY_OF_ORIGINS: 'contains',
    ECCN_CODES: 'contains',
    EAR_STATUS_CODES: 'contains',
    IS_FEC_CONTROLLED: 'equals',
    IS_US_ORIGIN: 'equals',
    BOM_PATHS: 'contains'
  }
})

const profileSearchUrl = (): string => {
  const user = getUserData()

  return JSON.stringify({
    USER_ID: Number(user.USER_ID),
    APPLICATION_ID: Number(import.meta.env.VITE_APPLICATION_ID),
    MENU_ID
  })
}

const normalizeBomTableSettings = (saved?: Partial<BomTableSettings>): BomTableSettings => {
  const defaults = defaultBomTableSettings()
  const savedOrder = saved?.columnOrder ?? []
  const savedVisibility = saved?.columnVisibility ?? {}
  const savedFilterFns = saved?.columnFilterFns ?? {}
  const currentColumns = new Set<string>(bomColumns)

  return {
    ...defaults,
    ...saved,
    pageSize: saved?.pageSize && saved.pageSize >= 10 ? saved.pageSize : defaults.pageSize,
    columnFilters: (saved?.columnFilters ?? []).filter(filter => currentColumns.has(filter.id)),
    columnOrder: [
      ...savedOrder.filter(column => currentColumns.has(column)),
      ...bomColumns.filter(column => !savedOrder.includes(column))
    ],
    columnVisibility: Object.fromEntries(
      bomColumns.map(column => [column, savedVisibility[column] ?? defaults.columnVisibility[column]])
    ),
    columnFilterFns: Object.fromEntries(
      bomColumns.map(column => [column, savedFilterFns[column] ?? defaults.columnFilterFns[column]])
    )
  }
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
const standardPriceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 7
})
const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6
})

const formatCurrency = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value) ? '-' : currencyFormatter.format(value)
const formatStandardPrice = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value) ? '-' : standardPriceFormatter.format(value)
const formatPercent = (value: number) => `${percentFormatter.format(value)}%`
const formatDecimal = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value) ? '-' : decimalFormatter.format(value)

type MetricCardProps = { title: string; detail: string } & (
  | { value: string; layer?: never }
  | { value?: never; layer: CalDeMinimisLayerResult }
)

const MetricCard = ({ title, detail, value, layer }: MetricCardProps) => {
  const isExceeded = layer?.RESULT === 'FAIL'

  return (
    <Paper
      variant='outlined'
      sx={{
        height: '100%',
        p: 4,
        border: 0,
        borderRadius: 4,
        bgcolor: 'action.hover'
      }}
    >
      <Stack direction='row' spacing={2} alignItems='center' mb={2}>
        <i className='tabler-calculator text-primary text-xl' aria-hidden='true' />
        <Typography variant='subtitle2' color='text.secondary' fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      <Typography variant='body2' sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
        {detail}
      </Typography>
      {layer ? (
        <Stack direction='row' alignItems='baseline' spacing={1.5} mt={2}>
          <Typography
            component='span'
            sx={{
              color: isExceeded ? 'error.main' : 'success.main',
              fontSize: { xs: 24, md: 28 },
              lineHeight: 1,
              fontWeight: 800
            }}
          >
            {formatPercent(layer.RATIO_PERCENT)}
          </Typography>
          <Typography component='span' color='text.disabled' sx={{ fontSize: 18, fontWeight: 600 }}>
            /
          </Typography>
          <Typography component='span' color='text.secondary' sx={{ fontSize: 18, fontWeight: 700 }}>
            {formatPercent(layer.THRESHOLD_PERCENT)}
          </Typography>
        </Stack>
      ) : (
        <Typography variant='h5' mt={2} fontWeight={800}>
          {value}
        </Typography>
      )}
    </Paper>
  )
}

const comparisonSymbol = (layer: CalDeMinimisLayerResult) => (layer.RESULT === 'PASS' ? '≤' : '>')

const isEligibleUsMaterial = (detail: CalDeMinimisBomDetail): boolean =>
  detail.IS_US_ORIGIN &&
  !(detail.EAR_STATUS_CODES.length > 0 && detail.EAR_STATUS_CODES.every(status => status === 'NOT_APPLICABLE'))

const getItemSummary = (
  details: CalDeMinimisBomDetail[],
  predicate: (detail: CalDeMinimisBomDetail) => boolean
): string => {
  const matching = details.filter(predicate)
  if (matching.length === 0) return 'No matching material'

  return matching.map(detail => `${detail.ITEM_CODE} ${formatCurrency(detail.AMOUNT_WITHOUT_IMPORT_FEE)}`).join(' + ')
}

const CalculationResult = ({ result }: { result: CalDeMinimisCalculationResult }) => {
  const tableMethods = useForm<BomTableForm>({ defaultValues: { searchResults: { pageSize: 10 } } })
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [sorting, setSorting] = useState<MRT_SortingState>([])
  const [density, setDensity] = useState<MRT_DensityState>('compact')
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>({})
  const [columnPinning, setColumnPinning] = useState<MRT_ColumnPinningState>({ left: [], right: [] })
  const [columnOrder, setColumnOrder] = useState<MRT_ColumnOrderState>([])
  const [columnFilterFns, setColumnFilterFns] = useState<MRT_ColumnFilterFnsState>({})
  const [tableSettingsReady, setTableSettingsReady] = useState(false)
  const { mutate: saveProfile } = useCreate(
    () => undefined,
    () => undefined
  )
  const { setValue } = tableMethods

  useEffect(() => {
    let isMounted = true

    const loadTableSettings = async () => {
      let settings = defaultBomTableSettings()

      try {
        const response = await UserProfileSettingProgramServices.getByUserIdAndApplicationIdAndMenuId<
          AxiosResponseI<UserProfileSettingProgramI<CalDeMinimisProfile>>
        >(profileSearchUrl())
        const saved = response.data.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA

        settings = normalizeBomTableSettings(saved?.searchResults)
      } catch {
        // Use the same defaults as the other Master Data tables when no profile is available.
      }

      if (!isMounted) return

      setPagination({ pageIndex: 0, pageSize: settings.pageSize })
      setColumnFilters(settings.columnFilters)
      setSorting(settings.sorting)
      setDensity(settings.density)
      setColumnVisibility(settings.columnVisibility)
      setColumnPinning(settings.columnPinning)
      setColumnOrder(settings.columnOrder)
      setColumnFilterFns(settings.columnFilterFns)
      setValue('searchResults.pageSize', settings.pageSize)
      setTableSettingsReady(true)
    }

    void loadTableSettings()

    return () => {
      isMounted = false
    }
  }, [setValue])

  const tableSettings = useMemo<BomTableSettings>(
    () => ({
      pageSize: pagination.pageSize,
      columnFilters,
      sorting,
      density,
      columnVisibility,
      columnPinning,
      columnOrder,
      columnFilterFns
    }),
    [pagination.pageSize, columnFilters, sorting, density, columnVisibility, columnPinning, columnOrder, columnFilterFns]
  )

  useEffect(() => {
    if (!tableSettingsReady || MENU_ID <= 0) return

    const timeout = window.setTimeout(() => {
      try {
        saveProfile({
          USER_ID: getUserData().USER_ID,
          APPLICATION_ID: import.meta.env.VITE_APPLICATION_ID,
          MENU_ID: MENU_ID.toString(),
          USER_PROFILE_SETTING_PROGRAM_DATA: { searchResults: tableSettings }
        })
      } catch {
        // A profile save must not block or change the calculation result.
      }
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [saveProfile, tableSettings, tableSettingsReady])

  const isNotConcern = result.OVERALL_RESULT === 'NOT_CONCERN'
  const usItemSummary = getItemSummary(result.BOM_DETAILS, isEligibleUsMaterial)
  const fecItemSummary = getItemSummary(
    result.BOM_DETAILS,
    detail => isEligibleUsMaterial(detail) && detail.IS_FEC_CONTROLLED
  )

  const columns = useMemo<MRT_ColumnDef<CalDeMinimisBomDetail>[]>(
    () => [
      { accessorKey: 'BOM_LEVEL', header: 'LEVEL', size: 150, filterFn: 'equals' },
      { accessorKey: 'ITEM_CODE', header: 'ITEM CODE', size: 180, filterFn: 'contains' },
      { accessorKey: 'ITEM_CATEGORY_NAME', header: 'MASTER CATEGORY', size: 220, filterFn: 'contains' },
      {
        accessorKey: 'PRICE_WITHOUT_IMPORT_FEE',
        header: 'STANDARD PRICE WITHOUT IMPORT FEE (THB)',
        size: 400,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => formatStandardPrice(cell.getValue<number>())
      },
      {
        accessorKey: 'USAGE_QUANTITY',
        header: 'USAGE QTY',
        size: 200,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => formatDecimal(cell.getValue<number>())
      },
      {
        accessorKey: 'EFFECTIVE_USAGE_QUANTITY',
        header: 'EFFECTIVE QTY',
        size: 200,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => formatDecimal(cell.getValue<number>())
      },
      { accessorKey: 'USAGE_UNIT', header: 'USAGE UNIT', size: 180, filterFn: 'contains' },
      {
        accessorKey: 'YIELD_ACCUMULATION',
        header: 'YIELD (%)',
        size: 200,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => {
          const value = cell.getValue<number | null>()

          return value === null ? '-' : formatPercent(value)
        }
      },
      {
        accessorKey: 'AMOUNT_WITHOUT_IMPORT_FEE',
        header: 'AMOUNT WITHOUT IMPORT FEE (THB)',
        size: 350,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => formatCurrency(cell.getValue<number>())
      },
      {
        accessorKey: 'PURCHASE_PRICE',
        header: 'PURCHASE PRICE',
        size: 200,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => formatDecimal(cell.getValue<number | null>())
      },
      { accessorKey: 'PURCHASE_PRICE_CURRENCY', header: 'PURCHASE CURRENCY', size: 250, filterFn: 'contains' },
      {
        accessorKey: 'EXCHANGE_RATE_VALUE',
        header: 'EXCHANGE RATE',
        size: 220,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => formatDecimal(cell.getValue<number | null>())
      },
      { accessorKey: 'PURCHASE_UNIT', header: 'PURCHASE UNIT', size: 200, filterFn: 'contains' },
      {
        accessorKey: 'PURCHASE_UNIT_RATIO',
        header: 'PURCHASE UNIT RATIO',
        size: 250,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => formatDecimal(cell.getValue<number | null>())
      },
      {
        accessorKey: 'USAGE_UNIT_RATIO',
        header: 'USAGE UNIT RATIO',
        size: 220,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => formatDecimal(cell.getValue<number | null>())
      },
      {
        accessorKey: 'IMPORT_FEE_RATE',
        header: 'IMPORT FEE RATE (%)',
        size: 230,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => {
          const value = cell.getValue<number | null>()

          return value === null ? '-' : formatPercent(value)
        }
      },
      {
        accessorKey: 'AMOUNT_WITH_IMPORT_FEE',
        header: 'AMOUNT WITH IMPORT FEE (THB)',
        size: 330,
        filterFn: 'betweenInclusive',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ cell }) => {
          const value = cell.getValue<number | null>()

          return value === null ? '-' : formatCurrency(value)
        }
      },
      {
        id: 'COUNTRY_OF_ORIGINS',
        header: 'COUNTRY OF ORIGIN',
        size: 250,
        accessorFn: row => row.COUNTRY_OF_ORIGINS.join(', '),
        filterFn: 'contains'
      },
      {
        id: 'ECCN_CODES',
        header: 'ECCN',
        size: 140,
        accessorFn: row => row.ECCN_CODES.join(', ') || '-',
        filterFn: 'contains'
      },
      {
        id: 'EAR_STATUS_CODES',
        header: 'EAR STATUS',
        size: 210,
        accessorFn: row => row.EAR_STATUS_CODES.join(', ') || '-',
        filterFn: 'contains'
      },
      {
        accessorKey: 'IS_FEC_CONTROLLED',
        header: 'FEC CONTROLLED',
        size: 220,
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          const controlled = cell.getValue<boolean>()

          return (
            <Chip
              size='small'
              label={controlled ? 'Yes' : 'No'}
              color={controlled ? 'warning' : 'default'}
              variant='tonal'
            />
          )
        }
      },
      {
        accessorKey: 'IS_US_ORIGIN',
        header: 'U.S. ORIGIN',
        size: 180,
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          const isUsOrigin = cell.getValue<boolean>()

          return (
            <Chip
              size='small'
              label={isUsOrigin ? 'Yes' : 'No'}
              color={isUsOrigin ? 'primary' : 'default'}
              variant='tonal'
            />
          )
        }
      },
      {
        id: 'BOM_PATHS',
        header: 'BOM PATH',
        size: 400,
        accessorFn: row => row.BOM_PATHS.join(' | '),
        filterFn: 'contains',
        Cell: ({ row }) => (
          <Tooltip title={row.original.BOM_PATHS.join('\n')} placement='top'>
            <Typography variant='body2' noWrap sx={{ maxWidth: 300 }}>
              {row.original.BOM_PATHS[0]}
              {row.original.BOM_PATHS.length > 1 ? ' (+' + (row.original.BOM_PATHS.length - 1) + ')' : ''}
            </Typography>
          </Tooltip>
        )
      }
    ],
    []
  )

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Card sx={{ height: '100%', borderTop: theme => `5px solid ${theme.palette.primary.main}` }}>
          <CardContent>
            <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={2} mb={4}>
              <Box>
                <Typography variant='overline' color='text.secondary' fontWeight={700}>
                  DE MINIMIS ASSESSMENT
                </Typography>
                <Typography variant='h4'>ผลการประเมิน</Typography>
                <Typography variant='body2' color='text.secondary' mt={1}>
                  {result.PRODUCT_TYPE_CODE} · {result.SCT_REVISION_CODE} · Finished Good price{' '}
                  {formatCurrency(result.FINISHED_GOOD_PRICE)} · Material basis {formatCurrency(result.TOTAL_MATERIAL_VALUE)}
                </Typography>
              </Box>
              <Chip
                icon={<i className={isNotConcern ? 'tabler-circle-check' : 'tabler-alert-triangle'} aria-hidden='true' />}
                label={isNotConcern ? 'NOT CONCERN' : 'CONCERN EAR'}
                color={isNotConcern ? 'success' : 'error'}
                variant='tonal'
                sx={{
                  height: 42,
                  borderRadius: 2,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  '& .MuiChip-label': { px: 3 },
                  '& .MuiChip-icon': { ml: 2.5, fontSize: 22 }
                }}
              />
            </Stack>

            <Typography variant='body2' color='text.secondary' mb={3}>
              Materials with EAR Status: Not Applicable are excluded from the Layer 1 and Layer 2 numerators.
            </Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <MetricCard
                  title='แหล่งกำเนิดสหรัฐฯ value'
                  detail={usItemSummary}
                  value={formatCurrency(result.LAYER_1_US_ORIGIN.MATERIAL_VALUE)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <MetricCard
                  title='แหล่งกำเนิดสหรัฐฯ ratio'
                  detail={`${formatCurrency(result.LAYER_1_US_ORIGIN.MATERIAL_VALUE)} / ${formatCurrency(result.TOTAL_MATERIAL_VALUE)} × 100`}
                  layer={result.LAYER_1_US_ORIGIN}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <MetricCard
                  title='ECCN ที่ถูกควบคุม value'
                  detail={fecItemSummary}
                  value={formatCurrency(result.LAYER_2_FEC_CONTROLLED.MATERIAL_VALUE)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <MetricCard
                  title='Controlled ratio'
                  detail={`${formatCurrency(result.LAYER_2_FEC_CONTROLLED.MATERIAL_VALUE)} / ${formatCurrency(result.TOTAL_MATERIAL_VALUE)} × 100`}
                  layer={result.LAYER_2_FEC_CONTROLLED}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack direction='row' spacing={2} alignItems='center' mb={3}>
              <i className='tabler-checklist text-primary text-2xl' aria-hidden='true' />
              <Typography variant='h5'>ลำดับเหตุผลตามกฎ</Typography>
            </Stack>
            {[
              `แหล่งกำเนิดสหรัฐฯ ratio = ${formatCurrency(result.LAYER_1_US_ORIGIN.MATERIAL_VALUE)} / ${formatCurrency(result.TOTAL_MATERIAL_VALUE)} × 100 = ${formatPercent(result.LAYER_1_US_ORIGIN.RATIO_PERCENT)}`,
              `${formatPercent(result.LAYER_1_US_ORIGIN.RATIO_PERCENT)} ${comparisonSymbol(result.LAYER_1_US_ORIGIN)} de minimis threshold ${formatPercent(result.LAYER_1_US_ORIGIN.THRESHOLD_PERCENT)}`,
              `ECCN ที่ถูกควบคุมจากสหรัฐฯ ratio = ${formatCurrency(result.LAYER_2_FEC_CONTROLLED.MATERIAL_VALUE)} / ${formatCurrency(result.TOTAL_MATERIAL_VALUE)} × 100 = ${formatPercent(result.LAYER_2_FEC_CONTROLLED.RATIO_PERCENT)}`,
              `${formatPercent(result.LAYER_2_FEC_CONTROLLED.RATIO_PERCENT)} ${comparisonSymbol(result.LAYER_2_FEC_CONTROLLED)} controlled threshold ${formatPercent(result.LAYER_2_FEC_CONTROLLED.THRESHOLD_PERCENT)}`
            ].map((reason, index, reasons) => (
              <Box key={reason}>
                <Stack direction='row' spacing={3} alignItems='center' py={3}>
                  <Box
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      minWidth: 34,
                      height: 34,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 700
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant='body1'>{reason}</Typography>
                </Stack>
                {index < reasons.length - 1 && <Divider />}
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <FormProvider {...tableMethods}>
          <Card>
            <CardHeader title='BOM Details' />
            {tableSettingsReady ? (
              <DxMRTTable
                columns={columns}
                data={result.BOM_DETAILS}
                rowCount={result.BOM_DETAILS.length}
                onColumnFiltersChange={setColumnFilters}
                onColumnFilterFnsChange={setColumnFilterFns}
                onPaginationChange={setPagination}
                onSortingChange={setSorting}
                onColumnVisibilityChange={setColumnVisibility}
                onDensityChange={setDensity}
                onColumnPinningChange={setColumnPinning}
                onColumnOrderChange={setColumnOrder}
                state={{
                  columnFilters,
                  pagination,
                  sorting,
                  density,
                  columnVisibility,
                  columnPinning,
                  columnOrder,
                  columnFilterFns
                }}
                isError={false}
                enableRowActions={false}
                layoutMode='grid-no-grow'
                manualFiltering={false}
                manualPagination={false}
                manualSorting={false}
              />
            ) : (
              <Box display='flex' justifyContent='center' alignItems='center' minHeight={180}>
                <CircularProgress size={28} />
              </Box>
            )}
          </Card>
        </FormProvider>
      </Grid>
    </Grid>
  )
}

export default CalculationResult
