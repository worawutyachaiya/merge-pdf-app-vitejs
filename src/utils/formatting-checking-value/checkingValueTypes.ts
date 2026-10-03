const is_Null_Undefined_Blank = (value: unknown): boolean => {
  return value === undefined || value === null || value.length === 0
}

const formatToNumberIfNanThenReturnBlank = (value: unknown): number | '' => {
  if (typeof value === 'undefined' || value == null || value.trim() == '') {
    return ''
  } else {
    return Number(value)
  }
}

const formatToDecimalDisplay = (value: unknown, countDecimal: number = 4): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return ''
  }

  return Number(value)
    .toFixed(countDecimal)
    .replace(/\.?0+$/, '')
}

function formatNumber(value: unknown, decimals = 2, useGrouping = true, unit = '', displayIsNaN = '') {
  // ตรวจสอบค่าไม่ถูกต้อง
  if (value === null || value === undefined || value === '') {
    return displayIsNaN
  }

  const num = Number(value)

  // ใช้ Number.isNaN แทน isNaN (ปลอดภัยกว่า)
  if (Number.isNaN(num) || !isFinite(num)) {
    return displayIsNaN
  }

  // ใช้ Intl.NumberFormat สำหรับการจัดรูปแบบที่สมบูรณ์
  const formatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: useGrouping
  })

  const formatted = formatter.format(num)
  return unit ? `${formatted}${unit}` : formatted
}

export { is_Null_Undefined_Blank, formatToNumberIfNanThenReturnBlank, formatToDecimalDisplay, formatNumber }
