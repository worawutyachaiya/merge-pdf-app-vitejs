export const resolveColumnOrder = (
  savedOrder: readonly string[],
  columns: readonly string[],
  documentStatusColumnIds: readonly string[],
  migrate: boolean
): string[] => {
  const currentColumns = new Set(columns)
  if (!migrate) {
    // Preserve the user's order; remove obsolete columns and append new ones.
    return [...new Set([...savedOrder.filter(column => currentColumns.has(column)), ...columns])]
  }
  const groupedColumns = new Set([...documentStatusColumnIds, 'REVISION_NO', 'DOCUMENT_COUNT', 'PAGE_COUNT'])
  const order = [...new Set([
    ...savedOrder.filter(column => currentColumns.has(column) && column !== 'OUTPUT_FILE_NAME' && !groupedColumns.has(column)),
    ...columns.filter(column => column !== 'OUTPUT_FILE_NAME' && !groupedColumns.has(column))
  ])]
  order.splice(order.indexOf('STATUS') + 1, 0, 'OUTPUT_FILE_NAME')
  order.splice(order.indexOf('JOB_TITLE') + 1, 0, ...documentStatusColumnIds, 'REVISION_NO', 'DOCUMENT_COUNT', 'PAGE_COUNT')
  return order
}
