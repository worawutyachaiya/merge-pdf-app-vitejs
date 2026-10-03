export const safeJsonParse = <T>(str: string) => {
  try {
    const jsonValue: T = JSON.parse(str)

    return jsonValue
  } catch (e) {
    return undefined
  }
}

// const safeJsonParse: <T>(str: string) => T | undefined ✅
