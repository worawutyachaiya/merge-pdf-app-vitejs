import CalDeMinimisServices from '@/_workspace/services/trade-compliance/CalDeMinimisServices'
import type { CalDeMinimisProductTypeOption } from '@/_workspace/types/trade-compliance/CalDeMinimis'

export const fetchCalDeMinimisProductTypes = async (inputValue: string): Promise<CalDeMinimisProductTypeOption[]> => {
  const response = await CalDeMinimisServices.getProductTypes(inputValue)
  return response.data.ResultOnDb
}
