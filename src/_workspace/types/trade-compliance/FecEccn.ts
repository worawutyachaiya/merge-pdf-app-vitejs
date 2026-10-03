export interface FecEccnI {
  ECCN_FEC_ID: number
  FEC_ECCN_CODE: string
  FEC_ECCN_SUB_CODE: string | null
  FEC_ECCN_FULL_CODE: string
  CREATE_BY: string
  CREATE_DATE: string
  UPDATE_BY: string | null
  UPDATE_DATE: string | null
  INUSE: number
}
