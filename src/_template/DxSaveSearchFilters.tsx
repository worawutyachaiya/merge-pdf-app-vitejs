// React Imports
import { useState } from 'react'

// react-hook-form Imports
import type { SubmitErrorHandler, SubmitHandler } from 'react-hook-form'
import { useFormContext, useWatch } from 'react-hook-form'

// react-use Imports
import { useDebounce, useUpdateEffect } from 'react-use'

// common-system Imports
import { useQueryClient } from '@tanstack/react-query'

import { useCreate } from '@libs/react-query/hooks/common-system/useUserProfileSettingProgram'

// utils Imports
import { getUserData } from '@utils/user-profile/userLoginProfile'
import { useDxContext } from './DxContextProvider'

interface Props {
  MENU_ID: number
  searchFiltersData: object
  PREFIX_QUERY_KEY: string
}

function DxSaveSearchFilters({ MENU_ID, searchFiltersData, PREFIX_QUERY_KEY }: Props) {
  const { setIsEnableFetching } = useDxContext()

  const { getValues } = useFormContext()

  const queryClient = useQueryClient()

  // Function - react-hook-form
  const onSubmit: SubmitHandler<FormData> = () => {
    setIsEnableFetching(true)
    queryClient.invalidateQueries({ queryKey: [PREFIX_QUERY_KEY] })
    handleAdd()
  }

  const onError: SubmitErrorHandler<FormData> = data => {
    console.log(data)
  }

  // react-query
  const handleAdd = () => {
    const dataItem = {
      USER_ID: getUserData().USER_ID,
      APPLICATION_ID: import.meta.env.VITE_APPLICATION_ID,
      MENU_ID: MENU_ID.toString(),
      USER_PROFILE_SETTING_PROGRAM_DATA: {
        searchFilters: searchFiltersData,

        // !! Example searchFiltersData
        // {
        // productCategory: getValues('searchFilters.productCategory'),
        // productMainName: getValues('searchFilters.productMainName'),
        // productMainCode: getValues('searchFilters.productMainCode'),
        // productMainAlphabet: getValues('searchFilters.productMainAlphabet'),
        // status: getValues('searchFilters.status')
        // }

        searchResults: {
          pageSize: getValues('searchResults.pageSize'),
          columnFilters: getValues('searchResults.columnFilters'),
          sorting: getValues('searchResults.sorting'),
          density: getValues('searchResults.density'),
          columnVisibility: getValues('searchResults.columnVisibility'),
          columnPinning: getValues('searchResults.columnPinning'),
          columnOrder: getValues('searchResults.columnOrder'),
          columnFilterFns: getValues('searchResults.columnFilterFns')
        }
      }
    }

    mutate(dataItem)
  }

  const onMutateSuccess = () => {
    //console.log('onMutateSuccess')
  }

  const onMutateError = (e: any) => {
    console.log('onMutateError', e)
  }

  const { mutate, isError, error } = useCreate(onMutateSuccess, onMutateError)

  return <>{isError ? <div>An error occurred: {error.message}</div> : null}</>
}

export default DxSaveSearchFilters
