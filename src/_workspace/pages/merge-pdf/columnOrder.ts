export const resolveColumnOrder = (
  savedOrder: readonly string[],
  columns: readonly string[],
  migrate: boolean
): string[] => {
  const currentColumns = new Set(columns)
  if (!migrate) {
    const order = savedOrder.filter(column => currentColumns.has(column))
    if (currentColumns.has('HAWB') && !order.includes('HAWB') && order.includes('JOB_TITLE'))
      order.splice(order.indexOf('JOB_TITLE') + 1, 0, 'HAWB')
    return [...new Set([...order, ...columns])]
  }
  const groupedColumns = new Set(['HAWB', 'REVISION_NO', 'DOCUMENT_COUNT', 'PAGE_COUNT'])
  const order = [...new Set([
    ...savedOrder.filter(column => currentColumns.has(column) && column !== 'OUTPUT_FILE_NAME' && !groupedColumns.has(column)),
    ...columns.filter(column => column !== 'OUTPUT_FILE_NAME' && !groupedColumns.has(column))
  ])]
  order.splice(order.indexOf('STATUS') + 1, 0, 'OUTPUT_FILE_NAME')
  order.splice(order.indexOf('JOB_TITLE') + 1, 0, 'HAWB', 'REVISION_NO', 'DOCUMENT_COUNT', 'PAGE_COUNT')
  return order
}

export const withDocumentColumns = (order: readonly string[], categoryIds: readonly string[]): string[] => {
  const columns = order.filter(id => !id.startsWith('DOC_CATEGORY_'))
  columns.splice(columns.indexOf('HAWB') + 1, 0, ...categoryIds)
  return columns
}
