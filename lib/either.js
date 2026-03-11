// either.js
// The Either monad (Left | Right).

import { just, nothing } from './maybe.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Wraps a value in the Left constructor, conventionally representing failure or an error.
 * Unlike `nothing` from Maybe, Left carries information about *why* the computation failed,
 * making it the right choice whenever the error message, code, or object matters downstream.
 * Use `right` for the success counterpart.
 * @example
 * // left :: a -> Either a b
 * left ('User not found')
 * // => { tag: 'left', left: 'User not found' }
 * left ({ code: 404, message: 'Not found' })
 * // => { tag: 'left', left: { code: 404, message: 'Not found' } }
 */
export function left (l) {
  return { tag: 'left', left: l }
}

/**
 * Wraps a value in the Right constructor, conventionally representing a successful result.
 * The computation "goes right" when it succeeds — all monadic operations (`map`, `chain`)
 * operate on this side, letting you describe a happy-path pipeline without manually
 * checking for errors at each step. Use `left` for the failure counterpart.
 * @example
 * // right :: b -> Either a b
 * right ({ id: 1, name: 'Alice' })
 * // => { tag: 'right', right: { id: 1, name: 'Alice' } }
 * right (42)
 * // => { tag: 'right', right: 42 }
 */
export function right (r) {
  return { tag: 'right', right: r }
}

/**
 * Lifts a nullable value into Either: Right when the value is non-null/non-undefined,
 * Left otherwise. The error is provided as a thunk so the message is only evaluated
 * when the value is absent — useful when constructing the error string is expensive or
 * depends on context. Common use-case: wrapping a database lookup that returns `null`
 * when no record is found.
 * @example
 * // fromNullable :: (() -> a) -> b -> Either a b
 * fromNullable (() => 'User not found') (null)
 * // => left('User not found')
 * fromNullable (() => 'User not found') ({ id: 1, name: 'Alice' })
 * // => right({ id: 1, name: 'Alice' })
 * fromNullable (() => "Config key 'port' is missing") (undefined)
 * // => left("Config key 'port' is missing")
 */
export function fromNullable (fe) {
  return (a) => (a !== null && a !== undefined) ? right (a) : left (fe ())
}

/**
 * Wraps a potentially-throwing function so it returns Either instead of throwing.
 * On success the result goes into Right; on failure `onError` is called with both
 * the caught Error and the original arguments array, giving full context for building
 * a descriptive Left message. This curried form lets you partially apply the function
 * and error-mapper once to produce a reusable, safe wrapper.
 * @example
 * // tryCatch :: ((...a) -> b) -> (Error -> Array a -> c) -> ...a -> Either c b
 * tryCatch (JSON.parse) (e => _ => e.message) ('{"a":1}')
 * // => right({ a: 1 })
 * tryCatch (JSON.parse) (e => _ => e.message) ('bad json')
 * // => left('Unexpected token ...')
 * const safeParseConfig = tryCatch (JSON.parse) (e => args => `Invalid config "${args[0]}": ${e.message}`)
 * safeParseConfig ('{bad}')
 * // => left('Invalid config "{bad}": ...')
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
 * Constructs an Either from a predicate, turning a boolean test into a typed
 * success/failure value. When the predicate holds the input is placed in Right;
 * when it fails `onFalse` is applied to produce a descriptive Left. This is the
 * idiomatic way to convert a validation rule into a pipeline-compatible step.
 * @example
 * // fromPredicate :: (a -> Boolean) -> (a -> b) -> a -> Either b a
 * fromPredicate (x => x > 0) (x => `${x} must be positive`) (5)
 * // => right(5)
 * fromPredicate (x => x > 0) (x => `${x} must be positive`) (-3)
 * // => left('-3 must be positive')
 * const validateEmail = fromPredicate (s => s.includes ('@')) (s => `'${s}' is not a valid email`)
 * validateEmail ('not-an-email')
 * // => left("'not-an-email' is not a valid email")
 */
export function fromPredicate (pred) {
  return (onFalse) => (a) => (pred (a) ? right (a) : left (onFalse (a)))
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns `true` when the value is a Left.
 * These tag-based guards are runtime type checks typically used inside array
 * utilities like `lefts`, `rights`, and `partition` to filter mixed arrays of Either values.
 * @example
 * // isLeft :: a -> Boolean
 * isLeft (left ('error'))
 * // => true
 * isLeft (right (1))
 * // => false
 */
export function isLeft (a) {
  return Boolean (a?.tag === 'left')
}

/**
 * Returns `true` when the value is a Right.
 * These tag-based guards are runtime type checks typically used inside array
 * utilities like `lefts`, `rights`, and `partition` to filter mixed arrays of Either values.
 * @example
 * // isRight :: a -> Boolean
 * isRight (right (42))
 * // => true
 * isRight (left ('error'))
 * // => false
 */
export function isRight (a) {
  return Boolean (a?.tag === 'right')
}

/**
 * Returns `true` when the value is any Either (Left or Right).
 * Useful as a runtime guard when working with heterogeneous data that may or may
 * not be wrapped in Either — for example, filtering an array of mixed values before
 * passing them to Either-aware combinators.
 * @example
 * // isEither :: a -> Boolean
 * isEither (right (1))
 * // => true
 * isEither (left ('e'))
 * // => true
 * isEither (42)
 * // => false
 */
export function isEither (a) {
  return isLeft (a) || isRight (a)
}

// =============================================================================
// Destructors
// =============================================================================

/**
 * The primary fold/destructor for Either — applies one of two functions depending
 * on which constructor is present and collapses the result to a plain value.
 * This is the symmetric counterpart to building Either values: every Either created
 * with `left`/`right` is ultimately consumed with `either`. Prefer it over manual
 * tag-checking as it keeps both branches visible and enforced in a single expression.
 * @example
 * // either :: (a -> c) -> (b -> c) -> Either a b -> c
 * either (err => `Error: ${err}`) (data => data.name) (right ({ name: 'Alice' }))
 * // => 'Alice'
 * either (err => `Error: ${err}`) (data => data.name) (left ('Not found'))
 * // => 'Error: Not found'
 * either (() => 0) (xs => xs.length) (right ([1, 2, 3]))
 * // => 3
 */
export function either (onLeft) {
  return (onRight) => (e) =>
    isLeft (e) ? onLeft (e.left) : onRight (e.right)
}

/**
 * Safely extracts the Left value, returning the provided default when given a Right.
 * Useful when you only care about the error side — for example, providing a fallback
 * error description before logging or reporting. Pair with `fromRight` to extract both sides.
 * @example
 * // fromLeft :: a -> Either a b -> a
 * fromLeft ('unknown error') (left ('connection refused'))
 * // => 'connection refused'
 * fromLeft ('unknown error') (right ({ id: 1 }))
 * // => 'unknown error'
 */
export function fromLeft (def) {
  return (e) => (isLeft (e) ? e.left : def)
}

/**
 * Safely extracts the Right value, returning the provided default when given a Left.
 * Useful at the edge of a pipeline when you need a plain value and have a sensible
 * fallback for the failure case. Pair with `fromLeft` to handle both sides.
 * @example
 * // fromRight :: b -> Either a b -> b
 * fromRight (0) (right (99))
 * // => 99
 * fromRight (0) (left ('NaN'))
 * // => 0
 */
export function fromRight (def) {
  return (e) => (isRight (e) ? e.right : def)
}

/**
 * Extracts the inner value regardless of which constructor is present.
 * Only safe — and meaningful — when both sides share the same type, e.g.
 * `Either String String`, where you want the string whether the operation succeeded
 * or failed (such as returning a default message string in both cases). Use `either`
 * with two separate handlers when the types differ.
 * @example
 * // fromEither :: Either a a -> a
 * fromEither (right ('success message'))
 * // => 'success message'
 * fromEither (left ('failure message'))
 * // => 'failure message'
 */
export function fromEither (e) {
  return isLeft (e) ? e.left : e.right
}

/**
 * Reduces the Right value with a curried binary function and an initial accumulator,
 * returning the initial value unchanged for Left. Useful for folding a single Right
 * result into a running total or collection — for example, accumulating a numeric
 * result into a sum without unwrapping manually.
 * @example
 * // fold :: (b -> a -> b) -> b -> Either l a -> b
 * fold (acc => x => acc + x) (10) (right (5))
 * // => 15
 * fold (acc => x => acc + x) (10) (left ('error'))
 * // => 10
 */
export function fold (f) {
  return (init) => (e) => (isLeft (e) ? init : f (init) (e.right))
}

// =============================================================================
// Array utilities
// =============================================================================

/**
 * Filters an array of Either values to only the Left instances and extracts their
 * inner values. Useful for collecting all errors from a batch operation — for example,
 * gathering every failed validation message after processing an array of inputs through
 * a pipeline where each item returns Either.
 * @example
 * // lefts :: Array (Either a b) -> Array a
 * lefts ([left ('Not found'), right ({ id: 1 }), left ('Unauthorized')])
 * // => ['Not found', 'Unauthorized']
 */
export function lefts (es) {
  return es.filter (isLeft).map ((e) => e.left)
}

/**
 * Filters an array of Either values to only the Right instances and extracts their
 * inner values. Useful for collecting all successful results from a batch operation —
 * for example, keeping only the records that parsed successfully after running each
 * item through a safe parser that returns Either.
 * @example
 * // rights :: Array (Either a b) -> Array b
 * rights ([left ('bad'), right ({ id: 1 }), right ({ id: 2 })])
 * // => [{ id: 1 }, { id: 2 }]
 */
export function rights (es) {
  return es.filter (isRight).map ((e) => e.right)
}

/**
 * Splits an array of Either values into a tuple `[successes, failures]`, extracting
 * the inner values from each side in a single pass. This is the most useful of the
 * three array utilities because it lets you act on both outcomes simultaneously —
 * for example, persisting valid records while logging errors, without iterating twice.
 * @example
 * // partition :: Array (Either a b) -> [Array b, Array a]
 * partition ([right ({ id: 1 }), left ('invalid'), right ({ id: 2 }), left ('missing')])
 * // => [[{ id: 1 }, { id: 2 }], ['invalid', 'missing']]
 * partition ([right ('ok'), left ('err')])
 * // => [['ok'], ['err']]
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
 * Lifts a throwing unary function into a total function that returns Either, placing
 * the raw `Error` object in Left if an exception is thrown. Unlike `tryCatch`, there
 * is no custom error-mapping step, making it simpler and the right default choice when
 * you are happy to work with Error objects directly rather than transformed messages.
 * @example
 * // encase :: (a -> b) -> a -> Either Error b
 * encase (JSON.parse) ('{"ok":true}')
 * // => right({ ok: true })
 * encase (JSON.parse) ('bad json')
 * // => left(SyntaxError: Unexpected token ...)
 * encase (obj => obj.deeply.nested.value) (null)
 * // => left(TypeError: Cannot read properties of null)
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
 * Converts an Either to a Maybe: Right becomes `just` and Left becomes `nothing`.
 * Use this when you want to discard the error information and continue in a
 * Maybe-based pipeline — for example, converting a computation result to an optional
 * value when the reason for absence is no longer relevant downstream.
 * @example
 * // toMaybe :: Either a b -> Maybe b
 * toMaybe (right ({ id: 1, name: 'Alice' }))
 * // => just({ id: 1, name: 'Alice' })
 * toMaybe (left ('User not found'))
 * // => nothing()
 */
export function toMaybe (e) {
  return isRight (e) ? just (e.right) : nothing ()
}

/**
 * Swaps Left and Right, turning a failure into a success and vice versa.
 * This is useful when you want to promote the error to the primary position for
 * further processing — for example, running `map` or `chain` over error values,
 * or recovering from a known expected-failure case by treating it as the happy path.
 * @example
 * // swap :: Either a b -> Either b a
 * swap (left ('expected error'))
 * // => right('expected error')
 * swap (right (42))
 * // => left(42)
 */
export function swap (a) {
  return isLeft (a) ? right (a.left) : left (a.right)
}

// =============================================================================
// Functor / Bifunctor
// =============================================================================

/**
 * Applies a function to the Right value, leaving Left untouched.
 * This is the core of the happy-path abstraction: you describe a chain of
 * transformations assuming success, and any Left encountered at any step is
 * automatically propagated through without executing subsequent steps.
 * @example
 * // map :: (b -> c) -> Either a b -> Either a c
 * map (user => user.name) (right ({ id: 1, name: 'Alice' }))
 * // => right('Alice')
 * map (user => user.name) (left ('User not found'))
 * // => left('User not found')
 * map (x => x * 2) (map (x => x + 1) (right (4)))
 * // => right(10)
 */
export function map (f) {
  return (a) => (isLeft (a) ? a : right (f (a.right)))
}

/**
 * Applies a function to the Left value, leaving Right untouched.
 * The mirror of `map` for the error side — useful for transforming a raw error
 * (e.g. an Error object from the runtime) into a user-facing message, or for
 * normalising errors from different sources into a common error type.
 * @example
 * // mapLeft :: (a -> c) -> Either a b -> Either c b
 * mapLeft (err => `Request failed: ${err.message}`) (left (new Error ('Timeout')))
 * // => left('Request failed: Timeout')
 * mapLeft (err => `Request failed: ${err.message}`) (right ({ status: 200 }))
 * // => right({ status: 200 })
 */
export function mapLeft (f) {
  return (a) => (isLeft (a) ? left (f (a.left)) : a)
}

/**
 * Maps both sides simultaneously: Left with the first function, Right with the second.
 * Use `bimap` when you need to normalise both the error type and the success type in
 * one step — for example, converting raw strings on both sides into typed domain objects
 * without chaining separate `map` and `mapLeft` calls.
 * @example
 * // bimap :: (a -> c) -> (b -> d) -> Either a b -> Either c d
 * bimap (err => ({ error: err })) (val => val.toUpperCase ()) (right ('hello'))
 * // => right('HELLO')
 * bimap (err => ({ error: err })) (val => val.toUpperCase ()) (left ('not found'))
 * // => left({ error: 'not found' })
 */
export function bimap (fl) {
  return (fr) => (a) => (isLeft (a) ? left (fl (a.left)) : right (fr (a.right)))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Applies a function wrapped in a Right to a value wrapped in a Right.
 * Enables combining two independent Either computations — for example, running two
 * separate validations and applying their results to a constructor. Note that `ap`
 * short-circuits on the first Left it encounters; use a Validation applicative if
 * you need to accumulate multiple errors rather than stopping at the first failure.
 * @example
 * // ap :: Either a (b -> c) -> Either a b -> Either a c
 * ap (right (x => x * 3)) (right (7))
 * // => right(21)
 * ap (left ('invalid fn')) (right (7))
 * // => left('invalid fn')
 * ap (right (x => x * 3)) (left ('invalid value'))
 * // => left('invalid value')
 */
export function ap (efn) {
  return (a) =>
    isLeft (efn) ? efn : isLeft (a) ? a : right (efn.right (a.right))
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Sequences a computation that itself returns an Either, enabling multi-step pipelines
 * where any step can fail with a Left that short-circuits the rest. This is the heart
 * of railway-oriented programming: data flows along the success rail through each
 * `chain` step, and the moment one returns a Left all subsequent steps are bypassed.
 * @example
 * // chain :: (b -> Either a c) -> Either a b -> Either a c
 * chain (n => n > 0 ? right (n) : left ('must be positive')) (right (5))
 * // => right(5)
 * chain (n => n > 0 ? right (n) : left ('must be positive')) (right (-1))
 * // => left('must be positive')
 * chain (n => n > 0 ? right (n) : left ('must be positive')) (left ('already failed'))
 * // => left('already failed')
 */
export function chain (f) {
  return (a) => (isLeft (a) ? a : f (a.right))
}

/**
 * Sequences a computation over the Left value, enabling error-recovery and retry logic.
 * If the Either is a Right it passes through untouched; if it is a Left the provided
 * function is called with the error value and can either recover by returning a Right
 * or re-fail with a different Left.
 * @example
 * // chainLeft :: (a -> Either c b) -> Either a b -> Either c b
 * chainLeft (_ => right (0)) (left ('missing'))
 * // => right(0)
 * chainLeft (e => left (`Wrapped: ${e}`)) (left ('original error'))
 * // => left('Wrapped: original error')
 * chainLeft (_ => right (0)) (right (42))
 * // => right(42)
 */
export function chainLeft (f) {
  return (a) => (isRight (a) ? a : f (a.left))
}

/**
 * Runs a side-effecting function on the Right value for its effect only, keeping the
 * original Right unchanged if the function succeeds. If the function returns a Left
 * the chain is short-circuited with that Left. This is ideal for "do this side effect
 * but keep the original value" patterns such as logging, writing an audit record, or
 * sending a notification without altering the data flowing through the pipeline.
 * @example
 * // chainFirst :: (b -> Either a c) -> Either a b -> Either a b
 * chainFirst (x => right (`logged ${x}`)) (right (42))
 * // => right(42)
 * chainFirst (_ => left ('audit failed')) (right ({ name: 'Alice' }))
 * // => left('audit failed')
 * chainFirst (_ => left ('audit failed')) (left ('earlier error'))
 * // => left('earlier error')
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
 * Returns the first Right encountered, falling back to the second Either when the
 * first is a Left. Use this for fallback logic — for example, trying a primary data
 * source and falling back to a secondary source when the first returns a Left.
 * Arguments are in "fallback-first" order: `alt(fallback)(primary)`.
 * @example
 * // alt :: Either a b -> Either a b -> Either a b
 * alt (right ('cached value')) (left ('fetch failed'))
 * // => right('cached value')
 * alt (left ('cache miss')) (right ('live value'))
 * // => right('live value')
 * alt (left ('all sources failed')) (left ('primary failed'))
 * // => left('all sources failed')
 */
export function alt (b) {
  return (a) => (isLeft (a) ? b : a)
}

/**
 * Applicative traversal: runs an effectful function over the Right value and re-wraps
 * the result in Either within the target applicative, leaving Left unchanged and lifted
 * into that applicative. Use this to run an effect (e.g. an array expansion, an async
 * call) only on the success side without manually unwrapping and re-wrapping.
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> Either l a -> f (Either l b)
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, x * 10]) (right (5))
 * // => [right(5), right(50)]
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, x * 10]) (left ('no value'))
 * // => [left('no value')]
 */
export function traverse (apOf) {
  return (apMap) => (f) => (e) =>
    isLeft (e) ? apOf (e) : apMap (right) (f (e.right))
}
