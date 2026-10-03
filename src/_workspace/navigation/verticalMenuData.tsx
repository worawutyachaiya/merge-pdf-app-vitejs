import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

import { MENU_ID } from '@/_workspace/pages/merge-pdf/env'

const verticalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [
  { id: MENU_ID, label: dictionary.navigation.documentsControl, icon: 'tabler-files', href: '/merge-pdf' }
]

export default verticalMenuData
