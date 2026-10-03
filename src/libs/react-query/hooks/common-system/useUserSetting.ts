import type AxiosResponseI from '@/libs/axios/types/AxiosResponseInterface'
import UserProfileSettingServices from '@/services/common-system/UserProfileSettingServices'
import { UserProfileSettingI } from '@/types/common-system/UserProfileSetting'
import { useQuery } from '@tanstack/react-query'

const PREFIX_QUERY_KEY = 'MENU'

const useGetByUserId = (dataItem: { USER_ID: string }) => {
  return useQuery<AxiosResponseI<UserProfileSettingI>, Error>({
    queryKey: [PREFIX_QUERY_KEY, dataItem],
    queryFn: () => UserProfileSettingServices.getByUserId(dataItem)
    //staleTime: Infinity
  })
}

export { useGetByUserId }
