// Position is the first page of the moved block in the final document.
export const movePagesToPosition = (
  pageIds: readonly number[],
  selectedIds: readonly number[],
  position: number
): number[] => {
  const selected = new Set(selectedIds)
  const moving = pageIds.filter(id => selected.has(id))
  const remaining = pageIds.filter(id => !selected.has(id))
  if (
    !moving.length ||
    moving.length !== selected.size ||
    !Number.isInteger(position) ||
    position < 1 ||
    position > remaining.length + 1
  ) {
    throw new Error('Select pages and enter a valid destination position')
  }
  remaining.splice(position - 1, 0, ...moving)
  return remaining
}
