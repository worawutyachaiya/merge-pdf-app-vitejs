export interface HsCodeEccnRelationI {
  ECCN_ID: number
  ECCN_CODE: string
  ECCN_SUB_CODE: string | null
  ECCN_FULL_CODE: string
}

export interface HsCodeI {
  HS_CODE_ID: number
  HS_CODE: string
  CREATE_BY: string
  CREATE_DATE: string
  UPDATE_BY: string | null
  UPDATE_DATE: string | null
  INUSE: number
}
