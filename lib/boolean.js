// boolean.js – Boolean type guard and equality.

/**
 * Returns true when a is a boolean primitive.
 * @example
 * // isBool :: a -> Boolean
 * isBool (true)  // => true
 * isBool (1)     // => false
 */
export function isBool (a) {
  return typeof a === 'boolean'
}

/**
 * True only when both values are booleans with the same value.
 * @example
 * // equals :: Boolean -> Boolean -> Boolean
 * equals (true) (true)  // => true
 * equals (true) (false) // => false
 */
export function equals (a) {
  return (b) => isBool (a) && isBool (b) && a === b
}
