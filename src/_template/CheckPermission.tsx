import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

type MenuPermission = {
  APPLICATION_ID: number
  APPLICATION_NAME: string
  IS_CREATE: 1 | 0
  IS_DELETE: 1 | 0
  IS_SEARCH: 1 | 0
  IS_UPDATE: 1 | 0
  MENU_ID: number
  MENU_LEAF: number
  MENU_NAME: string
  MENU_PARENT_ID: number
  MENU_PARENT_NAME: string | null
}

export function useCheckPermission() {
  const queryClient = useQueryClient()

  return (
    app_id: number,
    menu_id: number,
    type_button: 'IS_CREATE' | 'IS_DELETE' | 'IS_SEARCH' | 'IS_UPDATE',
    isShowAlert = true
  ) => {
    const data = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['MENU'] })
      .filter(query => query.isActive())

    //const data = queryClient.getQueryData(['MENU'])
    //console.log(data)

    if (typeof data === 'undefined' || data.length === 0) return null

    const rawData: MenuPermission[] = data?.[0]?.state?.data?.data?.ResultOnDbRawData ?? []

    const matchedItem = rawData.find(item => item.APPLICATION_ID === app_id && item.MENU_ID === menu_id)

    if (matchedItem && type_button in matchedItem) {
      const value = matchedItem[type_button]

      if (value === 0) {
        if (isShowAlert)
          toast.error(
            'You don’t have permission to access this feature. Please contact your administrator. คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้ กรุณาติดต่อผู้ดูแลระบบ'
          )
        return null
      }

      return value
    }

    //toast.error('ระบบไม่พบสิทธิ์การเข้าถึง หรือเมนูที่คุณเลือกไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ')

    return null
  }
}
