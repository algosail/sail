// pair.js
// Ordered pair (2-tuple) utilities.
// A pair is represented as a 2-element array [a, b].

// =============================================================================
// Constructors
// =============================================================================

/**
 * Constructs an ordered 2-tuple — a `[a, b]` array with labelled slot semantics.
 * Pairs are the simplest algebraic product type: they hold exactly two values of potentially
 * different types. Use `pair` rather than bare array literals to signal intent and to work
 * with the rest of the pair combinators (`fst`, `snd`, `bimap`, `swap`, etc.).
 * @example
 * // pair :: a -> b -> [a, b]
 * pair ('alice') (30)
 * // => ['alice', 30]
 * pair ('GET') ('/api/users')
 * // => ['GET', '/api/users']
 */
export function pair (a) {
  return (b) => [a, b]
}

/**
 * Duplicates a single value into both slots of a pair — `of(a)` produces `[a, a]`.
 * Also known as `dup` in some FP libraries. Useful as the starting point for a `bimap`
 * pipeline where you want to derive two different projections from the same input value.
 * @example
 * // of :: a -> [a, a]
 * of (5)
 * // => [5, 5]
 * of ('hello')
 * // => ['hello', 'hello']
 */
export function of (a) {
  return pair (a) (a)
}

// =============================================================================
// Destructors
// =============================================================================

/**
 * Extracts the first element of a pair — the `a` in `[a, b]`.
 * The symmetric counterpart to `snd`. Useful in pipelines that `map` over arrays of pairs,
 * for example extracting all keys from a list of key-value pairs.
 * @example
 * // fst :: [a, b] -> a
 * fst (['alice', 30])
 * // => 'alice'
 * fst ([['GET', '/users'], 200])
 * // => ['GET', '/users']
 */
export function fst ([a]) {
  return a
}

/**
 * Extracts the second element of a pair — the `b` in `[a, b]`.
 * The symmetric counterpart to `fst`. Use it to project the "value" side in a collection
 * of key-value pairs, or to recover the mapped element after a `traverse`.
 * @example
 * // snd :: [a, b] -> b
 * snd (['alice', 30])
 * // => 30
 * snd (['GET', '/api/users'])
 * // => '/api/users'
 */
export function snd ([, b]) {
  return b
}

/**
 * The canonical eliminator for a pair — applies a curried binary function to both elements.
 * Equivalent to Haskell's `uncurry`: it converts a curried `a -> b -> c` into a function that
 * accepts `[a, b]`. Use it to collapse a pair into a single value without destructuring manually,
 * or to bridge between curried pair combinators and a function that expects two separate arguments.
 * @example
 * // fold :: (a -> b -> c) -> [a, b] -> c
 * fold (a => b => a + b) ([3, 4])
 * // => 7
 * fold (key => val => `${key}=${val}`) (['color', 'red'])
 * // => 'color=red'
 */
export function fold (f) {
  return ([a, b]) => f (a) (b)
}

// =============================================================================
// Functor / Bifunctor
// =============================================================================

/**
 * Maps `f` over the second element, leaving the first unchanged — the standard `Functor` instance.
 * The first element acts as a fixed "context" (like the key in a key-value pair) while the second
 * is the "value" being transformed. This is consistent with the `Functor` instance for pairs in
 * Haskell and lets you pipeline transformations on the value slot without touching the context.
 * @example
 * // map :: (b -> d) -> [a, b] -> [a, d]
 * map (x => x * 2) (['score', 21])
 * // => ['score', 42]
 * map (s => s.toUpperCase()) (['key', 'hello'])
 * // => ['key', 'HELLO']
 */
export function map (f) {
  return ([a, b]) => pair (a) (f (b))
}

/**
 * Maps `f` over the first element, leaving the second unchanged. Use this when the
 * "context" or key slot needs to be transformed — for example, normalising string keys
 * to lowercase or converting an ID to a different format — without touching the associated value.
 * @example
 * // mapFst :: (a -> c) -> [a, b] -> [c, b]
 * mapFst (s => s.toLowerCase()) (['USER', 42])
 * // => ['user', 42]
 * mapFst (n => n * 10) ([3, 'hello'])
 * // => [30, 'hello']
 */
export function mapFst (f) {
  return ([a, b]) => pair (f (a)) (b)
}

/**
 * Maps `f` over the second element, leaving the first unchanged.
 * An explicit alias for `map` — prefer `mapSnd` over `map` when the intent is specifically
 * to transform the second slot, making the direction of the transformation immediately
 * clear at the call site.
 * @example
 * // mapSnd :: (b -> d) -> [a, b] -> [a, d]
 * mapSnd (n => n + 1) (['count', 9])
 * // => ['count', 10]
 * mapSnd (s => s.trim()) (['name', '  alice  '])
 * // => ['name', 'alice']
 */
export function mapSnd (f) {
  return ([a, b]) => pair (a) (f (b))
}

/**
 * Applies `f` to both elements independently, transforming both slots in one pass.
 * This is the `Bifunctor` interface for pairs. Use it instead of chaining `mapFst` and
 * `mapSnd` when you need to remap both elements simultaneously — for example, normalising
 * a key-value pair or converting both members to a common representation.
 * @example
 * // bimap :: (a -> c) -> (b -> d) -> [a, b] -> [c, d]
 * bimap (s => s.toLowerCase()) (n => n * 2) (['SCORE', 21])
 * // => ['score', 42]
 * bimap (Number) (Boolean) (['42', 1])
 * // => [42, true]
 */
export function bimap (f) {
  return (g) => ([a, b]) => pair (f (a)) (g (b))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Applies the function in the first slot to the value in the second — `[f, x]` becomes `f(x)`.
 * The pair acts as a self-contained argument bundle, pairing a computation with its input.
 * This is useful when you have accumulated both the function and its argument over separate
 * pipeline stages and need to discharge the application in a single step.
 * @example
 * // ap :: [a -> b, a] -> b
 * ap ([x => x * 2, 21])
 * // => 42
 * ap ([s => s.trim(), '  hello  '])
 * // => 'hello'
 */
export function ap ([f, a]) {
  return f (a)
}

// =============================================================================
// Swap
// =============================================================================

/**
 * Swaps the two elements, producing `[b, a]` from `[a, b]`. Useful when an API or
 * algorithm returns pairs in the opposite order from what a downstream combinator expects —
 * for example switching between `(key, value)` and `(value, key)` conventions, or reversing
 * the slots before applying `map` or `fold`.
 * @example
 * // swap :: [a, b] -> [b, a]
 * swap (['alice', 30])
 * // => [30, 'alice']
 * swap (['key', 'value'])
 * // => ['value', 'key']
 */
export function swap ([a, b]) {
  return pair (b) (a)
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Traverses the first element through an applicative functor, keeping the second as a fixed
 * context in the result. This is the `Traversable` instance for the first slot of a pair,
 * letting you sequence effects over the first element while the second rides along unchanged.
 * Accepts explicit `apOf`/`apMap` to remain functor-agnostic and work with any applicative.
 *
 * apOf  :: b -> f b                        (pure / of)
 * apMap :: (a -> b) -> f a -> f b          (map, curried)
 *
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> [a, c] -> f [b, c]
 * const apOf  = Array.of
 * const apMap = f => xs => xs.map (f)
 * traverse (apOf) (apMap) (x => [x, -x]) ([1, 'ctx'])
 * // => [[1, 'ctx'], [-1, 'ctx']]
 */
export function traverse (apOf) {
  return (apMap) => (f) => ([a, b]) => apMap ((x) => pair (x) (b)) (f (a))
}
