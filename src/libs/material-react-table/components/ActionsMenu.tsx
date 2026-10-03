// React Imports
import type { Dispatch, MouseEvent, ReactNode, SetStateAction } from 'react'
import { useState } from 'react'

// MUI Imports
import { Divider, ListItemIcon, ListItemText } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import { useCheckPermission } from '@/_template/CheckPermission'
import type { MRT_Row, MRT_RowData } from 'material-react-table'

const ITEM_HEIGHT = 48

interface ActionsMenuProps<T extends MRT_RowData> {
  row: MRT_Row<T>
  setOpenModalEdit?: Dispatch<SetStateAction<boolean>>
  setOpenModalDelete: Dispatch<SetStateAction<boolean>>
  //setOpenModalView: Dispatch<SetStateAction<boolean>>
  rowSelected: MRT_Row<T> | null
  setRowSelected: Dispatch<SetStateAction<MRT_Row<T> | null>>
  children?: ReactNode
  MENU_ID: number
  isNeedEdit?: boolean
  isNeedDelete?: boolean
  handleClickOpenModalView?: (row: MRT_Row<T>) => void
  isNeedViewEyeIcon?: boolean
}

const ActionsMenu = <T extends MRT_RowData>({
  row,
  setOpenModalEdit,
  setRowSelected,
  setOpenModalDelete,
  //setOpenModalView,
  children,
  MENU_ID,
  isNeedEdit = true,
  isNeedDelete = true,
  handleClickOpenModalView,
  isNeedViewEyeIcon = false
}: ActionsMenuProps<T>) => {
  // States
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const checkPermission = useCheckPermission()

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setRowSelected(null)
    setAnchorEl(null)
  }

  const onClickEdit = () => {
    setRowSelected(row)

    if (setOpenModalEdit) {
      setOpenModalEdit(true)
    }

    setAnchorEl(null)
  }

  const onClickDelete = () => {
    setRowSelected(row)
    setOpenModalDelete(true)
    setAnchorEl(null)
  }

  return (
    <>
      {/* <IconButton>
        <i
          className='tabler-eye text-[22px] text-textSecondary'
          onClick={() => {
            setRowSelected(row)
            setOpenModalView(true)
          }}
        />
      </IconButton> */}
      {isNeedViewEyeIcon && (
        <IconButton onClick={() => handleClickOpenModalView && handleClickOpenModalView(row)}>
          <i className='tabler-eye text-[22px] text-textSecondary' />
        </IconButton>
      )}
      {(isNeedEdit || isNeedDelete) &&
      (row?.original?.inuseForSearch === 1 || row?.original?.inuseForSearch === 3 || row?.original?.INUSE === 1) ? (
        <IconButton aria-label='more' aria-controls='long-menu' aria-haspopup='true' onClick={handleClick}>
          <i className='tabler-dots-vertical' />
        </IconButton>
      ) : null}
      <Menu
        keepMounted
        id='long-menu'
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        slotProps={{ paper: { style: { maxHeight: ITEM_HEIGHT * 4.5 } } }}
      >
        {isNeedEdit && (
          <MenuItem
            onClick={() => {
              if (checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_UPDATE')) {
                onClickEdit()
              }
            }}
            disabled={row?.original?.INUSE === 3}
          >
            <ListItemIcon>
              <i className='tabler-edit text-xl' />
            </ListItemIcon>
            <ListItemText primary='Edit' />
          </MenuItem>
        )}
        {children}
        {isNeedEdit && isNeedDelete && <Divider />}
        {isNeedDelete && (
          <MenuItem
            onClick={() => {
              if (checkPermission(Number(import.meta.env.VITE_APPLICATION_ID), MENU_ID, 'IS_DELETE')) {
                onClickDelete()
              }
            }}
          >
            <ListItemIcon>
              <i className='tabler-trash text-xl text-red-600' />
            </ListItemIcon>
            <ListItemText primary='Delete' />
          </MenuItem>
        )}
      </Menu>
    </>
  )
}

export default ActionsMenu
