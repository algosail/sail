// pair.js – Ordered pair (2-tuple) utilities.

/**
 * Constructs a 2-element tuple.
 * @example
 * // pair :: a -> b -> [a, b]
 * pair (1) (2) // => [1, 2]
 */
export function pair (first) {
  return (snd) => [first, snd]
}

/**
 * Duplicates a value into a pair.
 * @example
 * // dup :: a -> [a, a]
 * dup (3) // => [3, 3]
 */
export function dup (a) {
  return pair (a) (a)
}

/**
 * Applies the function in the first slot to the value in the second.
 * @example
 * // merge :: [(a -> b), a] -> b
 * merge ([x => x + 1, 5]) // => 6
 */
export function merge (a) {
  return a[0] (a[1])
}

/**
 * Applies the function in the second slot to the value in the first.
 * @example
 * // mergeSecond :: [a, (a -> b)] -> b
 * mergeSecond ([5, x => x + 1]) // => 6
 */
export function mergeSecond (a) {
  return a[1] (a[0])
}

/**
 * Extracts the first element.
 * @example
 * // fst :: [a, b] -> a
 * fst ([1, 2]) // => 1
 */
export function fst ([first]) {
  return first
}

/**
 * Extracts the second element.
 * @example
 * // snd :: [a, b] -> b
 * snd ([1, 2]) // => 2
 */
export function snd ([_, second]) {
  return second
}

/**
 * Swaps the two elements.
 * @example
 * // swap :: [a, b] -> [b, a]
 * swap ([1, 2]) // => [2, 1]
 */
export function swap ([first, second]) {
  return pair (second) (first)
}

/**
 * Maps over the first element.
 * @example
 * // map :: (a -> c) -> [a, b] -> [c, b]
 * map (x => x + 1) ([1, 2]) // => [2, 2]
 */
export function map (fn) {
  return ([first, second]) => pair (fn (first)) (second)
}

/**
 * Maps over the second element.
 * @example
 * // mapSecond :: (b -> d) -> [a, b] -> [a, d]
 * mapSecond (x => x + 1) ([1, 2]) // => [1, 3]
 */
export function mapSecond (fn) {
  return ([first, second]) => pair (first) (fn (second))
}

/**
 * Maps both elements — first arg for first element, second arg for second.
 * @example
 * // bimap :: (a -> c) -> (b -> d) -> [a, b] -> [c, d]
 * bimap (x => x + 1) (x => x * 2) ([1, 3]) // => [2, 6]
 */
export function bimap (fnf, fns) {
  return ([first, second]) => pair (fnf (first)) (fns (second))
}

/**
 * Reduces a pair with a ternary function (initial, first, second).
 * @example
 * // fold :: ((c, a, b) -> c) -> c -> [a, b] -> c
 * fold ((acc, a, b) => acc + a + b) (0) ([1, 2]) // => 3
 */
export function fold (fn, initial) {
  return ([first, second]) => fn (initial, first, second)
}

/**
 * Applies a curried binary function to the pair's elements.
 * @example
 * // foldWith :: (a -> b -> c) -> [a, b] -> c
 * foldWith (a => b => a + b) ([1, 2]) // => 3
 */
export function foldWith (f) {
  return ([a, b]) => f (a) (b)
}

/**
 * Applicative traversal over the first element.
 * @example
 * // traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> [a, c] -> f [b, c]
 * traverse (Array.of) (_ => _) (f => xs => xs.map (f)) (x => [x, -x]) ([1, 2]) // => [[1, 2], [-1, 2]]
 */
export function traverse (_apOf) {
  return (_apAp) => (apMap) => (f) => ([a, b]) =>
    apMap ((x) => pair (x) (b)) (f (a))
}
