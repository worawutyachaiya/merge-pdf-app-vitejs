export interface EccnHsCodeRelationI {
  HS_CODE_ID: number
  HS_CODE: string
}

export interface EccnI {
  ECCN_ID: number
  ECCN_CODE: string
  ECCN_SUB_CODE: string | null
  ECCN_FULL_CODE: string
  CREATE_BY: string
  CREATE_DATE: string
  UPDATE_BY: string | null
  UPDATE_DATE: string | null
  INUSE: number
}
