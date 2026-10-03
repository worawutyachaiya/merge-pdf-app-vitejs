import dayjs from 'dayjs'
import { MRT_FilterFns } from 'material-react-table'
import { z } from 'zod'

import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'
import UserProfileSettingProgramServices from '@/services/common-system/UserProfileSettingProgramServices'
import type { UserProfileSettingProgramI } from '@/types/common-system/UserProfileSettingProgram'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

const columns = [
  'mrt-row-actions',
  'INUSE',
  'LINK_AND_ACTIVATE',
  'REQUEST_DATE',
  'SUPPLIER_NAME',
  'CONTACT_NAME',
  'ITEM_COUNT',
  'ECCN_COUNT',
  'CREATE_DATE',
  'CREATE_BY',
  'UPDATE_DATE',
  'UPDATE_BY'
] as const

const searchFiltersSchema = z.object({
  requestDateFrom: z.custom<Date>().nullable(),
  requestDateTo: z.custom<Date>().nullable(),
  supplierName: z.string(),
  preTradeReference: z.string(),
  status: z.object({ value: z.number(), label: z.string(), icon: z.string() }).nullable(),
  includingCancelled: z.boolean()
})

export const validationSchemaPage = z.object({
  searchFilters: searchFiltersSchema,
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
  searchFilters: {
    requestDateFrom: null,
    requestDateTo: null,
    supplierName: '',
    preTradeReference: '',
    status: null,
    includingCancelled: false
  },
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
      REQUEST_DATE: MRT_FilterFns.equals.name,
      SUPPLIER_NAME: MRT_FilterFns.contains.name,
      CONTACT_NAME: MRT_FilterFns.contains.name,
      ITEM_COUNT: MRT_FilterFns.equals.name,
      ECCN_COUNT: MRT_FilterFns.equals.name,
      CREATE_DATE: MRT_FilterFns.equals.name,
      CREATE_BY: MRT_FilterFns.contains.name,
      UPDATE_DATE: MRT_FilterFns.equals.name,
      UPDATE_BY: MRT_FilterFns.contains.name
    }
  }
})

const parseDate = (value: unknown): Date | null => {
  if (!value) return null
  const parsed = dayjs(value as string)
  return parsed.isValid() ? parsed.toDate() : null
}

const getUrlParamSearch = ({ USER_ID, APPLICATION_ID, MENU_ID }: UserProfileSettingProgramI): string =>
  JSON.stringify({ USER_ID, APPLICATION_ID, MENU_ID })

export const fetchDefaultValues = async (menuId: number): Promise<FormDataPage> => {
  const defaults = defaultValues()
  if (menuId <= 0) return defaults

  try {
    const result = await UserProfileSettingProgramServices.getByUserIdAndApplicationIdAndMenuId<
      AxiosResponseI<UserProfileSettingProgramI<FormDataPage>>
    >(
      getUrlParamSearch({
        USER_ID: Number(getUserData().USER_ID),
        APPLICATION_ID: Number(import.meta.env.VITE_APPLICATION_ID),
        MENU_ID: menuId
      })
    )
    const saved = result.data.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA
    if (!saved) return defaults

    const savedOrder = saved.searchResults?.columnOrder ?? []
    const missingColumns = columns.filter(column => !savedOrder.includes(column))
    const savedColumnFilters = (saved.searchResults?.columnFilters ?? []).map(
      (item: { id: string; value: unknown }) => {
        if (['REQUEST_DATE', 'CREATE_DATE', 'UPDATE_DATE'].includes(item.id)) {
          const parsed = dayjs(item.value as string)
          return { ...item, value: parsed.isValid() ? parsed : null }
        }
        return item
      }
    )

    return {
      searchFilters: {
        ...defaults.searchFilters,
        ...saved.searchFilters,
        preTradeReference:
          saved.searchFilters?.preTradeReference ??
          ((saved.searchFilters as Record<string, unknown> | undefined)?.temporaryItemCode as string | undefined) ??
          '',
        requestDateFrom: parseDate(saved.searchFilters?.requestDateFrom),
        requestDateTo: parseDate(saved.searchFilters?.requestDateTo)
      },
      searchResults: {
        ...defaults.searchResults,
        ...saved.searchResults,
        columnFilters: savedColumnFilters,
        columnOrder: [...savedOrder, ...missingColumns],
        columnVisibility: { ...defaults.searchResults.columnVisibility, ...saved.searchResults?.columnVisibility },
        columnFilterFns: { ...defaults.searchResults.columnFilterFns, ...saved.searchResults?.columnFilterFns }
      }
    }
  } catch {
    return defaults
  }
}
