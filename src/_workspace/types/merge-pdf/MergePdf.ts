export interface MergePdfJob {
  JOB_ID: number
  INUSE: number
  JOB_CODE: string
  JOB_TITLE: string
  STAMP_X?: number | null
  STAMP_Y?: number | null
  STAMP_FONT_SIZE?: number | null
  STAMP_STYLE?: import('@/_workspace/pages/merge-pdf/textFormatting').TextStyle | null
  JOB_REFERENCE: string | null
  HAWB_OVERRIDE?: string | null
  HAWB?: string | null
  STATUS: 'DRAFT' | 'COMPLETING' | 'COMPLETED'
  ROW_VERSION: number
  REVISION_NO: number
  UPDATE_DATE: string
  UPDATE_BY: string
  CREATE_BY?: string
  CREATE_DATE?: string
  DOCUMENT_COUNT: number
  PAGE_COUNT: number
  LAST_COMPLETED_AT?: string | null
  OUTPUT_FILE_NAME?: string | null
  NETWORK_PATH?: string | null
  DOCUMENT_PAGE_COUNTS?: Record<string, number>
  UNCLASSIFIED_PAGE_COUNT?: number
}

export interface MergePdfDashboardSummary {
  draftCount: number
  completedCount: number
}

export interface MergePdfDashboardJob {
  JOB_ID: number
  JOB_CODE: string
  JOB_TITLE: string
  STATUS: 'DRAFT' | 'COMPLETED'
  CREATE_DATE: string
  DOCUMENT_COUNT: number
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
  DESCRIPTION: string | null
  UPLOAD_ORDER: number
}

export interface MergePdfPage {
  EDITOR_ANNOTATIONS?: import('@/_workspace/pages/merge-pdf/pageAnnotations').PageAnnotation[] | null
  PAGE_ID: number
  DOCUMENT_ID: number
  SOURCE_PAGE_NUMBER: number
  ROTATION_DEGREES: number
  DESKEW_DEGREES: number
  SORT_ORDER: number
  CATEGORY_ID: number
  CLASSIFICATION_SOURCE: 'AUTO_TEXT' | 'AUTO_OCR' | 'FILENAME' | 'UNKNOWN' | 'USER' | null
  CLASSIFICATION_CONFIDENCE: number | null
  DESCRIPTION: string | null
}

export interface MergePdfPublication {
  PUBLICATION_ID: number
  PUBLICATION_VERSION: number
  STATUS: 'PENDING' | 'PUBLISHED' | 'FAILED'
  SHARE_PATH?: string | null
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
  month?: string
  title: string
  reference: string | null
}

export type BatchPageAction =
  | { kind: 'category'; categoryId: number }
  | { kind: 'rotate'; delta: 90 | 270 }
  | { kind: 'remove' }
