// nonempty.js – NonEmptyArray: an array guaranteed to have at least one element.
// NonEmptyArray a = { tag: 'nonempty', head: a, tail: Array a }
//
// Unlike Array, NonEmptyArray is a Semigroup but not a Monoid (no empty),
// and head / last always return a value — never Maybe.

import * as M from './maybe.js'
import { toComparator } from './ordering.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Constructs a NonEmptyArray from a head element and a (possibly empty) tail.
 * @example
 * // of :: a -> Array a -> NonEmptyArray a
 * of (1) ([2, 3]) // => { tag: 'nonempty', head: 1, tail: [2, 3] }
 * of (1) ([])     // => { tag: 'nonempty', head: 1, tail: [] }
 */
export function of (head) {
  return (tail) => ({ tag: 'nonempty', head, tail })
}

/**
 * Constructs a singleton NonEmptyArray.
 * @example
 * // singleton :: a -> NonEmptyArray a
 * singleton (42) // => { tag: 'nonempty', head: 42, tail: [] }
 */
export function singleton (a) {
  return of (a) ([])
}

/**
 * Attempts to construct a NonEmptyArray from a plain array.
 * Returns Just(NonEmptyArray) for non-empty arrays, Nothing for empty.
 * @example
 * // fromArray :: Array a -> Maybe (NonEmptyArray a)
 * fromArray ([1, 2, 3]) // => just(of(1)([2, 3]))
 * fromArray ([])        // => nothing()
 */
export function fromArray (arr) {
  return arr.length > 0
    ? M.just (of (arr[0]) (arr.slice (1)))
    : M.nothing ()
}

// =============================================================================
// Guards
// =============================================================================

/**
 * True when the value is a NonEmptyArray.
 * @example
 * // isNonEmpty :: a -> Boolean
 * isNonEmpty (singleton (1)) // => true
 * isNonEmpty ([1, 2])        // => false
 */
export function isNonEmpty (a) {
  return Boolean (a?.tag === 'nonempty')
}

// =============================================================================
// Destructors
// =============================================================================

/**
 * Extracts the first element — always safe, no Maybe needed.
 * @example
 * // head :: NonEmptyArray a -> a
 * head (of (1) ([2, 3])) // => 1
 */
export function head (nea) {
  return nea.head
}

/**
 * Returns the tail as a plain array (may be empty).
 * @example
 * // tail :: NonEmptyArray a -> Array a
 * tail (of (1) ([2, 3])) // => [2, 3]
 * tail (singleton (1))   // => []
 */
export function tail (nea) {
  return nea.tail
}

/**
 * Extracts the last element — always safe, no Maybe needed.
 * @example
 * // last :: NonEmptyArray a -> a
 * last (of (1) ([2, 3])) // => 3
 * last (singleton (5))   // => 5
 */
export function last (nea) {
  return nea.tail.length > 0 ? nea.tail[nea.tail.length - 1] : nea.head
}

/**
 * Returns all elements except the last as a plain array (may be empty).
 * @example
 * // init :: NonEmptyArray a -> Array a
 * init (of (1) ([2, 3])) // => [1, 2]
 * init (singleton (1))   // => []
 */
export function init (nea) {
  return nea.tail.length > 0
    ? [nea.head, ...nea.tail.slice (0, -1)]
    : []
}

/**
 * Converts a NonEmptyArray to a plain array.
 * @example
 * // toArray :: NonEmptyArray a -> Array a
 * toArray (of (1) ([2, 3])) // => [1, 2, 3]
 */
export function toArray (nea) {
  return [nea.head, ...nea.tail]
}

/**
 * Returns the number of elements.
 * @example
 * // size :: NonEmptyArray a -> Integer
 * size (of (1) ([2, 3])) // => 3
 * size (singleton (1))   // => 1
 */
export function size (nea) {
  return 1 + nea.tail.length
}

/**
 * Case analysis — the single branch receives head and tail.
 * @example
 * // fold :: (a -> Array a -> b) -> NonEmptyArray a -> b
 * fold (h => t => h + t.length) (of (1) ([2, 3])) // => 3
 */
export function fold (f) {
  return (nea) => f (nea.head) (nea.tail)
}

// =============================================================================
// Eq / Ord
// =============================================================================

/**
 * Element-wise equality using a curried comparator.
 * @example
 * // equals :: (a -> a -> Boolean) -> NonEmptyArray a -> NonEmptyArray a -> Boolean
 * equals (a => b => a === b) (of (1) ([2])) (of (1) ([2])) // => true
 * equals (a => b => a === b) (of (1) ([2])) (of (1) ([3])) // => false
 */
export function equals (eq) {
  return (a) => (b) => {
    const as = toArray (a)
    const bs = toArray (b)
    if (as.length !== bs.length) return false
    for (let i = 0; i < as.length; i++) {
      if (!eq (as[i]) (bs[i])) return false
    }
    return true
  }
}

// =============================================================================
// Semigroup  (no Monoid — there is no empty NonEmptyArray)
// =============================================================================

/**
 * Concatenates two NonEmptyArrays — always produces a NonEmptyArray.
 * @example
 * // concat :: NonEmptyArray a -> NonEmptyArray a -> NonEmptyArray a
 * concat (of (1) ([2])) (of (3) ([4])) // => of(1)([2, 3, 4])
 */
export function concat (a) {
  return (b) => of (a.head) ([...a.tail, ...toArray (b)])
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies f to every element, preserving NonEmptyArray structure.
 * @example
 * // map :: (a -> b) -> NonEmptyArray a -> NonEmptyArray b
 * map (x => x * 2) (of (1) ([2, 3])) // => of(2)([4, 6])
 */
export function map (f) {
  return (nea) => of (f (nea.head)) (nea.tail.map (f))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Applies each function in the first NonEmptyArray to each value in the second.
 * @example
 * // ap :: NonEmptyArray (a -> b) -> NonEmptyArray a -> NonEmptyArray b
 * ap (of (x => x + 1) ([x => x * 2])) (of (10) ([20]))
 * // => of(11)([21, 20, 40])
 */
export function ap (nef) {
  return (nea) => {
    const fs  = toArray (nef)
    const xs  = toArray (nea)
    const all = fs.flatMap ((f) => xs.map (f))
    return of (all[0]) (all.slice (1))
  }
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Monadic bind — applies f to every element and concatenates the results.
 * @example
 * // chain :: (a -> NonEmptyArray b) -> NonEmptyArray a -> NonEmptyArray b
 * chain (x => of (x) ([x * 2])) (of (1) ([2]))
 * // => of(1)([2, 2, 4])
 */
export function chain (f) {
  return (nea) => {
    const all = toArray (nea).flatMap ((x) => toArray (f (x)))
    return of (all[0]) (all.slice (1))
  }
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Left fold over all elements with a curried binary function.
 * @example
 * // reduce :: (b -> a -> b) -> b -> NonEmptyArray a -> b
 * reduce (acc => x => acc + x) (0) (of (1) ([2, 3])) // => 6
 */
export function reduce (f) {
  return (init) => (nea) =>
    toArray (nea).reduce ((acc, x) => f (acc) (x), init)
}

/**
 * Left fold with no initial value — uses the head as the seed.
 * Equivalent to Haskell's `foldl1`.
 * @example
 * // reduce1 :: (a -> a -> a) -> NonEmptyArray a -> a
 * reduce1 (acc => x => acc + x) (of (1) ([2, 3])) // => 6
 */
export function reduce1 (f) {
  return (nea) =>
    nea.tail.reduce ((acc, x) => f (acc) (x), nea.head)
}

// =============================================================================
// Filtering  (returns Maybe because the result may become empty)
// =============================================================================

/**
 * Filters elements — returns Just(NonEmptyArray) if any pass, Nothing if all fail.
 * @example
 * // filter :: (a -> Boolean) -> NonEmptyArray a -> Maybe (NonEmptyArray a)
 * filter (x => x > 1) (of (1) ([2, 3])) // => just(of(2)([3]))
 * filter (x => x > 9) (of (1) ([2, 3])) // => nothing()
 */
export function filter (pred) {
  return (nea) => fromArray (toArray (nea).filter (pred))
}

// =============================================================================
// Other utilities
// =============================================================================

/**
 * Reverses the NonEmptyArray.
 * @example
 * // reverse :: NonEmptyArray a -> NonEmptyArray a
 * reverse (of (1) ([2, 3])) // => of(3)([2, 1])
 */
export function reverse (nea) {
  const arr = toArray (nea).reverse ()
  return of (arr[0]) (arr.slice (1))
}

/**
 * Appends a single element.
 * @example
 * // append :: a -> NonEmptyArray a -> NonEmptyArray a
 * append (4) (of (1) ([2, 3])) // => of(1)([2, 3, 4])
 */
export function append (x) {
  return (nea) => of (nea.head) ([...nea.tail, x])
}

/**
 * Prepends a single element.
 * @example
 * // prepend :: a -> NonEmptyArray a -> NonEmptyArray a
 * prepend (0) (of (1) ([2, 3])) // => of(0)([1, 2, 3])
 */
export function prepend (x) {
  return (nea) => of (x) (toArray (nea))
}

/**
 * Stable sort using an Ordering comparator.
 * Returns a NonEmptyArray — sorting can never empty the collection.
 * @example
 * // sort :: (a -> a -> Ordering) -> NonEmptyArray a -> NonEmptyArray a
 * sort (compare) (of (3) ([1, 2])) // => of(1)([2, 3])
 */
export function sort (cmp) {
  return (nea) => {
    const arr = toArray (nea).slice ()
    arr.sort (toComparator (cmp))
    return of (arr[0]) (arr.slice (1))
  }
}

/**
 * Applicative traversal — maps f over every element collecting effects.
 * Accepts explicit apOf / apAp / apMap to remain functor-agnostic.
 *
 * apOf  :: b -> f b                        (pure / of)
 * apAp  :: f (a -> b) -> f a -> f b        (ap, curried)
 * apMap :: (a -> b) -> f a -> f b          (map, curried)
 *
 * @example
 * // traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> NonEmptyArray a -> f (NonEmptyArray b)
 * const apOf  = Array.of
 * const apAp  = ff => fa => ff.flatMap (f => fa.map (f))
 * const apMap = f  => fa => fa.map (f)
 * traverse (apOf) (apAp) (apMap) (x => [x, -x]) (of (1) ([2]))
 * // => [of(1)([2]), of(1)([-2]), of(-1)([2]), of(-1)([-2])]
 */
export function traverse (apOf) {
  return (apAp) => (apMap) => (f) => (nea) => {
    const xs = toArray (nea)
    // Start with f(head) mapped into a singleton NonEmptyArray inside the functor
    const init = apMap ((v) => of (v) ([])) (f (xs[0]))
    // For each tail element, ap-append it into the accumulated NonEmptyArray
    return xs.slice (1).reduce (
      (acc, x) => apAp (apMap ((nea_) => (v) => append (v) (nea_)) (acc)) (f (x)),
      init,
    )
  }
}
