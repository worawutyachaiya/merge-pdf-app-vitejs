import { z } from 'zod'

export const validationSchema = z.object({
  scheduleTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid send time'),
  recipients: z
    .array(
      z.object({
        employeeCode: z.string().min(1).max(30),
        name: z.string(),
        email: z.string().email()
      })
    )
    .max(100)
})

export type FormDataPage = z.infer<typeof validationSchema>
