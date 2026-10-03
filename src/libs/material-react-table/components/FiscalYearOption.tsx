const FiscalYearColumn: {
  value: number
  label: string
  color: 'default' | 'success' | 'info' | 'warning' | 'error' | 'primary' | 'secondary'
}[] = [
  {
    value: 1,
    label: 'Need',
    color: 'primary'
  },
  {
    value: 0,
    label: 'No Need',
    color: 'secondary'
  }
]

export default FiscalYearColumn
