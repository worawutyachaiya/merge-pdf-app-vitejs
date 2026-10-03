export default function findValuesByKey(obj: any, key: any) {
  const values: any[] = []

  // Recursive function to traverse the object
  function search(obj: any) {
    // Check if the input is an object
    if (typeof obj === 'object' && obj !== null) {
      // Iterate through each key in the object
      for (const k in obj) {
        // If the current key matches the target key, add its value to the result
        if (k === key) {
          values.push(obj[k])
        }
        // If the current value is another object, recursively call the search function
        else if (typeof obj[k] === 'object' && obj[k] !== null) {
          search(obj[k])
        }
      }
    }
  }

  // Start the search
  search(obj)

  return values
}
