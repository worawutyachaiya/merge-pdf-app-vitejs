import { AxiosResponseI } from '@/libs/axios/types/ResultDataResponseI'
import { useMutation, useQuery } from '@tanstack/react-query'
import UserSettingProgramServices from '../../../../service/Common System/userSettingProgramService'

import {
  userSettingProgramDataItemInterface,
  userSettingProgramSearchInterface
} from '../../../../models/Common/UserSettingProgramTypes'

const PREFIX_QUERY_KEY = 'USER_PROFILE_SETTING_PROGRAM'

// - Search
const getByUserId = (params: { USER_ID: string; APPLICATION_ID: number; MENU_ID: number }) => {
  return UserSettingProgramServices.getByUserId(params)
}

const useSearchByUserId = (
  params: { USER_ID: string; APPLICATION_ID: number; MENU_ID: number },
  isFetchData: boolean = true
) => {
  return useQuery<AxiosResponseI<userSettingProgramSearchInterface>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => getByUserId(params),
    //staleTime: Infinity,
    enabled: isFetchData
  })
}

const upsert = (dataItem: userSettingProgramDataItemInterface) => {
  const data = UserSettingProgramServices.upsert(dataItem)
  return data
}

const useUpsert = (onMutate: any, onSuccess: any, onError: any) => {
  return useMutation({
    mutationFn: upsert,
    onMutate,
    onSuccess,
    onError
  })
}

export { useSearchByUserId, useUpsert }
