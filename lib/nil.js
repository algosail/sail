// nil.js – Nullable value utilities (null | undefined treated as "absent").
// Nil a = a | null | undefined

import * as M from './maybe.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Returns null — the canonical empty Nil value.
 * @example
 * // empty :: () -> null
 * empty () // => null
 */
export function empty () {
  return null
}

/**
 * Returns the value if non-nil, otherwise null.
 * @example
 * // of :: a -> Nil a
 * of (1)         // => 1
 * of (null)      // => null
 * of (undefined) // => null
 */
export function of (a) {
  return isNil (a) ? null : a
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns true for null or undefined.
 * @example
 * // isNil :: a -> Boolean
 * isNil (null)      // => true
 * isNil (undefined) // => true
 * isNil (0)         // => false
 */
export function isNil (a) {
  return a === null || a === undefined
}

/**
 * Returns true for any value that is not null or undefined.
 * @example
 * // isNotNil :: a -> Boolean
 * isNotNil (0)    // => true
 * isNotNil (null) // => false
 */
export function isNotNil (a) {
  return !isNil (a)
}

// =============================================================================
// Constructors from other types
// =============================================================================

/**
 * Returns the value if the predicate holds, otherwise null.
 * @example
 * // fromPredicate :: (a -> Boolean) -> a -> Nil a
 * fromPredicate (x => x > 0) (5)  // => 5
 * fromPredicate (x => x > 0) (-1) // => null
 */
export function fromPredicate (pred) {
  return (a) => (isNotNil (a) && pred (a) ? a : null)
}

/**
 * Converts Just(a) to a, Nothing to null.
 * @example
 * // fromMaybe :: Maybe a -> Nil a
 * fromMaybe (M.just (1))   // => 1
 * fromMaybe (M.nothing ()) // => null
 */
export function fromMaybe (ma) {
  return M.isJust (ma) ? ma.value : null
}

// =============================================================================
// Transformations
// =============================================================================

/**
 * Applies f to the value if non-nil, otherwise propagates null.
 * @example
 * // map :: (a -> b) -> Nil a -> Nil b
 * map (x => x + 1) (5)    // => 6
 * map (x => x + 1) (null) // => null
 */
export function map (f) {
  return (a) => (isNil (a) ? null : f (a))
}

/**
 * Applies f (which may itself return null) to the value if non-nil.
 * @example
 * // chain :: (a -> Nil b) -> Nil a -> Nil b
 * chain (x => x > 0 ? x * 2 : null) (5)    // => 10
 * chain (x => x > 0 ? x * 2 : null) (null) // => null
 */
export function chain (f) {
  return (a) => (isNil (a) ? null : f (a))
}

/**
 * Returns the value if non-nil, otherwise the provided default.
 * @example
 * // getOrElse :: a -> Nil a -> a
 * getOrElse (0) (5)    // => 5
 * getOrElse (0) (null) // => 0
 */
export function getOrElse (def) {
  return (a) => (isNil (a) ? def : a)
}

/**
 * Returns the value if non-nil, otherwise calls the thunk.
 * @example
 * // getOrElse_ :: (() -> a) -> Nil a -> a
 * getOrElse_ (() => 0) (null) // => 0
 */
export function getOrElse_ (thunk) {
  return (a) => (isNil (a) ? thunk () : a)
}

/**
 * Returns the first non-nil value, or null if both are nil.
 * @example
 * // alt :: Nil a -> Nil a -> Nil a
 * alt (5) (null) // => 5
 * alt (null) (3) // => 3
 * alt (null) (null) // => null
 */
export function alt (second) {
  return (first) => (isNotNil (first) ? first : second)
}

// =============================================================================
// Conversions
// =============================================================================

/**
 * Converts a Nil value to Maybe — Just for non-nil, Nothing for nil.
 * @example
 * // toMaybe :: Nil a -> Maybe a
 * toMaybe (5)    // => just(5)
 * toMaybe (null) // => nothing()
 */
export function toMaybe (a) {
  return isNil (a) ? M.nothing () : M.just (a)
}
