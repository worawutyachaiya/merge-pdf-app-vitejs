export interface MergePdfJob {
  JOB_ID: number
  INUSE: number
  JOB_CODE: string
  JOB_TITLE: string
  JOB_REFERENCE: string | null
  STATUS: 'DRAFT' | 'COMPLETING' | 'COMPLETED'
  ROW_VERSION: number
  UPDATE_DATE: string
  UPDATE_BY: string
  DOCUMENT_COUNT: number
  PAGE_COUNT: number
}

export interface MergePdfDocument {
  DOCUMENT_ID: number
  JOB_ID: number
  CATEGORY_ID: number
  CATEGORY_NAME: string
  ORIGINAL_FILE_NAME: string
  SOURCE_TYPE: 'PDF' | 'IMAGE' | 'EXCEL'
  PDF_PAGE_COUNT: number
  ENTRY_STATUS_CODE: string | null
  ENTRY_STATUS_SOURCE: string | null
  UPLOAD_ORDER: number
}

export interface MergePdfPage {
  PAGE_ID: number
  DOCUMENT_ID: number
  SOURCE_PAGE_NUMBER: number
  ROTATION_DEGREES: number
  SORT_ORDER: number
  CATEGORY_ID: number
  CLASSIFICATION_SOURCE: 'AUTO_TEXT' | 'AUTO_OCR' | 'FILENAME' | 'UNKNOWN' | 'USER' | null
  CLASSIFICATION_CONFIDENCE: number | null
}

export interface MergePdfPublication {
  PUBLICATION_ID: number
  PUBLICATION_VERSION: number
  STATUS: 'PENDING' | 'PUBLISHED' | 'FAILED'
  OUTPUT_FILE_NAME: string
  NETWORK_PATH: string | null
  PUBLISHED_AT: string | null
}

export interface MergePdfDetail {
  job: MergePdfJob
  documents: MergePdfDocument[]
  pages: MergePdfPage[]
  publications: MergePdfPublication[]
}

export interface MergePdfForm {
  title: string
  reference: string | null
}

export const MERGE_PDF_CATEGORIES = [
  { id: 1, name: 'Import entry (ใบขน)' },
  { id: 2, name: 'Invoice' },
  { id: 3, name: 'Packing list' },
  { id: 4, name: 'HAWB or AWB' },
  { id: 5, name: 'MAWB' },
  { id: 6, name: 'Permit Tisi' },
  { id: 7, name: 'ใบเสร็จศุลกากร' },
  { id: 8, name: 'DO' },
  { id: 9, name: 'Delivery note' },
  { id: 10, name: 'Other' }
] as const

export const REQUIRED_MERGE_PDF_CATEGORY_IDS = [1, 2, 4] as const
