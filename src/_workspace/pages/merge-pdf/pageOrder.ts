export const categoryRanks = (
  order: readonly { CATEGORY_ID: number; SORT_ORDER: number }[]
): ReadonlyMap<number, number> => new Map(order.map(category => [category.CATEGORY_ID, category.SORT_ORDER]))

const categoryRank = (categoryId: number, ranks: ReadonlyMap<number, number>) =>
  ranks.get(categoryId) ?? Number.MAX_SAFE_INTEGER

export const sortPagesByCategory = <T extends { CATEGORY_ID: number; SORT_ORDER: number }>(
  pages: readonly T[],
  ranks: ReadonlyMap<number, number>
): T[] =>
  [...pages].sort(
    (a, b) => categoryRank(a.CATEGORY_ID, ranks) - categoryRank(b.CATEGORY_ID, ranks) || a.SORT_ORDER - b.SORT_ORDER
  )

export const insertPagesByCategory = <T extends { CATEGORY_ID: number }>(
  existing: readonly T[],
  imported: readonly T[],
  ranks: ReadonlyMap<number, number>
): T[] => {
  const ordered = [...existing]
  for (const page of imported) {
    const insertAfter = ordered.findLastIndex(
      current => categoryRank(current.CATEGORY_ID, ranks) <= categoryRank(page.CATEGORY_ID, ranks)
    )
    ordered.splice(insertAfter + 1, 0, page)
  }
  return ordered
}

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
