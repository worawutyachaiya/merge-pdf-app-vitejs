const DATABASE_NAME = 'master-data-user-preferences'
const DATABASE_VERSION = 1
const BACKGROUND_STORE_NAME = 'background-images'

export const DEFAULT_BACKGROUND_SHADING = 55

type BackgroundRecord = {
  key: string
  image: Blob
  shading?: number
  updatedAt: number
}

export type BackgroundPreferences = {
  image: Blob | null
  shading: number
}

let databasePromise: Promise<IDBDatabase> | undefined

const openDatabase = (): Promise<IDBDatabase> => {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('This browser does not support IndexedDB.'))
  }

  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(BACKGROUND_STORE_NAME)) {
        database.createObjectStore(BACKGROUND_STORE_NAME, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open background storage.'))
    request.onblocked = () => reject(new Error('Background storage is blocked by another browser tab.'))
  })

  return databasePromise
}

const runRequest = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(BACKGROUND_STORE_NAME, mode)
    const request = operation(transaction.objectStore(BACKGROUND_STORE_NAME))
    let result: T

    request.onsuccess = () => {
      result = request.result
    }
    request.onerror = () => reject(request.error ?? new Error('Unable to access background storage.'))
    transaction.oncomplete = () => resolve(result)
    transaction.onabort = () => reject(transaction.error ?? new Error('Background storage transaction was aborted.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('Background storage transaction failed.'))
  })
}

export const getUserBackground = async (key: string): Promise<BackgroundPreferences> => {
  const record = await runRequest<BackgroundRecord | undefined>('readonly', store => store.get(key))

  return {
    image: record?.image ?? null,
    shading: record?.shading ?? DEFAULT_BACKGROUND_SHADING
  }
}

export const saveUserBackground = async (key: string, image: Blob, shading: number): Promise<void> => {
  await runRequest<IDBValidKey>('readwrite', store =>
    store.put({ key, image, shading, updatedAt: Date.now() } satisfies BackgroundRecord)
  )
}

export const saveUserBackgroundShading = async (key: string, shading: number): Promise<void> => {
  const currentPreferences = await getUserBackground(key)

  if (!currentPreferences.image) return

  await saveUserBackground(key, currentPreferences.image, shading)
}

export const deleteUserBackground = async (key: string): Promise<void> => {
  await runRequest<undefined>('readwrite', store => store.delete(key))
}
