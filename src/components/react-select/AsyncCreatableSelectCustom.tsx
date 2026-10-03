import { useState } from 'react'

import type { GroupBase } from 'react-select'
import type { AsyncCreatableProps } from 'react-select/async-creatable'
import AsyncCreatableSelect from 'react-select/async-creatable'

import { twMerge } from 'tailwind-merge'

type AsyncCreatableSelectCustomProps = {
  label: string
  inputId?: string
  error?: boolean | undefined
  helperText?: string
}

function AsyncCreatableSelectCustom<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(props: AsyncCreatableSelectCustomProps & AsyncCreatableProps<Option, IsMulti, Group>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const activeClass = isMenuOpen ? 'custom-select-label-active' : ''
  const isErrorClassText = props?.error ? 'error-mui-color' : ''
  const isErrorClassBorder = props?.error ? 'error-border' : ''

  return (
    <>
      <label htmlFor={props.inputId} className={twMerge('custom-select-label', activeClass, isErrorClassText)}>
        {props.label}
      </label>
      <AsyncCreatableSelect
        menuPortalTarget={document.body}
        menuPosition='fixed'
        {...props}
        className={twMerge('custom-select', isErrorClassBorder)}
        onMenuOpen={() => {
          setIsMenuOpen(true)
        }}
        onMenuClose={() => {
          setIsMenuOpen(false)
        }}
      />
      {props?.error && <span className={twMerge('custom-error-message', isErrorClassText)}>{props.helperText}</span>}
    </>
  )
}

export default AsyncCreatableSelectCustom
