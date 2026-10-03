import router from '@/_workspace/router/index'
import Spinner from '@/components/react-router/Spinner'

import MainLayout from '@/layouts/MainLayout'
import BlankLayout from '@/layouts/BlankLayout'
import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import ProtectedRoute from './ProtectedRoute'
// import AuthLayout from '@/layouts/AuthLayout'
// import NotFound from '@/views/NotFound'

const Router = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <MainLayout
                params={{
                  lang: 'en'
                }}
              />
            }
          >
            <Route path='/home' element={<Navigate to='/merge-pdf' replace />} />
            {/* Your routes */}
            {router}
          </Route>
        </Route>
        {/* <Route element={<AuthLayout />}>
          <Route path='/login' element={<Login />} />
        </Route> */}
        <Route
          element={
            <BlankLayout
              params={{
                lang: 'en'
              }}
            />
          }
        >
          <Route path='*' element={<Navigate to='/merge-pdf' replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default Router
