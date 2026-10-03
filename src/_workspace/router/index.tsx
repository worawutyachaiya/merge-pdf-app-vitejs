/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { Navigate, Route } from 'react-router'

const MergePdfPage = lazy(() => import('@/_workspace/pages/merge-pdf/page'))

export default (
  <>
    <Route path='/' element={<Navigate to='/merge-pdf' replace />} />
    <Route path='/merge-pdf' element={<MergePdfPage />} />
  </>
)
