import { useMutation, useQuery } from '@tanstack/react-query'

import type AxiosResponseI from '@/libs/axios/types/AxiosResponseI'
import ApplicationFavoriteServices from '@/services/security-center-system/ApplicationFavoriteServices'
import type { SearchFavoriteApplicationInterface } from '@/types/security-center-system/ApplicationFavoriteTypes'

const searchApplicationFavoriteByUserId = (params: string) => {
  const data = ApplicationFavoriteServices.searchApplicationFavoriteByUserId(params)

  return data
}

const useSearchApplicationFavoriteByUserId = (params: string) => {
  return useQuery<AxiosResponseI<SearchFavoriteApplicationInterface>, Error>({
    queryKey: ['searchApplicationFavoriteByUserId', params],
    queryFn: () => searchApplicationFavoriteByUserId(params)
    //staleTime: Infinity
  })
}

const updateUserApplicationFavorite = (dataItem: {
  USER_APPLICATION_FAVORITE_ID: number
  isFavorite: boolean
  APPLICATION_ID: number
  USER_ID: number
}) => {
  const data = ApplicationFavoriteServices.updateUserApplicationFavorite(dataItem)

  return data
}

const useUpdateUserApplicationFavorite = (onSettled: any) => {
  return useMutation({
    mutationFn: updateUserApplicationFavorite,
    onSettled
  })
}

export { useSearchApplicationFavoriteByUserId, useUpdateUserApplicationFavorite }
