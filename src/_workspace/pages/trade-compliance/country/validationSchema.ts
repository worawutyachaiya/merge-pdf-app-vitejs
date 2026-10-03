import { MRT_FilterFns } from 'material-react-table'
import { z } from 'zod'

import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'
import UserProfileSettingProgramServices from '@/services/common-system/UserProfileSettingProgramServices'
import type { UserProfileSettingProgramI } from '@/types/common-system/UserProfileSettingProgram'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

const columns = [
  'INUSE',
  'COUNTRY_NAME',
  'COUNTRY_ALPHA2',
  'COUNTRY_ALPHA3',
  'CREATE_DATE',
  'CREATE_BY',
  'UPDATE_DATE',
  'UPDATE_BY'
] as const

export const validationSchemaPage = z.object({
  searchFilters: z.object({
    countryName: z.string(),
    status: z.object({ value: z.number(), label: z.string(), icon: z.string() }).nullable(),
    includingCancelled: z.boolean()
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

export type FormDataPage = z.infer<typeof validationSchemaPage>

const defaultValues = (): FormDataPage => ({
  searchFilters: { countryName: '', status: null, includingCancelled: false },
  searchResults: {
    pageSize: 10,
    columnFilters: [],
    sorting: [],
    density: 'compact',
    columnVisibility: Object.fromEntries(columns.map(column => [column, true])),
    columnPinning: { left: [], right: [] },
    columnOrder: Array.from(columns),
    columnFilterFns: {
      INUSE: MRT_FilterFns.equals.name,
      COUNTRY_NAME: MRT_FilterFns.contains.name,
      COUNTRY_ALPHA2: MRT_FilterFns.contains.name,
      COUNTRY_ALPHA3: MRT_FilterFns.contains.name,
      CREATE_DATE: MRT_FilterFns.equals.name,
      CREATE_BY: MRT_FilterFns.contains.name,
      UPDATE_DATE: MRT_FilterFns.equals.name,
      UPDATE_BY: MRT_FilterFns.contains.name
    }
  }
})

const getUrlParamSearch = ({ USER_ID, APPLICATION_ID, MENU_ID }: UserProfileSettingProgramI): string => {
  let params = ``

  params += `"USER_ID":"${USER_ID}"`
  params += `, "APPLICATION_ID":"${APPLICATION_ID}"`
  params += `, "MENU_ID":"${MENU_ID}"`

  return `{${params}}`
}

const paramForSearch = (MENU_ID: number): UserProfileSettingProgramI => ({
  USER_ID: Number(getUserData().USER_ID),
  APPLICATION_ID: Number(import.meta.env.VITE_APPLICATION_ID),
  MENU_ID
})

export const fetchDefaultValues = async (MENU_ID: number): Promise<FormDataPage> => {
  const defaults = defaultValues()

  if (MENU_ID <= 0) return defaults

  try {
    const result = await UserProfileSettingProgramServices.getByUserIdAndApplicationIdAndMenuId<
      AxiosResponseI<UserProfileSettingProgramI<FormDataPage>>
    >(getUrlParamSearch(paramForSearch(MENU_ID)))
    const saved = result.data.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA

    if (!saved) return defaults

    const savedColumnOrder = saved.searchResults?.columnOrder ?? []
    const currentColumns = new Set<string>(columns)
    const columnOrder = [
      ...savedColumnOrder.filter(column => currentColumns.has(column)),
      ...columns.filter(column => !savedColumnOrder.includes(column))
    ]
    const columnFilters = (saved.searchResults?.columnFilters ?? []).filter((filter: { id: string }) =>
      currentColumns.has(filter.id)
    )
    const columnVisibility = Object.fromEntries(
      columns.map(column => [
        column,
        saved.searchResults?.columnVisibility?.[column] ?? defaults.searchResults.columnVisibility[column]
      ])
    )
    const columnFilterFns = Object.fromEntries(
      columns.map(column => [
        column,
        saved.searchResults?.columnFilterFns?.[column] ?? defaults.searchResults.columnFilterFns[column]
      ])
    )

    return {
      ...defaults,
      searchFilters: { ...defaults.searchFilters, ...saved.searchFilters },
      searchResults: {
        ...defaults.searchResults,
        ...saved.searchResults,
        columnFilters,
        columnOrder,
        columnVisibility,
        columnFilterFns
      }
    }
  } catch {
    return defaults
  }
}
