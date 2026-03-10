// set.js – Functional Set with arbitrary equality.
//
// Unlike JS's native Set (which uses reference equality for objects),
// this module accepts an explicit equality function wherever element
// comparison is needed.  Internally a Set is a plain Array of unique
// elements in insertion order — dependency-free and transparent.
//
// Set a = Array a  (all elements are unique under the provided eq)
//
// All operations are immutable — every "mutating" function returns a new Set.

import * as M from './maybe.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Returns a new empty Set.
 * @example
 * // empty :: () -> Set a
 * empty () // => []
 */
export function empty () {
  return []
}

/**
 * Creates a Set with a single element.
 * @example
 * // singleton :: a -> Set a
 * singleton (1) // => [1]
 */
export function singleton (a) {
  return [a]
}

/**
 * Builds a Set from an array, discarding duplicates (later duplicates are
 * ignored — first occurrence wins).
 * @example
 * // fromArray :: (a -> a -> Boolean) -> Array a -> Set a
 * fromArray (a => b => a === b) ([1, 2, 1, 3, 2]) // => [1, 2, 3]
 */
export function fromArray (eq) {
  return (arr) => {
    const result = []
    for (const x of arr) {
      if (!result.some ((y) => eq (x) (y))) result.push (x)
    }
    return result
  }
}

/**
 * Converts a Set to a plain array (identity — Sets are already arrays).
 * @example
 * // toArray :: Set a -> Array a
 * toArray ([1, 2, 3]) // => [1, 2, 3]
 */
export function toArray (s) {
  return s.slice ()
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns the number of elements in the Set.
 * @example
 * // size :: Set a -> Integer
 * size ([1, 2, 3]) // => 3
 * size ([])        // => 0
 */
export function size (s) {
  return s.length
}

/**
 * True when the Set has no elements.
 * @example
 * // isEmpty :: Set a -> Boolean
 * isEmpty ([])    // => true
 * isEmpty ([1])   // => false
 */
export function isEmpty (s) {
  return s.length === 0
}

/**
 * True when the element is a member of the Set.
 * @example
 * // member :: (a -> a -> Boolean) -> a -> Set a -> Boolean
 * member (a => b => a === b) (2) ([1, 2, 3]) // => true
 * member (a => b => a === b) (9) ([1, 2, 3]) // => false
 */
export function member (eq) {
  return (x) => (s) => s.some ((y) => eq (x) (y))
}

/**
 * True when the element is NOT a member of the Set.
 * @example
 * // notMember :: (a -> a -> Boolean) -> a -> Set a -> Boolean
 * notMember (a => b => a === b) (9) ([1, 2, 3]) // => true
 * notMember (a => b => a === b) (1) ([1, 2, 3]) // => false
 */
export function notMember (eq) {
  return (x) => (s) => !s.some ((y) => eq (x) (y))
}

// =============================================================================
// Insert / Delete
// =============================================================================

/**
 * Returns a new Set with the element added.
 * If the element is already a member the Set is returned unchanged.
 * @example
 * // insert :: (a -> a -> Boolean) -> a -> Set a -> Set a
 * insert (a => b => a === b) (4) ([1, 2, 3]) // => [1, 2, 3, 4]
 * insert (a => b => a === b) (2) ([1, 2, 3]) // => [1, 2, 3]
 */
export function insert (eq) {
  return (x) => (s) =>
    s.some ((y) => eq (x) (y)) ? s : [...s, x]
}

/**
 * Returns a new Set with the element removed.
 * No-op if the element is not a member.
 * @example
 * // remove :: (a -> a -> Boolean) -> a -> Set a -> Set a
 * remove (a => b => a === b) (2) ([1, 2, 3]) // => [1, 3]
 * remove (a => b => a === b) (9) ([1, 2, 3]) // => [1, 2, 3]
 */
export function remove (eq) {
  return (x) => (s) => s.filter ((y) => !eq (x) (y))
}

// =============================================================================
// Set operations
// =============================================================================

/**
 * Union — all elements that appear in either Set.
 * Elements from a come first; elements from b are appended if not already
 * present (left-biased on duplicates).
 * @example
 * // union :: (a -> a -> Boolean) -> Set a -> Set a -> Set a
 * union (a => b => a === b) ([1, 2]) ([2, 3]) // => [1, 2, 3]
 * union (a => b => a === b) ([1])    ([2, 3]) // => [1, 2, 3]
 */
export function union (eq) {
  return (a) => (b) => {
    const result = a.slice ()
    for (const x of b) {
      if (!result.some ((y) => eq (x) (y))) result.push (x)
    }
    return result
  }
}

/**
 * Intersection — elements that appear in both Sets (values from a).
 * @example
 * // intersection :: (a -> a -> Boolean) -> Set a -> Set a -> Set a
 * intersection (a => b => a === b) ([1, 2, 3]) ([2, 3, 4]) // => [2, 3]
 * intersection (a => b => a === b) ([1, 2])    ([3, 4])    // => []
 */
export function intersection (eq) {
  return (a) => (b) =>
    a.filter ((x) => b.some ((y) => eq (x) (y)))
}

/**
 * Difference — elements in a that are NOT in b.
 * @example
 * // difference :: (a -> a -> Boolean) -> Set a -> Set a -> Set a
 * difference (a => b => a === b) ([1, 2, 3]) ([2, 3]) // => [1]
 * difference (a => b => a === b) ([1, 2, 3]) ([4, 5]) // => [1, 2, 3]
 */
export function difference (eq) {
  return (a) => (b) =>
    a.filter ((x) => !b.some ((y) => eq (x) (y)))
}

/**
 * Symmetric difference — elements in exactly one of the two Sets.
 * @example
 * // symmetricDifference :: (a -> a -> Boolean) -> Set a -> Set a -> Set a
 * symmetricDifference (a => b => a === b) ([1, 2, 3]) ([2, 3, 4]) // => [1, 4]
 */
export function symmetricDifference (eq) {
  return (a) => (b) => [
    ...a.filter ((x) => !b.some ((y) => eq (x) (y))),
    ...b.filter ((x) => !a.some ((y) => eq (x) (y))),
  ]
}

// =============================================================================
// Subset / Equality
// =============================================================================

/**
 * True when every element of a is also in b (a ⊆ b).
 * @example
 * // isSubsetOf :: (a -> a -> Boolean) -> Set a -> Set a -> Boolean
 * isSubsetOf (a => b => a === b) ([1, 2]) ([1, 2, 3]) // => true
 * isSubsetOf (a => b => a === b) ([1, 4]) ([1, 2, 3]) // => false
 * isSubsetOf (a => b => a === b) ([])     ([1, 2, 3]) // => true
 */
export function isSubsetOf (eq) {
  return (a) => (b) =>
    a.every ((x) => b.some ((y) => eq (x) (y)))
}

/**
 * True when a ⊆ b and b ⊆ a — both Sets contain the same elements.
 * @example
 * // equals :: (a -> a -> Boolean) -> Set a -> Set a -> Boolean
 * equals (a => b => a === b) ([1, 2, 3]) ([3, 1, 2]) // => true
 * equals (a => b => a === b) ([1, 2])    ([1, 2, 3]) // => false
 */
export function equals (eq) {
  return (a) => (b) =>
    a.length === b.length &&
    a.every ((x) => b.some ((y) => eq (x) (y)))
}

// =============================================================================
// Functor / Filterable
// =============================================================================

/**
 * Applies f to every element.
 * Note: the result may contain duplicates if f maps distinct elements to equal
 * values — pass the result through `fromArray` if uniqueness is required.
 * @example
 * // map :: (a -> b) -> Set a -> Set b
 * map (x => x * 2) ([1, 2, 3]) // => [2, 4, 6]
 */
export function map (f) {
  return (s) => s.map (f)
}

/**
 * Like map, but re-deduplicates the result using the provided equality.
 * @example
 * // mapUniq :: (b -> b -> Boolean) -> (a -> b) -> Set a -> Set b
 * mapUniq (a => b => a === b) (x => x % 2) ([1, 2, 3, 4]) // => [1, 0]
 */
export function mapUniq (eq) {
  return (f) => (s) => fromArray (eq) (s.map (f))
}

/**
 * Keeps elements satisfying pred.
 * @example
 * // filter :: (a -> Boolean) -> Set a -> Set a
 * filter (x => x > 1) ([1, 2, 3]) // => [2, 3]
 */
export function filter (pred) {
  return (s) => s.filter (pred)
}

// =============================================================================
// Fold
// =============================================================================

/**
 * Left fold over elements in insertion order with a curried function.
 * @example
 * // reduce :: (b -> a -> b) -> b -> Set a -> b
 * reduce (acc => x => acc + x) (0) ([1, 2, 3]) // => 6
 */
export function reduce (f) {
  return (init) => (s) => s.reduce ((acc, x) => f (acc) (x), init)
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * True when every element satisfies pred.
 * @example
 * // all :: (a -> Boolean) -> Set a -> Boolean
 * all (x => x > 0) ([1, 2, 3]) // => true
 * all (x => x > 1) ([1, 2, 3]) // => false
 */
export function all (pred) {
  return (s) => s.every (pred)
}

/**
 * True when at least one element satisfies pred.
 * @example
 * // any :: (a -> Boolean) -> Set a -> Boolean
 * any (x => x > 2) ([1, 2, 3]) // => true
 * any (x => x > 9) ([1, 2, 3]) // => false
 */
export function any (pred) {
  return (s) => s.some (pred)
}

/**
 * True when no element satisfies pred.
 * @example
 * // none :: (a -> Boolean) -> Set a -> Boolean
 * none (x => x > 9) ([1, 2, 3]) // => true
 * none (x => x > 2) ([1, 2, 3]) // => false
 */
export function none (pred) {
  return (s) => !s.some (pred)
}

/**
 * Returns Just the first element satisfying pred, or Nothing.
 * @example
 * // find :: (a -> Boolean) -> Set a -> Maybe a
 * find (x => x > 2) ([1, 2, 3, 4]) // => just(3)
 * find (x => x > 9) ([1, 2, 3])    // => nothing()
 */
export function find (pred) {
  return (s) => {
    const x = s.find (pred)
    return x !== undefined ? M.just (x) : M.nothing ()
  }
}

/**
 * Returns the number of elements satisfying pred.
 * @example
 * // count :: (a -> Boolean) -> Set a -> Integer
 * count (x => x > 1) ([1, 2, 3]) // => 2
 */
export function count (pred) {
  return (s) => s.reduce ((n, x) => pred (x) ? n + 1 : n, 0)
}

/**
 * Splits the Set into [matching, nonMatching] based on pred.
 * @example
 * // partition :: (a -> Boolean) -> Set a -> [Set a, Set a]
 * partition (x => x > 1) ([1, 2, 3]) // => [[2, 3], [1]]
 */
export function partition (pred) {
  return (s) => {
    const yes = []
    const no  = []
    for (const x of s) (pred (x) ? yes : no).push (x)
    return [yes, no]
  }
}
