export type EarSurveyStage = 'ACTIVE' | 'PRE_TRADE'

export interface ManufacturingItemLookupI {
  ITEM_MANUFACTURING_ID: number
  ITEM_CODE_FOR_SUPPORT_MES: string
}

export interface EarSurveyControlI {
  EAR_SURVEY_ITEM_CONTROL_ID: number
  EAR_SURVEY_ITEM_ID: number
  ECCN_ID: number
  ECCN_CODE: string
  ECCN_SUB_CODE: string | null
  ECCN_FULL_CODE: string
  REASON_FOR_CONTROL: string
  COMPONENT_OF_PRODUCT: string
  REMARK: string | null
}

export interface EarSurveyItemI {
  EAR_SURVEY_ITEM_ID: number
  EAR_SURVEY_HEADER_ID: number
  ITEM_MANUFACTURING_ID: number | null
  ITEM_CODE: string | null
  PRE_TRADE_REFERENCE_NO: string | null
  DESCRIPTION: string | null
  MODEL: string | null
  EAR_SURVEY_STATUS_ID: number
  EAR_SURVEY_STATUS_CODE: string
  EAR_SURVEY_STATUS_NAME: string
  HS_CODE_ID: number | null
  HS_CODE: string | null
  COUNTRY_ID: number | null
  COUNTRY_NAME: string | null
  REMARK: string | null
  CONTROLS: EarSurveyControlI[]
}

export interface EarSurveyI {
  EAR_SURVEY_HEADER_ID: number
  EAR_SURVEY_STAGE_ID: number
  REVISION_NO: number | null
  REVISION_CODE: string | null
  SURVEY_STAGE: EarSurveyStage
  SURVEY_STAGE_NAME: string
  IS_CURRENT: number
  REQUEST_DATE: string
  SUPPLIER_CODE: string | null
  SUPPLIER_NAME: string
  CONTACT_TEL: string
  CONTACT_NAME: string
  POSITION_NAME: string
  DEPARTMENT_NAME: string
  CONTACT_EMAIL: string
  ITEM_COUNT: number
  ECCN_COUNT: number
  CREATE_BY: string
  CREATE_DATE: string
  UPDATE_BY: string
  UPDATE_DATE: string
  INUSE: number
  ITEMS?: EarSurveyItemI[]
}

export interface EarSurveyImportErrorI {
  ROW_NO: number | null
  FIELD: string
  MESSAGE: string
}

export interface EarSurveyImportRowI {
  EXCEL_ROW_NO: number
  SURVEY_ITEM_NO?: string | null
  ITEM_CODE?: string | null
  DESCRIPTION: string
  MODEL: string
  EAR_SURVEY_STATUS_NAME: string
  ECCN_FULL_CODE: string
  REASON_FOR_CONTROL: string
  COUNTRY_NAME: string
  HS_CODE: string
  COMPONENT_OF_PRODUCT: string
  REMARK: string
}

export interface EarSurveyImportPayloadI {
  HEADER: {
    REQUEST_DATE: string
    SUPPLIER_CODE: string | null
    SUPPLIER_NAME: string
    CONTACT_TEL: string
    CONTACT_NAME: string
    POSITION_NAME: string
    DEPARTMENT_NAME: string
    CONTACT_EMAIL: string
  }
  ROWS: EarSurveyImportRowI[]
  CREATE_BY: string
}

export interface EarSurveyPreTradeImportRowI extends EarSurveyImportRowI {
  SURVEY_ITEM_NO: string
  ITEM_CODE: string
}

export interface EarSurveyPreTradeImportPayloadI extends Omit<EarSurveyImportPayloadI, 'ROWS'> {
  ROWS: EarSurveyPreTradeImportRowI[]
}

export interface EarSurveyActivatePreTradeItemMappingI {
  EAR_SURVEY_ITEM_ID: number
  ITEM_MANUFACTURING_ID: number
}

export interface EarSurveyActivatePreTradePayloadI {
  EAR_SURVEY_HEADER_ID: number
  SUPPLIER_CODE: string
  ITEM_MAPPINGS: EarSurveyActivatePreTradeItemMappingI[]
  UPDATE_BY: string
}

export interface EarSurveyCancelPreTradePayloadI {
  EAR_SURVEY_HEADER_ID: number
  UPDATE_BY: string
}
