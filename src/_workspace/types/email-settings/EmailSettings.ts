export interface AccountingPerson {
  employeeCode: string
  name: string
  email: string
}

export interface EmailSettings {
  scheduleTime: string
  recipients: AccountingPerson[]
}
