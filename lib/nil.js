// nil.js
// Nullable value utilities (null | undefined treated as "absent").
// Nil a = a | null | undefined

import * as M from './maybe.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Returns `null`, the canonical representation of an absent `Nil` value. Having a
 * named constructor makes it explicit in code that `null` is being used intentionally
 * as an empty or absent value, rather than being an accidental omission or
 * uninitialised variable.
 * @example
 * // empty :: () -> null
 * empty ()
 * // => null
 */
export function empty () {
  return null
}

/**
 * Lifts a value into the `Nil` context, normalising `undefined` to `null`. This
 * ensures that functions which may return either `null` or `undefined` both produce a
 * consistent `null`, simplifying downstream checks that only need to guard against
 * one absent value.
 * @example
 * // of :: a -> Nil a
 * of (1)
 * // => 1
 * of (null)
 * // => null
 * of (undefined)
 * // => null
 */
export function of (a) {
  return isNil (a) ? null : a
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns `true` for both `null` and `undefined`, treating them as interchangeable
 * absent values. JavaScript's dual-nil design often forces you to check both; this
 * predicate eliminates the repetition. Pass it directly to `filter` to remove absent
 * values from an array, or use it as a guard before accessing object properties.
 * @example
 * // isNil :: a -> Boolean
 * isNil (null)
 * // => true
 * isNil (undefined)
 * // => true
 * isNil (0)
 * // => false
 */
export function isNil (a) {
  return a === null || a === undefined
}

/**
 * Returns `true` for any value that is not `null` or `undefined`. This is the
 * complement of `isNil` and is the most common predicate for filtering out absent
 * values in a concise, pipeline-friendly way — for example, `array.filter (isNotNil)`
 * removes all nil entries without writing a lambda.
 * @example
 * // isNotNil :: a -> Boolean
 * isNotNil (0)
 * // => true
 * isNotNil (null)
 * // => false
 */
export function isNotNil (a) {
  return !isNil (a)
}

// =============================================================================
// Constructors from other types
// =============================================================================

/**
 * Returns the value if it is non-nil and the predicate returns `true`, otherwise
 * returns `null`. This is a compact way to combine an existence check with a domain
 * check into a single step, avoiding nested `if` statements in transformation
 * pipelines. Already-nil values always return `null` regardless of the predicate.
 * @example
 * // fromPredicate :: (a -> Boolean) -> a -> Nil a
 * fromPredicate (x => x > 0) (5)
 * // => 5
 * fromPredicate (x => x > 0) (-1)
 * // => null
 */
export function fromPredicate (pred) {
  return (a) => (isNotNil (a) && pred (a) ? a : null)
}

/**
 * Converts a `Maybe` value to a `Nil` value by extracting the inner value from `Just`
 * or returning `null` for `Nothing`. Useful when bridging code that uses `Maybe` for
 * optional values with code that uses `null` — for example, when writing to a database
 * or API that expects `null` for absent fields.
 * @example
 * // fromMaybe :: Maybe a -> Nil a
 * fromMaybe (M.just (1))
 * // => 1
 * fromMaybe (M.nothing ())
 * // => null
 */
export function fromMaybe (ma) {
  return M.isJust (ma) ? ma.value : null
}

// =============================================================================
// Transformations
// =============================================================================

/**
 * Applies a transformation function to the value if it is non-nil, otherwise
 * propagates `null`. This mirrors the `Maybe` functor's `map` and makes it safe to
 * chain transformations over potentially-absent values without sprinkling explicit
 * null checks throughout your code.
 * @example
 * // map :: (a -> b) -> Nil a -> Nil b
 * map (x => x + 1) (5)
 * // => 6
 * map (x => x + 1) (null)
 * // => null
 */
export function map (f) {
  return (a) => (isNil (a) ? null : f (a))
}

/**
 * Applies a function that may itself return `null` to the value if it is non-nil,
 * flattening one level of nullability. Use this instead of `map` when the
 * transformation function already returns a `Nil` value — otherwise `map` would
 * deliver a `null` result as a valid (non-null) value, defeating nil-propagation.
 * @example
 * // chain :: (a -> Nil b) -> Nil a -> Nil b
 * chain (x => x > 0 ? x * 2 : null) (5)
 * // => 10
 * chain (x => x > 0 ? x * 2 : null) (null)
 * // => null
 */
export function chain (f) {
  return (a) => (isNil (a) ? null : f (a))
}

/**
 * Returns the value if non-nil, or the provided default value otherwise. This is the
 * standard way to terminate a `Nil` pipeline, turning an optional value into a
 * required one with a sensible fallback. Use `getOrElse_` instead if computing the
 * default is expensive and should be deferred.
 * @example
 * // getOrElse :: a -> Nil a -> a
 * getOrElse (0) (5)
 * // => 5
 * getOrElse (0) (null)
 * // => 0
 */
export function getOrElse (def) {
  return (a) => (isNil (a) ? def : a)
}

/**
 * Like `getOrElse`, but accepts a zero-argument function (thunk) for the default,
 * deferring its evaluation until the value is actually absent. This avoids computing
 * an expensive default — such as a database query result or a complex object — when
 * the primary value is already present.
 * @example
 * // getOrElse_ :: (() -> a) -> Nil a -> a
 * getOrElse_ (() => 0) (null)
 * // => 0
 * getOrElse_ (() => 42) (7)
 * // => 7
 */
export function getOrElse_ (thunk) {
  return (a) => (isNil (a) ? thunk () : a)
}

/**
 * Returns the first non-nil value, or `null` if both are nil. This implements an
 * OR-like fallback: if the primary value (second argument) is absent, the secondary
 * value (first argument) is used instead. Chain multiple `alt` calls to implement a
 * priority list of optional sources.
 * @example
 * // alt :: Nil a -> Nil a -> Nil a
 * alt (5) (null)
 * // => 5
 * alt (null) (3)
 * // => 3
 * alt (null) (null)
 * // => null
 */
export function alt (second) {
  return (first) => (isNotNil (first) ? first : second)
}

// =============================================================================
// Conversions
// =============================================================================

/**
 * Converts a `Nil` value to a `Maybe` — `Just(a)` for a non-nil value and `Nothing`
 * for `null` or `undefined`. Use this to move from the `Nil` world into the `Maybe`
 * world when you need `Maybe`'s richer set of combinators (`chain`, `map`, `ap`, etc.)
 * for further composition.
 * @example
 * // toMaybe :: Nil a -> Maybe a
 * toMaybe (5)
 * // => just(5)
 * toMaybe (null)
 * // => nothing()
 */
export function toMaybe (a) {
  return isNil (a) ? M.nothing () : M.just (a)
}
