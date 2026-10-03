import { components } from 'react-select'

const OptionComponent = ({ data, ...props }) => {
  const Icon = data.icon

  return (
    <components.Option {...props}>
      {data.label}
      <i />
    </components.Option>
  )
}

export default OptionComponent
