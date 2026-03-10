import test from 'brittle'
import {
  empty, singleton, fromPairs, toPairs,
  size, isEmpty, member, notMember,
  lookup, findWithDefault,
  insert, insertWith, insertWithCombine,
  remove, update, upsert,
  map, mapWithKey, filter, filterWithKey, filterMap,
  reduce, foldWithKey,
  union, unionLeft, unionWith,
  intersection, intersectionWith, difference,
  equals,
  keys, values,
  all, any, none,
} from '../lib/map.js'
import { isJust, isNothing, just, nothing } from '../lib/maybe.js'

const eq = (a) => (b) => a === b

// =============================================================================
// Constructors
// =============================================================================

test ('empty returns an empty map', (t) => {
  t.alike (empty (), [])
})

test ('singleton creates a single-entry map', (t) => {
  t.alike (singleton ('a') (1), [['a', 1]])
  t.alike (singleton (42) ('hello'), [[42, 'hello']])
})

test ('fromPairs builds a map from key-value pairs', (t) => {
  t.alike (fromPairs (eq) ([['a', 1], ['b', 2]]), [['a', 1], ['b', 2]])
})

test ('fromPairs last write wins on duplicate keys', (t) => {
  t.alike (fromPairs (eq) ([['a', 1], ['b', 2], ['a', 3]]), [['a', 3], ['b', 2]])
})

test ('fromPairs works with object keys using deep equality', (t) => {
  const deepEq = (a) => (b) => JSON.stringify (a) === JSON.stringify (b)
  const result = fromPairs (deepEq) ([
    [{ id: 1 }, 'one'],
    [{ id: 2 }, 'two'],
    [{ id: 1 }, 'one-updated'],
  ])
  t.is (result.length, 2)
})

test ('toPairs returns a copy of the underlying pairs', (t) => {
  const m = [['a', 1], ['b', 2]]
  const p = toPairs (m)
  t.alike (p, m)
  // should be a copy, not the same reference
  t.not (p, m)
})

// =============================================================================
// Guards
// =============================================================================

test ('size returns the number of entries', (t) => {
  t.is (size (empty ()), 0)
  t.is (size (singleton ('a') (1)), 1)
  t.is (size ([['a', 1], ['b', 2], ['c', 3]]), 3)
})

test ('isEmpty returns true for empty maps', (t) => {
  t.ok (isEmpty (empty ()))
  t.absent (isEmpty (singleton ('a') (1)))
})

test ('member returns true when key is present', (t) => {
  const m = [['a', 1], ['b', 2]]
  t.ok (member (eq) ('a') (m))
  t.ok (member (eq) ('b') (m))
  t.absent (member (eq) ('z') (m))
  t.absent (member (eq) ('a') (empty ()))
})

test ('member works with non-string keys', (t) => {
  const m = [[1, 'one'], [2, 'two']]
  t.ok (member (eq) (1) (m))
  t.absent (member (eq) (3) (m))
})

test ('notMember is the complement of member', (t) => {
  const m = [['a', 1], ['b', 2]]
  t.ok (notMember (eq) ('z') (m))
  t.absent (notMember (eq) ('a') (m))
})

// =============================================================================
// Lookup
// =============================================================================

test ('lookup returns Just value for present key', (t) => {
  const m = [['a', 1], ['b', 2]]
  const r = lookup (eq) ('a') (m)
  t.ok (isJust (r))
  t.is (r.value, 1)
})

test ('lookup returns Nothing for absent key', (t) => {
  const m = [['a', 1]]
  t.ok (isNothing (lookup (eq) ('z') (m)))
  t.ok (isNothing (lookup (eq) ('a') (empty ())))
})

test ('findWithDefault returns value when key is present', (t) => {
  const m = [['a', 1], ['b', 2]]
  t.is (findWithDefault (eq) (0) ('a') (m), 1)
  t.is (findWithDefault (eq) (0) ('b') (m), 2)
})

test ('findWithDefault returns default when key is absent', (t) => {
  t.is (findWithDefault (eq) (0) ('z') ([['a', 1]]), 0)
  t.is (findWithDefault (eq) (99) ('x') (empty ()), 99)
})

// =============================================================================
// Insert / Delete / Update
// =============================================================================

test ('insert adds a new key-value pair', (t) => {
  const m = insert (eq) ('b') (2) ([['a', 1]])
  t.alike (m, [['a', 1], ['b', 2]])
})

test ('insert replaces an existing key', (t) => {
  const m = insert (eq) ('a') (99) ([['a', 1], ['b', 2]])
  t.is (m.length, 2)
  t.is (findWithDefault (eq) (0) ('a') (m), 99)
})

test ('insert does not mutate the original', (t) => {
  const original = [['a', 1]]
  insert (eq) ('b') (2) (original)
  t.alike (original, [['a', 1]])
})

test ('insertWith does not overwrite existing keys', (t) => {
  const m = insertWith (eq) ('a') (99) ([['a', 1]])
  t.is (findWithDefault (eq) (0) ('a') (m), 1)
})

test ('insertWith adds the key if absent', (t) => {
  const m = insertWith (eq) ('b') (2) ([['a', 1]])
  t.is (findWithDefault (eq) (0) ('b') (m), 2)
})

test ('insertWithCombine combines values for existing keys', (t) => {
  const combine = (newVal) => (oldVal) => newVal + oldVal
  const m = insertWithCombine (eq) (combine) ('a') (10) ([['a', 1]])
  t.is (findWithDefault (eq) (0) ('a') (m), 11)
})

test ('insertWithCombine inserts when key is absent', (t) => {
  const combine = (newVal) => (_oldVal) => newVal
  const m = insertWithCombine (eq) (combine) ('b') (5) ([['a', 1]])
  t.is (findWithDefault (eq) (0) ('b') (m), 5)
})

test ('remove deletes an existing key', (t) => {
  const m = remove (eq) ('a') ([['a', 1], ['b', 2]])
  t.absent (member (eq) ('a') (m))
  t.ok (member (eq) ('b') (m))
  t.is (size (m), 1)
})

test ('remove is a no-op for absent keys', (t) => {
  const original = [['a', 1]]
  const m = remove (eq) ('z') (original)
  t.alike (m, original)
})

test ('remove does not mutate the original', (t) => {
  const original = [['a', 1], ['b', 2]]
  remove (eq) ('a') (original)
  t.is (original.length, 2)
})

test ('update modifies value at key', (t) => {
  const m = update (eq) ((v) => just (v + 1)) ('a') ([['a', 5]])
  t.is (findWithDefault (eq) (0) ('a') (m), 6)
})

test ('update removes key when f returns Nothing', (t) => {
  const m = update (eq) ((_v) => nothing ()) ('a') ([['a', 5]])
  t.absent (member (eq) ('a') (m))
  t.is (size (m), 0)
})

test ('update is a no-op for absent keys', (t) => {
  const original = [['a', 1]]
  const m = update (eq) ((v) => just (v + 1)) ('z') (original)
  t.alike (m, original)
})

test ('upsert updates existing key with f', (t) => {
  const m = upsert (eq) ((v) => v + 1) ('a') (0) ([['a', 5]])
  t.is (findWithDefault (eq) (0) ('a') (m), 6)
})

test ('upsert inserts default when key is absent', (t) => {
  const m = upsert (eq) ((v) => v + 1) ('b') (42) ([['a', 1]])
  t.is (findWithDefault (eq) (0) ('b') (m), 42)
})

// =============================================================================
// Functor / Filterable
// =============================================================================

test ('map applies f to all values', (t) => {
  const m = map ((v) => v * 2) ([['a', 1], ['b', 2], ['c', 3]])
  t.alike (m, [['a', 2], ['b', 4], ['c', 6]])
})

test ('map on empty map returns empty', (t) => {
  t.alike (map ((v) => v + 1) (empty ()), [])
})

test ('mapWithKey passes both key and value', (t) => {
  const m = mapWithKey ((k) => (v) => `${k}:${v}`) ([['a', 1], ['b', 2]])
  t.alike (m, [['a', 'a:1'], ['b', 'b:2']])
})

test ('filter keeps entries matching predicate', (t) => {
  const m = filter ((v) => v > 1) ([['a', 1], ['b', 2], ['c', 3]])
  t.alike (m, [['b', 2], ['c', 3]])
})

test ('filter returns empty when no entries match', (t) => {
  t.alike (filter ((v) => v > 99) ([['a', 1], ['b', 2]]), [])
})

test ('filterWithKey filters by both key and value', (t) => {
  const m = filterWithKey ((k) => (v) => k !== 'a' && v > 0) ([['a', 1], ['b', 2]])
  t.alike (m, [['b', 2]])
})

test ('filterMap keeps Just results and discards Nothing', (t) => {
  const f = (v) => v > 1 ? just (v * 10) : nothing ()
  const m = filterMap (f) ([['a', 1], ['b', 2], ['c', 3]])
  t.alike (m, [['b', 20], ['c', 30]])
})

test ('filterMap on all Nothing returns empty', (t) => {
  t.alike (filterMap ((_) => nothing ()) ([['a', 1]]), [])
})

// =============================================================================
// Fold
// =============================================================================

test ('reduce folds values left in insertion order', (t) => {
  const m = [['a', 1], ['b', 2], ['c', 3]]
  t.is (reduce ((acc) => (v) => acc + v) (0) (m), 6)
})

test ('reduce on empty returns init', (t) => {
  t.is (reduce ((acc) => (v) => acc + v) (99) (empty ()), 99)
})

test ('foldWithKey provides key and value to accumulator', (t) => {
  const m = [['a', 1], ['b', 2]]
  const result = foldWithKey ((acc) => (k) => (v) => [...acc, `${k}=${v}`]) ([]) (m)
  t.alike (result, ['a=1', 'b=2'])
})

// =============================================================================
// Combine
// =============================================================================

test ('union merges two maps — right-biased on duplicates', (t) => {
  const m = union (eq) ([['a', 1]]) ([['b', 2]])
  t.alike (m, [['a', 1], ['b', 2]])
})

test ('union right-biased: b overwrites a on duplicate keys', (t) => {
  const m = union (eq) ([['a', 1]]) ([['a', 9], ['b', 2]])
  t.is (findWithDefault (eq) (0) ('a') (m), 9)
  t.is (size (m), 2)
})

test ('union with empty is identity', (t) => {
  const m = [['a', 1], ['b', 2]]
  t.alike (union (eq) (m) (empty ()), m)
  t.alike (union (eq) (empty ()) (m), m)
})

test ('unionLeft left-biased: a keeps its values on duplicate keys', (t) => {
  const m = unionLeft (eq) ([['a', 1]]) ([['a', 9], ['b', 2]])
  t.is (findWithDefault (eq) (0) ('a') (m), 1)
  t.is (size (m), 2)
})

test ('unionWith combines duplicate keys via f', (t) => {
  const m = unionWith (eq) ((a) => (b) => a + b) ([['a', 1], ['b', 2]]) ([['a', 10], ['c', 3]])
  t.is (findWithDefault (eq) (0) ('a') (m), 11)
  t.is (findWithDefault (eq) (0) ('b') (m), 2)
  t.is (findWithDefault (eq) (0) ('c') (m), 3)
})

test ('intersection keeps only shared keys with values from b', (t) => {
  const m = intersection (eq) ([['a', 1], ['b', 2]]) ([['b', 9], ['c', 3]])
  t.alike (m, [['b', 9]])
})

test ('intersection of disjoint maps is empty', (t) => {
  t.alike (intersection (eq) ([['a', 1]]) ([['b', 2]]), [])
})

test ('intersectionWith combines shared keys via f', (t) => {
  const m = intersectionWith (eq) ((a) => (b) => a + b) ([['a', 1], ['b', 2]]) ([['b', 3]])
  t.alike (m, [['b', 5]])
})

test ('difference returns entries in a not in b', (t) => {
  const m = difference (eq) ([['a', 1], ['b', 2], ['c', 3]]) ([['b', 9]])
  t.alike (m, [['a', 1], ['c', 3]])
})

test ('difference with empty b returns a unchanged', (t) => {
  const m = [['a', 1], ['b', 2]]
  t.alike (difference (eq) (m) (empty ()), m)
})

test ('difference of identical maps is empty', (t) => {
  const m = [['a', 1], ['b', 2]]
  t.alike (difference (eq) (m) (m), [])
})

// =============================================================================
// Eq
// =============================================================================

test ('equals returns true for maps with same key-value pairs', (t) => {
  t.ok (equals (eq) (eq) ([['a', 1], ['b', 2]]) ([['a', 1], ['b', 2]]))
  t.ok (equals (eq) (eq) (empty ()) (empty ()))
})

test ('equals returns true regardless of insertion order', (t) => {
  t.ok (equals (eq) (eq) ([['a', 1], ['b', 2]]) ([['b', 2], ['a', 1]]))
})

test ('equals returns false for maps with different values', (t) => {
  t.absent (equals (eq) (eq) ([['a', 1]]) ([['a', 2]]))
})

test ('equals returns false for maps with different keys', (t) => {
  t.absent (equals (eq) (eq) ([['a', 1]]) ([['b', 1]]))
})

test ('equals returns false for maps with different sizes', (t) => {
  t.absent (equals (eq) (eq) ([['a', 1], ['b', 2]]) ([['a', 1]]))
})

// =============================================================================
// Accessors
// =============================================================================

test ('keys returns all keys in insertion order', (t) => {
  t.alike (keys ([['a', 1], ['b', 2], ['c', 3]]), ['a', 'b', 'c'])
  t.alike (keys (empty ()), [])
})

test ('values returns all values in insertion order', (t) => {
  t.alike (values ([['a', 1], ['b', 2], ['c', 3]]), [1, 2, 3])
  t.alike (values (empty ()), [])
})

test ('all returns true when every value satisfies pred', (t) => {
  t.ok (all ((v) => v > 0) ([['a', 1], ['b', 2]]))
  t.absent (all ((v) => v > 1) ([['a', 1], ['b', 2]]))
  t.ok (all ((v) => v > 0) (empty ()))
})

test ('any returns true when at least one value satisfies pred', (t) => {
  t.ok (any ((v) => v > 1) ([['a', 1], ['b', 2]]))
  t.absent (any ((v) => v > 9) ([['a', 1], ['b', 2]]))
  t.absent (any ((v) => v > 0) (empty ()))
})

test ('none returns true when no value satisfies pred', (t) => {
  t.ok (none ((v) => v > 9) ([['a', 1], ['b', 2]]))
  t.absent (none ((v) => v > 1) ([['a', 1], ['b', 2]]))
  t.ok (none ((v) => v > 0) (empty ()))
})

// =============================================================================
// Works with object keys (demonstrating arbitrary key support)
// =============================================================================

test ('Map works with object keys using deep equality', (t) => {
  const deepEq = (a) => (b) => JSON.stringify (a) === JSON.stringify (b)
  const k1 = { x: 1 }
  const k2 = { x: 2 }
  let m = empty ()
  m = insert (deepEq) (k1) ('first') (m)
  m = insert (deepEq) (k2) ('second') (m)
  t.ok (member (deepEq) ({ x: 1 }) (m))
  t.ok (member (deepEq) ({ x: 2 }) (m))
  t.absent (member (deepEq) ({ x: 3 }) (m))
  const r = lookup (deepEq) ({ x: 1 }) (m)
  t.ok (isJust (r))
  t.is (r.value, 'first')
})
