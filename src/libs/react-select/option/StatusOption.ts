export interface StatusOptionType {
  value: number
  label: string
  icon: string
}

const StatusOption: StatusOptionType[] = [
  {
    value: 2,
    label: 'Using',
    icon: 'tabler-check'
  },

  {
    value: 1,
    label: 'Can use',
    icon: 'tabler-circle-check'
  },
  {
    value: 3,
    label: 'Can use (Used)',
    icon: 'tabler-circle'
  },
  {
    value: 0,
    label: 'Cancel',
    icon: 'tabler-x'
  }
]

export default StatusOption
