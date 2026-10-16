import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

import { MENU_ID } from '@/_workspace/pages/merge-pdf/env'
import { MENU_ID as SETTINGS_MENU_ID } from '@/_workspace/pages/settings/env'

const verticalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [
  { id: MENU_ID, label: dictionary.navigation.documentsControl, icon: 'tabler-files', href: '/merge-pdf' },
  {
    id: SETTINGS_MENU_ID,
    label: dictionary.navigation.settings,
    icon: 'tabler-settings',
    href: '/settings'
  }
]

export default verticalMenuData
