/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { Navigate, Route } from 'react-router'

const MergePdfPage = lazy(() => import('@/_workspace/pages/merge-pdf/page'))
const EmailSettingsPage = lazy(() => import('@/_workspace/pages/email-settings/page'))

export default (
  <>
    <Route path='/' element={<Navigate to='/merge-pdf' replace />} />
    <Route path='/merge-pdf' element={<MergePdfPage />} />
    <Route path='/email-settings' element={<EmailSettingsPage />} />
    <Route path='/merge-pdf/email-settings' element={<Navigate to='/email-settings' replace />} />
  </>
)
