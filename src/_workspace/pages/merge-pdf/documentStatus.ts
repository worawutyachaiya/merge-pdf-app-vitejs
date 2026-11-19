import type { DocumentOrderCategory } from '@/_workspace/types/settings/Settings'

export const documentStatusColumns = (categories: readonly DocumentOrderCategory[]) =>
  categories.filter(category => category.IS_ENABLED === 1).map(category => ({
    categoryId: category.CATEGORY_ID,
    id: `DOC_CATEGORY_${category.CATEGORY_ID}`,
    name: category.CATEGORY_NAME,
    required: category.REQUIRED_FOR_COMPLETE === 1
  }))
