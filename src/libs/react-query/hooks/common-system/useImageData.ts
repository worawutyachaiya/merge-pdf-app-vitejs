import CommonServices from '@/_workspace/services/common/commonServices'
import type { ImageI } from '@/types/common-system/ImageType'
import noImage from '@assets/images/common/no-image-2.jpg'
import type { Dispatch, SetStateAction } from 'react'

interface ImageTypeOption extends ImageI {}

const ImageFromURL = (URL_PATH: string, setSmall: Dispatch<SetStateAction<string>>, setLarge: any) => {
  CommonServices.getImageFromUrl({ URL_PATH })
    .then(responseJson => {
      if (responseJson?.data?.Status === false) {
        setSmall('@/images/common/no-image-2.jpg')
        setLarge('@/images/common/no-image-2.jpg')
      } else {
        setSmall(URL.createObjectURL(responseJson.data))
        setLarge(URL.createObjectURL(responseJson.data))
      }
    })
    .catch(error => {
      setSmall('@/images/common/no-image-2.jpg')
      setLarge('@/images/common/no-image-2.jpg')
    })
}

const ImageEmployeeFromURL = (URL_PATH: string, setSmall: Dispatch<SetStateAction<string>>, setLarge: any) => {
  CommonServices.getImageEmployeeFromUrl({ URL_PATH })
    .then(responseJson => {
      if (responseJson?.data?.Status === false) {
        setSmall('@/images/common/no-image-2.jpg')
        setLarge('@/images/common/no-image-2.jpg')
      } else {
        setSmall(URL.createObjectURL(responseJson.data))
        setLarge(URL.createObjectURL(responseJson.data))
      }
    })
    .catch(error => {
      setSmall('@/images/common/no-image-2.jpg')
      setLarge('@/images/common/no-image-2.jpg')
    })
}

const ImageFromUrlRawData = (
  URL_PATH: string,
  setImage: Dispatch<SetStateAction<string>>,
  setValueFormEdit: (field: string, value: any, options?: any) => void,
  setIsFetchingImage: Dispatch<SetStateAction<boolean>>,
  itemPropertyImageSrc = ''
) => {
  ;({ URL_PATH })

  CommonServices.getImageArrayFromUrl({ URL_PATH })
    .then((responseJson: { data?: any }) => {
      const imageList = responseJson.data?.data // <<< แก้ตรงนี้

      if (!Array.isArray(imageList) || imageList.length === 0 || imageList?.[0]?.status === false) {
        // กรณีไม่มีภาพ หรือ status false
        setIsFetchingImage(false)
        setImage(noImage)
        if (setValueFormEdit && itemPropertyImageSrc)
          setValueFormEdit('itemPropertyImageSrc', '', {
            shouldDirty: true,
            shouldValidate: true
          })
      } else {
        // กรณีมีภาพ
        const imageArray = imageList.map((item: any) => {
          const rawBytes = item.data?.data || item.data
          const uint8Array = new Uint8Array(rawBytes)
          const blob = new Blob([uint8Array], { type: 'image/png' })
          return URL.createObjectURL(blob)
        })

        setImage(imageArray) // ใช้รูปแรกแสดง

        if (setValueFormEdit && itemPropertyImageSrc)
          setValueFormEdit('itemPropertyImageSrc', imageArray[0], {
            shouldDirty: true,
            shouldValidate: true
          })
        setIsFetchingImage(false)
      }
    })
    .catch(error => {
      setIsFetchingImage(false)
      setImage(noImage)
      if (setValueFormEdit && itemPropertyImageSrc)
        setValueFormEdit('itemPropertyImageSrc', '', {
          shouldDirty: true,
          shouldValidate: true
        })
    })
}

const setImageFromUrl = (URL_PATH, setImage) =>
  CommonServices.getImageFromUrl({ URL_PATH })
    .then(responseJson => {
      setImage(URL.createObjectURL(responseJson.data))
    })
    .catch(error => console.log(error))

export { ImageFromURL, ImageFromUrlRawData, ImageEmployeeFromURL }
