export interface ApplicationInterface {
  APPLICATION_ID: number
  APPLICATION_NAME: string
  APPLICATION_URL: string
  USER_APPLICATION_FAVORITE_ID: number
  IS_FAVORITE: boolean
  DESCRIPTION: string
  CREATE_BY: string
  CREATE_DATE: string
  UPDATE_BY: string
  MODIFIED_DATE: string
  INUSE: number
  No: number
}

export interface searchFavoriteApplicationInterface {
  APPLICATION_ID: number
  APPLICATION_NAME: string
  APPLICATION_URL: string
}
