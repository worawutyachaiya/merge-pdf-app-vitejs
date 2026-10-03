import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Suspense } from 'react'
// import { ErrorBoundary } from 'react-error-boundary'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import 'react-perfect-scrollbar/dist/css/styles.css'
import '@components/react-select/styles/react-select.css'
// import '@sweetalert2/theme-material-ui/material-ui.scss'
import './globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

import App from './App'
import { ToastMessageError } from './components/dx/ToastMessage'
// import ErrorFallback from './components/ErrorFallback'

import { ModuleRegistry } from 'ag-grid-community'
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise'

ModuleRegistry.registerModules([AllEnterpriseModule])

LicenseManager.setLicenseKey(
  'Using_this_{AG_Grid}_Enterprise_key_{AG-114300}_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_changing_this_key_please_contact_info@ag-grid.com___{Furukawa_FITEL_(Thailand)_Co.,_Ltd.}_is_granted_a_{Multiple_Applications}_Developer_License_for_{2}_Front-End_JavaScript_developers___All_Front-End_JavaScript_developers_need_to_be_licensed_in_addition_to_the_ones_working_with_{AG_Grid}_Enterprise___This_key_has_been_granted_a_Deployment_License_Add-on_for_{2}_Production_Environments___This_key_works_with_{AG_Grid}_Enterprise_versions_released_before_{8_December_2026}____[v3]_[01]_MTc5NjY4ODAwMDAwMA==07efcfd03d6cc8634d9d2982af8aa9af'
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      retry: false,

      // staleTime: 0,
      // gcTime: 0,
      retryOnMount: false
    }
  },
  queryCache: new QueryCache({
    onError: (e: unknown) => {
      if (e instanceof Error) {
        ToastMessageError({
          message: e.message
        })
      }
    }
  })
})

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        {/* <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={error => {
            ToastMessageError({ message: error.message })
          }}
        > */}
        <App />
        {/* </ErrorBoundary> */}
      </Suspense>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </BrowserRouter>
)
