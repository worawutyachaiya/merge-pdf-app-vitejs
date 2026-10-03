import AxiosResponseI from '@/libs/axios/types/AxiosResponseI'
import UserServices from '@/services/security-center-system/UserServices'
import { UserInterface } from '@/types/security-center-system/UserTypes'
import { useQuery } from '@tanstack/react-query'

const PREFIX_QUERY_KEY = 'LOGIN'

const useLogin = (params: string, isFetchData: boolean) =>
  useQuery<AxiosResponseI<UserInterface>, Error>({
    queryKey: [PREFIX_QUERY_KEY, params],
    queryFn: () => UserServices.search(params),
    enabled: isFetchData
    //staleTime: Infinity
    // {  keepPreviousData: true}

    // onSuccess: () => {
    //   console.log('one time');
    // },
    // onError
  })
export { useLogin }
