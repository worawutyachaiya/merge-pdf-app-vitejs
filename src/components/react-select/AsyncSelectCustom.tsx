import { Children, isValidElement, useState } from 'react'

import type { AsyncProps } from 'react-select/async'
import type {
  GroupBase,
  InputActionMeta,
  MenuListProps,
  MultiValueProps,
  OptionProps,
  OptionsOrGroups
} from 'react-select'
import AsyncSelect from 'react-select/async'
import { components } from 'react-select'

import { twMerge } from 'tailwind-merge'
import { IconButton, Tooltip } from '@mui/material'

type AsyncSelectCustomProps<Option> = {
  label: string
  error?: boolean | undefined
  helperText?: string
  showSearchIcon?: boolean
  searchIconTooltip?: string
  onSearchIconClick?: () => void
  maxVisibleMultiValues?: number
  showSelectedOptionsFirst?: boolean
  allowTextSearch?: boolean
  getTextSearchValue?: (option: Option) => string
  onTextSearchSubmit?: (value: string) => void
}

function AsyncSelectCustom<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(props: AsyncSelectCustomProps<Option> & AsyncProps<Option, IsMulti, Group>) {
  const {
    showSearchIcon = false,
    searchIconTooltip = 'Search',
    onSearchIconClick,
    maxVisibleMultiValues = 2,
    showSelectedOptionsFirst = true,
    allowTextSearch = false,
    getTextSearchValue,
    onTextSearchSubmit,
    components: selectComponents,
    ...selectProps
  } = props

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isTextSearchEditing, setIsTextSearchEditing] = useState(false)
  const [textSearchInputValue, setTextSearchInputValue] = useState('')

  const isDisabledBackground = props?.isDisabled ? 'disabled-mui-color' : ''
  const isDisabledText = props?.isDisabled ? 'disabled-mui-text-color' : ''

  const activeClass = isMenuOpen ? 'custom-select-label-active' : ''
  const isErrorClassText = props?.error ? 'error-mui-color' : ''
  const isErrorClassBorder = props?.error ? 'error-border' : ''

  const CompactMultiValue = (multiValueProps: MultiValueProps<Option, IsMulti, Group>) => {
    if (multiValueProps.index < maxVisibleMultiValues) {
      return <components.MultiValue {...multiValueProps} />
    }

    if (multiValueProps.index !== maxVisibleMultiValues) return null

    const hiddenLabels = multiValueProps
      .getValue()
      .slice(maxVisibleMultiValues)
      .map(option => multiValueProps.selectProps.getOptionLabel(option))
      .join(', ')

    return (
      <span className='custom-select-multi-overflow' title={hiddenLabels}>
        ...
      </span>
    )
  }

  const RemovableSelectedOption = (optionProps: OptionProps<Option, IsMulti, Group>) => (
    <components.Option {...optionProps}>
      <span className='flex min-w-0 items-center justify-between gap-2'>
        <span className='truncate'>{optionProps.children}</span>
        {optionProps.isSelected && (
          <span aria-hidden className='shrink-0 text-lg leading-none' title='Remove'>
            ×
          </span>
        )}
      </span>
    </components.Option>
  )

  const SelectedFirstMenuList = (menuListProps: MenuListProps<Option, IsMulti, Group>) => {
    const menuItems = Children.toArray(menuListProps.children)
    const selectedItems = menuItems.filter(
      item => isValidElement<{ isSelected?: boolean }>(item) && item.props.isSelected
    )
    const otherItems = menuItems.filter(
      item => !(isValidElement<{ isSelected?: boolean }>(item) && item.props.isSelected)
    )

    return <components.MenuList {...menuListProps}>{[...selectedItems, ...otherItems]}</components.MenuList>
  }

  const prioritizeSelectedOptions = (loadedOptions: OptionsOrGroups<Option, Group>) => {
    if (!props.isMulti || !showSelectedOptionsFirst || loadedOptions.some(option => 'options' in Object(option))) {
      return loadedOptions
    }

    const selectedValues = Array.isArray(props.value) ? [...props.value] : props.value ? [props.value as Option] : []

    if (selectedValues.length === 0) return loadedOptions

    const getOptionId = (option: Option): string | Option =>
      selectProps.getOptionValue ? selectProps.getOptionValue(option) : option
    const selectedIds = new Set(selectedValues.map(getOptionId))

    return [
      ...selectedValues,
      ...(loadedOptions as readonly Option[]).filter(option => !selectedIds.has(getOptionId(option)))
    ]
  }

  const loadOptions =
    props.isMulti && showSelectedOptionsFirst && selectProps.loadOptions
      ? (inputValue: string, callback: (options: OptionsOrGroups<Option, Group>) => void) => {
          const loadedOptions = selectProps.loadOptions?.(inputValue, options =>
            callback(prioritizeSelectedOptions(options))
          )

          return loadedOptions?.then(prioritizeSelectedOptions)
        }
      : selectProps.loadOptions

  const defaultMultiComponents = props.isMulti
    ? {
        MultiValue: CompactMultiValue,
        ...(showSelectedOptionsFirst && {
          MenuList: SelectedFirstMenuList,
          Option: RemovableSelectedOption
        })
      }
    : {}

  const mergedSelectComponents = {
    ...defaultMultiComponents,
    ...selectComponents,
    ...(showSearchIcon && {
      DropdownIndicator: (
        indicatorProps: Parameters<typeof components.DropdownIndicator<Option, IsMulti, Group>>[0]
      ) => {
        const DropdownIndicator = selectComponents?.DropdownIndicator ?? components.DropdownIndicator

        return (
          <div className='flex items-center'>
            <Tooltip title={searchIconTooltip}>
              <span>
                <IconButton
                  size='small'
                  disabled={props.isDisabled}
                  onMouseDown={event => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  onClick={event => {
                    event.preventDefault()
                    event.stopPropagation()
                    onSearchIconClick?.()
                  }}
                >
                  <i className='tabler-search text-lg' />
                </IconButton>
              </span>
            </Tooltip>
            <DropdownIndicator {...indicatorProps} />
          </div>
        )
      }
    })
  }

  const getSelectedTextSearchValue = () => {
    if (!selectProps.value || Array.isArray(selectProps.value)) return ''

    const selectedOption = selectProps.value as Option

    return getTextSearchValue?.(selectedOption) ?? selectProps.getOptionLabel?.(selectedOption) ?? ''
  }

  const handleInputChange = (newValue: string, actionMeta: InputActionMeta) => {
    const resolvedValue = selectProps.onInputChange?.(newValue, actionMeta) ?? newValue

    if (allowTextSearch && actionMeta.action === 'input-change') {
      setTextSearchInputValue(resolvedValue)
    }

    return resolvedValue
  }

  return (
    <div className='flex flex-col w-full'>
      <label
        htmlFor={props.name}
        className={twMerge('custom-select-label w-fit', activeClass, isErrorClassText, isDisabledText)}
      >
        {props.label}
      </label>
      <AsyncSelect
        menuPortalTarget={document.body}
        menuPosition='fixed'
        {...selectProps}
        classNamePrefix={selectProps.classNamePrefix ?? 'select'}
        loadOptions={loadOptions}
        inputValue={allowTextSearch ? textSearchInputValue : selectProps.inputValue}
        controlShouldRenderValue={allowTextSearch ? !isTextSearchEditing : selectProps.controlShouldRenderValue}
        onInputChange={handleInputChange}
        closeMenuOnSelect={selectProps.closeMenuOnSelect ?? !props.isMulti}
        hideSelectedOptions={selectProps.hideSelectedOptions ?? !props.isMulti}
        blurInputOnSelect={selectProps.blurInputOnSelect ?? !props.isMulti}
        className={twMerge(
          'custom-select rounded-md',
          props.isMulti && 'custom-select--compact-multi',
          isErrorClassBorder,
          isDisabledBackground,
          props.className
        )}
        onMenuOpen={() => {
          setIsMenuOpen(true)
        }}
        onMenuClose={() => {
          setIsMenuOpen(false)
        }}
        onFocus={event => {
          if (allowTextSearch) {
            setTextSearchInputValue(getSelectedTextSearchValue())
            setIsTextSearchEditing(true)
          }

          selectProps.onFocus?.(event)
        }}
        onBlur={event => {
          if (allowTextSearch) {
            setTextSearchInputValue('')
            setIsTextSearchEditing(false)
          }

          selectProps.onBlur?.(event)
        }}
        onKeyDown={event => {
          const submittedValue = textSearchInputValue.trim()

          if (allowTextSearch && onTextSearchSubmit && event.key === 'Enter' && submittedValue) {
            event.preventDefault()
            event.stopPropagation()
            onTextSearchSubmit(submittedValue)
            setTextSearchInputValue('')
            setIsTextSearchEditing(false)
            const inputElement = event.target as HTMLInputElement

            inputElement.blur()

            return
          }

          selectProps.onKeyDown?.(event)
        }}
        components={mergedSelectComponents}
      />
      {props?.error && <span className={twMerge('custom-error-message', isErrorClassText)}>{props.helperText}</span>}
    </div>
  )
}

export default AsyncSelectCustom
