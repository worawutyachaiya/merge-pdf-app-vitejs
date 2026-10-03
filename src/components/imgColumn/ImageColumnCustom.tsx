import CommonServices from '@/_workspace/services/common/commonServices'
import noImg from '@assets/images/common/no-image-2.jpg'
import Rotate90DegreesCcwIcon from '@mui/icons-material/Rotate90DegreesCcw'
import { Box, Button, Modal, Typography } from '@mui/material' // ใช้ Modal จาก Material-UI
import { useEffect, useState } from 'react'

const ImageItemFromURL = (itemCode: string, setSmall: (url: string) => void, setLarge: (url: string) => void) => {
  CommonServices.getImageFromUrl({ URL_PATH: itemCode })
    .then(response => {
      const imageUrl = response?.data?.Status === false ? noImg : URL.createObjectURL(response.data)
      setSmall(imageUrl)
      setLarge(imageUrl)
    })
    .catch(() => {
      setSmall(noImg)
      setLarge(noImg)
    })
}

interface ImageCell {
  ITEM_CODE_FOR_SUPPORT_MES: string | null
}

const ImageItemColumn = ({ cell }: { cell: ImageCell }) => {
  const [small, setSmall] = useState('')
  const [large, setLarge] = useState('')
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [rotation, setRotation] = useState(0)

  // useEffect(() => {
  //   ImageItemFromURL(cell.row.original.ITEM_FOR_SUPPORT_MES, setSmall, setLarge)
  // }, [cell.row.original.ITEM_ID])

  useEffect(() => {
    if (cell.ITEM_CODE_FOR_SUPPORT_MES !== 'None' && cell.ITEM_CODE_FOR_SUPPORT_MES !== null)
      ImageItemFromURL(cell.ITEM_CODE_FOR_SUPPORT_MES, setSmall, setLarge)
  }, [cell.ITEM_CODE_FOR_SUPPORT_MES])

  const rotateImage = () => {
    setRotation(prevRotation => prevRotation + 90) // หมุน 90 องศาทุกครั้งที่คลิก
  }

  return (
    <>
      {small ? (
        <img
          src={small}
          width={40}
          // height='10'
          onClick={() => setIsOpenModal(true)} // คลิกที่ภาพเพื่อเปิด Modal
          loading='lazy'
          alt=''
          style={{ cursor: 'pointer' }}
        />
      ) : (
        <Typography variant='body2' color='textSecondary' align='center'>
          No Image Available
        </Typography>
      )}
      <Modal
        open={isOpenModal}
        onClose={() => setIsOpenModal(false)} // ปิด Modal เมื่อคลิกปิด
        aria-labelledby='image-modal-title'
        aria-describedby='image-modal-description'
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: 600,
            padding: 2,
            // borderRadius: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Button
            onClick={rotateImage}
            variant='contained'
            color='primary'
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10
            }}
          >
            <Rotate90DegreesCcwIcon />
          </Button>

          {large ? (
            <img
              src={large}
              width={0}
              height={0}
              sizes='100vw'
              alt='Large Preview'
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease',
                width: '100%',
                height: 'auto'
              }}
            />
          ) : (
            <Typography variant='h6' color='textSecondary'>
              No Image Available
            </Typography>
          )}
        </Box>
      </Modal>
    </>
  )
}
export default ImageItemColumn
