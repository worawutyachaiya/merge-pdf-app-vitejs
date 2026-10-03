export function typeFieldMessage({
  fieldName = 'This field',
  typeName = 'string'
}: {
  fieldName: string
  typeName?: string
}) {
  return `${fieldName} must be a ${typeName}.`
}

export function requiredFieldMessage({ fieldName = 'This field' }: { fieldName?: string }) {
  return `${fieldName} is required.`
}

export function minLengthFieldMessage({
  fieldName = 'This field',
  minLength
}: {
  fieldName: string
  minLength: number
}) {
  return `${fieldName} must be at least ${minLength} characters long.`
}

export function maxLengthFieldMessage({
  fieldName = 'This field',
  maxLength
}: {
  fieldName: string
  maxLength: number
}) {
  return `${fieldName} can be max ${maxLength} characters long.`
}

export function uppercaseFieldMessage({ fieldName = 'This field' }: { fieldName: string }) {
  return `${fieldName} must contain only uppercase letters.`
}
