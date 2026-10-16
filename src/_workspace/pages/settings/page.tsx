import { Grid } from '@mui/material'
import DxBreadCrumbs from '@/_template/DxBreadCrumbs'
import DocumentOrderSettings from './DocumentOrderSettings'
import AccountingEmailSettings from './AccountingEmailSettings'
import { breadcrumbNavigation, MENU_NAME } from './env'

const SettingsPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={12} sx={{ display: 'flex', alignItems: 'center' }}>
        <DxBreadCrumbs menuName={MENU_NAME} breadcrumbNavigation={breadcrumbNavigation} />
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <DocumentOrderSettings />
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <AccountingEmailSettings />
      </Grid>
    </Grid>
  )
}

export default SettingsPage
