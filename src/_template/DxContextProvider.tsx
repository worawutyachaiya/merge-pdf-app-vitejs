import type { ReactNode } from 'react'
import React, { createContext, useContext, useState } from 'react'

import type { MRT_PaginationState } from 'material-react-table'

type DxContextType = {
  isEnableFetching: boolean
  setIsEnableFetching: React.Dispatch<React.SetStateAction<boolean>>
  pagination: MRT_PaginationState
  setPagination: React.Dispatch<React.SetStateAction<MRT_PaginationState>>
}
const DxContext = createContext<DxContextType | undefined>(undefined)

const DxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEnableFetching, setIsEnableFetching] = useState(false)

  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  return (
    <DxContext.Provider value={{ isEnableFetching, setIsEnableFetching, pagination, setPagination }}>
      {children}
    </DxContext.Provider>
  )
}

const useDxContext = () => {
  const context = useContext(DxContext)

  if (!context) {
    throw new Error('useDxContext must be used within a DxProvider')
  }

  return context
}

export { DxProvider, useDxContext }
