import * as M from './maybe.js'

/**
 * Returns the value if non-nil, otherwise null.
 * @example
 * // nil :: a -> Nil a
 * nil (undefined) // => null
 */
export function nil (a) {
  return isNotNil (a) ? a : null
}

/**
 * Returns the empty nil value (null).
 * @example
 * // init :: () -> Nil never
 * init () // => null
 */
export function init () {
  return null
}

/**
 * Returns the value if non-nil and predicate holds, otherwise null.
 * @example
 * // fromPredicate :: (a -> Boolean) -> Nil a -> Nil a
 * fromPredicate (x => x > 0) (5) // => 5
 */
export function fromPredicate (predicate) {
  return (ta) => (isNotNil (ta) && predicate (ta) ? ta : null)
}

/**
 * Converts Nothing to null, Just(a) to a.
 * @example
 * // fromMaybe :: Maybe a -> Nil a
 * fromMaybe (just (1)) // => 1
 */
export function fromMaybe (ua) {
  return M.isJust (ua) ? ua.value : null
}

/**
 * Returns true for null or undefined.
 * @example
 * // isNil :: Nil a -> Boolean
 * isNil (null) // => true
 */
export function isNil (ta) {
  return ta === undefined || ta === null
}

/**
 * Returns true for any value that is not null or undefined.
 * @example
 * // isNotNil :: Nil a -> Boolean
 * isNotNil (0) // => true
 */
export function isNotNil (ta) {
  return !isNil (ta)
}
