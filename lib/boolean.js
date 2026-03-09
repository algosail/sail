// boolean.js – Plain boolean comparison functions.
// Ordering: false < true

/**
 * Returns true when a is a boolean primitive.
 * @example
 * // isBool :: a -> Boolean
 * isBool (true) // => true
 */
export function isBool (a) {
  return typeof a === 'boolean'
}

/**
 * True only when both are booleans with the same value.
 * @example
 * // equals :: Boolean -> Boolean -> Boolean
 * equals (true) (true) // => true
 */
export function equals (a) {
  return (b) => isBool (a) && isBool (b) && a === b
}

/**
 * false <= false, false <= true, NOT true <= false.
 * @example
 * // lte :: Boolean -> Boolean -> Boolean
 * lte (false) (true) // => true
 */
export function lte (a) {
  return (b) => (a === false && b === false) || (a === false && b === true)
}

/**
 * Strict less-than.
 * @example
 * // lt :: Boolean -> Boolean -> Boolean
 * lt (false) (true) // => true
 */
export function lt (a) {
  return (b) => lte (a) (b) && !lte (b) (a)
}

/**
 * Greater-than-or-equal.
 * @example
 * // gte :: Boolean -> Boolean -> Boolean
 * gte (true) (false) // => true
 */
export function gte (a) {
  return (b) => lte (b) (a)
}

/**
 * Strict greater-than.
 * @example
 * // gt :: Boolean -> Boolean -> Boolean
 * gt (true) (false) // => true
 */
export function gt (a) {
  return (b) => lte (b) (a) && !lte (a) (b)
}

/**
 * Returns the smaller of the two booleans.
 * @example
 * // min :: Boolean -> Boolean -> Boolean
 * min (true) (false) // => false
 */
export function min (a) {
  return (b) => (lte (a) (b) ? a : b)
}

/**
 * Returns the larger of the two booleans.
 * @example
 * // max :: Boolean -> Boolean -> Boolean
 * max (true) (false) // => true
 */
export function max (a) {
  return (b) => (lte (b) (a) ? a : b)
}

/**
 * Clamps a value between lo and hi.
 * @example
 * // clamp :: Boolean -> Boolean -> Boolean -> Boolean
 * clamp (false) (true) (false) // => false
 */
export function clamp (lo) {
  return (hi) => (x) => (lte (x) (lo) ? lo : lte (hi) (x) ? hi : x)
}
