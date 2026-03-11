// validation.js
// The Validation applicative (Failure | Success).
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
 * Constructs a Failure variant, representing one or more accumulated errors.
 * Unlike Either's Left, multiple Failures can be merged via `ap` because the
 * error type must be a Semigroup (typically `Array`) — this allows all field
 * errors to be collected in one pass rather than stopping at the first. Use
 * this wherever a validation check does not pass.
 * @example
 * // failure :: e -> Validation e a
 * failure (['field is required'])
 * // => { tag: 'failure', failure: ['field is required'] }
 * failure (['must be at least 8 characters', 'must contain a digit'])
 * // => { tag: 'failure', failure: ['must be at least 8 characters', 'must contain a digit'] }
 */
export function failure (e) {
  return { tag: 'failure', failure: e }
}

/**
 * Constructs a Success variant, representing a validated value ready to be
 * consumed. In an applicative pipeline, Success values are passed to the
 * wrapped constructor via `ap`; when every field validates successfully the
 * final Success is produced. Equivalent to `of`.
 * @example
 * // success :: a -> Validation e a
 * success (42)
 * // => { tag: 'success', value: 42 }
 * success ({ name: 'Alice', age: 30 })
 * // => { tag: 'success', value: { name: 'Alice', age: 30 } }
 */
export function success (a) {
  return { tag: 'success', value: a }
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Type guard that returns true when the value is a Failure. Use it to branch
 * on a Validation result without destructuring the tag directly.
 * @example
 * // isFailure :: a -> Boolean
 * isFailure (failure (['required']))
 * // => true
 * isFailure (success (1))
 * // => false
 */
export function isFailure (a) {
  return Boolean (a?.tag === 'failure')
}

/**
 * Type guard that returns true when the value is a Success. Use it to branch
 * on a Validation result without destructuring the tag directly.
 * @example
 * // isSuccess :: a -> Boolean
 * isSuccess (success (1))
 * // => true
 * isSuccess (failure (['required']))
 * // => false
 */
export function isSuccess (a) {
  return Boolean (a?.tag === 'success')
}

/**
 * Returns true when the value is either a Failure or a Success, acting as a
 * runtime membership test for the Validation type. Useful for defensive checks
 * in generic utilities that accept mixed inputs.
 * @example
 * // isValidation :: a -> Boolean
 * isValidation (success (1))
 * // => true
 * isValidation (failure (['err']))
 * // => true
 * isValidation (42)
 * // => false
 */
export function isValidation (a) {
  return isFailure (a) || isSuccess (a)
}

// =============================================================================
// Constructors from predicates / nullables
// =============================================================================

/**
 * Lifts a boolean predicate into a Validation, turning a simple test into a
 * reusable validator. When the predicate holds the input is wrapped in
 * Success; when it fails the provided error value is wrapped in Failure. This
 * is the primary way to create primitive validators that can later be combined
 * with `ap` to validate multiple fields at once.
 * @example
 * // fromPredicate :: (a -> Boolean) -> e -> a -> Validation e a
 * fromPredicate (x => x >= 18) (['must be 18 or older']) (16)
 * // => failure(['must be 18 or older'])
 * fromPredicate (x => x >= 18) (['must be 18 or older']) (21)
 * // => success(21)
 * fromPredicate (s => s.length >= 8) (['password too short']) ('secret')
 * // => failure(['password too short'])
 */
export function fromPredicate (pred) {
  return (e) => (a) => pred (a) ? success (a) : failure (e)
}

/**
 * Turns a possibly-null or possibly-undefined value into a Validation, using
 * the provided error when the value is absent. A convenient shorthand for
 * required-field checks in form or API validation pipelines where a missing
 * value should immediately produce an error.
 * @example
 * // fromNullable :: e -> a -> Validation e a
 * fromNullable (['email is required']) (null)
 * // => failure(['email is required'])
 * fromNullable (['email is required']) (undefined)
 * // => failure(['email is required'])
 * fromNullable (['email is required']) ('user@example.com')
 * // => success('user@example.com')
 */
export function fromNullable (e) {
  return (a) => (a !== null && a !== undefined) ? success (a) : failure (e)
}

// =============================================================================
// Destructor
// =============================================================================

/**
 * Case analysis — the canonical way to extract a final value from a
 * Validation without inspecting the tag directly. Both branches must return
 * the same type, making it the natural last step in a validation pipeline
 * where errors are formatted for display and the success value is consumed.
 * @example
 * // validation :: (e -> b) -> (a -> b) -> Validation e a -> b
 * validation (es => es.join (', ')) (x => `Hello, ${x}`) (success ('Alice'))
 * // => 'Hello, Alice'
 * validation (es => es.join (', ')) (x => `Hello, ${x}`) (failure (['name required', 'too short']))
 * // => 'name required, too short'
 */
export function validation (onFailure) {
  return (onSuccess) => (va) =>
    isSuccess (va) ? onSuccess (va.value) : onFailure (va.failure)
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies a transformation to the value inside a Success, leaving Failure
 * untouched. This is the standard Functor map, useful for post-processing a
 * validated value — such as normalising case or trimming whitespace — without
 * touching the error path.
 * @example
 * // map :: (a -> b) -> Validation e a -> Validation e b
 * map (s => s.trim ().toLowerCase ()) (success ('  Alice  '))
 * // => success('alice')
 * map (x => x * 2) (success (5))
 * // => success(10)
 * map (s => s.trim ().toLowerCase ()) (failure (['name required']))
 * // => failure(['name required'])
 */
export function map (f) {
  return (va) => isSuccess (va) ? success (f (va.value)) : va
}

/**
 * Applies a transformation to the errors inside a Failure, leaving Success
 * untouched. Use it to convert between error representations — for example,
 * turning an array of strings into typed Error objects, or prefixing field
 * names to produce structured error reports for an API response.
 * @example
 * // mapFailure :: (e -> f) -> Validation e a -> Validation f a
 * mapFailure (es => es.map (msg => `password: ${msg}`)) (failure (['too short', 'no digit']))
 * // => failure(['password: too short', 'password: no digit'])
 * mapFailure (es => es.map (msg => new Error (msg))) (failure (['too short']))
 * // => failure([Error: too short])
 * mapFailure (es => es.map (msg => `password: ${msg}`)) (success ('s3cr3t!!'))
 * // => success('s3cr3t!!')
 */
export function mapFailure (f) {
  return (va) => isFailure (va) ? failure (f (va.failure)) : va
}

/**
 * Maps both sides simultaneously: fl over errors in Failure, fr over the
 * value in Success. A concise alternative to calling `map` and `mapFailure`
 * in sequence when both branches need transformation at the same time.
 * @example
 * // bimap :: (e -> f) -> (a -> b) -> Validation e a -> Validation f b
 * bimap (es => es.length) (x => x * 2) (success (3))
 * // => success(6)
 * bimap (es => es.length) (x => x * 2) (failure (['a', 'b']))
 * // => failure(2)
 */
export function bimap (fl) {
  return (fr) => (va) =>
    isSuccess (va) ? success (fr (va.value)) : failure (fl (va.failure))
}

// =============================================================================
// Applicative  ← the whole point of this module
// =============================================================================

/**
 * Lifts a plain value into Validation as a Success. In applicative-style form
 * validation, `of` is used to wrap the data constructor before applying
 * validated arguments with `ap` — it is the starting point of every `ap`
 * chain and makes the pipeline fully point-free.
 * @example
 * // of :: a -> Validation e a
 * of (42)
 * // => success(42)
 * of ('Alice')
 * // => success('Alice')
 */
export function of (a) {
  return success (a)
}

/**
 * The key operation of this module — applies a validated function to a
 * validated argument and accumulates errors from both sides when either or
 * both are Failures. This is what distinguishes Validation from Either: rather
 * than short-circuiting at the first error, `ap` always evaluates both
 * arguments and merges their error Semigroups. Build form validation by
 * starting with `of(constructor)` and chaining one `ap` per field so that
 * every error is collected in a single pass.
 * @example
 * // ap :: (e -> e -> e) -> Validation e (a -> b) -> Validation e a -> Validation e b
 * const apArr = ap (a => b => a.concat (b))
 * apArr (success (x => x * 2)) (success (5))
 * // => success(10)
 * apArr (failure (['fn error'])) (failure (['arg error']))
 * // => failure(['fn error', 'arg error'])
 * const mkUser = name => age => ({ name, age })
 * const vName  = fromPredicate (s => s.length > 0) (['name required']) ('')
 * const vAge   = fromPredicate (n => n >= 18) (['must be 18+']) (15)
 * apArr (apArr (of (mkUser)) (vName)) (vAge)
 * // => failure(['name required', 'must be 18+'])
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
 * Returns the first Success encountered, falling back to the second argument
 * when the first is a Failure. Unlike `ap`, errors are not accumulated here —
 * `alt` models choice rather than combination. Use it to provide a fallback
 * validator or a default value when the primary check fails.
 * @example
 * // alt :: Validation e a -> Validation e a -> Validation e a
 * alt (success (2)) (failure (['err']))
 * // => success(2)
 * alt (failure (['e1'])) (success (1))
 * // => success(1)
 * alt (failure (['fallback failed'])) (failure (['primary failed']))
 * // => failure(['fallback failed'])
 */
export function alt (second) {
  return (first) => isSuccess (first) ? first : second
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Reduces a Success by applying f to the accumulator and the inner value,
 * returning the initial accumulator unchanged for Failure. Use it as a safe
 * extractor in pipelines where a default answer must always be produced
 * regardless of whether validation passed.
 * @example
 * // fold :: (b -> a -> b) -> b -> Validation e a -> b
 * fold (acc => x => acc + x) (0) (success (5))
 * // => 5
 * fold (acc => xs => acc.concat (xs)) ([]) (success (['a', 'b']))
 * // => ['a', 'b']
 * fold (acc => x => acc + x) (0) (failure (['invalid input']))
 * // => 0
 */
export function fold (f) {
  return (init) => (va) => isSuccess (va) ? f (init) (va.value) : init
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Sequences a Validation through an outer applicative functor, turning
 * `Validation e (f a)` into `f (Validation e a)`. Failure is lifted directly
 * into the outer functor without invoking f. The explicit `apOf` and `apMap`
 * arguments keep the function functor-agnostic so it works with any
 * applicative, including Array, Promise, or a custom type.
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> Validation e a -> f (Validation e b)
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, x * 10]) (success (3))
 * // => [success(3), success(30)]
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, x * 10]) (failure (['err']))
 * // => [failure(['err'])]
 */
export function traverse (apOf) {
  return (apMap) => (f) => (va) =>
    isSuccess (va) ? apMap (success) (f (va.value)) : apOf (va)
}

// =============================================================================
// Conversions
// =============================================================================

/**
 * Converts a Validation to a Maybe, discarding any error information. Success
 * becomes Just and Failure becomes Nothing. Use this when downstream code
 * works with Maybe and you no longer need to distinguish between specific
 * error values.
 * @example
 * // toMaybe :: Validation e a -> Maybe a
 * toMaybe (success (42))
 * // => just(42)
 * toMaybe (failure (['invalid email']))
 * // => nothing()
 */
export function toMaybe (va) {
  return isSuccess (va) ? just (va.value) : nothing ()
}

/**
 * Converts a Validation to an Either, preserving errors in Left and the value
 * in Right. Use this when the validated result needs to enter a monadic Either
 * pipeline — after collecting all errors with `ap`, switching to Either lets
 * you chain further transformations that short-circuit on failure.
 * @example
 * // toEither :: Validation e a -> Either e a
 * toEither (success (1))
 * // => right(1)
 * toEither (failure (['email invalid', 'password too short']))
 * // => left(['email invalid', 'password too short'])
 */
export function toEither (va) {
  return isSuccess (va) ? right (va.value) : left (va.failure)
}

/**
 * Converts an Either to a Validation, mapping Right to Success and Left to
 * Failure. Use this to enter the Validation applicative pipeline from code
 * that already produces Either values — such as parsing utilities or domain
 * functions that return Left on error.
 * @example
 * // fromEither :: Either e a -> Validation e a
 * fromEither (right (42))
 * // => success(42)
 * fromEither (left (['not a number']))
 * // => failure(['not a number'])
 */
export function fromEither (e) {
  return e.tag === 'right' ? success (e.right) : failure (e.left)
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Extracts the error collection from a Failure, or returns an empty array for
 * a Success. A safe accessor that always produces an array, eliminating null
 * checks when feeding errors into display components, logs, or aggregators.
 * @example
 * // getFailure :: Validation (Array e) a -> Array e
 * getFailure (failure (['required', 'too short']))
 * // => ['required', 'too short']
 * getFailure (success (1))
 * // => []
 */
export function getFailure (va) {
  return isFailure (va) ? va.failure : []
}

/**
 * Collects and flattens all errors from every Failure in an array of
 * Validations, ignoring Success values. Use it to aggregate errors from
 * independently validated fields into a single flat list for display or
 * structured logging.
 * @example
 * // failures :: Array (Validation (Array e) a) -> Array e
 * failures ([success (1), failure (['required']), failure (['too short', 'no digit'])])
 * // => ['required', 'too short', 'no digit']
 * failures ([success (1), success (2)])
 * // => []
 */
export function failures (vas) {
  return vas.reduce (
    (acc, va) => isFailure (va) ? acc.concat (va.failure) : acc,
    [],
  )
}

/**
 * Extracts the values from all Success elements of an array, discarding
 * Failures. Use it to collect only the valid results from a batch of
 * independent validations where partial success is acceptable — for example,
 * importing a list of records and keeping only the ones that parsed correctly.
 * @example
 * // successes :: Array (Validation e a) -> Array a
 * successes ([success (1), failure (['err']), success (3)])
 * // => [1, 3]
 * successes ([failure (['a']), failure (['b'])])
 * // => []
 */
export function successes (vas) {
  return vas.reduce (
    (acc, va) => isSuccess (va) ? (acc.push (va.value), acc) : acc,
    [],
  )
}

/**
 * Splits an array of Validations into a `[successes, failures]` pair,
 * extracting the inner values from each side in a single pass. A more
 * efficient alternative to calling `successes` and `failures` separately when
 * both results are needed at the same time — for example, reporting errors
 * while processing the valid entries.
 * @example
 * // partition :: Array (Validation e a) -> [Array a, Array e]
 * partition ([success (1), failure (['e1']), success (3), failure (['e2'])])
 * // => [[1, 3], [['e1'], ['e2']]]
 * partition ([success ('a'), success ('b')])
 * // => [['a', 'b'], []]
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
