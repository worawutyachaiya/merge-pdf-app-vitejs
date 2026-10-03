import AxiosResponseI from '@/libs/axios/types/AxiosResponseI'
import UserGroupService from '@/services/security-center-system/UserGroupServices'
import { ApplicationInterface } from '@/types/security-center-system/ApplicationTypes'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

const PREFIX_QUERY_KEY = 'APPLICATION_AND_USER_GROUP'

const useSearchApplicationAndUserGroup = (params: any, isFetchData: boolean) =>
  useQuery<AxiosResponseI<ApplicationInterface>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => UserGroupService.searchApplicationAndUserGroup(params),
    placeholderData: keepPreviousData,
    //staleTime: 30_000,
    enabled: isFetchData
  })

export { useSearchApplicationAndUserGroup }
