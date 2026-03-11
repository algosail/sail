// set.js
// Functional Set with arbitrary equality.
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
 * Creates a new empty Set with no elements — the starting point when building
 * a set incrementally via `insert`. Because the Set is represented as an
 * immutable array, `empty()` is safe to use as a shared initial value without
 * risk of accidental mutation.
 * @example
 * // empty :: () -> Set a
 * empty ()
 * // => []
 */
export function empty () {
  return []
}

/**
 * Creates a Set containing exactly one element. Useful for wrapping a single
 * value into Set context before combining it with other sets via `union` or
 * `insert`, or when you need a unit set to test membership invariants with
 * `isSubsetOf` or `intersection`.
 * @example
 * // singleton :: a -> Set a
 * singleton ('admin')
 * // => ['admin']
 * singleton ({ id: 1 })
 * // => [{ id: 1 }]
 */
export function singleton (a) {
  return [a]
}

/**
 * Converts an array into a Set by deduplicating elements with the provided
 * equality function. Because it uses custom equality rather than reference
 * equality, it correctly treats two structurally equal objects as duplicates.
 * The first occurrence of each element is kept; later duplicates are ignored.
 * @example
 * // fromArray :: (a -> a -> Boolean) -> Array a -> Set a
 * const eqById = a => b => a.id === b.id
 * fromArray (eqById) ([{ id: 1 }, { id: 2 }, { id: 1 }])
 * // => [{ id: 1 }, { id: 2 }]
 * fromArray (a => b => a === b) (['read', 'write', 'read', 'execute'])
 * // => ['read', 'write', 'execute']
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
 * Returns a shallow copy of the Set as a plain array. Use this to escape the
 * Set abstraction when you need to pass elements to a function that expects a
 * regular array, or to serialize the set for storage or display.
 * @example
 * // toArray :: Set a -> Array a
 * toArray (['read', 'write', 'execute'])
 * // => ['read', 'write', 'execute']
 */
export function toArray (s) {
  return s.slice ()
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns the number of unique elements currently in the Set. Because
 * deduplication is enforced at insert time, the returned count is always
 * accurate — there is no possibility of phantom duplicates distorting the
 * result.
 * @example
 * // size :: Set a -> Integer
 * size (['read', 'write', 'execute'])
 * // => 3
 * size ([])
 * // => 0
 */
export function size (s) {
  return s.length
}

/**
 * Returns `true` when the Set contains no elements. Handy as a cheap early
 * exit before traversal operations such as `reduce` or `union`, avoiding
 * unnecessary computation on empty sets.
 * @example
 * // isEmpty :: Set a -> Boolean
 * isEmpty ([])
 * // => true
 * isEmpty ([{ id: 1 }])
 * // => false
 */
export function isEmpty (s) {
  return s.length === 0
}

/**
 * Checks whether an element belongs to the Set using the provided equality
 * function. Unlike JavaScript's native `Set.has`, which relies on reference
 * equality, this correctly handles structural equality — two distinct
 * `{ id: 1 }` objects are treated as the same element when the equality
 * function compares their `id` fields.
 * @example
 * // member :: (a -> a -> Boolean) -> a -> Set a -> Boolean
 * const eqById = a => b => a.id === b.id
 * member (eqById) ({ id: 2 }) ([{ id: 1 }, { id: 2 }, { id: 3 }])
 * // => true
 * member (eqById) ({ id: 9 }) ([{ id: 1 }, { id: 2 }])
 * // => false
 */
export function member (eq) {
  return (x) => (s) => s.some ((y) => eq (x) (y))
}

/**
 * The complement of `member` — returns `true` when the element is absent from
 * the Set. Use it as a guard before insertion to avoid no-ops, or to assert
 * that a newly generated ID does not collide with any existing member.
 * @example
 * // notMember :: (a -> a -> Boolean) -> a -> Set a -> Boolean
 * const eqById = a => b => a.id === b.id
 * notMember (eqById) ({ id: 9 }) ([{ id: 1 }, { id: 2 }])
 * // => true
 * notMember (eqById) ({ id: 1 }) ([{ id: 1 }, { id: 2 }])
 * // => false
 */
export function notMember (eq) {
  return (x) => (s) => !s.some ((y) => eq (x) (y))
}

// =============================================================================
// Insert / Delete
// =============================================================================

/**
 * Adds an element to the Set if it is not already a member, returning a new
 * Set. If an equivalent element is already present the original Set is returned
 * unchanged, making repeated insertions idempotent. The equality function is
 * used for the duplicate check, so object-valued sets work correctly.
 * @example
 * // insert :: (a -> a -> Boolean) -> a -> Set a -> Set a
 * const eqById = a => b => a.id === b.id
 * insert (eqById) ({ id: 3 }) ([{ id: 1 }, { id: 2 }])
 * // => [{ id: 1 }, { id: 2 }, { id: 3 }]
 * insert (eqById) ({ id: 1 }) ([{ id: 1 }, { id: 2 }])
 * // => [{ id: 1 }, { id: 2 }]
 */
export function insert (eq) {
  return (x) => (s) =>
    s.some ((y) => eq (x) (y)) ? s : [...s, x]
}

/**
 * Removes an element from the Set and returns a new Set without it. If the
 * element is absent the original Set is returned unchanged. The equality
 * function governs what counts as "the same element", so structural equality
 * on objects is fully supported.
 * @example
 * // remove :: (a -> a -> Boolean) -> a -> Set a -> Set a
 * const eqById = a => b => a.id === b.id
 * remove (eqById) ({ id: 2 }) ([{ id: 1 }, { id: 2 }, { id: 3 }])
 * // => [{ id: 1 }, { id: 3 }]
 * remove (eqById) ({ id: 9 }) ([{ id: 1 }, { id: 2 }])
 * // => [{ id: 1 }, { id: 2 }]
 */
export function remove (eq) {
  return (x) => (s) => s.filter ((y) => !eq (x) (y))
}

// =============================================================================
// Set operations
// =============================================================================

/**
 * Returns a Set containing every element from either input Set, with
 * duplicates removed. Elements from `a` are kept when both sets contain an
 * equivalent element (left-biased). Essential when merging permission sets,
 * tag lists, or any collection where membership matters more than order.
 * @example
 * // union :: (a -> a -> Boolean) -> Set a -> Set a -> Set a
 * const eq = a => b => a === b
 * union (eq) (['read', 'write']) (['write', 'execute'])
 * // => ['read', 'write', 'execute']
 * union (a => b => a.id === b.id) ([{ id: 1 }, { id: 2 }]) ([{ id: 2 }, { id: 3 }])
 * // => [{ id: 1 }, { id: 2 }, { id: 3 }]
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
 * Returns a Set of elements that exist in both input Sets, taking values from
 * `a`. This is the standard set-intersection and is useful for finding the
 * overlap between two groups — for example, identifying users who hold all
 * required permissions, or tags shared between two articles.
 * @example
 * // intersection :: (a -> a -> Boolean) -> Set a -> Set a -> Set a
 * const eq = a => b => a === b
 * intersection (eq) (['read', 'write', 'execute']) (['write', 'execute', 'delete'])
 * // => ['write', 'execute']
 * intersection (a => b => a.id === b.id) ([{ id: 1 }, { id: 2 }]) ([{ id: 2 }, { id: 3 }])
 * // => [{ id: 2 }]
 */
export function intersection (eq) {
  return (a) => (b) =>
    a.filter ((x) => b.some ((y) => eq (x) (y)))
}

/**
 * Returns the elements in `a` that are absent from `b` — the set-theoretic
 * difference `a \ b`. Useful for computing what needs to be added when syncing
 * two sets, or for finding which permissions a user still lacks after comparing
 * their granted set against the required set.
 * @example
 * // difference :: (a -> a -> Boolean) -> Set a -> Set a -> Set a
 * const eq = a => b => a === b
 * difference (eq) (['read', 'write', 'execute']) (['write'])
 * // => ['read', 'execute']
 * difference (a => b => a.id === b.id) ([{ id: 1 }, { id: 2 }, { id: 3 }]) ([{ id: 2 }])
 * // => [{ id: 1 }, { id: 3 }]
 */
export function difference (eq) {
  return (a) => (b) =>
    a.filter ((x) => !b.some ((y) => eq (x) (y)))
}

/**
 * Returns elements that appear in exactly one of the two Sets — those present
 * in `a` but not `b`, plus those in `b` but not `a`. This models the XOR of
 * two sets and is useful for computing "what changed" between two snapshots:
 * elements that were added or removed, but not those that stayed the same.
 * @example
 * // symmetricDifference :: (a -> a -> Boolean) -> Set a -> Set a -> Set a
 * const eq = a => b => a === b
 * symmetricDifference (eq) (['a', 'b', 'c']) (['b', 'c', 'd'])
 * // => ['a', 'd']
 * symmetricDifference (eq) ([1, 2]) ([2, 3])
 * // => [1, 3]
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
 * Returns `true` when every element of `a` is also present in `b` (a ⊆ b).
 * Use this to verify that a required set of capabilities is entirely covered
 * by an available set — for example, checking that all mandatory permissions
 * are included in a user's role before granting access.
 * @example
 * // isSubsetOf :: (a -> a -> Boolean) -> Set a -> Set a -> Boolean
 * const eq = a => b => a === b
 * isSubsetOf (eq) (['read', 'write']) (['read', 'write', 'execute'])
 * // => true
 * isSubsetOf (eq) (['read', 'delete']) (['read', 'write'])
 * // => false
 * isSubsetOf (eq) ([]) (['read', 'write'])
 * // => true
 */
export function isSubsetOf (eq) {
  return (a) => (b) =>
    a.every ((x) => b.some ((y) => eq (x) (y)))
}

/**
 * Compares two Sets for equality: returns `true` when both contain exactly the
 * same elements according to the equality function, regardless of insertion
 * order. This is more reliable than comparing array representations directly,
 * since order is not meaningful for sets.
 * @example
 * // equals :: (a -> a -> Boolean) -> Set a -> Set a -> Boolean
 * const eq = a => b => a === b
 * equals (eq) (['read', 'write']) (['write', 'read'])
 * // => true
 * equals (eq) (['read']) (['read', 'write'])
 * // => false
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
 * Transforms every element of the Set by applying `f`. Because `f` may
 * collapse distinct elements to the same value, the result is not guaranteed
 * to be duplicate-free — use `mapUniq` when uniqueness must be enforced. Plain
 * `map` is provided for performance when you know `f` is injective.
 * @example
 * // map :: (a -> b) -> Set a -> Set b
 * map (x => x.toUpperCase ()) (['read', 'write', 'execute'])
 * // => ['READ', 'WRITE', 'EXECUTE']
 * map (u => u.role) ([{ id: 1, role: 'admin' }, { id: 2, role: 'user' }])
 * // => ['admin', 'user']
 */
export function map (f) {
  return (s) => s.map (f)
}

/**
 * Like `map`, but deduplicates the result using the provided equality function
 * after applying `f`. Use this whenever `f` might project multiple distinct
 * elements to the same value — for example, extracting the `role` field from a
 * set of user objects where multiple users share a role.
 * @example
 * // mapUniq :: (b -> b -> Boolean) -> (a -> b) -> Set a -> Set b
 * const eq = a => b => a === b
 * mapUniq (eq) (u => u.role) ([{ id: 1, role: 'admin' }, { id: 2, role: 'user' }, { id: 3, role: 'admin' }])
 * // => ['admin', 'user']
 * mapUniq (eq) (x => x % 2) ([1, 2, 3, 4])
 * // => [1, 0]
 */
export function mapUniq (eq) {
  return (f) => (s) => fromArray (eq) (s.map (f))
}

/**
 * Returns a new Set containing only the elements that satisfy the predicate.
 * Use this to narrow down a set — for example, retaining only active users,
 * filtering permissions to those in a particular category, or keeping only IDs
 * within a valid range.
 * @example
 * // filter :: (a -> Boolean) -> Set a -> Set a
 * filter (x => x.active) ([{ id: 1, active: true }, { id: 2, active: false }, { id: 3, active: true }])
 * // => [{ id: 1, active: true }, { id: 3, active: true }]
 * filter (x => x > 2) ([1, 2, 3, 4])
 * // => [3, 4]
 */
export function filter (pred) {
  return (s) => s.filter (pred)
}

// =============================================================================
// Fold
// =============================================================================

/**
 * Folds all elements of the Set into a single accumulated result, visiting
 * entries in insertion order. This is the primary way to compute a single value
 * from a set — for example, summing IDs, concatenating labels, or building a
 * lookup table from a set of records.
 * @example
 * // reduce :: (b -> a -> b) -> b -> Set a -> b
 * reduce (acc => x => acc + x) (0) ([1, 2, 3, 4])
 * // => 10
 * reduce (acc => x => [...acc, x.id]) ([]) ([{ id: 1 }, { id: 2 }, { id: 3 }])
 * // => [1, 2, 3]
 */
export function reduce (f) {
  return (init) => (s) => s.reduce ((acc, x) => f (acc) (x), init)
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Returns `true` only when all elements in the Set satisfy the predicate.
 * Useful for invariant checks — for example, verifying that every user in a set
 * has a valid email, or that all permission strings follow a naming convention
 * before storing them.
 * @example
 * // all :: (a -> Boolean) -> Set a -> Boolean
 * all (x => typeof x === 'string') (['read', 'write', 'execute'])
 * // => true
 * all (x => x.active) ([{ active: true }, { active: false }])
 * // => false
 */
export function all (pred) {
  return (s) => s.every (pred)
}

/**
 * Returns `true` when at least one element in the Set satisfies the predicate.
 * Use this for quick membership-by-property checks — for example, testing
 * whether any user in a set is an admin, or whether any tag in a post's tag
 * set matches a given category.
 * @example
 * // any :: (a -> Boolean) -> Set a -> Boolean
 * any (x => x.role === 'admin') ([{ role: 'user' }, { role: 'admin' }])
 * // => true
 * any (x => x < 0) ([1, 2, 3])
 * // => false
 */
export function any (pred) {
  return (s) => s.some (pred)
}

/**
 * Returns `true` when no element in the Set satisfies the predicate — the
 * complement of `any`. Use this as a guard to confirm that a set is free from
 * invalid or prohibited members before committing to further processing.
 * @example
 * // none :: (a -> Boolean) -> Set a -> Boolean
 * none (x => x.banned) ([{ banned: false }, { banned: false }])
 * // => true
 * none (x => x > 10) ([1, 5, 3])
 * // => true
 * none (x => x > 3) ([1, 5, 3])
 * // => false
 */
export function none (pred) {
  return (s) => !s.some (pred)
}

/**
 * Finds and returns the first element in the Set that satisfies the predicate,
 * wrapped in `Just`, or `Nothing` if no element qualifies. This avoids the
 * need to check for `undefined` from a raw `Array.find` call and integrates
 * cleanly into Maybe-based pipelines.
 * @example
 * // find :: (a -> Boolean) -> Set a -> Maybe a
 * find (x => x.role === 'admin') ([{ id: 1, role: 'user' }, { id: 2, role: 'admin' }])
 * // => just({ id: 2, role: 'admin' })
 * find (x => x > 10) ([1, 2, 3])
 * // => nothing()
 */
export function find (pred) {
  return (s) => {
    const x = s.find (pred)
    return x !== undefined ? M.just (x) : M.nothing ()
  }
}

/**
 * Counts how many elements in the Set satisfy the predicate. Use this when you
 * need a summary statistic — for example, counting how many users have admin
 * rights, or how many tags in a post belong to a particular category.
 * @example
 * // count :: (a -> Boolean) -> Set a -> Integer
 * count (x => x.active) ([{ active: true }, { active: false }, { active: true }])
 * // => 2
 * count (x => x > 2) ([1, 2, 3, 4])
 * // => 2
 */
export function count (pred) {
  return (s) => s.reduce ((n, x) => pred (x) ? n + 1 : n, 0)
}

/**
 * Splits the Set into two arrays `[matching, nonMatching]` in a single pass
 * based on the predicate. More efficient than calling `filter` and `reject`
 * separately when you need both halves — for example, sorting users into
 * active and inactive groups, or separating valid records from invalid ones.
 * @example
 * // partition :: (a -> Boolean) -> Set a -> [Set a, Set a]
 * partition (x => x.active) ([{ id: 1, active: true }, { id: 2, active: false }, { id: 3, active: true }])
 * // => [[{ id: 1, active: true }, { id: 3, active: true }], [{ id: 2, active: false }]]
 * partition (x => x > 2) ([1, 2, 3, 4])
 * // => [[3, 4], [1, 2]]
 */
export function partition (pred) {
  return (s) => {
    const yes = []
    const no  = []
    for (const x of s) (pred (x) ? yes : no).push (x)
    return [yes, no]
  }
}
