import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'
import { requiredFieldMessage } from '@/libs/valibot/error-message/errorMessage'
import UserProfileSettingProgramServices from '@/services/common-system/UserProfileSettingProgramServices'
import { UserProfileSettingProgramI } from '@/types/common-system/UserProfileSettingProgram'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import { z } from 'zod'
import { MENU_ID } from '../../../app/[lang]/(_workspace)/(productGroup)/product-main/env'
import { MRT_FilterFns } from 'material-react-table'
import dayjs from 'dayjs'

// TODO: Can change this value
const columns = [
  'mrt-row-actions',

  'inuseForSearch',

  'PRODUCT_CATEGORY_NAME',
  'PRODUCT_MAIN_CODE',

  'PRODUCT_MAIN_NAME',
  'PRODUCT_MAIN_ALPHABET',

  'CREATE_BY',
  'CREATE_DATE',

  'UPDATE_BY',
  'UPDATE_DATE'
] as const

// TODO: Can change this value
const searchFiltersSchema = z.object({
  // Header
  productCategory: z
    .object({
      PRODUCT_CATEGORY_ID: z.number().min(1, requiredFieldMessage({ fieldName: 'Product Category' })),
      PRODUCT_CATEGORY_NAME: z.string().nonempty(requiredFieldMessage({ fieldName: 'Product Category' }))
    })
    .nullable(),

  // Product Main Detail
  productMainName: z.string().nullable().optional(),
  productMainAlphabet: z.string().nullable().optional(),
  productMainCode: z.string().nullable().optional(),

  // Status
  status: z
    .object({
      value: z.union([z.literal(''), z.literal(0), z.literal(1), z.literal(2)], {
        invalid_type_error: 'status invalid_type_error',
        required_error: 'status required_error'
      }),
      label: z.string().nonempty(requiredFieldMessage({ fieldName: 'Status' }))
    })
    .nullable()
})

// !! Do not change this value
export const schemaZod = z.object({
  // searchFilters
  searchFilters: searchFiltersSchema,
  // searchResults
  searchResults: z.object({
    pageSize: z.number().min(10, requiredFieldMessage({ fieldName: 'Page Size' })),
    columnFilters: z.array(
      z.object({
        id: z.enum(columns),
        value: z.unknown({
          invalid_type_error: 'columnFilters invalid_type_error',
          required_error: 'columnFilters required_error'
        })
      })
    ),
    sorting: z.array(
      z.object({
        id: z.enum(columns),
        desc: z.boolean({
          invalid_type_error: 'columnSorting invalid_type_error',
          required_error: 'columnSorting required_error'
        })
      })
    ),
    density: z.enum(['comfortable', 'compact', 'spacious'], {
      invalid_type_error: 'density invalid_type_error',
      required_error: 'density required_error'
    }),
    columnVisibility: z.object(
      columns.reduce(
        (acc, key) => {
          acc[key] = z.boolean()
          return acc
        },
        {} as Record<(typeof columns)[number], z.ZodTypeAny>
      )
    ),
    columnPinning: z.object({
      left: z.array(z.enum(columns)),
      right: z.array(z.enum(columns))
    }),
    columnOrder: z.array(z.enum(columns)),
    columnFilterFns: z.object(
      columns.reduce(
        (acc, key) => {
          acc[key] = z.boolean()
          return acc
        },
        {} as Record<(typeof columns)[number], z.ZodTypeAny>
      )
    )
  })
})

export type FormDataPage = z.infer<typeof schemaZod>

// ------------------------- Fetch Default Values -------------------------

const getUrlParamSearch = ({ USER_ID, APPLICATION_ID, MENU_ID }: UserProfileSettingProgramI): string => {
  let params = ``

  params += `"USER_ID":"${USER_ID}"`
  params += `, "APPLICATION_ID":"${APPLICATION_ID}"`
  params += `, "MENU_ID":"${MENU_ID}"`

  params = `{${params}}`

  return params
}

const paramForSearch: UserProfileSettingProgramI = {
  USER_ID: Number(getUserData().USER_ID),
  APPLICATION_ID: Number(import.meta.env.VITE_APPLICATION_ID),
  MENU_ID: MENU_ID
}

export const fetchDefaultValues = async (): Promise<FormDataPage> => {
  return new Promise(async resolve => {
    try {
      // get data from common-system-web-api
      const result = await UserProfileSettingProgramServices.getByUserIdAndApplicationIdAndMenuId<
        AxiosResponseI<UserProfileSettingProgramI<FormDataPage>>
      >(getUrlParamSearch(paramForSearch))

      // find column missing from default
      const columnsDifference = columns?.filter(
        element =>
          result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnOrder?.includes(
            element
          ) === false
      )

      // change to date format
      const columnFilters =
        result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnFilters?.map(
          (item: any) => {
            if (item.id === 'CREATE_DATE' || item.id === 'UPDATE_DATE' || item.id === 'MODIFIED_DATE') {
              const value = (item?.value as string) || ''

              return {
                id: item.id,
                value: dayjs(value).isValid() ? dayjs(value) : null
              }
            } else {
              return item
            }
          }
        )

      resolve({
        searchFilters: {
          productCategory:
            result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchFilters.productCategory || null,
          productMainName:
            result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchFilters.productMainCode || '',
          productMainCode:
            result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchFilters.productMainAlphabet || '',
          productMainAlphabet:
            result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchFilters.productMainAlphabet || '',
          status: result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchFilters.status || null
        },
        searchResults: {
          pageSize: result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.pageSize || 10,
          columnFilters: columnFilters || [],
          sorting: result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.sorting || [],
          density:
            result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.density ?? 'compact',
          columnVisibility: {
            PRODUCT_CATEGORY_NAME:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnVisibility
                ?.PRODUCT_CATEGORY_NAME || true,
            PRODUCT_MAIN_CODE:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnVisibility
                ?.PRODUCT_MAIN_CODE ?? true,
            PRODUCT_MAIN_NAME:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnVisibility
                ?.PRODUCT_MAIN_NAME ?? true,
            PRODUCT_MAIN_ALPHABET:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnVisibility
                ?.PRODUCT_MAIN_ALPHABET ?? true,
            CREATE_BY:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnVisibility
                ?.CREATE_BY ?? true,
            UPDATE_BY:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnVisibility
                ?.UPDATE_BY ?? true,
            CREATE_DATE:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnVisibility
                ?.CREATE_DATE ?? true,
            UPDATE_DATE:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnVisibility
                ?.UPDATE_DATE ?? 'mrt-row-actions',
            inuseForSearch:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults?.columnVisibility
                ?.inuseForSearch ?? true
          },
          columnPinning: result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults
            .columnPinning || { left: [], right: [] },
          columnOrder:
            result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnOrder?.concat(
              columnsDifference
            ) || [],
          columnFilterFns: {
            PRODUCT_CATEGORY_NAME:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnFilterFns
                .PRODUCT_CATEGORY_NAME || MRT_FilterFns.contains.name,
            PRODUCT_MAIN_CODE:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnFilterFns
                .PRODUCT_MAIN_CODE || MRT_FilterFns.contains.name,
            PRODUCT_MAIN_NAME:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnFilterFns
                .PRODUCT_MAIN_NAME || MRT_FilterFns.contains.name,
            PRODUCT_MAIN_ALPHABET:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnFilterFns
                .PRODUCT_MAIN_ALPHABET || MRT_FilterFns.contains.name,
            CREATE_BY:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnFilterFns
                .CREATE_BY || MRT_FilterFns.contains.name,
            UPDATE_BY:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnFilterFns
                .UPDATE_BY || MRT_FilterFns.contains.name,
            CREATE_DATE:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnFilterFns
                .CREATE_DATE || MRT_FilterFns.equals.name,
            UPDATE_DATE:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnFilterFns
                .UPDATE_DATE || MRT_FilterFns.equals.name,
            inuseForSearch:
              result?.data?.ResultOnDb?.[0]?.USER_PROFILE_SETTING_PROGRAM_DATA?.searchResults.columnFilterFns
                .inuseForSearch || ''
          }
        }
      })
    } catch (error) {
      resolve({
        searchFilters: {
          productCategory: null,
          productMainName: '',
          productMainCode: '',
          productMainAlphabet: '',
          status: null
        },
        searchResults: {
          pageSize: 10,
          columnFilters: [],
          sorting: [],
          density: 'compact',
          columnVisibility: {
            PRODUCT_CATEGORY_NAME: true,
            PRODUCT_MAIN_ALPHABET: true,
            PRODUCT_MAIN_CODE: true,
            PRODUCT_MAIN_NAME: true,
            CREATE_BY: true,
            CREATE_DATE: true,
            UPDATE_DATE: true,
            UPDATE_BY: true,
            inuseForSearch: true
          },
          columnPinning: { left: [], right: [] },
          columnOrder: Array.from(columns),
          columnFilterFns: {
            PRODUCT_CATEGORY_NAME: MRT_FilterFns.contains.name,
            PRODUCT_MAIN_CODE: MRT_FilterFns.contains.name,
            PRODUCT_MAIN_NAME: MRT_FilterFns.contains.name,
            PRODUCT_MAIN_ALPHABET: MRT_FilterFns.contains.name,
            CREATE_BY: MRT_FilterFns.contains.name,
            CREATE_DATE: MRT_FilterFns.contains.name,
            UPDATE_DATE: MRT_FilterFns.contains.name,
            UPDATE_BY: MRT_FilterFns.contains.name,
            inuseForSearch: MRT_FilterFns.contains.name
          }
        }
      })
    }
  })
}
