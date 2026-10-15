export interface AccountingPerson {
  employeeCode: string
  name: string
  email: string
}

export interface EmailSettings {
  revisionNo: number
  scheduleTime: string
  recipients: AccountingPerson[]
}
