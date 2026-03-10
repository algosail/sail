// pair.js – Ordered pair (2-tuple) utilities.
// A pair is represented as a 2-element array [a, b].

// =============================================================================
// Constructors
// =============================================================================

/**
 * Constructs a 2-element tuple.
 * @example
 * // pair :: a -> b -> [a, b]
 * pair (1) (2) // => [1, 2]
 */
export function pair (a) {
  return (b) => [a, b]
}

/**
 * Lifts a value into a pair context — pairs it with itself.
 * @example
 * // of :: a -> [a, a]
 * of (3) // => [3, 3]
 */
export function of (a) {
  return pair (a) (a)
}

// =============================================================================
// Destructors
// =============================================================================

/**
 * Extracts the first element.
 * @example
 * // fst :: [a, b] -> a
 * fst ([1, 2]) // => 1
 */
export function fst ([a]) {
  return a
}

/**
 * Extracts the second element.
 * @example
 * // snd :: [a, b] -> b
 * snd ([, b]) // => b
 * snd ([1, 2]) // => 2
 */
export function snd ([, b]) {
  return b
}

/**
 * Applies a curried binary function to the pair's elements.
 * The canonical eliminator — Haskell's `uncurry`.
 * @example
 * // fold :: (a -> b -> c) -> [a, b] -> c
 * fold (a => b => a + b) ([1, 2]) // => 3
 */
export function fold (f) {
  return ([a, b]) => f (a) (b)
}

// =============================================================================
// Functor / Bifunctor
// =============================================================================

/**
 * Maps over the second element (the Functor slot), leaving the first unchanged.
 * Consistent with the standard Functor instance for pairs, where the first
 * element is the "fixed" context and the second is the mapped value.
 * @example
 * // map :: (b -> d) -> [a, b] -> [a, d]
 * map (x => x + 1) ([1, 2]) // => [1, 3]
 */
export function map (f) {
  return ([a, b]) => pair (a) (f (b))
}

/**
 * Maps over the first element, leaving the second unchanged.
 * @example
 * // mapFst :: (a -> c) -> [a, b] -> [c, b]
 * mapFst (x => x + 1) ([1, 2]) // => [2, 2]
 */
export function mapFst (f) {
  return ([a, b]) => pair (f (a)) (b)
}

/**
 * Maps over the second element, leaving the first unchanged.
 * Alias for `map` — provided for symmetry with `mapFst`.
 * @example
 * // mapSnd :: (b -> d) -> [a, b] -> [a, d]
 * mapSnd (x => x + 1) ([1, 2]) // => [1, 3]
 */
export function mapSnd (f) {
  return ([a, b]) => pair (a) (f (b))
}

/**
 * Maps both elements independently.
 * @example
 * // bimap :: (a -> c) -> (b -> d) -> [a, b] -> [c, d]
 * bimap (x => x + 1) (x => x * 2) ([1, 3]) // => [2, 6]
 */
export function bimap (f) {
  return (g) => ([a, b]) => pair (f (a)) (g (b))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Applies the function in the first slot to the value in the second.
 * `ap ([f, x])` ≡ `f (x)` — the pair acts as an environment holding
 * both the function and its argument.
 * @example
 * // ap :: [a -> b, a] -> b
 * ap ([x => x + 1, 5]) // => 6
 */
export function ap ([f, a]) {
  return f (a)
}

// =============================================================================
// Swap
// =============================================================================

/**
 * Swaps the two elements.
 * @example
 * // swap :: [a, b] -> [b, a]
 * swap ([1, 2]) // => [2, 1]
 */
export function swap ([a, b]) {
  return pair (b) (a)
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Traverses the first element through an applicative functor.
 * Accepts explicit apOf / apMap to remain functor-agnostic.
 *
 * apOf  :: b -> f b                        (pure / of)
 * apMap :: (a -> b) -> f a -> f b          (map, curried)
 *
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> [a, c] -> f [b, c]
 * const apOf  = Array.of
 * const apMap = f => xs => xs.map (f)
 * traverse (apOf) (apMap) (x => [x, -x]) ([1, 2]) // => [[1, 2], [-1, 2]]
 */
export function traverse (apOf) {
  return (apMap) => (f) => ([a, b]) => apMap ((x) => pair (x) (b)) (f (a))
}
