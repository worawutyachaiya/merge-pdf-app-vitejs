import { keepPreviousData, useQuery } from '@tanstack/react-query'
import ApplicationServices from '@/services/security-center-system/ApplicationServices'

export const PREFIX_QUERY_KEY = 'APPLICATION_SEARCH'
export const USER_GROUP_APPLICATION_QUERY_KEY = 'USER_GROUP_APPLICATION_SEARCH'

type ApplicationSearchParams = {
  APPLICATION_NAME: string
  APPLICATION_CODE: string
  USER_GROUP_ID: string
  USER_ID: string
  INUSE: string
  Start: number
  Limit: number | string
  Order: Array<{ id: string; desc: boolean }>
}

const useSearchApplicationByUserIdAndUserGroupId = (
  params: ApplicationSearchParams | null,
  isEnableFetching: boolean
) =>
  useQuery({
    queryKey: [USER_GROUP_APPLICATION_QUERY_KEY, params],
    queryFn: () => ApplicationServices.searchApplicationByUserIdAndUserGroupId(JSON.stringify(params)),
    placeholderData: keepPreviousData,
    enabled: isEnableFetching
  })

const useSearchApplicationMergeByUserIdAndUserGroupId = (
  params: ApplicationSearchParams | null,
  isEnableFetching: boolean
) =>
  useQuery({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => ApplicationServices.searchApplicationMergeByUserIdAndUserGroupId(JSON.stringify(params)),
    placeholderData: keepPreviousData,
    enabled: isEnableFetching
  })

export { useSearchApplicationByUserIdAndUserGroupId, useSearchApplicationMergeByUserIdAndUserGroupId }
