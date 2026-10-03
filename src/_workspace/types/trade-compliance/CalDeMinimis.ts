export type DeMinimisLayerResultStatus = 'PASS' | 'FAIL'
export type DeMinimisOverallResultStatus = 'NOT_CONCERN' | 'CONCERN_EAR'
export type DeMinimisResultStatus = DeMinimisLayerResultStatus

export interface CalDeMinimisProductTypeOption {
  PRODUCT_TYPE_ID: number
  PRODUCT_TYPE_CODE: string
  PRODUCT_TYPE_NAME: string
}

export interface CalDeMinimisSctOption {
  SCT_ID: string
  SCT_REVISION_CODE: string
  SELLING_PRICE: number
}

export interface CalDeMinimisCalculationRequest {
  PRODUCT_TYPE_ID: number
  SCT_ID: string
}

export interface CalDeMinimisThresholdSettings {
  CAL_DE_MINIMIS_SETTING_ID: number
  SETTING_CODE: string
  US_ORIGIN_THRESHOLD_PERCENT: number
  FEC_CONTROLLED_THRESHOLD_PERCENT: number
  CREATE_BY: string
  CREATE_DATE: string
  UPDATE_BY: string
  UPDATE_DATE: string
}

export interface CalDeMinimisThresholdSettingsUpdate {
  US_ORIGIN_THRESHOLD_PERCENT: number
  FEC_CONTROLLED_THRESHOLD_PERCENT: number
  UPDATE_BY: string
}

export interface CalDeMinimisLayerResult {
  MATERIAL_VALUE: number
  RATIO_PERCENT: number
  THRESHOLD_PERCENT: number
  RESULT: DeMinimisLayerResultStatus
}

export interface CalDeMinimisBomDetail {
  ITEM_MANUFACTURING_ID: number
  ITEM_CODE: string
  ITEM_CATEGORY_ID: 4 | 6
  ITEM_CATEGORY_NAME: string
  COUNTRY_OF_ORIGINS: string[]
  ECCN_CODES: string[]
  EAR_STATUS_CODES: string[]
  FEC_ECCN_CODES: string[]
  PRICE_WITHOUT_IMPORT_FEE: number
  AMOUNT_WITHOUT_IMPORT_FEE: number
  AMOUNT_WITH_IMPORT_FEE: number | null
  PURCHASE_PRICE: number | null
  PURCHASE_PRICE_CURRENCY: string | null
  EXCHANGE_RATE_VALUE: number | null
  IMPORT_FEE_RATE: number | null
  PURCHASE_UNIT: string | null
  USAGE_UNIT: string | null
  PURCHASE_UNIT_RATIO: number | null
  USAGE_UNIT_RATIO: number | null
  USAGE_QUANTITY: number
  EFFECTIVE_USAGE_QUANTITY: number
  YIELD_ACCUMULATION: number | null
  IS_US_ORIGIN: boolean
  IS_FEC_CONTROLLED: boolean
  BOM_LEVEL: number
  BOM_PATHS: string[]
}

export interface CalDeMinimisCalculationResult {
  PRODUCT_TYPE_ID: number
  PRODUCT_TYPE_CODE: string
  PRODUCT_TYPE_NAME: string
  SCT_ID: string
  SCT_REVISION_CODE: string
  FINISHED_GOOD_PRICE: number | null
  TOTAL_MATERIAL_VALUE: number
  LAYER_1_US_ORIGIN: CalDeMinimisLayerResult
  LAYER_2_FEC_CONTROLLED: CalDeMinimisLayerResult
  OVERALL_RESULT: DeMinimisOverallResultStatus
  BOM_DETAILS: CalDeMinimisBomDetail[]
}
