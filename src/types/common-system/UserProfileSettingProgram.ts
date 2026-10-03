export interface UserProfileSettingProgramI<T = string> {
  USER_PROFILE_SETTING_PROGRAM_ID?: number
  USER_ID: number
  APPLICATION_ID: number
  MENU_ID: number
  ROUTE_URL?: string
  USER_PROFILE_SETTING_PROGRAM_DATA?: T // must extend on your type
  CREATE_BY?: string
  CREATE_DATE?: string
  UPDATE_BY?: string
  UPDATE_DATE?: string
  DESCRIPTION?: string
  INUSE?: number // 0 , 1
}
