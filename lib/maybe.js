import * as F from './fn.js'
import * as E from './either.js'

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
 * Creates a Nothing value.
 * @example 
 * // nothing :: () -> Maybe never
 * nothing () // => { tag: 'nothing' }
 */
export function nothing () {
  return { tag: 'nothing' }
}

/**
 * Converts null/undefined to Nothing, any other value to Just.
 * @example 
 * // fromNullable :: a -> Maybe (NonNullable a)
 * fromNullable (1)    // => just(1)
 * fromNullable (null) // => nothing()
 */
export function fromNullable (a) {
  return (a !== null && a !== undefined) ? just (a) : nothing ()
}

/**
 * Returns Just(a) if predicate holds, Nothing otherwise.
 * @example 
 * // fromPredicate :: (a -> Boolean) -> a -> Maybe a
 * fromPredicate (x => x > 0) (1) // => just(1)
 */
export function fromPredicate (predicate) {
  return (a) => (predicate (a) ? just (a) : nothing ())
}

/**
 * Wraps a thunk — Just on success, Nothing on throw.
 * @example 
 * // tryCatch :: (() -> a) -> Maybe a
 * tryCatch (() => JSON.parse ('1')) // => just(1)
 */
export function tryCatch (fn) {
  return F.handleThrow (fn, just, nothing ())
}

/**
 * Returns true if the value is a Just.
 * @example 
 * // isJust :: unknown -> Boolean
 * isJust (just (1)) // => true
 */
export function isJust (a) {
  return Boolean (a?.tag === 'just')
}

/**
 * Returns true if the value is Nothing.
 * @example 
 * // isNothing :: unknown -> Boolean
 * isNothing (nothing ()) // => true
 */
export function isNothing (a) {
  return Boolean (a?.tag === 'nothing')
}

/**
 * Returns true if the value is a Just or Nothing.
 * @example 
 * // isMaybe :: unknown -> Boolean
 * isMaybe (just (1)) // => true
 */
export function isMaybe (value) {
  return isJust (value) || isNothing (value)
}

/**
 * Case-fold — returns the default for Nothing, applies f for Just.
 * @example 
 * // maybe :: b -> (a -> b) -> Maybe a -> b
 * maybe (0) (x => x + 1) (just (1)) // => 2
 */
export function maybe (nothing_) {
  return (just_) => (ma) => (isJust (ma) ? just_ (ma.value) : nothing_)
}

/**
 * Lazy case-fold — default thunk called only for Nothing.
 * @example 
 * // maybe_ :: (() -> b) -> (a -> b) -> Maybe a -> b
 * maybe_ (() => 0) (x => x + 1) (nothing ()) // => 0
 */
export function maybe_ (nothing_) {
  return (just_) => (ma) => (isJust (ma) ? just_ (ma.value) : nothing_ ())
}

/**
 * Extracts the value or returns the strict default.
 * @example 
 * // fromMaybe :: a -> Maybe a -> a
 * fromMaybe (0) (just (5)) // => 5
 */
export function fromMaybe (def) {
  return (ma) => (isJust (ma) ? ma.value : def)
}

/**
 * Extracts the value or calls the lazy default thunk.
 * @example 
 * // fromMaybe_ :: (() -> a) -> Maybe a -> a
 * fromMaybe_ (() => 0) (nothing ()) // => 0
 */
export function fromMaybe_ (onNothing) {
  return (ma) => (isNothing (ma) ? onNothing () : ma.value)
}

/**
 * Discards Nothings and unwraps Justs.
 * @example 
 * // justs :: Array (Maybe a) -> Array a
 * justs([just (1), nothing (), just (2)]) // => [1, 2]
 */
export function justs (maybes) {
  return maybes.reduce ((acc, ma) => (isJust (ma) ? (acc.push (ma.value), acc) : acc), [])
}

/**
 * Extracts the value or returns null.
 * @example 
 * // toNull :: Maybe a -> a | null
 * toNull (nothing ()) // => null
 */
export function toNull (ma) {
  return fromMaybe_ (() => null) (ma)
}

/**
 * Extracts the value or returns undefined.
 * @example 
 * // toUndefined :: Maybe a -> a | undefined
 * toUndefined (nothing ()) // => undefined
 */
export function toUndefined (ma) {
  return fromMaybe_ (() => undefined) (ma)
}

/**
 * Converts Nothing to Left(def) and Just(v) to Right(v).
 * @example 
 * // maybeToEither :: a -> Maybe b -> Either a b
 * maybeToEither ('err') (just (1)) // => { tag: 'right', right: 1 }
 */
export function maybeToEither (def) {
  return (ma) =>
    isJust (ma) ? E.right (ma.value) : E.left (def)
}

/**
 * Applies f to the value inside Just, passes Nothing through.
 * @example 
 * // map :: (a -> b) -> Maybe a -> Maybe b
 * map (x => x + 1) (just (1)) // => just(2)
 */
export function map (mfn) {
  return (ma) => (isNothing (ma) ? nothing () : just (mfn (ma.value)))
}

/**
 * Returns Nothing if predicate fails or Maybe is already Nothing.
 * @example 
 * // filter :: (a -> Boolean) -> Maybe a -> Maybe a
 * filter(x => x > 0)(just(1)) // => just(1)
 */
export function filter (predicate) {
  const _exists = exists (predicate)
  return (ta) => (_exists (ta) ? ta : nothing ())
}

/**
 * Applies f only if the input is Just, forwarding Nothing directly.
 * @example 
 * // filterMap :: (a -> Maybe b) -> Maybe a -> Maybe b
 * filterMap (x => x > 0 ? just (x) : nothing ()) (just (-1)) // => nothing()
 */
export function filterMap (fn) {
  return (ma) => (isNothing (ma) ? ma : fn (ma.value))
}

/**
 * Monadic bind — applies f to Just's value, passes Nothing through.
 * @example 
 * // flatmap :: (a -> Maybe b) -> Maybe a -> Maybe b
 * flatmap(x => just(x + 1))(just(1)) // => just(2)
 */
export function flatmap (f) {
  return (ma) => (isNothing (ma) ? ma : f (ma.value))
}

/**
 * Maps with a nullable-returning function, converting null/undefined to Nothing.
 * @example 
 * // mapNullable :: (a -> b | null | undefined) -> Maybe a -> Maybe b
 * mapNullable (x => x.name) (just ({ name: 'Alice' })) // => just('Alice')
 */
export function mapNullable (fn) {
  return flatmap (F.pipe ([fn, fromNullable]))
}

/**
 * Maps over an array, discarding Nothings and unwrapping Justs.
 * @example 
 * mapMaybe :: (a -> Maybe b) -> Array a -> Array b
 * mapMaybe (x => x > 0 ? just (x) : nothing ()) ([1, -2, 3]) // => [1, 3]
 */
export function mapMaybe (f) {
  return (xs) => justs (xs.map (f))
}

/**
 * Applies a Just-wrapped function to a Just-wrapped value.
 * @example 
 * // ap :: Maybe (a -> b) -> Maybe a -> Maybe b
 * ap (just (x => x + 1)) (just (1)) // => just(2)
 */
export function ap (mfn) {
  return (ma) =>
    isNothing (mfn) || isNothing (ma) ? nothing () : just (mfn.value (ma.value))
}

/**
 * Returns the first Just, falling back to the second.
 * @example 
 * // alt :: Maybe a -> Maybe a -> Maybe a
 * alt (just (2)) (nothing ()) // => just(2)
 */
export function alt (second) {
  return (first) => (isNothing (first) ? second : first)
}

/**
 * Returns true if Maybe is Just and the predicate holds.
 * @example 
 * // exists :: (a -> Boolean) -> Maybe a -> Boolean
 * exists (x => x > 0) (just (1)) // => true
 */
export function exists (predicate) {
  return (ua) => isJust (ua) && predicate (ua.value)
}

/**
 * Folds a Maybe — returns initial for Nothing, applies foldr for Just.
 * @example 
 * // fold :: ((b, a) -> b) -> b -> Maybe a -> b
 * fold ((acc, x) => acc + x, 0) (just (5)) // => 5
 */
export function fold (foldr, initial) {
  return (ma) => (isJust (ma) ? foldr (initial, ma.value) : initial)
}
