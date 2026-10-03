import { useMemo, useSyncExternalStore } from 'react'

const createObjectUrlResource = (blob: Blob | undefined) => {
  let url: string | undefined
  return {
    getSnapshot: () => url,
    subscribe: (notify: () => void) => {
      if (blob) {
        url = URL.createObjectURL(blob)
        notify()
      }
      return () => {
        if (url) URL.revokeObjectURL(url)
        url = undefined
      }
    }
  }
}

// Keep the URL tied to its Blob so changing pages cannot show the previous page.
export const useObjectUrl = (blob: Blob | undefined) => {
  const resource = useMemo(() => createObjectUrlResource(blob), [blob])
  return useSyncExternalStore(resource.subscribe, resource.getSnapshot, () => undefined)
}
