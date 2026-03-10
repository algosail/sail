// validation.js – The Validation applicative (Failure | Success).
//
// Validation is like Either but its Applicative instance accumulates errors
// rather than short-circuiting on the first one.  This makes it the right
// tool for validating data where you want all errors reported at once.
//
// Unlike Either, Validation is NOT a Monad — chain would require
// short-circuiting, which defeats the purpose.
//
// Validation e a = Failure e | Success a
//
// The error type e must be a Semigroup (provide a `concat` function).
// Typically e = Array String, but any semigroup works.

import { just, nothing } from './maybe.js'
import { left, right }   from './either.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Wraps errors in the Failure constructor.
 * By convention errors is an Array, but any Semigroup is valid.
 * @example
 * // failure :: e -> Validation e a
 * failure (['too short']) // => { tag: 'failure', failure: ['too short'] }
 */
export function failure (e) {
  return { tag: 'failure', failure: e }
}

/**
 * Wraps a value in the Success constructor.
 * @example
 * // success :: a -> Validation e a
 * success (42) // => { tag: 'success', value: 42 }
 */
export function success (a) {
  return { tag: 'success', value: a }
}

// =============================================================================
// Guards
// =============================================================================

/**
 * True when the value is a Failure.
 * @example
 * // isFailure :: a -> Boolean
 * isFailure (failure (['err'])) // => true
 * isFailure (success (1))       // => false
 */
export function isFailure (a) {
  return Boolean (a?.tag === 'failure')
}

/**
 * True when the value is a Success.
 * @example
 * // isSuccess :: a -> Boolean
 * isSuccess (success (1))       // => true
 * isSuccess (failure (['err'])) // => false
 */
export function isSuccess (a) {
  return Boolean (a?.tag === 'success')
}

/**
 * True when the value is a Failure or Success.
 * @example
 * // isValidation :: a -> Boolean
 * isValidation (success (1)) // => true
 * isValidation (42)          // => false
 */
export function isValidation (a) {
  return isFailure (a) || isSuccess (a)
}

// =============================================================================
// Constructors from predicates / nullables
// =============================================================================

/**
 * Returns Success(a) when the predicate holds, Failure(e) otherwise.
 * @example
 * // fromPredicate :: (a -> Boolean) -> e -> a -> Validation e a
 * fromPredicate (x => x > 0) (['must be positive']) (-1) // => failure(['must be positive'])
 * fromPredicate (x => x > 0) (['must be positive']) (3)  // => success(3)
 */
export function fromPredicate (pred) {
  return (e) => (a) => pred (a) ? success (a) : failure (e)
}

/**
 * Returns Success(a) for non-null/undefined, Failure(e) otherwise.
 * @example
 * // fromNullable :: e -> a -> Validation e a
 * fromNullable (['required']) (null) // => failure(['required'])
 * fromNullable (['required']) (42)   // => success(42)
 */
export function fromNullable (e) {
  return (a) => (a !== null && a !== undefined) ? success (a) : failure (e)
}

// =============================================================================
// Destructor
// =============================================================================

/**
 * Case analysis — applies onFailure to the errors or onSuccess to the value.
 * @example
 * // validation :: (e -> b) -> (a -> b) -> Validation e a -> b
 * validation (es => es.join (', ')) (x => x) (success (42))          // => 42
 * validation (es => es.join (', ')) (x => x) (failure (['oops']))    // => 'oops'
 */
export function validation (onFailure) {
  return (onSuccess) => (va) =>
    isSuccess (va) ? onSuccess (va.value) : onFailure (va.failure)
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies f to the value inside Success; passes Failure through unchanged.
 * @example
 * // map :: (a -> b) -> Validation e a -> Validation e b
 * map (x => x + 1) (success (1))        // => success(2)
 * map (x => x + 1) (failure (['err']))  // => failure(['err'])
 */
export function map (f) {
  return (va) => isSuccess (va) ? success (f (va.value)) : va
}

/**
 * Applies f to the errors inside Failure; passes Success through unchanged.
 * @example
 * // mapFailure :: (e -> f) -> Validation e a -> Validation f a
 * mapFailure (es => es.map (e => `Error: ${e}`)) (failure (['oops'])) // => failure(['Error: oops'])
 * mapFailure (es => es.map (e => `Error: ${e}`)) (success (1))        // => success(1)
 */
export function mapFailure (f) {
  return (va) => isFailure (va) ? failure (f (va.failure)) : va
}

/**
 * Maps Success with fr and Failure with fl.
 * @example
 * // bimap :: (e -> f) -> (a -> b) -> Validation e a -> Validation f b
 * bimap (es => es.length) (x => x * 2) (success (3))         // => success(6)
 * bimap (es => es.length) (x => x * 2) (failure (['a','b'])) // => failure(2)
 */
export function bimap (fl) {
  return (fr) => (va) =>
    isSuccess (va) ? success (fr (va.value)) : failure (fl (va.failure))
}

// =============================================================================
// Applicative  ← the whole point of this module
// =============================================================================

/**
 * Lifts a value into Validation as a Success.
 * @example
 * // of :: a -> Validation e a
 * of (42) // => success(42)
 */
export function of (a) {
  return success (a)
}

/**
 * Applicative ap — accumulates errors from both sides using `concat`.
 * When both are Failure the errors are combined with the provided semigroup
 * concat.  When both are Success the function is applied.
 *
 * This is the key difference from Either: both sides are always evaluated.
 *
 * @example
 * // ap :: (e -> e -> e) -> Validation e (a -> b) -> Validation e a -> Validation e b
 * const apArr = ap (a => b => a.concat (b))
 * apArr (success (x => x + 1))        (success (2))         // => success(3)
 * apArr (failure (['bad fn']))         (success (2))         // => failure(['bad fn'])
 * apArr (success (x => x + 1))        (failure (['bad val']))// => failure(['bad val'])
 * apArr (failure (['bad fn']))         (failure (['bad val']))// => failure(['bad fn','bad val'])
 */
export function ap (concatErrors) {
  return (vf) => (va) => {
    if (isSuccess (vf) && isSuccess (va)) return success (vf.value (va.value))
    if (isFailure (vf) && isFailure (va)) return failure (concatErrors (vf.failure) (va.failure))
    if (isFailure (vf)) return vf
    return va
  }
}

// =============================================================================
// Alt
// =============================================================================

/**
 * Returns the first Success, or the second argument if both are Failure.
 * Errors are NOT accumulated here — use `ap` for that.
 * @example
 * // alt :: Validation e a -> Validation e a -> Validation e a
 * alt (success (2))       (failure (['e'])) // => success(2)
 * alt (failure (['e']))   (success (1))     // => success(1)
 * alt (failure (['a']))   (failure (['b'])) // => failure(['b'])
 */
export function alt (second) {
  return (first) => isSuccess (first) ? first : second
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Reduces a Success with f and init; returns init for Failure.
 * @example
 * // fold :: (b -> a -> b) -> b -> Validation e a -> b
 * fold (acc => x => acc + x) (0) (success (5))       // => 5
 * fold (acc => x => acc + x) (0) (failure (['err'])) // => 0
 */
export function fold (f) {
  return (init) => (va) => isSuccess (va) ? f (init) (va.value) : init
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Sequences a Success through an applicative functor; Failure is lifted as-is.
 * Accepts explicit apOf / apMap to remain functor-agnostic.
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> Validation e a -> f (Validation e b)
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, -x]) (success (1))
 * // => [success(1), success(-1)]
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, -x]) (failure (['e']))
 * // => [failure(['e'])]
 */
export function traverse (apOf) {
  return (apMap) => (f) => (va) =>
    isSuccess (va) ? apMap (success) (f (va.value)) : apOf (va)
}

// =============================================================================
// Conversions
// =============================================================================

/**
 * Converts Success to Just and Failure to Nothing.
 * @example
 * // toMaybe :: Validation e a -> Maybe a
 * toMaybe (success (1))      // => just(1)
 * toMaybe (failure (['err'])) // => nothing()
 */
export function toMaybe (va) {
  return isSuccess (va) ? just (va.value) : nothing ()
}

/**
 * Converts Success to Right and Failure to Left.
 * @example
 * // toEither :: Validation e a -> Either e a
 * toEither (success (1))       // => right(1)
 * toEither (failure (['err'])) // => left(['err'])
 */
export function toEither (va) {
  return isSuccess (va) ? right (va.value) : left (va.failure)
}

/**
 * Converts Right to Success and Left to Failure.
 * @example
 * // fromEither :: Either e a -> Validation e a
 * fromEither (right (1))     // => success(1)
 * fromEither (left (['err'])) // => failure(['err'])
 */
export function fromEither (e) {
  return e.tag === 'right' ? success (e.right) : failure (e.left)
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Extracts errors from a Failure, or returns an empty array for Success.
 * @example
 * // getFailure :: Validation (Array e) a -> Array e
 * getFailure (failure (['a', 'b'])) // => ['a', 'b']
 * getFailure (success (1))          // => []
 */
export function getFailure (va) {
  return isFailure (va) ? va.failure : []
}

/**
 * Collects all Failure errors from an array of Validations into a flat array.
 * @example
 * // failures :: Array (Validation (Array e) a) -> Array e
 * failures ([success (1), failure (['a']), failure (['b'])]) // => ['a', 'b']
 */
export function failures (vas) {
  return vas.reduce (
    (acc, va) => isFailure (va) ? acc.concat (va.failure) : acc,
    [],
  )
}

/**
 * Collects the values from all Success elements of an array.
 * @example
 * // successes :: Array (Validation e a) -> Array a
 * successes ([success (1), failure (['e']), success (2)]) // => [1, 2]
 */
export function successes (vas) {
  return vas.reduce (
    (acc, va) => isSuccess (va) ? (acc.push (va.value), acc) : acc,
    [],
  )
}

/**
 * Splits an array of Validations into [successes, failures],
 * extracting the inner values from each.
 * @example
 * // partition :: Array (Validation e a) -> [Array a, Array e]
 * partition ([success (1), failure (['e']), success (2)])
 * // => [[1, 2], ['e']]
 */
export function partition (vas) {
  const ss = []
  const fs = []
  for (const va of vas) {
    if (isSuccess (va)) ss.push (va.value)
    else fs.push (va.failure)
  }
  return [ss, fs]
}
