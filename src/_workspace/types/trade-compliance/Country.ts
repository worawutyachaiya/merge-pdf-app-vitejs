export interface CountryI {
  COUNTRY_ID: number
  COUNTRY_NAME: string
  COUNTRY_ALPHA2: string | null
  COUNTRY_ALPHA3: string | null
  CREATE_BY: string
  CREATE_DATE: string
  UPDATE_BY: string | null
  UPDATE_DATE: string | null
  INUSE: number
}
