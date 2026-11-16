import { useState } from 'react'

import { Alert, Box, Card, CardContent, Divider, IconButton, Skeleton, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import { useDxContext } from '@/_template/DxContextProvider'
import { useMergePdfDashboard } from '@/_workspace/react-query/hooks/useMergePdf'

import MergePdfDashboardStatusModal from './MergePdfDashboardStatusModal'
import { formatMergePdfSearchDate, type MergePdfListValues } from './validationSchema'

const WORKFLOW_STATUS = [
  { id: 'DRAFT', label: 'Draft', icon: 'tabler-edit', accent: '#ff9800' },
  { id: 'COMPLETED', label: 'Completed', icon: 'tabler-circle-check', accent: '#00a6c7' }
] as const

type DashboardStatus = (typeof WORKFLOW_STATUS)[number]['id']

interface Props {
  onOpen: (jobId: number) => void
  searchFilters: MergePdfListValues['searchFilters']
}

const MergePdfDashboard = ({ onOpen, searchFilters }: Props) => {
  const theme = useTheme()
  const { isEnableFetching } = useDxContext()
  const [selectedStatus, setSelectedStatus] = useState<DashboardStatus | null>(null)
  const from = formatMergePdfSearchDate(searchFilters.createDateFrom)
  const to = formatMergePdfSearchDate(searchFilters.createDateTo)
  const updatedFrom = formatMergePdfSearchDate(searchFilters.updateDateFrom)
  const updatedTo = formatMergePdfSearchDate(searchFilters.updateDateTo)
  const creatorFilter = searchFilters.createdBy.trim()
  const updaterFilter = searchFilters.updatedBy.trim()
  const isValidRange = Boolean(!from || !to || from <= to)
  const isValidUpdatedRange = Boolean(!updatedFrom || !updatedTo || updatedFrom <= updatedTo)
  const { data, isLoading, isError } = useMergePdfDashboard(
    from,
    to,
    creatorFilter,
    updatedFrom,
    updatedTo,
    updaterFilter,
    isEnableFetching && isValidRange && isValidUpdatedRange
  )
  const response = data?.data
  const summary = response?.Status ? response.ResultOnDb[0] : undefined
  const hasError = isError || (response !== undefined && !response.Status)

  return (
    <>
      <Card
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          boxShadow: 1
        }}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          {!isValidRange || !isValidUpdatedRange ? (
            <Alert severity='info' variant='outlined'>
              Date range is invalid.
            </Alert>
          ) : isLoading || !data ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {WORKFLOW_STATUS.map(status => (
                <Skeleton key={status.id} variant='rounded' width='100%' height={56} />
              ))}
            </Stack>
          ) : hasError || !summary ? (
            <Alert severity='error' variant='outlined'>
              Unable to load the Combination summary.
            </Alert>
          ) : (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              divider={<Divider orientation='vertical' flexItem />}
              sx={{ minHeight: 82 }}
            >
              {WORKFLOW_STATUS.map(status => {
                const count = status.id === 'DRAFT' ? summary.draftCount : summary.completedCount
                const statusTint = alpha(status.accent, theme.palette.mode === 'dark' ? 0.18 : 0.1)

                return (
                  <Box
                    key={status.id}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      px: { xs: 2, sm: 3 },
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Stack direction='row' alignItems='center' spacing={1.75} sx={{ minWidth: 0, flex: 1 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          borderRadius: '12px',
                          color: status.accent,
                          backgroundColor: statusTint
                        }}
                      >
                        <i className={`${status.icon} text-2xl`} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant='body2' color='text.secondary' sx={{ display: 'block', lineHeight: 1.2 }}>
                          {status.label}
                        </Typography>
                        <Typography variant='h4' sx={{ mt: 0.5, fontWeight: 700, color: status.accent, lineHeight: 1 }}>
                          {count.toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton
                      size='medium'
                      aria-label={`View ${status.label} document numbers`}
                      onClick={() => setSelectedStatus(status.id)}
                      sx={{
                        flexShrink: 0,
                        color: status.accent,
                        backgroundColor: statusTint,
                        '&:hover': { backgroundColor: statusTint }
                      }}
                    >
                      <i className='tabler-list-details text-xl' />
                    </IconButton>
                  </Box>
                )
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      <MergePdfDashboardStatusModal
        open={selectedStatus !== null}
        status={selectedStatus}
        from={from}
        to={to}
        createdBy={creatorFilter}
        updatedFrom={updatedFrom}
        updatedTo={updatedTo}
        updatedBy={updaterFilter}
        onOpen={onOpen}
        onClose={() => setSelectedStatus(null)}
      />
    </>
  )
}

export default MergePdfDashboard
