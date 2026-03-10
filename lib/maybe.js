// maybe.js – The Maybe monad (Just | Nothing).

import * as E from './either.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Wraps a value in Just.
 * @example
 * // just :: a -> Maybe a
 * just (1) // => { tag: 'just', value: 1 }
 */
export function just (value) {
  return { tag: 'just', value }
}

/**
 * The empty Maybe — represents absence of a value.
 * @example
 * // nothing :: () -> Maybe a
 * nothing () // => { tag: 'nothing' }
 */
export function nothing () {
  return { tag: 'nothing' }
}

/**
 * Returns Just(a) for any non-null/undefined value, Nothing otherwise.
 * @example
 * // fromNullable :: a -> Maybe a
 * fromNullable (1)         // => just(1)
 * fromNullable (null)      // => nothing()
 * fromNullable (undefined) // => nothing()
 */
export function fromNullable (a) {
  return (a !== null && a !== undefined) ? just (a) : nothing ()
}

/**
 * Returns Just(a) when the predicate holds, Nothing otherwise.
 * @example
 * // fromPredicate :: (a -> Boolean) -> a -> Maybe a
 * fromPredicate (x => x > 0) (1)  // => just(1)
 * fromPredicate (x => x > 0) (-1) // => nothing()
 */
export function fromPredicate (pred) {
  return (a) => pred (a) ? just (a) : nothing ()
}

/**
 * Runs a thunk — Just on success, Nothing if it throws.
 * @example
 * // tryCatch :: (() -> a) -> Maybe a
 * tryCatch (() => JSON.parse ('1'))     // => just(1)
 * tryCatch (() => JSON.parse ('bad'))   // => nothing()
 */
export function tryCatch (thunk) {
  try {
    return just (thunk ())
  } catch (_) {
    return nothing ()
  }
}

// =============================================================================
// Guards
// =============================================================================

/**
 * True when the value is a Just.
 * @example
 * // isJust :: a -> Boolean
 * isJust (just (1))   // => true
 * isJust (nothing ()) // => false
 */
export function isJust (a) {
  return Boolean (a?.tag === 'just')
}

/**
 * True when the value is Nothing.
 * @example
 * // isNothing :: a -> Boolean
 * isNothing (nothing ()) // => true
 * isNothing (just (1))   // => false
 */
export function isNothing (a) {
  return Boolean (a?.tag === 'nothing')
}

// =============================================================================
// Destructors
// =============================================================================

/**
 * Case analysis — the lazy default thunk is called only for Nothing.
 * @example
 * // maybe :: (() -> b) -> (a -> b) -> Maybe a -> b
 * maybe (() => 0)  (x => x + 1) (just (1))   // => 2
 * maybe (() => 0)  (x => x + 1) (nothing ())  // => 0
 */
export function maybe (onNothing) {
  return (onJust) => (ma) => isJust (ma) ? onJust (ma.value) : onNothing ()
}

/**
 * Extracts the value or returns the default.
 * @example
 * // fromMaybe :: a -> Maybe a -> a
 * fromMaybe (0) (just (5))   // => 5
 * fromMaybe (0) (nothing ()) // => 0
 */
export function fromMaybe (def) {
  return (ma) => isJust (ma) ? ma.value : def
}

/**
 * Extracts the value or calls the lazy thunk.
 * @example
 * // fromMaybe_ :: (() -> a) -> Maybe a -> a
 * fromMaybe_ (() => 0) (nothing ()) // => 0
 * fromMaybe_ (() => 0) (just (5))   // => 5
 */
export function fromMaybe_ (thunk) {
  return (ma) => isJust (ma) ? ma.value : thunk ()
}

/**
 * Extracts the value or returns null.
 * @example
 * // toNull :: Maybe a -> a | null
 * toNull (just (1))   // => 1
 * toNull (nothing ()) // => null
 */
export function toNull (ma) {
  return isJust (ma) ? ma.value : null
}

/**
 * Extracts the value or returns undefined.
 * @example
 * // toUndefined :: Maybe a -> a | undefined
 * toUndefined (just (1))   // => 1
 * toUndefined (nothing ()) // => undefined
 */
export function toUndefined (ma) {
  return isJust (ma) ? ma.value : undefined
}

/**
 * Converts Nothing to Left(def) and Just(v) to Right(v).
 * @example
 * // toEither :: a -> Maybe b -> Either a b
 * toEither ('err') (just (1))   // => right(1)
 * toEither ('err') (nothing ()) // => left('err')
 */
export function toEither (def) {
  return (ma) => isJust (ma) ? E.right (ma.value) : E.left (def)
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies f to the value inside Just; passes Nothing through.
 * @example
 * // map :: (a -> b) -> Maybe a -> Maybe b
 * map (x => x + 1) (just (1))   // => just(2)
 * map (x => x + 1) (nothing ()) // => nothing()
 */
export function map (f) {
  return (ma) => isJust (ma) ? just (f (ma.value)) : nothing ()
}

// =============================================================================
// Filterable
// =============================================================================

/**
 * Returns Nothing when the predicate fails or the Maybe is already Nothing.
 * @example
 * // filter :: (a -> Boolean) -> Maybe a -> Maybe a
 * filter (x => x > 0) (just (1))   // => just(1)
 * filter (x => x > 0) (just (-1))  // => nothing()
 * filter (x => x > 0) (nothing ()) // => nothing()
 */
export function filter (pred) {
  return (ma) => isJust (ma) && pred (ma.value) ? ma : nothing ()
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Applies a Just-wrapped function to a Just-wrapped value.
 * @example
 * // ap :: Maybe (a -> b) -> Maybe a -> Maybe b
 * ap (just (x => x + 1)) (just (1))   // => just(2)
 * ap (nothing ())         (just (1))   // => nothing()
 */
export function ap (mf) {
  return (ma) => isJust (mf) && isJust (ma) ? just (mf.value (ma.value)) : nothing ()
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Monadic bind — applies f to Just's value, passes Nothing through.
 * @example
 * // chain :: (a -> Maybe b) -> Maybe a -> Maybe b
 * chain (x => just (x + 1)) (just (1))   // => just(2)
 * chain (x => just (x + 1)) (nothing ()) // => nothing()
 */
export function chain (f) {
  return (ma) => isJust (ma) ? f (ma.value) : nothing ()
}

/**
 * Maps with a nullable-returning function, lifting the result into Maybe.
 * Equivalent to  chain (compose (fromNullable) (f)).
 * @example
 * // chainNullable :: (a -> b | null | undefined) -> Maybe a -> Maybe b
 * chainNullable (x => x.name) (just ({ name: 'Alice' })) // => just('Alice')
 * chainNullable (x => x.name) (just ({}))                // => nothing()
 */
export function chainNullable (f) {
  return (ma) => isJust (ma) ? fromNullable (f (ma.value)) : nothing ()
}

// =============================================================================
// Alt / Plus
// =============================================================================

/**
 * Returns the first Just, falling back to the second.
 * @example
 * // alt :: Maybe a -> Maybe a -> Maybe a
 * alt (just (2))  (nothing ()) // => just(2)
 * alt (nothing ()) (just (1))  // => just(1)
 * alt (nothing ()) (nothing ()) // => nothing()
 */
export function alt (second) {
  return (first) => isJust (first) ? first : second
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Folds a Maybe — returns `init` for Nothing, applies f(init)(value) for Just.
 * @example
 * // fold :: (b -> a -> b) -> b -> Maybe a -> b
 * fold (acc => x => acc + x) (0) (just (5))   // => 5
 * fold (acc => x => acc + x) (0) (nothing ()) // => 0
 */
export function fold (f) {
  return (init) => (ma) => isJust (ma) ? f (init) (ma.value) : init
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Sequences a Maybe through an applicative functor.
 * Accepts explicit apOf / apMap to remain functor-agnostic.
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> Maybe a -> f (Maybe b)
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, -x]) (just (1))   // => [just(1), just(-1)]
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, -x]) (nothing ()) // => [nothing()]
 */
export function traverse (apOf) {
  return (apMap) => (f) => (ma) =>
    isJust (ma) ? apMap (just) (f (ma.value)) : apOf (nothing ())
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Combines two Maybes into a Just of a pair, or Nothing if either is Nothing.
 * @example
 * // zip :: Maybe a -> Maybe b -> Maybe [a, b]
 * zip (just (1)) (just (2))   // => just([1, 2])
 * zip (nothing ()) (just (2)) // => nothing()
 */
export function zip (ma) {
  return (mb) => isJust (ma) && isJust (mb) ? just ([ma.value, mb.value]) : nothing ()
}

/**
 * Collects Just values from an array, discarding Nothings.
 * @example
 * // justs :: Array (Maybe a) -> Array a
 * justs ([just (1), nothing (), just (2)]) // => [1, 2]
 */
export function justs (mas) {
  return mas.reduce ((acc, ma) => (isJust (ma) ? (acc.push (ma.value), acc) : acc), [])
}

/**
 * Maps f over an array and collects only the Just results.
 * @example
 * // mapMaybe :: (a -> Maybe b) -> Array a -> Array b
 * mapMaybe (x => x > 0 ? just (x) : nothing ()) ([1, -2, 3]) // => [1, 3]
 */
export function mapMaybe (f) {
  return (xs) => justs (xs.map (f))
}
