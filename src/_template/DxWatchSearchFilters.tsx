// React Imports
import { useEffect, useRef, useState } from 'react'

// react-hook-form Imports
import { useWatch } from 'react-hook-form'

// react-use Imports
import { useDebounce, useUpdateEffect } from 'react-use'

// common-system Imports
import { useCreate } from '@libs/react-query/hooks/common-system/useUserProfileSettingProgram'

// utils Imports
import { getUserData } from '@utils/user-profile/userLoginProfile'

interface Props {
  MENU_ID: number
  searchFiltersData: object
  searchResultsMetadata?: Record<string, unknown>
  saveOnMount?: boolean
}

function DxWatchSearchFilters({ MENU_ID, searchFiltersData, searchResultsMetadata, saveOnMount = false }: Props) {
  const data = useWatch({
    name: [
      'searchResults.pageSize',
      'searchResults.columnFilters',
      'searchResults.sorting',
      'searchResults.density',
      'searchResults.columnVisibility',
      'searchResults.columnPinning',
      'searchResults.columnOrder',
      'searchResults.columnFilterFns'
    ],
    exact: true
  })

  const [isFirstMount, setIsFirstMount] = useState(true)
  const initialSaveStarted = useRef(false)
  const migrationSaveQueue = useRef<Promise<void>>(Promise.resolve())

  // react-query
  const handleAdd = (data: Array<any>) => {
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
          pageSize: data[0],
          columnFilters: data[1],
          sorting: data[2],
          density: data[3],
          columnVisibility: data[4],
          columnPinning: data[5],
          columnOrder: data[6],
          columnFilterFns: data[7],
          ...searchResultsMetadata
        }
      }
    }

    if (saveOnMount) {
      // Keep the one-time migration save ahead of any subsequent user changes.
      migrationSaveQueue.current = migrationSaveQueue.current
        .then(async () => { await mutateAsync(dataItem) })
        .catch(() => undefined)
    } else {
      mutate(dataItem)
    }
  }

  const onMutateSuccess = () => {
    console.log('onMutateSuccess')
  }

  const onMutateError = (e: any) => {
    console.log('onMutateError', e)
  }

  const { mutate, mutateAsync, isError, error } = useCreate(onMutateSuccess, onMutateError)

  // Persist an explicitly requested one-time settings migration as soon as it is loaded.
  useEffect(() => {
    if (saveOnMount && !initialSaveStarted.current) {
      initialSaveStarted.current = true
      handleAdd(data)
    }
    // This initial save intentionally uses the settings loaded at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [,] = useDebounce(
    () => {
      if (isFirstMount === false) {
        handleAdd(data)
      }
    },
    1500,
    [JSON.stringify(data)]
  )

  useUpdateEffect(() => {
    setIsFirstMount(false)
  }, [JSON.stringify(data)])

  return <>{isError ? <div>An error occurred: {error.message}</div> : null}</>
}

export default DxWatchSearchFilters
