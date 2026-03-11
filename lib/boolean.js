// boolean.js
// Boolean type guard and equality.

/**
 * Returns `true` only for the boolean primitives `true` and `false`, not for truthy or
 * falsy non-boolean values. JavaScript's loose type coercion makes it easy to confuse
 * `0`, `''`, or `null` with `false` — this guard ensures you are working with an actual
 * boolean. Use it in `filter` to extract booleans from mixed-type arrays, or as a
 * precondition before calling `equals`.
 * @example
 * // isBool :: a -> Boolean
 * isBool (true)
 * // => true
 * isBool (1)
 * // => false
 * isBool (null)
 * // => false
 */
export function isBool (a) {
  return typeof a === 'boolean'
}

/**
 * Returns `true` only when both arguments are booleans with the same value. Unlike
 * `===`, this first checks that both arguments are actual booleans, so it will not
 * accidentally return `true` for non-boolean values that compare equal. The curried
 * form `equals (true)` produces a reusable "is true" predicate for `filter` or
 * conditional branching.
 * @example
 * // equals :: Boolean -> Boolean -> Boolean
 * equals (true) (true)
 * // => true
 * equals (true) (false)
 * // => false
 * equals (true) (1)
 * // => false
 */
export function equals (a) {
  return (b) => isBool (a) && isBool (b) && a === b
}
