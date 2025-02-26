import { trueValues, falseValues } from '@baserow/modules/core/utils/constants'

/**
 * Ensures that the value is an integer or can be converted to an integer.
 * @param {number|string} value - The value to ensure as an integer.
 * @returns {number} The value as an integer if conversion is successful.
 * @throws {Error} If the value is not a valid integer or convertible to an integer.
 */
export const ensureInteger = (value) => {
  if (Number.isInteger(value)) {
    return value
  }
  if (typeof value === 'string' || value instanceof String) {
    if (/^(-|\+)?(\d+|Infinity)$/.test(value)) {
      return Number(value)
    }
  }
  throw new Error('Value is not a valid integer or convertible to an integer.')
}

/**
 * Ensures that the value is a positive integer.
 * @param {*} value - The value to ensure is a positive integer.
 * @returns {number} The value as an integer if conversion is successful.
 * @throws {Error} If the value is not a valid integer or convertible to an integer.
 */
export const ensurePositiveInteger = (value) => {
  const validInteger = ensureInteger(value)
  if (validInteger < 0) {
    throw new Error('Value is not a positive integer.')
  }
  return validInteger
}

/**
 * Ensures that the value is a string or try to convert it.
 * @param {*} value - The value to ensure as a string.
 * @param {*} allowEmpty - Whether we should throw an error if `value` is empty.
 * @returns {string} The value as a string.
 * @throws {Error} If !allowEmpty and the `value` is empty.
 */
export const ensureString = (value, allowEmpty = true) => {
  if (value === null || value === undefined || value === '') {
    if (!allowEmpty) {
      throw new Error('A valid String is required.')
    }
    return ''
  }
  return `${value}`
}

/**
 * Ensures that the value is a non-empty string or try to convert it.
 * @param {*} value - The value to ensure as a string, which can't be blank.
 * @returns {string} The value as a string
 * @throws {Error} If `value` is empty.
 */
export const ensureNonEmptyString = (value) => {
  return ensureString(value, false)
}

/**
 * Ensures that the value is a boolean or convert it.
 * @param {*} value - The value to ensure as a boolean.
 * @returns {boolean} The value as a boolean.
 */
export const ensureBoolean = (value) => {
  if (trueValues.includes(value)) {
    return true
  } else if (falseValues.includes(value)) {
    return false
  }
  throw new Error('Value is not a valid boolean or convertible to a boolean.')
}
