import test from 'brittle'
import {
  empty, singleton, fromArray, toArray,
  size, isEmpty, member, notMember,
  insert, remove,
  union, intersection, difference, symmetricDifference,
  isSubsetOf, equals,
  map, mapUniq, filter,
  reduce,
  all, any, none,
  find, count, partition,
} from '../lib/set.js'
import { isJust, isNothing } from '../lib/maybe.js'

const eq = (a) => (b) => a === b

// =============================================================================
// Constructors
// =============================================================================

test ('empty returns an empty set', (t) => {
  t.alike (empty (), [])
})

test ('singleton creates a set with one element', (t) => {
  t.alike (singleton (1), [1])
  t.alike (singleton ('x'), ['x'])
})

test ('fromArray deduplicates elements — first occurrence wins', (t) => {
  t.alike (fromArray (eq) ([1, 2, 1, 3, 2]), [1, 2, 3])
})

test ('fromArray preserves insertion order of first occurrences', (t) => {
  t.alike (fromArray (eq) ([3, 1, 2, 1, 3]), [3, 1, 2])
})

test ('fromArray on empty array returns empty set', (t) => {
  t.alike (fromArray (eq) ([]), [])
})

test ('fromArray on array with no duplicates is identity', (t) => {
  t.alike (fromArray (eq) ([1, 2, 3]), [1, 2, 3])
})

test ('fromArray works with object equality', (t) => {
  const deepEq = (a) => (b) => JSON.stringify (a) === JSON.stringify (b)
  const result = fromArray (deepEq) ([{ x: 1 }, { x: 2 }, { x: 1 }])
  t.is (result.length, 2)
})

test ('toArray returns a copy of the set', (t) => {
  const s = [1, 2, 3]
  const copy = toArray (s)
  t.alike (copy, s)
  t.not (copy, s)
})

test ('toArray on empty set returns empty array', (t) => {
  t.alike (toArray (empty ()), [])
})

// =============================================================================
// Guards
// =============================================================================

test ('size returns the number of elements', (t) => {
  t.is (size (empty ()), 0)
  t.is (size (singleton (1)), 1)
  t.is (size ([1, 2, 3]), 3)
})

test ('isEmpty returns true for empty set', (t) => {
  t.ok (isEmpty (empty ()))
  t.absent (isEmpty (singleton (1)))
  t.absent (isEmpty ([1, 2, 3]))
})

test ('member returns true when element is present', (t) => {
  const s = [1, 2, 3]
  t.ok (member (eq) (1) (s))
  t.ok (member (eq) (2) (s))
  t.ok (member (eq) (3) (s))
})

test ('member returns false when element is absent', (t) => {
  const s = [1, 2, 3]
  t.absent (member (eq) (4) (s))
  t.absent (member (eq) (0) (s))
  t.absent (member (eq) (1) (empty ()))
})

test ('member works with non-primitive equality', (t) => {
  const deepEq = (a) => (b) => JSON.stringify (a) === JSON.stringify (b)
  const s = [{ x: 1 }, { x: 2 }]
  t.ok (member (deepEq) ({ x: 1 }) (s))
  t.absent (member (deepEq) ({ x: 3 }) (s))
})

test ('notMember is the complement of member', (t) => {
  const s = [1, 2, 3]
  t.ok (notMember (eq) (4) (s))
  t.absent (notMember (eq) (1) (s))
  t.ok (notMember (eq) (1) (empty ()))
})

// =============================================================================
// Insert / Delete
// =============================================================================

test ('insert adds a new element', (t) => {
  const s = insert (eq) (4) ([1, 2, 3])
  t.ok (member (eq) (4) (s))
  t.is (size (s), 4)
})

test ('insert is a no-op when element already present', (t) => {
  const s = [1, 2, 3]
  const s2 = insert (eq) (2) (s)
  t.is (size (s2), 3)
  t.alike (s2, s)
})

test ('insert into empty set creates singleton', (t) => {
  t.alike (insert (eq) (1) (empty ()), [1])
})

test ('insert does not mutate the original', (t) => {
  const s = [1, 2, 3]
  insert (eq) (4) (s)
  t.is (s.length, 3)
})

test ('remove deletes an existing element', (t) => {
  const s = remove (eq) (2) ([1, 2, 3])
  t.absent (member (eq) (2) (s))
  t.is (size (s), 2)
  t.alike (s, [1, 3])
})

test ('remove is a no-op for absent elements', (t) => {
  const s = [1, 2, 3]
  const s2 = remove (eq) (9) (s)
  t.alike (s2, s)
})

test ('remove from empty set returns empty', (t) => {
  t.alike (remove (eq) (1) (empty ()), [])
})

test ('remove does not mutate the original', (t) => {
  const s = [1, 2, 3]
  remove (eq) (1) (s)
  t.is (s.length, 3)
})

// =============================================================================
// Set operations
// =============================================================================

test ('union contains all elements from both sets', (t) => {
  const s = union (eq) ([1, 2]) ([2, 3])
  t.alike (s, [1, 2, 3])
})

test ('union with empty is identity', (t) => {
  t.alike (union (eq) ([1, 2, 3]) (empty ()), [1, 2, 3])
  t.alike (union (eq) (empty ()) ([1, 2, 3]), [1, 2, 3])
})

test ('union of identical sets returns original', (t) => {
  const s = [1, 2, 3]
  t.alike (union (eq) (s) (s), s)
})

test ('union of disjoint sets contains all elements', (t) => {
  const s = union (eq) ([1, 2]) ([3, 4])
  t.alike (s, [1, 2, 3, 4])
})

test ('union preserves elements from a first, then unique from b', (t) => {
  const s = union (eq) ([1, 2, 3]) ([2, 3, 4, 5])
  t.alike (s, [1, 2, 3, 4, 5])
})

test ('intersection contains only shared elements', (t) => {
  const s = intersection (eq) ([1, 2, 3]) ([2, 3, 4])
  t.alike (s, [2, 3])
})

test ('intersection of disjoint sets is empty', (t) => {
  t.alike (intersection (eq) ([1, 2]) ([3, 4]), [])
})

test ('intersection with empty is empty', (t) => {
  t.alike (intersection (eq) ([1, 2, 3]) (empty ()), [])
  t.alike (intersection (eq) (empty ()) ([1, 2, 3]), [])
})

test ('intersection of identical sets returns same elements', (t) => {
  const s = [1, 2, 3]
  t.alike (intersection (eq) (s) (s), s)
})

test ('difference returns elements in a not in b', (t) => {
  const s = difference (eq) ([1, 2, 3]) ([2, 3])
  t.alike (s, [1])
})

test ('difference with empty b returns a unchanged', (t) => {
  t.alike (difference (eq) ([1, 2, 3]) (empty ()), [1, 2, 3])
})

test ('difference of a from itself is empty', (t) => {
  t.alike (difference (eq) ([1, 2, 3]) ([1, 2, 3]), [])
})

test ('difference with empty a returns empty', (t) => {
  t.alike (difference (eq) (empty ()) ([1, 2, 3]), [])
})

test ('symmetricDifference contains elements in exactly one set', (t) => {
  const s = symmetricDifference (eq) ([1, 2, 3]) ([2, 3, 4])
  t.alike (s, [1, 4])
})

test ('symmetricDifference of identical sets is empty', (t) => {
  t.alike (symmetricDifference (eq) ([1, 2, 3]) ([1, 2, 3]), [])
})

test ('symmetricDifference of disjoint sets is their union', (t) => {
  const s = symmetricDifference (eq) ([1, 2]) ([3, 4])
  t.alike (s, [1, 2, 3, 4])
})

test ('symmetricDifference with empty is identity', (t) => {
  t.alike (symmetricDifference (eq) ([1, 2, 3]) (empty ()), [1, 2, 3])
  t.alike (symmetricDifference (eq) (empty ()) ([1, 2, 3]), [1, 2, 3])
})

// =============================================================================
// Subset / Equality
// =============================================================================

test ('isSubsetOf returns true when a is a subset of b', (t) => {
  t.ok (isSubsetOf (eq) ([1, 2]) ([1, 2, 3]))
  t.ok (isSubsetOf (eq) ([1, 2, 3]) ([1, 2, 3]))
})

test ('isSubsetOf returns false when a has elements not in b', (t) => {
  t.absent (isSubsetOf (eq) ([1, 4]) ([1, 2, 3]))
  t.absent (isSubsetOf (eq) ([1, 2, 3]) ([1, 2]))
})

test ('empty set is subset of everything', (t) => {
  t.ok (isSubsetOf (eq) (empty ()) ([1, 2, 3]))
  t.ok (isSubsetOf (eq) (empty ()) (empty ()))
})

test ('equals returns true for sets with same elements', (t) => {
  t.ok (equals (eq) ([1, 2, 3]) ([1, 2, 3]))
  t.ok (equals (eq) (empty ()) (empty ()))
})

test ('equals returns true regardless of order', (t) => {
  t.ok (equals (eq) ([1, 2, 3]) ([3, 1, 2]))
  t.ok (equals (eq) ([3, 2, 1]) ([1, 2, 3]))
})

test ('equals returns false for sets with different elements', (t) => {
  t.absent (equals (eq) ([1, 2, 3]) ([1, 2, 4]))
  t.absent (equals (eq) ([1, 2]) ([1, 2, 3]))
  t.absent (equals (eq) ([1, 2, 3]) ([1, 2]))
})

test ('equals returns false when sizes differ', (t) => {
  t.absent (equals (eq) ([1]) ([1, 2]))
  t.absent (equals (eq) ([1, 2]) ([1]))
})

// =============================================================================
// Functor / Filterable
// =============================================================================

test ('map applies f to every element', (t) => {
  t.alike (map ((x) => x * 2) ([1, 2, 3]), [2, 4, 6])
  t.alike (map ((x) => x + 1) (empty ()), [])
})

test ('map may produce duplicates — does not re-deduplicate', (t) => {
  // map is intentionally a raw transform; use mapUniq for deduplication
  const result = map ((x) => x % 2) ([1, 2, 3, 4])
  t.alike (result, [1, 0, 1, 0])
})

test ('mapUniq re-deduplicates after mapping', (t) => {
  const result = mapUniq (eq) ((x) => x % 2) ([1, 2, 3, 4])
  t.alike (result, [1, 0])
})

test ('mapUniq on empty set returns empty', (t) => {
  t.alike (mapUniq (eq) ((x) => x * 2) (empty ()), [])
})

test ('filter keeps elements satisfying pred', (t) => {
  t.alike (filter ((x) => x > 1) ([1, 2, 3]), [2, 3])
  t.alike (filter ((x) => x > 9) ([1, 2, 3]), [])
  t.alike (filter ((x) => x > 0) ([1, 2, 3]), [1, 2, 3])
})

test ('filter on empty set returns empty', (t) => {
  t.alike (filter ((x) => x > 0) (empty ()), [])
})

// =============================================================================
// Fold
// =============================================================================

test ('reduce folds elements left in insertion order', (t) => {
  t.is (reduce ((acc) => (x) => acc + x) (0) ([1, 2, 3]), 6)
  t.is (reduce ((acc) => (x) => acc + x) (0) (empty ()), 0)
})

test ('reduce builds array in correct order', (t) => {
  const result = reduce ((acc) => (x) => [...acc, x]) ([]) ([3, 1, 2])
  t.alike (result, [3, 1, 2])
})

// =============================================================================
// Utilities
// =============================================================================

test ('all returns true when every element satisfies pred', (t) => {
  t.ok (all ((x) => x > 0) ([1, 2, 3]))
  t.absent (all ((x) => x > 1) ([1, 2, 3]))
  t.ok (all ((x) => x > 0) (empty ()))
})

test ('any returns true when at least one element satisfies pred', (t) => {
  t.ok (any ((x) => x > 2) ([1, 2, 3]))
  t.absent (any ((x) => x > 9) ([1, 2, 3]))
  t.absent (any ((x) => x > 0) (empty ()))
})

test ('none returns true when no element satisfies pred', (t) => {
  t.ok (none ((x) => x > 9) ([1, 2, 3]))
  t.absent (none ((x) => x > 2) ([1, 2, 3]))
  t.ok (none ((x) => x > 0) (empty ()))
})

test ('find returns Just first element satisfying pred', (t) => {
  const r = find ((x) => x > 2) ([1, 2, 3, 4])
  t.ok (isJust (r))
  t.is (r.value, 3)
})

test ('find returns Nothing when no element satisfies pred', (t) => {
  t.ok (isNothing (find ((x) => x > 9) ([1, 2, 3])))
  t.ok (isNothing (find ((x) => x > 0) (empty ())))
})

test ('count returns number of elements satisfying pred', (t) => {
  t.is (count ((x) => x > 1) ([1, 2, 3]), 2)
  t.is (count ((x) => x > 9) ([1, 2, 3]), 0)
  t.is (count ((x) => x > 0) ([1, 2, 3]), 3)
  t.is (count ((x) => x > 0) (empty ()), 0)
})

test ('partition splits set into matching and non-matching', (t) => {
  const [yes, no] = partition ((x) => x > 1) ([1, 2, 3])
  t.alike (yes, [2, 3])
  t.alike (no, [1])
})

test ('partition with all matching returns [set, empty]', (t) => {
  const [yes, no] = partition ((x) => x > 0) ([1, 2, 3])
  t.alike (yes, [1, 2, 3])
  t.alike (no, [])
})

test ('partition with none matching returns [empty, set]', (t) => {
  const [yes, no] = partition ((x) => x > 9) ([1, 2, 3])
  t.alike (yes, [])
  t.alike (no, [1, 2, 3])
})

test ('partition on empty set returns two empty sets', (t) => {
  const [yes, no] = partition ((x) => x > 0) (empty ())
  t.alike (yes, [])
  t.alike (no, [])
})

// =============================================================================
// Works with non-primitive keys
// =============================================================================

test ('Set works correctly with object equality', (t) => {
  const deepEq = (a) => (b) => JSON.stringify (a) === JSON.stringify (b)
  let s = empty ()
  s = insert (deepEq) ({ id: 1 }) (s)
  s = insert (deepEq) ({ id: 2 }) (s)
  s = insert (deepEq) ({ id: 1 }) (s) // duplicate — should be ignored

  t.is (size (s), 2)
  t.ok (member (deepEq) ({ id: 1 }) (s))
  t.ok (member (deepEq) ({ id: 2 }) (s))
  t.absent (member (deepEq) ({ id: 3 }) (s))

  const s2 = remove (deepEq) ({ id: 1 }) (s)
  t.is (size (s2), 1)
  t.absent (member (deepEq) ({ id: 1 }) (s2))
})

test ('union, intersection, difference work with object equality', (t) => {
  const deepEq = (a) => (b) => JSON.stringify (a) === JSON.stringify (b)
  const a = [{ id: 1 }, { id: 2 }]
  const b = [{ id: 2 }, { id: 3 }]

  const u = union (deepEq) (a) (b)
  t.is (size (u), 3)

  const i = intersection (deepEq) (a) (b)
  t.is (size (i), 1)

  const d = difference (deepEq) (a) (b)
  t.is (size (d), 1)
  t.ok (member (deepEq) ({ id: 1 }) (d))
})
