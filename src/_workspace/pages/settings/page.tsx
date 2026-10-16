import { useState } from 'react'
import { Grid, Tab, Tabs } from '@mui/material'
import DxBreadCrumbs from '@/_template/DxBreadCrumbs'
import DocumentOrderSettings from './DocumentOrderSettings'
import AccountingEmailSettings from './AccountingEmailSettings'
import { breadcrumbNavigation, MENU_NAME } from './env'

const SettingsPage = () => {
  const [tab, setTab] = useState('document-order')
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <DxBreadCrumbs menuName={MENU_NAME} breadcrumbNavigation={breadcrumbNavigation} />
      </Grid>
      <Grid size={12}>
        <Tabs value={tab} onChange={(_, value: string) => setTab(value)} aria-label='Settings sections'>
          <Tab value='document-order' label='Document order' />
          <Tab value='email' label='Accounting email' />
        </Tabs>
      </Grid>
      <Grid size={12}>{tab === 'document-order' ? <DocumentOrderSettings /> : <AccountingEmailSettings />}</Grid>
    </Grid>
  )
}

export default SettingsPage
