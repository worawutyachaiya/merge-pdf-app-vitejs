import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

import { MENU_ID } from '@/_workspace/pages/merge-pdf/env'
import { MENU_ID as EMAIL_SETTINGS_MENU_ID } from '@/_workspace/pages/email-settings/env'

const verticalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [
  { id: MENU_ID, label: dictionary.navigation.documentsControl, icon: 'tabler-files', href: '/merge-pdf' },
  {
    id: EMAIL_SETTINGS_MENU_ID,
    label: dictionary.navigation.accountingEmailSettings,
    icon: 'tabler-settings',
    href: '/email-settings'
  }
]

export default verticalMenuData
