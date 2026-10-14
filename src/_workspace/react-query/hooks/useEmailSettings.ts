import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import EmailSettingsServices from '@/_workspace/services/email-settings/EmailSettingsServices'

export const PREFIX_QUERY_KEY = 'EMAIL_SETTINGS'

export const useEmailSettings = () =>
  useQuery({
    queryKey: [PREFIX_QUERY_KEY],
    queryFn: EmailSettingsServices.settings,
    staleTime: 0,
    gcTime: 0,
    retry: false
  })

export const useAccountingPeople = (search: string) =>
  useQuery({
    queryKey: [PREFIX_QUERY_KEY, 'accounting-people', search],
    queryFn: () => EmailSettingsServices.accountingPeople(search),
    staleTime: 0,
    gcTime: 0,
    retry: false
  })

export const useSaveEmailSettings = (
  onSuccess: (response: Awaited<ReturnType<typeof EmailSettingsServices.save>>) => void,
  onError: (error: Error) => void
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { scheduleTime: string; employeeCodes: string[] }) =>
      EmailSettingsServices.save(input.scheduleTime, input.employeeCodes),
    onSuccess: response => {
      if (response.data.Status) void queryClient.invalidateQueries({ queryKey: [PREFIX_QUERY_KEY] })
      onSuccess(response)
    },
    onError
  })
}
