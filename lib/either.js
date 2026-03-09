// either.js – Either monad with left/right tags (lowercase).

import { just, nothing } from './maybe.js'

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
 * Right when value is non-null/undefined; Left using the thunk otherwise.
 * @example 
 * // fromNullable :: (() -> a) -> b -> Either a b
 * fromNullable (() => 'missing') (null) // => left('missing')
 */
export function fromNullable (fe) {
  return (a) => (a !== null && a !== undefined) ? right (a) : left (fe ())
}

/**
 * Runs fn; Right on success, Left via onError handler on throw.
 * @example 
 * // tryCatch :: ((...a) -> b, (Error, a) -> c) -> ...a -> Either c b
 * tryCatch (JSON.parse, e => e.message) ('bad') // => left('...')
 */
export function tryCatch (fn, onError) {
  return (...arg) => {
    try {
      return right (fn (...arg))
    } catch (e) {
      return left (onError (e, arg))
    }
  }
}

/**
 * Right when predicate is true; Left via onFalse otherwise.
 * @example 
 * // fromPredicate :: (a -> Boolean, a -> b) -> a -> Either b a
 * fromPredicate (x => x > 0, x => 'neg') (3) // => right(3)
 */
export function fromPredicate (predicate, onFalse) {
  return (a) => (predicate (a) ? right (a) : left (onFalse (a)))
}

/**
 * True when the value is a Left.
 * @example 
 * // isLeft :: a -> Boolean
 * isLeft (left (1)) // => true
 */
export function isLeft (a) {
  return Boolean (a?.tag === 'left')
}

/**
 * True when the value is a Right.
 * @example 
 * // isRight :: a -> Boolean
 * isRight (right (1)) // => true
 */
export function isRight (a) {
  return Boolean (a?.tag === 'right')
}

/**
 * Curried case-fold on Either.
 * @example 
 * // either :: (a -> c) -> (b -> c) -> Either a b -> c
 * either (l => l) (r => r) (right (42)) // => 42
 */
export function either (onLeft) {
  return (onRight) => (e) =>
    isLeft (e) ? onLeft (e.left) : onRight (e.right)
}

/**
 * Extracts the Left value, or returns the default for Right.
 * @example 
 * // fromLeft :: a -> Either a b -> a
 * fromLeft ('def') (right (1)) // => 'def'
 */
export function fromLeft (def) {
  return (e) => (isLeft (e) ? e.left : def)
}

/**
 * Extracts the Right value, or returns the default for Left.
 * @example 
 * // fromRight :: b -> Either a b -> b
 * fromRight (0) (left ('x')) // => 0
 */
export function fromRight (def) {
  return (e) => (isRight (e) ? e.right : def)
}

/**
 * Extracts the value regardless of constructor when both sides share a type.
 * @example 
 * // fromEither :: Either a a -> a
 * fromEither (left (42)) // => 42
 */
export function fromEither (e) {
  return isLeft (e) ? e.left : e.right
}

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
 * Lifts a throwing function into a total Either-returning one.
 * @example 
 * // encase :: (a -> b) -> a -> Either Error b
 * encase (JSON.parse) ('{"a":1}') // => right({ a: 1 })
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
 * // eitherToMaybe :: Either a b -> Maybe b
 * eitherToMaybe (right (1)) // => just(1)
 */
export function eitherToMaybe (e) {
  return isRight (e) ? just (e.right) : nothing ()
}

/**
 * Swaps Left and Right.
 * @example 
 * // swap :: Either a b -> Either b a
 * swap (left (1)) // => right(1)
 */
export function swap (a) {
  return isLeft (a) ? right (a.left) : left (a.right)
}

/**
 * Maps over the Right value, leaving Left untouched.
 * @example 
 * // mapRight :: (b -> c) -> Either a b -> Either a c
 * mapRight (x => x + 1) (right (1)) // => right(2)
 */
export function mapRight (fn) {
  return (a) => (isLeft (a) ? a : right (fn (a.right)))
}

/**
 * Maps over the Left value, leaving Right untouched.
 * @example 
 * // mapLeft :: (a -> c) -> Either a b -> Either c b
 * mapLeft (x => x + '!') (left ('err')) // => left('err!')
 */
export function mapLeft (fn) {
  return (a) => (isLeft (a) ? left (fn (a.left)) : a)
}

/**
 * Maps Left with the first function and Right with the second.
 * @example 
 * // bimap :: (a -> c) -> (b -> d) -> Either a b -> Either c d
 * bimap (l => l + '!') (r => r + 1) (right (2)) // => right(3)
 */
export function bimap (fnl, fnr) {
  return (a) => (isLeft (a) ? left (fnl (a.left)) : right (fnr (a.right)))
}

/**
 * Applies a function in a Right to a value in a Right.
 * @example 
 * // ap :: Either a (b -> c) -> Either a b -> Either a c
 * ap (right (x => x + 1)) (right (2)) // => right(3)
 */
export function ap (efn) {
  return (a) =>
    isLeft (efn) ? efn : isLeft (a) ? a : right (efn.right (a.right))
}

/**
 * Monadic bind over Right.
 * @example 
 * // flatmapRight :: (b -> Either a c) -> Either a b -> Either a c
 * flatmapRight (x => right (x + 1)) (right (2)) // => right(3)
 */
export function flatmapRight (fn) {
  return (a) => (isLeft (a) ? a : fn (a.right))
}

/**
 * Monadic bind over Left.
 * @example 
 * // flatmapLeft :: (a -> Either c b) -> Either a b -> Either c b
 * flatmapLeft (e => left (e + '!')) (left ('x')) // => left('x!')
 */
export function flatmapLeft (fn) {
  return (a) => (isRight (a) ? a : fn (a.left))
}

/**
 * Runs a Right through fn for its Left side effect; keeps original Right on success.
 * @example
 * // flatmapFirst :: (b -> Either a c) -> Either a b -> Either a b
 * flatmapFirst (x => left ('stop')) (right (1)) // => left('stop')
 */
export function flatmapFirst (fn) {
  return (a) => {
    if (isLeft (a)) {
      return a
    } else {
      const b = fn (a.right)
      return isLeft (b) ? b : a
    }
  }
}

/**
 * Returns the first Right, or the second argument if both are Left.
 * @example 
 * // alt :: Either a b -> Either a b -> Either a b
 * alt (right (2)) (left ('x')) // => right(2)
 */
export function alt (b) {
  return (a) => (isLeft (a) ? b : a)
}

/**
 * Reduces a Right with a binary function and initial value; returns initial for Left.
 * @example 
 * // fold :: ((c, b) -> c) -> c -> Either a b -> c
 * fold ((acc, x) => acc + x, 0) (right (5)) // => 5
 */
export function fold (fn, initial) {
  return (a) => (isLeft (a) ? initial : fn (initial, a.right))
}

/**
 * Applicative traversal over the Right value.
 * @example 
 * // traverse :: (b -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Either l a -> f (Either l b)
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, x]) (right (1)) // => [right(1), right(1)]
 */
export function traverse (apOf) {
  return (apMap) => (f) => (e) =>
    isLeft (e) ? apOf (e) : apMap (right) (f (e.right))
}
