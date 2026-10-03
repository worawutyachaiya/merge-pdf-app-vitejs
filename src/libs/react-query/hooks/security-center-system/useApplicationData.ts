import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type AxiosResponseI from '@/libs/axios/types/AxiosResponseI'
import type { ApplicationInterface } from '@/types/security-center-system/ApplicationTypes'
import ApplicationServices from '@/services/security-center-system/ApplicationServices'

const PREFIX_QUERY_KEY = 'APPLICATION'

const useSearchApplicationByUserIdAndUserGroupId = (params: string, isFetchData: boolean) =>
  useQuery<AxiosResponseI<ApplicationInterface>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => ApplicationServices.searchApplicationByUserIdAndUserGroupId(params),
    placeholderData: keepPreviousData, //useful for paginated queries by keeping data from previous pages on screen while fetching the next page
    //staleTime: 30_000, //don't refetch previously viewed pages until cache is more than 30 seconds old
    enabled: isFetchData
  })

export { useSearchApplicationByUserIdAndUserGroupId }
