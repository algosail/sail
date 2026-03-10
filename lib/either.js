// either.js – The Either monad (Left | Right).

import { just, nothing } from './maybe.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Wraps a value in the Left constructor.
 * @example
 * // left :: a -> Either a b
 * left ('err') // => { tag: 'left', left: 'err' }
 */
export function left (l) {
  return { tag: 'left', left: l }
}

/**
 * Wraps a value in the Right constructor.
 * @example
 * // right :: b -> Either a b
 * right (42) // => { tag: 'right', right: 42 }
 */
export function right (r) {
  return { tag: 'right', right: r }
}

/**
 * Right when value is non-null/undefined; Left via thunk otherwise.
 * @example
 * // fromNullable :: (() -> a) -> b -> Either a b
 * fromNullable (() => 'missing') (null) // => left('missing')
 * fromNullable (() => 'missing') (42)   // => right(42)
 */
export function fromNullable (fe) {
  return (a) => (a !== null && a !== undefined) ? right (a) : left (fe ())
}

/**
 * Runs fn; Right on success, Left via curried onError on throw.
 * @example
 * // tryCatch :: ((...a) -> b) -> (Error -> Array a -> c) -> ...a -> Either c b
 * tryCatch (JSON.parse) (e => _ => e.message) ('{"a":1}') // => right({ a: 1 })
 * tryCatch (JSON.parse) (e => _ => e.message) ('bad')     // => left('...')
 */
export function tryCatch (fn) {
  return (onError) => (...args) => {
    try {
      return right (fn (...args))
    } catch (e) {
      return left (onError (e) (args))
    }
  }
}

/**
 * Right when predicate holds; Left via onFalse otherwise. Fully curried.
 * @example
 * // fromPredicate :: (a -> Boolean) -> (a -> b) -> a -> Either b a
 * fromPredicate (x => x > 0) (x => `${x} is not positive`) (3)  // => right(3)
 * fromPredicate (x => x > 0) (x => `${x} is not positive`) (-1) // => left('-1 is not positive')
 */
export function fromPredicate (pred) {
  return (onFalse) => (a) => (pred (a) ? right (a) : left (onFalse (a)))
}

// =============================================================================
// Guards
// =============================================================================

/**
 * True when the value is a Left.
 * @example
 * // isLeft :: a -> Boolean
 * isLeft (left (1))  // => true
 * isLeft (right (1)) // => false
 */
export function isLeft (a) {
  return Boolean (a?.tag === 'left')
}

/**
 * True when the value is a Right.
 * @example
 * // isRight :: a -> Boolean
 * isRight (right (1)) // => true
 * isRight (left (1))  // => false
 */
export function isRight (a) {
  return Boolean (a?.tag === 'right')
}

/**
 * True when the value is either a Left or a Right.
 * @example
 * // isEither :: a -> Boolean
 * isEither (right (1)) // => true
 * isEither (left ('e')) // => true
 * isEither (42)         // => false
 */
export function isEither (a) {
  return isLeft (a) || isRight (a)
}

// =============================================================================
// Destructors
// =============================================================================

/**
 * Curried case-fold on Either.
 * @example
 * // either :: (a -> c) -> (b -> c) -> Either a b -> c
 * either (l => `err: ${l}`) (r => r * 2) (right (21)) // => 42
 * either (l => `err: ${l}`) (r => r * 2) (left ('x')) // => 'err: x'
 */
export function either (onLeft) {
  return (onRight) => (e) =>
    isLeft (e) ? onLeft (e.left) : onRight (e.right)
}

/**
 * Extracts the Left value, or returns the default for Right.
 * @example
 * // fromLeft :: a -> Either a b -> a
 * fromLeft ('def') (left ('x'))  // => 'x'
 * fromLeft ('def') (right (1))   // => 'def'
 */
export function fromLeft (def) {
  return (e) => (isLeft (e) ? e.left : def)
}

/**
 * Extracts the Right value, or returns the default for Left.
 * @example
 * // fromRight :: b -> Either a b -> b
 * fromRight (0) (right (42)) // => 42
 * fromRight (0) (left ('x')) // => 0
 */
export function fromRight (def) {
  return (e) => (isRight (e) ? e.right : def)
}

/**
 * Extracts the value regardless of constructor when both sides share a type.
 * @example
 * // fromEither :: Either a a -> a
 * fromEither (left (42))  // => 42
 * fromEither (right (42)) // => 42
 */
export function fromEither (e) {
  return isLeft (e) ? e.left : e.right
}

/**
 * Reduces a Right with a curried binary function and initial; returns initial for Left.
 * @example
 * // fold :: (b -> a -> b) -> b -> Either l a -> b
 * fold (acc => x => acc + x) (0) (right (5)) // => 5
 * fold (acc => x => acc + x) (0) (left ('x')) // => 0
 */
export function fold (f) {
  return (init) => (e) => (isLeft (e) ? init : f (init) (e.right))
}

// =============================================================================
// Array utilities
// =============================================================================

/**
 * Filters to Left values and extracts them.
 * @example
 * // lefts :: Array (Either a b) -> Array a
 * lefts ([left (1), right (2), left (3)]) // => [1, 3]
 */
export function lefts (es) {
  return es.filter (isLeft).map ((e) => e.left)
}

/**
 * Filters to Right values and extracts them.
 * @example
 * // rights :: Array (Either a b) -> Array b
 * rights ([left (1), right (2), right (3)]) // => [2, 3]
 */
export function rights (es) {
  return es.filter (isRight).map ((e) => e.right)
}

/**
 * Splits an array into [rights, lefts], extracting the inner values.
 * @example
 * // partition :: Array (Either a b) -> [Array b, Array a]
 * partition ([right (1), left ('e'), right (2)]) // => [[1, 2], ['e']]
 */
export function partition (es) {
  const rs = []
  const ls = []
  for (const e of es) (isRight (e) ? rs : ls).push (isRight (e) ? e.right : e.left)
  return [rs, ls]
}

// =============================================================================
// Conversions
// =============================================================================

/**
 * Lifts a throwing unary function into a total Either-returning one.
 * The error is placed in Left as-is (typically an Error object).
 * For custom error mapping use `tryCatch`.
 * @example
 * // encase :: (a -> b) -> a -> Either Error b
 * encase (JSON.parse) ('{"a":1}') // => right({ a: 1 })
 * encase (JSON.parse) ('bad')     // => left(SyntaxError)
 */
export function encase (f) {
  return (x) => {
    try {
      return right (f (x))
    } catch (err) {
      return left (err)
    }
  }
}

/**
 * Converts Right to Just and Left to Nothing.
 * @example
 * // toMaybe :: Either a b -> Maybe b
 * toMaybe (right (1))   // => just(1)
 * toMaybe (left ('err')) // => nothing()
 */
export function toMaybe (e) {
  return isRight (e) ? just (e.right) : nothing ()
}

/**
 * Swaps Left and Right.
 * @example
 * // swap :: Either a b -> Either b a
 * swap (left (1))  // => right(1)
 * swap (right (1)) // => left(1)
 */
export function swap (a) {
  return isLeft (a) ? right (a.left) : left (a.right)
}

// =============================================================================
// Functor / Bifunctor
// =============================================================================

/**
 * Maps over the Right value, leaving Left untouched.
 * @example
 * // map :: (b -> c) -> Either a b -> Either a c
 * map (x => x + 1) (right (1))   // => right(2)
 * map (x => x + 1) (left ('err')) // => left('err')
 */
export function map (f) {
  return (a) => (isLeft (a) ? a : right (f (a.right)))
}

/**
 * Maps over the Left value, leaving Right untouched.
 * @example
 * // mapLeft :: (a -> c) -> Either a b -> Either c b
 * mapLeft (x => x + '!') (left ('err'))  // => left('err!')
 * mapLeft (x => x + '!') (right (1))     // => right(1)
 */
export function mapLeft (f) {
  return (a) => (isLeft (a) ? left (f (a.left)) : a)
}

/**
 * Maps Left with the first function and Right with the second. Fully curried.
 * @example
 * // bimap :: (a -> c) -> (b -> d) -> Either a b -> Either c d
 * bimap (l => l + '!') (r => r + 1) (right (2)) // => right(3)
 * bimap (l => l + '!') (r => r + 1) (left ('x')) // => left('x!')
 */
export function bimap (fl) {
  return (fr) => (a) => (isLeft (a) ? left (fl (a.left)) : right (fr (a.right)))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Applies a function in a Right to a value in a Right.
 * @example
 * // ap :: Either a (b -> c) -> Either a b -> Either a c
 * ap (right (x => x + 1)) (right (2))   // => right(3)
 * ap (left ('err')) (right (2))          // => left('err')
 */
export function ap (efn) {
  return (a) =>
    isLeft (efn) ? efn : isLeft (a) ? a : right (efn.right (a.right))
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Monadic bind over Right (chain).
 * @example
 * // chain :: (b -> Either a c) -> Either a b -> Either a c
 * chain (x => right (x + 1)) (right (2))   // => right(3)
 * chain (x => right (x + 1)) (left ('err')) // => left('err')
 */
export function chain (f) {
  return (a) => (isLeft (a) ? a : f (a.right))
}

/**
 * Monadic bind over Left.
 * @example
 * // chainLeft :: (a -> Either c b) -> Either a b -> Either c b
 * chainLeft (e => left (e + '!')) (left ('x'))  // => left('x!')
 * chainLeft (e => left (e + '!')) (right (1))   // => right(1)
 */
export function chainLeft (f) {
  return (a) => (isRight (a) ? a : f (a.left))
}

/**
 * Runs f on the Right value for a potential short-circuit Left;
 * returns the original Right if f returns Right.
 * @example
 * // chainFirst :: (b -> Either a c) -> Either a b -> Either a b
 * chainFirst (x => left ('stop')) (right (1)) // => left('stop')
 * chainFirst (x => right ('ok'))  (right (1)) // => right(1)
 * chainFirst (x => left ('stop')) (left ('e')) // => left('e')
 */
export function chainFirst (f) {
  return (a) => {
    if (isLeft (a)) return a
    const b = f (a.right)
    return isLeft (b) ? b : a
  }
}

// =============================================================================
// Alt / Foldable / Traversable
// =============================================================================

/**
 * Returns the first Right, or the second if both are Left.
 * @example
 * // alt :: Either a b -> Either a b -> Either a b
 * alt (right (2)) (left ('x'))  // => right(2)
 * alt (left ('y')) (right (1))  // => right(1)
 * alt (right (2)) (right (1))   // => right(1)
 */
export function alt (b) {
  return (a) => (isLeft (a) ? b : a)
}

/**
 * Applicative traversal over the Right value.
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> Either l a -> f (Either l b)
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, x]) (right (1)) // => [right(1), right(1)]
 */
export function traverse (apOf) {
  return (apMap) => (f) => (e) =>
    isLeft (e) ? apOf (e) : apMap (right) (f (e.right))
}
