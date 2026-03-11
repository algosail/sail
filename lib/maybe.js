// maybe.js
// The Maybe monad (Just | Nothing).

import * as E from './either.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Wraps a value in Just — the "presence" constructor for Maybe.
 * Use `just` when you have a computed result and want to place it into a
 * Maybe pipeline. It pairs with `nothing` to form the two possible states of
 * Maybe; downstream consumers such as `map`, `chain`, and `maybe` handle
 * both states without any explicit null checks.
 * @example
 * // just :: a -> Maybe a
 * just ('alice@example.com')
 * // => { tag: 'just', value: 'alice@example.com' }
 * just (42)
 * // => { tag: 'just', value: 42 }
 */
export function just (value) {
  return { tag: 'just', value }
}

/**
 * Constructs the empty Maybe — represents the total absence of a value.
 * Use it to signal that an operation produced no result: a failed dictionary
 * lookup, a missing config key, an optional user field that was never
 * filled in. Every Maybe-consuming function handles Nothing gracefully
 * without throwing, so the absence propagates silently through the pipeline.
 * @example
 * // nothing :: () -> Maybe a
 * nothing ()
 * // => { tag: 'nothing' }
 */
export function nothing () {
  return { tag: 'nothing' }
}

/**
 * The primary bridge between nullable JavaScript and Maybe. Returns
 * Just(a) for any non-null / non-undefined value and Nothing otherwise,
 * letting you safely lift ordinary JS values — object fields, API responses,
 * Map lookups — into a Maybe pipeline without manual null checks. Pair with
 * `chain` or `map` to keep transforming inside the Maybe context, and with
 * `fromMaybe` or `maybe` to extract a result at the end.
 * @example
 * // fromNullable :: a -> Maybe a
 * fromNullable (user.address)
 * // => just({ street: '1 Main St', city: 'Springfield' })
 * fromNullable (user.middleName)
 * // => nothing()
 * fromNullable (null)
 * // => nothing()
 */
export function fromNullable (a) {
  return (a !== null && a !== undefined) ? just (a) : nothing ()
}

/**
 * Returns Just(a) when the predicate holds and Nothing otherwise, turning a
 * boolean test into a Maybe-producing gate. Use it for validation at the
 * entry point of a pipeline — you get a Just only when the value meets your
 * criteria, and Nothing then propagates silently through every subsequent
 * `map` and `chain` call without any additional branching.
 * @example
 * // fromPredicate :: (a -> Boolean) -> a -> Maybe a
 * fromPredicate (x => x > 0) (150)
 * // => just(150)
 * fromPredicate (x => x > 0) (-5)
 * // => nothing()
 * fromPredicate (s => s.length > 0) ('')
 * // => nothing()
 */
export function fromPredicate (pred) {
  return (a) => pred (a) ? just (a) : nothing ()
}

/**
 * Safely executes a thunk that might throw, returning Just on success and
 * Nothing if any exception is caught. Ideal for wrapping operations like
 * JSON.parse, localStorage access, or third-party calls that may fail at
 * runtime. Unlike `Either.tryCatch`, this variant discards the error value —
 * use Either.tryCatch when you need to preserve the exception message for
 * diagnosis or display to the user.
 * @example
 * // tryCatch :: (() -> a) -> Maybe a
 * tryCatch (() => JSON.parse ('{"id":1,"name":"Alice"}'))
 * // => just({ id: 1, name: 'Alice' })
 * tryCatch (() => JSON.parse ('<not json>'))
 * // => nothing()
 * tryCatch (() => localStorage.getItem ('theme'))
 * // => just('dark')
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
 * Returns true when the Maybe carries a value (is a Just).
 * Primarily useful as a low-level guard at non-FP boundaries, but in most
 * pipelines it is cleaner to use the `maybe` fold rather than branching on
 * `isJust` explicitly — the fold enforces handling both cases and composes
 * more naturally.
 * @example
 * // isJust :: Maybe a -> Boolean
 * isJust (just ('alice@example.com'))
 * // => true
 * isJust (nothing ())
 * // => false
 */
export function isJust (a) {
  return Boolean (a?.tag === 'just')
}

/**
 * Returns true when the Maybe carries no value (is a Nothing).
 * Useful as a quick early-exit guard, but prefer the `maybe` fold for
 * extracting or transforming values in a pipeline — checking `isNothing` and
 * branching imperatively tends to defeat the purpose of working with Maybe.
 * @example
 * // isNothing :: Maybe a -> Boolean
 * isNothing (nothing ())
 * // => true
 * isNothing (just ('alice@example.com'))
 * // => false
 */
export function isNothing (a) {
  return Boolean (a?.tag === 'nothing')
}

// =============================================================================
// Destructors
// =============================================================================

/**
 * The primary destructor for Maybe — performs exhaustive case analysis.
 * `onNothing` is a lazy thunk called only when the Maybe is Nothing,
 * avoiding unnecessary work when computing the fallback is expensive.
 * `onJust` receives the unwrapped value when a Just is present. Prefer
 * `maybe` over `isJust`/`isNothing` whenever you need to extract a result,
 * because it enforces handling both cases and composes cleanly in pipelines.
 * @example
 * // maybe :: (() -> b) -> (a -> b) -> Maybe a -> b
 * maybe (() => 'Anonymous') (user => user.name) (just ({ name: 'Alice', role: 'admin' }))
 * // => 'Alice'
 * maybe (() => 'Anonymous') (user => user.name) (nothing ())
 * // => 'Anonymous'
 * maybe (() => 0) (price => price * 1.2) (just (100))
 * // => 120
 */
export function maybe (onNothing) {
  return (onJust) => (ma) => isJust (ma) ? onJust (ma.value) : onNothing ()
}

/**
 * Extracts the value from a Just or returns the provided eager default.
 * Because the default is evaluated unconditionally before the call, prefer
 * `fromMaybe_` when computing the fallback is expensive or has side effects.
 * A common use is supplying a sensible zero or empty value when an optional
 * field is missing — for example, defaulting a parsed number to 0.
 * @example
 * // fromMaybe :: a -> Maybe a -> a
 * fromMaybe (0) (just (42))
 * // => 42
 * fromMaybe (0) (nothing ())
 * // => 0
 * fromMaybe ('guest') (fromNullable (session.username))
 * // => 'guest'
 */
export function fromMaybe (def) {
  return (ma) => isJust (ma) ? ma.value : def
}

/**
 * Extracts the value from a Just or calls the lazy thunk to produce the
 * default. The thunk is invoked only when the Maybe is Nothing, making this
 * the right choice when computing the fallback involves real work — reading a
 * config file, running a database query, or constructing a large object —
 * that you want to skip entirely when a real value is already present.
 * @example
 * // fromMaybe_ :: (() -> a) -> Maybe a -> a
 * fromMaybe_ (() => loadDefaultConfig ()) (just ({ theme: 'dark' }))
 * // => { theme: 'dark' }
 * fromMaybe_ (() => 'default-role') (nothing ())
 * // => 'default-role'
 */
export function fromMaybe_ (thunk) {
  return (ma) => isJust (ma) ? ma.value : thunk ()
}

/**
 * Converts a Maybe back to a null-based nullable — the standard escape hatch
 * at the boundary of FP code. Use it when interfacing with libraries or APIs
 * that expect null instead of a Maybe, such as React controlled-input props,
 * database query parameters, or third-party SDKs.
 * @example
 * // toNull :: Maybe a -> a | null
 * toNull (just ('alice@example.com'))
 * // => 'alice@example.com'
 * toNull (nothing ())
 * // => null
 */
export function toNull (ma) {
  return isJust (ma) ? ma.value : null
}

/**
 * Converts a Maybe back to an undefined-based nullable — the other common
 * escape hatch at the boundary of FP code. Use it when interfacing with APIs
 * that treat undefined as "absent" rather than null, such as optional object
 * spread properties or certain serialisation libraries.
 * @example
 * // toUndefined :: Maybe a -> a | undefined
 * toUndefined (just ('dark'))
 * // => 'dark'
 * toUndefined (nothing ())
 * // => undefined
 */
export function toUndefined (ma) {
  return isJust (ma) ? ma.value : undefined
}

/**
 * Converts a Maybe into an Either, promoting Nothing to a Left carrying a
 * caller-supplied error value and Just to a Right. Use this when you need to
 * enter the Either world — for example, to attach a diagnostic message after
 * a lookup that may have found nothing, or to chain Maybe-based lookups with
 * Either-based validation steps.
 * @example
 * // toEither :: a -> Maybe b -> Either a b
 * toEither ('user not found') (just ({ id: 1, name: 'Alice' }))
 * // => right({ id: 1, name: 'Alice' })
 * toEither ('user not found') (nothing ())
 * // => left('user not found')
 */
export function toEither (def) {
  return (ma) => isJust (ma) ? E.right (ma.value) : E.left (def)
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies f to the value inside Just and returns a new Just; passes Nothing
 * through unchanged. `map` is the core way to transform a value while
 * staying inside the Maybe context — it lifts a plain function into
 * Maybe-land without ever unwrapping. Chaining multiple maps is equivalent
 * to mapping their composition: `map(f)(map(g)(m))` equals
 * `map(x => f(g(x)))(m)`.
 * @example
 * // map :: (a -> b) -> Maybe a -> Maybe b
 * map (user => user.name) (just ({ name: 'Alice', role: 'admin' }))
 * // => just('Alice')
 * map (name => name.toUpperCase ()) (just ('alice'))
 * // => just('ALICE')
 * map (x => x * 2) (nothing ())
 * // => nothing()
 */
export function map (f) {
  return (ma) => isJust (ma) ? just (f (ma.value)) : nothing ()
}

// =============================================================================
// Filterable
// =============================================================================

/**
 * Narrows a Just down to Nothing when the value fails the predicate, while
 * passing an existing Nothing through unchanged. Use it to enforce domain
 * constraints inside a pipeline — for example, discarding a user who does
 * not meet an age requirement, or a price that is non-positive — without
 * breaking the Maybe chain or adding explicit branching.
 * @example
 * // filter :: (a -> Boolean) -> Maybe a -> Maybe a
 * filter (user => user.age >= 18) (just ({ name: 'Alice', age: 30 }))
 * // => just({ name: 'Alice', age: 30 })
 * filter (user => user.age >= 18) (just ({ name: 'Bob', age: 15 }))
 * // => nothing()
 * filter (x => x > 0) (nothing ())
 * // => nothing()
 */
export function filter (pred) {
  return (ma) => isJust (ma) && pred (ma.value) ? ma : nothing ()
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Applies a Just-wrapped function to a Just-wrapped value; returns Nothing
 * if either argument is Nothing. Use `ap` to combine two independent Maybes
 * — for example, validating two separate optional fields and merging their
 * results — where neither value depends on the other. When the second Maybe
 * must be derived from the first value, use `chain` instead.
 * @example
 * // ap :: Maybe (a -> b) -> Maybe a -> Maybe b
 * ap (just (name => name.toUpperCase ())) (just ('alice'))
 * // => just('ALICE')
 * ap (nothing ()) (just ('alice'))
 * // => nothing()
 * ap (just (x => x * 2)) (nothing ())
 * // => nothing()
 */
export function ap (mf) {
  return (ma) => isJust (mf) && isJust (ma) ? just (mf.value (ma.value)) : nothing ()
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Monadic bind — applies f to the value inside Just and returns the result
 * directly, without double-wrapping; passes Nothing through. Use `chain`
 * when each step in a pipeline might itself fail and return Nothing — for
 * example, looking up a user, then their address, then their city — so that
 * the first Nothing short-circuits all remaining steps automatically.
 * @example
 * // chain :: (a -> Maybe b) -> Maybe a -> Maybe b
 * chain (user => fromNullable (user.address)) (just ({ name: 'Alice', address: '1 Main St' }))
 * // => just('1 Main St')
 * chain (user => fromNullable (user.address)) (just ({ name: 'Bob' }))
 * // => nothing()
 * chain (user => fromNullable (user.address)) (nothing ())
 * // => nothing()
 */
export function chain (f) {
  return (ma) => isJust (ma) ? f (ma.value) : nothing ()
}

/**
 * Sequences a Maybe with a nullable-returning function, automatically
 * wrapping the result via `fromNullable`. Equivalent to
 * `chain(compose(fromNullable)(f))` but more concise. Use it when you have
 * accessor functions that return null or undefined — such as direct property
 * reads or Map.get calls — and want to keep the pipeline flat without
 * manually calling `fromNullable` at every step.
 * @example
 * // chainNullable :: (a -> b | null | undefined) -> Maybe a -> Maybe b
 * chainNullable (user => user.address) (just ({ name: 'Alice', address: '1 Main St' }))
 * // => just('1 Main St')
 * chainNullable (user => user.address) (just ({ name: 'Bob' }))
 * // => nothing()
 * chainNullable (user => user.address) (nothing ())
 * // => nothing()
 */
export function chainNullable (f) {
  return (ma) => isJust (ma) ? fromNullable (f (ma.value)) : nothing ()
}

// =============================================================================
// Alt / Plus
// =============================================================================

/**
 * Returns the first Just, falling back to the second Maybe if the first is
 * Nothing. Models the "try primary, fall back to secondary" pattern — for
 * example, preferring a user-supplied locale over a system default, or using
 * a cached value before falling back to a freshly computed one. Note that the
 * fallback is passed as the first (curried) argument due to the fixed
 * currying order.
 * @example
 * // alt :: Maybe a -> Maybe a -> Maybe a
 * alt (just ('en-US')) (just ('fr-FR'))
 * // => just('fr-FR')
 * alt (just ('en-US')) (nothing ())
 * // => just('en-US')
 * alt (nothing ()) (nothing ())
 * // => nothing()
 */
export function alt (second) {
  return (first) => isJust (first) ? first : second
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Folds a Maybe into a single value — returns `init` for Nothing and applies
 * `f(init)(value)` for Just. This is the standard Foldable interface; it
 * lets you reduce a Maybe into any type, such as appending an optional tag
 * onto a list, summing an optional price into a running total, or converting
 * a Maybe into a string for display.
 * @example
 * // fold :: (b -> a -> b) -> b -> Maybe a -> b
 * fold (tags => tag => [...tags, tag]) ([]) (just ('admin'))
 * // => ['admin']
 * fold (tags => tag => [...tags, tag]) ([]) (nothing ())
 * // => []
 * fold (total => price => total + price) (0) (just (49.99))
 * // => 49.99
 */
export function fold (f) {
  return (init) => (ma) => isJust (ma) ? f (init) (ma.value) : init
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Sequences a Maybe through an applicative functor — runs `f` which
 * produces a wrapped value and collects the result into a wrapped Maybe.
 * For Just it applies `f` to the inner value and maps `just` over the
 * resulting applicative; for Nothing it lifts `nothing()` into the functor.
 * Pass `apOf` (pure / of) and `apMap` (fmap) for the target applicative to
 * keep this function functor-agnostic.
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> Maybe a -> f (Maybe b)
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, -x]) (just (3))
 * // => [just(3), just(-3)]
 * traverse (Array.of) (f => xs => xs.map (f)) (x => [x, -x]) (nothing ())
 * // => [nothing()]
 */
export function traverse (apOf) {
  return (apMap) => (f) => (ma) =>
    isJust (ma) ? apMap (just) (f (ma.value)) : apOf (nothing ())
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Combines two independent Maybes into a Just of a pair, returning Nothing
 * if either is Nothing. Use it when you need both optional values to be
 * present before proceeding — for example, pairing a user's first and last
 * name, or combining a latitude and longitude into a coordinate — so that
 * the pair is only formed when all pieces exist.
 * @example
 * // zip :: Maybe a -> Maybe b -> Maybe [a, b]
 * zip (just ('Alice')) (just ('Smith'))
 * // => just(['Alice', 'Smith'])
 * zip (just (51.509865)) (nothing ())
 * // => nothing()
 * zip (nothing ()) (nothing ())
 * // => nothing()
 */
export function zip (ma) {
  return (mb) => isJust (ma) && isJust (mb) ? just ([ma.value, mb.value]) : nothing ()
}

/**
 * Extracts and collects the values from all Just elements in an array,
 * silently discarding any Nothings. Useful for gathering successful results
 * after mapping a fallible operation — for example, collecting valid records
 * from a batch of lookups where some IDs were not found.
 * @example
 * // justs :: Array (Maybe a) -> Array a
 * justs ([just ('alice'), nothing (), just ('bob'), nothing ()])
 * // => ['alice', 'bob']
 * justs ([nothing (), nothing ()])
 * // => []
 */
export function justs (mas) {
  return mas.reduce ((acc, ma) => (isJust (ma) ? (acc.push (ma.value), acc) : acc), [])
}

/**
 * Maps a Maybe-returning function over an array and collects only the Just
 * results, performing transformation and filtering in a single pass.
 * Equivalent to `justs(xs.map(f))` but expressed as a reusable combinator.
 * Use it whenever you want to simultaneously transform and discard — for
 * example, parsing strings into numbers and silently dropping the ones that
 * fail to parse.
 * @example
 * // mapMaybe :: (a -> Maybe b) -> Array a -> Array b
 * mapMaybe (x => x > 0 ? just (x * 10) : nothing ()) ([3, -1, 5, -2])
 * // => [30, 50]
 * mapMaybe (s => s.trim ().length > 0 ? just (s.trim ()) : nothing ()) (['  hi  ', '', '  world  '])
 * // => ['hi', 'world']
 */
export function mapMaybe (f) {
  return (xs) => justs (xs.map (f))
}
