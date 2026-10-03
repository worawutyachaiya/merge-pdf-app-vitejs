export interface MenuI {
  APPLICATION_ID: number
  APPLICATION_NAME: string
  IS_CREATE: number
  IS_DELETE: number
  IS_SEARCH: number
  IS_UPDATE: number
  MENU_ID: number
  MENU_LEAF: number
  MENU_NAME: string
  MENU_PARENT_ID: number
  MENU_PARENT_NAME: string | null
  INUSE: number
  id: string
  children?: { text: string; link: string; id?: string }[]
  header: string
}
