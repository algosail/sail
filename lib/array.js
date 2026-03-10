// array.js – Array utilities: constructors, folds, and transformers.

import * as M from './maybe.js'
import { lt as ordLT, eq as ordEQ, gt as ordGT, toComparator } from './ordering.js'
import { pair } from './pair.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Lifts a value into a singleton array.
 * @example
 * // of :: a -> Array a
 * of (1) // => [1]
 */
export function of (a) {
  return [a]
}

/**
 * Returns a new empty array.
 * @example
 * // empty :: () -> Array a
 * empty () // => []
 */
export function empty () {
  return []
}

/**
 * Produces [from, from+1, ..., to-1].
 * @example
 * // range :: Integer -> Integer -> Array Integer
 * range (1) (4) // => [1, 2, 3]
 */
export function range (from) {
  return (to) => {
    const result = []
    for (let n = from; n < to; n++) result.push (n)
    return result
  }
}

/**
 * Generates an array from a seed until the stepper returns Nothing.
 * @example
 * // unfold :: (b -> Maybe [a, b]) -> b -> Array a
 * unfold (n => n > 3 ? M.nothing () : M.just ([n, n + 1])) (1) // => [1, 2, 3]
 */
export function unfold (f) {
  return (seed) => {
    const result = []
    let s = seed
    while (true) {
      const m = f (s)
      if (M.isNothing (m)) return result
      result.push (m.value[0])
      s = m.value[1]
    }
  }
}

/**
 * Stack-safe recursive array expansion. f receives (next, done, value).
 * @example
 * // chainRec :: ((a -> Step, b -> Step, a) -> Array Step) -> a -> Array b
 * chainRec ((next, done, x) => x > 2 ? [done (x)] : [next (x + 1), next (x + 2)]) (0)
 */
export function chainRec (f) {
  return (seed) => {
    const next  = (value) => ({ done: false, value })
    const done  = (value) => ({ done: true,  value })
    const result = []
    let todo = [seed]
    while (todo.length > 0) {
      const pending = []
      for (const step of f (next, done, todo.shift ())) {
        if (step.done) result.push (step.value)
        else pending.push (step.value)
      }
      todo = pending.concat (todo)
    }
    return result
  }
}

// =============================================================================
// Eq / Ord
// =============================================================================

/**
 * Element-wise equality using a curried comparator.
 * @example
 * // equals :: (a -> a -> Boolean) -> Array a -> Array a -> Boolean
 * equals (a => b => a === b) ([1, 2]) ([1, 2]) // => true
 * equals (a => b => a === b) ([1, 2]) ([1, 3]) // => false
 */
export function equals (eq) {
  return (a) => (b) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!eq (a[i]) (b[i])) return false
    }
    return true
  }
}

/**
 * Lexicographic ordering using a curried lte comparator.
 * @example
 * // lte :: (a -> a -> Boolean) -> Array a -> Array a -> Boolean
 * lte (a => b => a <= b) ([1, 2]) ([1, 3]) // => true
 * lte (a => b => a <= b) ([1, 3]) ([1, 2]) // => false
 */
export function lte (lteElem) {
  return (a) => (b) => {
    for (let i = 0; i < a.length; i++) {
      if (i >= b.length) return false
      const aLteB = lteElem (a[i]) (b[i])
      const bLteA = lteElem (b[i]) (a[i])
      if (!(aLteB && bLteA)) return aLteB
    }
    return true
  }
}

// =============================================================================
// Guards
// =============================================================================

/**
 * True when index is negative or >= array length.
 * @example
 * // isOutOfBounds :: Integer -> Array a -> Boolean
 * isOutOfBounds (3) ([1, 2, 3]) // => true
 * isOutOfBounds (0) ([1, 2, 3]) // => false
 */
export function isOutOfBounds (index) {
  return (a) => index < 0 || index >= a.length
}

/**
 * Returns the number of elements.
 * @example
 * // size :: Array a -> Integer
 * size ([1, 2, 3]) // => 3
 * size ([])        // => 0
 */
export function size (arr) {
  return arr.length
}

/**
 * True when every element satisfies the predicate.
 * @example
 * // all :: (a -> Boolean) -> Array a -> Boolean
 * all (x => x > 0) ([1, 2, 3]) // => true
 * all (x => x > 0) ([1, -1])   // => false
 */
export function all (pred) {
  return (arr) => arr.every (pred)
}

/**
 * True when at least one element satisfies the predicate.
 * @example
 * // any :: (a -> Boolean) -> Array a -> Boolean
 * any (x => x > 2) ([1, 2, 3]) // => true
 * any (x => x > 5) ([1, 2, 3]) // => false
 */
export function any (pred) {
  return (arr) => arr.some (pred)
}

/**
 * True when no element satisfies the predicate.
 * @example
 * // none :: (a -> Boolean) -> Array a -> Boolean
 * none (x => x > 5) ([1, 2, 3]) // => true
 * none (x => x > 2) ([1, 2, 3]) // => false
 */
export function none (pred) {
  return (arr) => !arr.some (pred)
}

/**
 * True when x is found in arr using a curried equality function.
 * @example
 * // elem :: (a -> a -> Boolean) -> a -> Array a -> Boolean
 * elem (a => b => a === b) (2) ([1, 2, 3]) // => true
 * elem (a => b => a === b) (9) ([1, 2, 3]) // => false
 */
export function elem (eq) {
  return (x) => (arr) => arr.some ((a) => eq (a) (x))
}

// =============================================================================
// Accessors
// =============================================================================

/**
 * Case analysis: returns the empty value for [], or nonEmpty(head)(tail).
 * @example
 * // array :: b -> (a -> Array a -> b) -> Array a -> b
 * array (0) (h => _ => h) ([5, 6]) // => 5
 * array (0) (h => _ => h) ([])     // => 0
 */
export function array (empty_) {
  return (nonEmpty) => (arr) =>
    arr.length === 0 ? empty_ : nonEmpty (arr[0]) (arr.slice (1))
}

/**
 * Returns Just the element at index, or Nothing if out of bounds.
 * @example
 * // lookup :: Integer -> Array a -> Maybe a
 * lookup (0) ([10, 20]) // => just(10)
 * lookup (5) ([10, 20]) // => nothing()
 */
export function lookup (index) {
  return (a) => isOutOfBounds (index) (a) ? M.nothing () : M.just (a[index])
}

/**
 * Returns Just the first element, or Nothing for empty arrays.
 * @example
 * // head :: Array a -> Maybe a
 * head ([1, 2, 3]) // => just(1)
 * head ([])        // => nothing()
 */
export function head (arr) {
  return arr.length > 0 ? M.just (arr[0]) : M.nothing ()
}

/**
 * Returns Just the last element, or Nothing for empty arrays.
 * @example
 * // last :: Array a -> Maybe a
 * last ([1, 2, 3]) // => just(3)
 * last ([])        // => nothing()
 */
export function last (arr) {
  return arr.length > 0 ? M.just (arr[arr.length - 1]) : M.nothing ()
}

/**
 * Returns Just all elements after the first, or Nothing for empty.
 * @example
 * // tail :: Array a -> Maybe (Array a)
 * tail ([1, 2, 3]) // => just([2, 3])
 * tail ([])        // => nothing()
 */
export function tail (arr) {
  return arr.length > 0 ? M.just (arr.slice (1)) : M.nothing ()
}

/**
 * Returns Just all elements except the last, or Nothing for empty.
 * @example
 * // init :: Array a -> Maybe (Array a)
 * init ([1, 2, 3]) // => just([1, 2])
 * init ([])        // => nothing()
 */
export function init (arr) {
  return arr.length > 0 ? M.just (arr.slice (0, -1)) : M.nothing ()
}

/**
 * Returns Just the first element satisfying the predicate, or Nothing.
 * @example
 * // find :: (a -> Boolean) -> Array a -> Maybe a
 * find (x => x > 2) ([1, 2, 3, 4]) // => just(3)
 * find (x => x > 9) ([1, 2, 3])    // => nothing()
 */
export function find (pred) {
  return (arr) => {
    for (const x of arr) if (pred (x)) return M.just (x)
    return M.nothing ()
  }
}

/**
 * Returns the first Just result from applying f to each element.
 * @example
 * // findMap :: (a -> Maybe b) -> Array a -> Maybe b
 * findMap (x => x > 2 ? M.just (x * 10) : M.nothing ()) ([1, 2, 3]) // => just(30)
 * findMap (x => x > 9 ? M.just (x) : M.nothing ())      ([1, 2, 3]) // => nothing()
 */
export function findMap (f) {
  return (arr) => {
    for (const x of arr) {
      const r = f (x)
      if (M.isJust (r)) return r
    }
    return M.nothing ()
  }
}

// =============================================================================
// Folds
// =============================================================================

/**
 * Left fold with a curried binary function.
 * @example
 * // reduce :: (b -> a -> b) -> b -> Array a -> b
 * reduce (acc => x => acc + x) (0) ([1, 2, 3]) // => 6
 */
export function reduce (f) {
  return (init) => (arr) =>
    arr.reduce ((acc, x) => f (acc) (x), init)
}

/**
 * Left scan — like reduce but collects all intermediate values.
 * @example
 * // scanl :: (b -> a -> b) -> b -> Array a -> Array b
 * scanl (acc => x => acc + x) (0) ([1, 2, 3]) // => [0, 1, 3, 6]
 */
export function scanl (f) {
  return (init) => (arr) => {
    const result = [init]
    let acc = init
    for (const x of arr) {
      acc = f (acc) (x)
      result.push (acc)
    }
    return result
  }
}

/**
 * Maps elements to a monoid and concatenates using a curried concat.
 * @example
 * // foldMap :: (b -> b -> b) -> b -> (a -> b) -> Array a -> b
 * foldMap (a => b => a + b) (0) (x => x * 2) ([1, 2, 3]) // => 12
 */
export function foldMap (concat) {
  return (empty) => (f) => (arr) =>
    arr.reduce ((acc, x) => concat (acc) (f (x)), empty)
}

/**
 * Joins the array with a separator string.
 * @example
 * // joinWith :: String -> Array String -> String
 * joinWith (',') (['a', 'b', 'c']) // => 'a,b,c'
 * joinWith (',') ([])              // => ''
 */
export function joinWith (sep) {
  return (arr) => arr.join (sep)
}

// =============================================================================
// Transformers
// =============================================================================

/**
 * Concatenates two arrays.
 * @example
 * // concat :: Array a -> Array a -> Array a
 * concat ([1, 2]) ([3, 4]) // => [1, 2, 3, 4]
 */
export function concat (a) {
  return (b) => a.concat (b)
}

/**
 * Appends an element to the end.
 * @example
 * // append :: a -> Array a -> Array a
 * append (4) ([1, 2, 3]) // => [1, 2, 3, 4]
 */
export function append (x) {
  return (arr) => arr.concat ([x])
}

/**
 * Prepends an element to the front.
 * @example
 * // prepend :: a -> Array a -> Array a
 * prepend (0) ([1, 2, 3]) // => [0, 1, 2, 3]
 */
export function prepend (x) {
  return (arr) => [x].concat (arr)
}

/**
 * Applies f to every element.
 * @example
 * // map :: (a -> b) -> Array a -> Array b
 * map (x => x * 2) ([1, 2, 3]) // => [2, 4, 6]
 */
export function map (f) {
  return (arr) => arr.map (f)
}

/**
 * Keeps elements satisfying the predicate.
 * @example
 * // filter :: (a -> Boolean) -> Array a -> Array a
 * filter (x => x > 1) ([1, 2, 3]) // => [2, 3]
 */
export function filter (pred) {
  return (arr) => arr.filter (pred)
}

/**
 * Removes elements satisfying the predicate.
 * @example
 * // reject :: (a -> Boolean) -> Array a -> Array a
 * reject (x => x > 1) ([1, 2, 3]) // => [1]
 */
export function reject (pred) {
  return (arr) => arr.filter ((x) => !pred (x))
}

/**
 * Splits an array into a Pair of [passing, failing] based on a predicate.
 * @example
 * // partition :: (a -> Boolean) -> Array a -> [Array a, Array a]
 * partition (x => x > 2) ([1, 2, 3, 4]) // => [[3, 4], [1, 2]]
 */
export function partition (pred) {
  return (arr) => {
    const yes = []
    const no  = []
    for (const x of arr) (pred (x) ? yes : no).push (x)
    return pair (yes) (no)
  }
}

/**
 * Monadic bind — maps f then flattens one level.
 * @example
 * // chain :: (a -> Array b) -> Array a -> Array b
 * chain (x => [x, x * 2]) ([1, 2]) // => [1, 2, 2, 4]
 */
export function chain (f) {
  return (arr) => arr.flatMap (f)
}

/**
 * Flattens one level of nesting.
 * @example
 * // flatten :: Array (Array a) -> Array a
 * flatten ([[1, 2], [3], [4, 5]]) // => [1, 2, 3, 4, 5]
 */
export function flatten (arr) {
  return arr.flat (1)
}

/**
 * Cartesian application — each function applied to each value.
 * @example
 * // ap :: Array (a -> b) -> Array a -> Array b
 * ap ([x => x + 1, x => x * 2]) ([10, 20]) // => [11, 21, 20, 40]
 */
export function ap (fns) {
  return (arr) => fns.flatMap ((f) => arr.map (f))
}

/**
 * Returns a reversed copy.
 * @example
 * // reverse :: Array a -> Array a
 * reverse ([1, 2, 3]) // => [3, 2, 1]
 */
export function reverse (arr) {
  return [...arr].reverse ()
}

/**
 * Stable sort using a curried lte comparator.
 * @example
 * // sort :: (a -> a -> Boolean) -> Array a -> Array a
 * sort (a => b => a <= b) ([3, 1, 2]) // => [1, 2, 3]
 */
export function sort (lteElem) {
  return (arr) => {
    const cmp = (a) => (b) => {
      const ab = lteElem (a) (b)
      const ba = lteElem (b) (a)
      if (ab && ba) return ordEQ
      return ab ? ordLT : ordGT
    }
    const indexed = arr.map ((x, i) => [x, i])
    indexed.sort (([a, i], [b, j]) => {
      const r = toComparator (cmp) (a, b)
      return r === 0 ? i - j : r
    })
    return indexed.map (([x]) => x)
  }
}

/**
 * Stable sort on a projected key using a curried lte comparator.
 * @example
 * // sortBy :: (b -> b -> Boolean) -> (a -> b) -> Array a -> Array a
 * sortBy (a => b => a <= b) (x => x.n) ([{ n: 2 }, { n: 1 }]) // => [{ n: 1 }, { n: 2 }]
 */
export function sortBy (lteKey) {
  return (toKey) => (arr) => {
    const cmp = (a) => (b) => {
      const ka = toKey (a)
      const kb = toKey (b)
      const ab = lteKey (ka) (kb)
      const ba = lteKey (kb) (ka)
      if (ab && ba) return ordEQ
      return ab ? ordLT : ordGT
    }
    const indexed = arr.map ((x, i) => [x, i])
    indexed.sort (([a, i], [b, j]) => {
      const r = toComparator (cmp) (a, b)
      return r === 0 ? i - j : r
    })
    return indexed.map (([x]) => x)
  }
}

/**
 * Removes duplicate elements, keeping the first occurrence.
 * Uses a curried equality function.
 * @example
 * // nub :: (a -> a -> Boolean) -> Array a -> Array a
 * nub (a => b => a === b) ([1, 2, 1, 3, 2]) // => [1, 2, 3]
 */
export function nub (eq) {
  return (arr) => arr.filter ((x, i) =>
    arr.findIndex ((y) => eq (x) (y)) === i,
  )
}

/**
 * Comonad extend — applies f to every suffix.
 * @example
 * // extend :: (Array a -> b) -> Array a -> Array b
 * extend (head) ([1, 2, 3]) // => [just(1), just(2), just(3)]
 */
export function extend (f) {
  return (arr) => arr.map ((_, idx) => f (arr.slice (idx)))
}

// =============================================================================
// Slicing
// =============================================================================

/**
 * Returns Just the first n elements if 0 <= n <= length, else Nothing.
 * @example
 * // take :: Integer -> Array a -> Maybe (Array a)
 * take (2) ([1, 2, 3]) // => just([1, 2])
 * take (5) ([1, 2, 3]) // => nothing()
 */
export function take (n) {
  return (arr) =>
    n >= 0 && n <= arr.length ? M.just (arr.slice (0, n)) : M.nothing ()
}

/**
 * Returns Just the array after dropping the first n elements, else Nothing.
 * @example
 * // drop :: Integer -> Array a -> Maybe (Array a)
 * drop (1) ([1, 2, 3]) // => just([2, 3])
 * drop (5) ([1, 2, 3]) // => nothing()
 */
export function drop (n) {
  return (arr) =>
    n >= 0 && n <= arr.length ? M.just (arr.slice (n)) : M.nothing ()
}

/**
 * Returns Just the last n elements if 0 <= n <= length, else Nothing.
 * @example
 * // takeLast :: Integer -> Array a -> Maybe (Array a)
 * takeLast (2) ([1, 2, 3]) // => just([2, 3])
 * takeLast (5) ([1, 2, 3]) // => nothing()
 */
export function takeLast (n) {
  return (arr) =>
    n >= 0 && n <= arr.length ? M.just (arr.slice (arr.length - n)) : M.nothing ()
}

/**
 * Returns Just the array with the last n elements removed, else Nothing.
 * @example
 * // dropLast :: Integer -> Array a -> Maybe (Array a)
 * dropLast (1) ([1, 2, 3]) // => just([1, 2])
 * dropLast (5) ([1, 2, 3]) // => nothing()
 */
export function dropLast (n) {
  return (arr) =>
    n >= 0 && n <= arr.length ? M.just (arr.slice (0, arr.length - n)) : M.nothing ()
}

/**
 * Returns an array of n copies of x.
 * @example
 * // replicate :: Integer -> a -> Array a
 * replicate (3) ('x') // => ['x', 'x', 'x']
 * replicate (0) (42)  // => []
 */
export function replicate (n) {
  return (x) => {
    const result = []
    for (let i = 0; i < n; i++) result.push (x)
    return result
  }
}

/**
 * Splits the array into [takeWhile(pred), dropWhile(pred)] — the longest
 * prefix satisfying pred and the remainder.
 * @example
 * // span :: (a -> Boolean) -> Array a -> [Array a, Array a]
 * span (x => x < 3) ([1, 2, 3, 4]) // => [[1, 2], [3, 4]]
 * span (x => x < 0) ([1, 2, 3])    // => [[], [1, 2, 3]]
 * span (x => x > 0) ([1, 2, 3])    // => [[1, 2, 3], []]
 */
export function span (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && pred (arr[i])) i++
    return [arr.slice (0, i), arr.slice (i)]
  }
}

/**
 * Like span but splits at the first element satisfying the predicate —
 * equivalent to span(complement(pred)).
 * @example
 * // break_ :: (a -> Boolean) -> Array a -> [Array a, Array a]
 * break_ (x => x > 2) ([1, 2, 3, 4]) // => [[1, 2], [3, 4]]
 * break_ (x => x > 0) ([1, 2, 3])    // => [[], [1, 2, 3]]
 * break_ (x => x < 0) ([1, 2, 3])    // => [[1, 2, 3], []]
 */
export function break_ (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && !pred (arr[i])) i++
    return [arr.slice (0, i), arr.slice (i)]
  }
}

/**
 * Splits the array at a given index — [arr.slice(0,n), arr.slice(n)].
 * Returns the full array paired with [] when n >= length, and [] paired
 * with the full array when n <= 0.
 * @example
 * // splitAt :: Integer -> Array a -> [Array a, Array a]
 * splitAt (2) ([1, 2, 3, 4]) // => [[1, 2], [3, 4]]
 * splitAt (0) ([1, 2, 3])    // => [[], [1, 2, 3]]
 * splitAt (5) ([1, 2, 3])    // => [[1, 2, 3], []]
 */
export function splitAt (n) {
  return (arr) => [arr.slice (0, n), arr.slice (n)]
}

/**
 * Applies f to x repeatedly until pred(x) is true, then returns x.
 * Equivalent to Haskell's `until`.
 * @example
 * // until :: (a -> Boolean) -> (a -> a) -> a -> a
 * until (x => x > 100) (x => x * 2) (1) // => 128
 * until (x => x === 0) (x => x - 1) (5) // => 0
 */
export function until (pred) {
  return (f) => (x) => {
    let v = x
    while (!pred (v)) v = f (v)
    return v
  }
}

/**
 * Takes elements from the front while the predicate holds.
 * @example
 * // takeWhile :: (a -> Boolean) -> Array a -> Array a
 * takeWhile (x => x < 3) ([1, 2, 3, 4]) // => [1, 2]
 */
export function takeWhile (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && pred (arr[i])) i++
    return arr.slice (0, i)
  }
}

/**
 * Drops elements from the front while the predicate holds.
 * @example
 * // dropWhile :: (a -> Boolean) -> Array a -> Array a
 * dropWhile (x => x < 3) ([1, 2, 3, 4]) // => [3, 4]
 */
export function dropWhile (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && pred (arr[i])) i++
    return arr.slice (i)
  }
}

// =============================================================================
// Combining
// =============================================================================

/**
 * Inserts sep between sub-arrays and flattens one level.
 * @example
 * // intercalate :: Array a -> Array (Array a) -> Array a
 * intercalate ([0]) ([[1, 2], [3, 4]]) // => [1, 2, 0, 3, 4]
 */
export function intercalate (sep) {
  return (arr) => {
    if (arr.length === 0) return []
    return arr.reduce ((acc, x, i) => i === 0 ? [...x] : [...acc, ...sep, ...x])
  }
}

/**
 * Groups adjacent elements that are equal under f into sub-arrays.
 * @example
 * // groupBy :: (a -> a -> Boolean) -> Array a -> Array (Array a)
 * groupBy (a => b => a === b) ([1, 1, 2, 3, 3]) // => [[1, 1], [2], [3, 3]]
 */
export function groupBy (f) {
  return (arr) => {
    if (arr.length === 0) return []
    let x0 = arr[0]
    let active = [x0]
    const result = [active]
    for (let i = 1; i < arr.length; i++) {
      const x = arr[i]
      if (f (x0) (x)) active.push (x)
      else result.push ((active = [(x0 = x)]))
    }
    return result
  }
}

/**
 * Zips two arrays to the length of the shorter.
 * @example
 * // zip :: Array a -> Array b -> Array [a, b]
 * zip ([1, 2, 3]) (['a', 'b']) // => [[1, 'a'], [2, 'b']]
 */
export function zip (xs) {
  return (ys) => {
    const n = Math.min (xs.length, ys.length)
    const result = new Array (n)
    for (let i = 0; i < n; i++) result[i] = [xs[i], ys[i]]
    return result
  }
}

/**
 * Zips with a combining function, truncating to the shorter length.
 * @example
 * // zipWith :: (a -> b -> c) -> Array a -> Array b -> Array c
 * zipWith (a => b => a + b) ([1, 2, 3]) ([10, 20]) // => [11, 22]
 */
export function zipWith (f) {
  return (xs) => (ys) => {
    const n = Math.min (xs.length, ys.length)
    const result = new Array (n)
    for (let i = 0; i < n; i++) result[i] = f (xs[i]) (ys[i])
    return result
  }
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Applicative traversal — maps f over the array collecting effects.
 * Accepts explicit apOf / apAp / apMap to remain functor-agnostic.
 *
 * apOf  :: b -> f b                        (pure / of)
 * apAp  :: f (a -> b) -> f a -> f b        (ap, curried)
 * apMap :: (a -> b) -> f a -> f b          (map, curried)
 *
 * @example
 * // traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Array a -> f (Array b)
 * const apOf  = Array.of
 * const apAp  = ff => fa => ff.flatMap (f => fa.map (f))
 * const apMap = f  => fa => fa.map (f)
 * traverse (apOf) (apAp) (apMap) (x => [x, -x]) ([1, 2])
 */
export function traverse (apOf) {
  return (apAp) => (apMap) => (f) => (arr) => {
    if (arr.length === 0) return apOf ([])
    // Start with f(head) lifted into a singleton array inside the functor
    const init = apMap ((x) => [x]) (f (arr[0]))
    // For each remaining element, ap-append it to the accumulated array
    return arr.slice (1).reduce (
      (acc, x) => apAp (apMap ((xs) => (x) => [...xs, x]) (acc)) (f (x)),
      init,
    )
  }
}

/**
 * Maps a monadic function over an array and collects results — the monadic
 * version of `map`.  Requires the monad's `chain` and `of` to be passed
 * explicitly so it works with any monad (Maybe, Either, State, etc.).
 *
 * mapM (chain) (of) (f) (xs)
 *   ≡ sequence through xs applying f to each element
 *
 * @example
 * // mapM :: (m b -> (b -> m c) -> m c) -> (Array b -> m (Array b)) -> (a -> m b) -> Array a -> m (Array b)
 * import * as M from './maybe.js'
 * mapM (M.chain) (xs => M.just(xs)) (x => x > 0 ? M.just(x) : M.nothing()) ([1, 2, 3])
 * // => just([1, 2, 3])
 * mapM (M.chain) (xs => M.just(xs)) (x => x > 0 ? M.just(x) : M.nothing()) ([1, -1, 3])
 * // => nothing()
 */
export function mapM (chain) {
  return (of_) => (f) => (arr) => {
    const go = (i, acc) => {
      if (i >= arr.length) return of_ (acc)
      return chain ((v) => go (i + 1, [...acc, v])) (f (arr[i]))
    }
    return go (0, [])
  }
}

/**
 * Like `mapM` but with the array and function arguments flipped —
 * useful for readability when the array is known upfront.
 *
 * forM (chain) (of) (xs) (f) ≡ mapM (chain) (of) (f) (xs)
 *
 * @example
 * // forM :: (m b -> (b -> m c) -> m c) -> (Array b -> m (Array b)) -> Array a -> (a -> m b) -> m (Array b)
 * import * as M from './maybe.js'
 * forM (M.chain) (xs => M.just(xs)) ([1, 2, 3]) (x => x > 0 ? M.just(x) : M.nothing())
 * // => just([1, 2, 3])
 */
export function forM (chain) {
  return (of_) => (arr) => (f) => mapM (chain) (of_) (f) (arr)
}
