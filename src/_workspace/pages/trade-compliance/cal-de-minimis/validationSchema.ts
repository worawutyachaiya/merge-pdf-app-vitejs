import { z } from 'zod'

const requiredProductType = z
  .number()
  .int()
  .positive()
  .nullable()
  .refine((value): value is number => value !== null, { message: 'Product Type Code is required' })

const requiredSct = z
  .string()
  .uuid()
  .nullable()
  .refine((value): value is string => value !== null, { message: 'SCT Revision Code is required' })

export const calDeMinimisFormSchema = z.object({
  PRODUCT_TYPE_ID: requiredProductType,
  SCT_ID: requiredSct
})

export type CalDeMinimisFormInput = z.input<typeof calDeMinimisFormSchema>
export type CalDeMinimisFormData = z.output<typeof calDeMinimisFormSchema>

export const calDeMinimisDefaultValues: CalDeMinimisFormInput = {
  PRODUCT_TYPE_ID: null,
  SCT_ID: null
}
