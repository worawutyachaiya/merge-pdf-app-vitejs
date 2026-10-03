import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'
import UserProfileSettingProgramServices from '@/services/common-system/UserProfileSettingProgramServices'
import type { UserProfileSettingProgramI } from '@/types/common-system/UserProfileSettingProgram'

export const PREFIX_QUERY_KEY = 'USER_PROFILE_SETTING_PROGRAM'

// - create
const useCreate = (onSuccess: any, onError?: any) => {
  return useMutation({
    mutationFn: (dataItem: any) => UserProfileSettingProgramServices.create(dataItem),
    onSuccess,
    onError
  })
}

const usesCreateUserGroupApplication = (onSuccess: any, onError?: any) => {
  return useMutation({
    mutationFn: (dataItem: any) => UserProfileSettingProgramServices.createUserGroupApplication(dataItem),
    onSuccess,
    onError
  })
}

// - Search

const useGetByUserIdAndApplicationIdAndMenuId = (params: string, isFetchData: boolean) =>
  useQuery<AxiosResponseI<UserProfileSettingProgramI>, Error>({
    queryKey: [`${PREFIX_QUERY_KEY}_GetByUserIdAndApplicationIdAndMenuId"`, params],
    queryFn: () => UserProfileSettingProgramServices.getByUserIdAndApplicationIdAndMenuId(params),
    placeholderData: keepPreviousData, //useful for paginated queries by keeping data from previous pages on screen while fetching the next page
    //staleTime: 0, //don't refetch previously viewed pages until cache is more than 30 seconds old
    enabled: isFetchData
  })

export { useCreate, useGetByUserIdAndApplicationIdAndMenuId, usesCreateUserGroupApplication }
