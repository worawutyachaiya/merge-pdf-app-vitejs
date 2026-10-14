import { MRT_FilterFns } from 'material-react-table'
import { z } from 'zod'

import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'
import UserProfileSettingProgramServices from '@/services/common-system/UserProfileSettingProgramServices'
import type { UserProfileSettingProgramI } from '@/types/common-system/UserProfileSettingProgram'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import { documentStatusColumnIds } from './documentStatus'

export const mergePdfFormSchema = z.object({
  title: z.string().trim().max(255)
})
export type MergePdfFormValues = z.infer<typeof mergePdfFormSchema>
export const mergePdfFormDefaults: MergePdfFormValues = { title: '' }

export const mergePdfStatusOptions = [
  { value: 'DRAFT' as const, label: 'Draft' },
  { value: 'COMPLETED' as const, label: 'Completed' }
]

const columns = [
  'mrt-row-actions',
  'STATUS',
  'OUTPUT_FILE_NAME',
  'JOB_TITLE',
  'DOCUMENT_COUNT',
  'PAGE_COUNT',
  ...documentStatusColumnIds,
  'UPDATE_DATE',
  'UPDATE_BY'
] as const

export const mergePdfListSchema = z.object({
  searchFilters: z.object({
    documentName: z.string(),
    status: z.object({ value: z.enum(['DRAFT', 'COMPLETED']), label: z.string() }).nullable()
  }),
  searchResults: z.object({
    pageSize: z.number().min(10),
    columnFilters: z.any(),
    sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })),
    density: z.enum(['comfortable', 'compact', 'spacious']),
    columnVisibility: z.record(z.string(), z.boolean()),
    columnPinning: z.object({ left: z.array(z.string()).optional(), right: z.array(z.string()).optional() }),
    columnOrder: z.array(z.string()),
    columnFilterFns: z.any()
  })
})

export type MergePdfListValues = z.infer<typeof mergePdfListSchema>

const defaultListValues = (): MergePdfListValues => ({
  searchFilters: { documentName: '', status: null },
  searchResults: {
    pageSize: 10,
    columnFilters: [],
    sorting: [{ id: 'UPDATE_DATE', desc: true }],
    density: 'compact',
    columnVisibility: Object.fromEntries(columns.map(column => [column, true])),
    columnPinning: { left: ['mrt-row-actions'], right: [] },
    columnOrder: Array.from(columns),
    columnFilterFns: {
      STATUS: MRT_FilterFns.equals.name,
      JOB_TITLE: MRT_FilterFns.contains.name,
      DOCUMENT_COUNT: MRT_FilterFns.equals.name,
      PAGE_COUNT: MRT_FilterFns.equals.name,
      UPDATE_DATE: MRT_FilterFns.equals.name,
      UPDATE_BY: MRT_FilterFns.contains.name
    }
  }
})

export const fetchMergePdfListValues = async (menuId: number): Promise<MergePdfListValues> => {
  const defaults = defaultListValues()
  if (menuId <= 0) return defaults

  try {
    const data = JSON.stringify({
      USER_ID: Number(getUserData().USER_ID),
      APPLICATION_ID: Number(import.meta.env.VITE_APPLICATION_ID),
      MENU_ID: menuId
    })
    const response =
      await UserProfileSettingProgramServices.getByUserIdAndApplicationIdAndMenuId<
        AxiosResponseI<UserProfileSettingProgramI<MergePdfListValues>>
      >(data)
    const saved = response.data.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA
    if (!saved) return defaults

    const currentColumns = new Set<string>(columns)
    const savedOrder = saved.searchResults?.columnOrder ?? []
    const columnOrder = [
      ...savedOrder.filter(
        column =>
          currentColumns.has(column) && column !== 'OUTPUT_FILE_NAME' && !documentStatusColumnIds.includes(column)
      ),
      ...columns.filter(
        column =>
          !savedOrder.includes(column) && column !== 'OUTPUT_FILE_NAME' && !documentStatusColumnIds.includes(column)
      )
    ]
    columnOrder.splice(columnOrder.indexOf('STATUS') + 1, 0, 'OUTPUT_FILE_NAME')
    columnOrder.splice(columnOrder.indexOf('PAGE_COUNT') + 1, 0, ...documentStatusColumnIds)
    return {
      searchFilters: { ...defaults.searchFilters, ...saved.searchFilters },
      searchResults: {
        ...defaults.searchResults,
        ...saved.searchResults,
        columnFilters: (saved.searchResults?.columnFilters ?? []).filter((filter: { id: string }) =>
          currentColumns.has(filter.id)
        ),
        columnOrder,
        columnVisibility: Object.fromEntries(
          columns.map(column => [column, saved.searchResults?.columnVisibility?.[column] ?? true])
        ),
        columnFilterFns: {
          ...defaults.searchResults.columnFilterFns,
          ...saved.searchResults?.columnFilterFns
        }
      }
    }
  } catch {
    return defaults
  }
}
