import { useQuery } from '@tanstack/react-query'

import type { MenuI } from '@/types/security-center-system/MenuTypes'

import MenuService from '@/services/security-center-system/MenuServices'
import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'

const PREFIX_QUERY_KEY = 'MENU'

const useGetMenuMergeUserGroup = (params: string, isFetchData: boolean) =>
  useQuery<AxiosResponseI<MenuI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => MenuService.getMenuMergeUserGroup(params),
    enabled: isFetchData
  })

const useGetMenuMergeUserGroupByUserNameAndApplicationId = (params: string, isFetchData: boolean) =>
  useQuery<AxiosResponseI<MenuI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => MenuService.getMenuMergeUserGroupByUserNameAndApplicationId(params),
    enabled: isFetchData
  })

export { useGetMenuMergeUserGroup, useGetMenuMergeUserGroupByUserNameAndApplicationId }
