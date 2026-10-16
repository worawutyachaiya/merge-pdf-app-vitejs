import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import SettingsServices from '@/_workspace/services/settings/SettingsServices'
import type { DocumentOrderItem } from '@/_workspace/types/settings/Settings'

const documentOrderKey = ['SETTINGS', 'document-order'] as const

export const useDocumentOrder = () =>
  useQuery({
    queryKey: documentOrderKey,
    queryFn: SettingsServices.documentOrder,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false
  })

export const useSaveDocumentOrder = (
  onSuccess: (response: Awaited<ReturnType<typeof SettingsServices.saveDocumentOrder>>) => void,
  onError: (error: Error) => void
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (order: DocumentOrderItem[]) => SettingsServices.saveDocumentOrder(order),
    onSuccess: response => {
      if (response.data.Status) queryClient.setQueryData(documentOrderKey, response)
      onSuccess(response)
    },
    onError
  })
}
