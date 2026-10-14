import { useState } from 'react'

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { ToastMessageError } from '@/components/ToastMessage'

export const ReactQueryClientProvider = ({ children }: React.PropsWithChildren) => {
  const [queryClient] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnMount: false,
          refetchOnReconnect: false,
          refetchOnWindowFocus: false,
          retry: false,

          staleTime: 0,
          gcTime: 0,
          retryOnMount: false
        }
      },
      queryCache: new QueryCache({
        onError: (e, query) => {
          if (query.meta?.suppressErrorToast) return
          ToastMessageError({ message: e.message })
        }
      })
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={true} />
    </QueryClientProvider>
  )
}
