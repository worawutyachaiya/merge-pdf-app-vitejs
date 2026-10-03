export interface StatusInterface {
  value: string
  label: string
}

export enum StatusEnum {
  status = 'status'
}

export interface StatusForSearchInterface {
  // other
  inuseForSearch: number | '' // 0 = Cancel , 1 = Can use , 2 = Using , 3 = Can use (Used)
}
