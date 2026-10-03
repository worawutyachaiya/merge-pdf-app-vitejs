import { useState } from 'react'

import type { GroupBase, Props } from 'react-select'
import Select, { components } from 'react-select'

import { twMerge } from 'tailwind-merge'

import { IconButton } from '@mui/material'

import type { StatusOptionType } from '@/libs/react-select/option/StatusOption'
type SelectCustomProps = {
  label?: string
  error?: boolean | undefined
  helperText?: string
}

function SelectCustom<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
  props: SelectCustomProps & Props<Option, IsMulti, Group>
) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isDisabledBackground = props?.isDisabled ? 'disabled-mui-color' : ''
  const isDisabledText = props?.isDisabled ? 'disabled-mui-text-color' : ''

  const activeClass = isMenuOpen ? 'custom-select-label-active' : ''
  const isErrorClassText = props?.error ? 'error-mui-color' : ''
  const isErrorClassBorder = props?.error ? 'error-border' : ''

  return (
    <>
      <div className='flex flex-col'>
        <label
          htmlFor={props.name}
          className={twMerge('custom-select-label w-fit', activeClass, isErrorClassText, isDisabledText)}
        >
          {props?.label ?? ''}
        </label>
        <Select
          menuPortalTarget={document.body}
          menuPosition='fixed'
          {...props}
          classNamePrefix={props.classNamePrefix ?? 'select'}
          className={twMerge('custom-select rounded-md', isErrorClassBorder, isDisabledBackground)}
          onMenuOpen={() => {
            setIsMenuOpen(true)
          }}
          onMenuClose={() => {
            setIsMenuOpen(false)
          }}
          components={{
            Option: props => {
              const data = props.data as StatusOptionType
              const iconClassName = data?.icon || ''

              return (
                <components.Option {...props}>
                  {iconClassName && (
                    <IconButton className='text-textPrimary'>
                      <i className={`${iconClassName} w-5 h-5`} />
                    </IconButton>
                  )}
                  {data.label}
                </components.Option>
              )
            }
          }}
        />
        {props?.error && <span className={twMerge('custom-error-message', isErrorClassText)}>{props.helperText}</span>}
      </div>
    </>
  )
}

export default SelectCustom
