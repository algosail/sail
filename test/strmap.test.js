import test from 'brittle'
import {
  equals, lte,
  concat, empty,
  singleton, fromPairs,
  size, all, any, none, elem,
  lookup, insert, remove,
  map, mapWithKey, filter, filterWithKey, reject,
  ap, alt,
  reduce, foldWithKey,
  traverse,
  keys, values, pairs,
} from '../lib/strmap.js'
import { isJust, isNothing } from '../lib/maybe.js'

// =============================================================================
// Eq / Ord
// =============================================================================

test ('equals returns true for element-wise equal maps', (t) => {
  t.ok (equals ((a) => (b) => a === b) ({ a: 1 }) ({ a: 1 }))
  t.ok (equals ((a) => (b) => a === b) ({}) ({}))
  t.ok (equals ((a) => (b) => a === b) ({ a: 1, b: 2 }) ({ a: 1, b: 2 }))
})

test ('equals returns false for maps with different values', (t) => {
  t.absent (equals ((a) => (b) => a === b) ({ a: 1 }) ({ a: 2 }))
  t.absent (equals ((a) => (b) => a === b) ({ a: 1 }) ({ b: 1 }))
})

test ('equals returns false for maps with different key counts', (t) => {
  t.absent (equals ((a) => (b) => a === b) ({ a: 1 }) ({ a: 1, b: 2 }))
  t.absent (equals ((a) => (b) => a === b) ({ a: 1, b: 2 }) ({ a: 1 }))
})

test ('equals uses the provided comparator', (t) => {
  const approxEq = (a) => (b) => Math.abs (a - b) < 0.01
  t.ok (equals (approxEq) ({ x: 1.001 }) ({ x: 1.002 }))
  t.absent (equals (approxEq) ({ x: 1 }) ({ x: 2 }))
})

test ('lte returns true when first map is <= second lexicographically', (t) => {
  t.ok (lte ((a) => (b) => a <= b) ({ a: 1 }) ({ a: 2 }))
  t.ok (lte ((a) => (b) => a <= b) ({ a: 1 }) ({ a: 1 }))
  t.ok (lte ((a) => (b) => a <= b) ({}) ({ a: 1 }))
  t.ok (lte ((a) => (b) => a <= b) ({}) ({}))
})

test ('lte returns false when first map is > second', (t) => {
  t.absent (lte ((a) => (b) => a <= b) ({ a: 2 }) ({ a: 1 }))
  t.absent (lte ((a) => (b) => a <= b) ({ b: 1 }) ({ a: 1 }))
})

// =============================================================================
// Semigroup / Monoid
// =============================================================================

test ('concat merges two maps — right-biased on duplicate keys', (t) => {
  t.alike (concat ({ a: 1 }) ({ b: 2 }), { a: 1, b: 2 })
  t.alike (concat ({ a: 1 }) ({ a: 2, b: 3 }), { a: 2, b: 3 })
  t.alike (concat ({}) ({ a: 1 }), { a: 1 })
  t.alike (concat ({ a: 1 }) ({}), { a: 1 })
})

test ('empty returns a fresh empty object', (t) => {
  t.alike (empty (), {})
})

test ('concat with empty satisfies monoid laws', (t) => {
  const m = { a: 1, b: 2 }
  t.alike (concat (m) (empty ()), m)
  t.alike (concat (empty ()) (m), m)
})

// =============================================================================
// Constructors
// =============================================================================

test ('singleton creates a single-entry map', (t) => {
  t.alike (singleton ('a') (1), { a: 1 })
  t.alike (singleton ('key') ('value'), { key: 'value' })
})

test ('fromPairs builds a map from key-value pairs', (t) => {
  t.alike (fromPairs ([['a', 1], ['b', 2]]), { a: 1, b: 2 })
  t.alike (fromPairs ([]), {})
})

test ('fromPairs uses last value on duplicate keys', (t) => {
  t.alike (fromPairs ([['a', 1], ['a', 2]]), { a: 2 })
})

// =============================================================================
// Guards
// =============================================================================

test ('size returns the number of keys', (t) => {
  t.is (size ({}), 0)
  t.is (size ({ a: 1 }), 1)
  t.is (size ({ a: 1, b: 2, c: 3 }), 3)
})

test ('all returns true when every value satisfies the predicate', (t) => {
  t.ok (all ((v) => v > 0) ({ a: 1, b: 2 }))
  t.ok (all ((v) => v > 0) ({}))
})

test ('all returns false when any value fails', (t) => {
  t.absent (all ((v) => v > 1) ({ a: 1, b: 2 }))
})

test ('any returns true when at least one value satisfies the predicate', (t) => {
  t.ok (any ((v) => v > 1) ({ a: 1, b: 2 }))
})

test ('any returns false when no value satisfies', (t) => {
  t.absent (any ((v) => v > 5) ({ a: 1, b: 2 }))
  t.absent (any ((v) => v > 0) ({}))
})

test ('none returns true when no value satisfies the predicate', (t) => {
  t.ok (none ((v) => v > 5) ({ a: 1, b: 2 }))
  t.ok (none ((v) => v > 0) ({}))
})

test ('none returns false when any value satisfies', (t) => {
  t.absent (none ((v) => v > 1) ({ a: 1, b: 2 }))
})

test ('elem returns true when value is present', (t) => {
  t.ok (elem ((a) => (b) => a === b) (2) ({ a: 1, b: 2 }))
})

test ('elem returns false when value is absent', (t) => {
  t.absent (elem ((a) => (b) => a === b) (9) ({ a: 1, b: 2 }))
  t.absent (elem ((a) => (b) => a === b) (1) ({}))
})

// =============================================================================
// Lookup / Mutation
// =============================================================================

test ('lookup returns Just for an existing key', (t) => {
  const m = lookup ('a') ({ a: 1, b: 2 })
  t.ok (isJust (m))
  t.is (m.value, 1)
})

test ('lookup returns Nothing for a missing key', (t) => {
  t.ok (isNothing (lookup ('z') ({ a: 1 })))
  t.ok (isNothing (lookup ('a') ({})))
})

test ('lookup does not find inherited properties', (t) => {
  const obj = Object.create ({ inherited: 99 })
  t.ok (isNothing (lookup ('inherited') (obj)))
})

test ('insert adds or updates a key', (t) => {
  t.alike (insert ('b') (2) ({ a: 1 }), { a: 1, b: 2 })
  t.alike (insert ('a') (99) ({ a: 1 }), { a: 99 })
})

test ('insert does not mutate the original object', (t) => {
  const obj = { a: 1 }
  insert ('b') (2) (obj)
  t.alike (obj, { a: 1 })
})

test ('remove deletes a key', (t) => {
  t.alike (remove ('a') ({ a: 1, b: 2 }), { b: 2 })
  t.alike (remove ('z') ({ a: 1 }), { a: 1 })
})

test ('remove does not mutate the original object', (t) => {
  const obj = { a: 1, b: 2 }
  remove ('a') (obj)
  t.alike (obj, { a: 1, b: 2 })
})

// =============================================================================
// Functor / Filterable
// =============================================================================

test ('map applies f to every value', (t) => {
  t.alike (map ((v) => v * 2) ({ a: 1, b: 2 }), { a: 2, b: 4 })
  t.alike (map ((v) => v * 2) ({}), {})
})

test ('map does not mutate the original object', (t) => {
  const obj = { a: 1 }
  map ((v) => v * 2) (obj)
  t.alike (obj, { a: 1 })
})

test ('mapWithKey applies f to every key-value pair', (t) => {
  t.alike (
    mapWithKey ((k) => (v) => `${k}:${v}`) ({ a: 1, b: 2 }),
    { a: 'a:1', b: 'b:2' },
  )
})

test ('filter keeps only entries whose value satisfies the predicate', (t) => {
  t.alike (filter ((v) => v > 1) ({ a: 1, b: 2, c: 3 }), { b: 2, c: 3 })
  t.alike (filter ((v) => v > 10) ({ a: 1 }), {})
  t.alike (filter ((v) => v > 0) ({}), {})
})

test ('filterWithKey keeps only entries whose key and value satisfy the predicate', (t) => {
  t.alike (
    filterWithKey ((k) => (v) => k !== 'a' && v > 0) ({ a: 1, b: 2, c: 0 }),
    { b: 2 },
  )
})

test ('reject removes entries whose value satisfies the predicate', (t) => {
  t.alike (reject ((v) => v > 1) ({ a: 1, b: 2 }), { a: 1 })
  t.alike (reject ((v) => v > 10) ({ a: 1 }), { a: 1 })
})

test ('reject is the complement of filter', (t) => {
  const pred = (v) => v > 1
  const obj  = { a: 1, b: 2, c: 3 }
  const kept = filter (pred) (obj)
  const removed = reject (pred) (obj)
  const keptKeys = Object.keys (kept).sort ()
  const removedKeys = Object.keys (removed).sort ()
  const allKeys = Object.keys (obj).sort ()
  t.alike ([...keptKeys, ...removedKeys].sort (), allKeys)
})

// =============================================================================
// Applicative
// =============================================================================

test ('ap applies functions to matching keys', (t) => {
  t.alike (ap ({ a: (x) => x + 1 }) ({ a: 1, b: 2 }), { a: 2 })
})

test ('ap only produces entries for shared keys', (t) => {
  t.alike (ap ({ a: (x) => x * 2, c: (x) => x }) ({ a: 5, b: 10 }), { a: 10 })
})

test ('ap returns empty map when no keys are shared', (t) => {
  t.alike (ap ({ z: (x) => x }) ({ a: 1 }), {})
})

// =============================================================================
// Alt
// =============================================================================

test ('alt returns a left-biased merge', (t) => {
  t.alike (alt ({ a: 1 }) ({ a: 9, b: 2 }), { a: 1, b: 2 })
  t.alike (alt ({ a: 1 }) ({ b: 2 }), { a: 1, b: 2 })
})

test ('alt with empty map on either side', (t) => {
  const obj = { a: 1 }
  t.alike (alt (obj) ({}), obj)
  t.alike (alt ({}) (obj), obj)
})

// =============================================================================
// Foldable
// =============================================================================

test ('reduce folds values in sorted key order', (t) => {
  t.is (reduce ((acc) => (v) => acc + v) (0) ({ b: 2, a: 1 }), 3)
  t.is (reduce ((acc) => (v) => acc + v) (0) ({}), 0)
})

test ('reduce processes keys in sorted order regardless of insertion order', (t) => {
  const result = reduce ((acc) => (v) => [...acc, v]) ([]) ({ c: 3, a: 1, b: 2 })
  t.alike (result, [1, 2, 3])
})

test ('foldWithKey folds key-value pairs in sorted key order', (t) => {
  const result = foldWithKey ((acc) => (k) => (v) => acc + `${k}=${v} `) ('') ({ b: 2, a: 1 })
  t.is (result, 'a=1 b=2 ')
})

test ('foldWithKey on empty map returns init', (t) => {
  t.is (foldWithKey ((acc) => (_k) => (_v) => acc + 1) (0) ({}), 0)
})

// =============================================================================
// Accessors
// =============================================================================

test ('keys returns all enumerable keys in insertion order', (t) => {
  t.alike (keys ({ b: 2, a: 1 }), ['b', 'a'])
  t.alike (keys ({}), [])
})

test ('values returns all enumerable values in insertion order', (t) => {
  t.alike (values ({ a: 1, b: 2 }), [1, 2])
  t.alike (values ({}), [])
})

test ('pairs returns all key-value entries in insertion order', (t) => {
  t.alike (pairs ({ a: 1, b: 2 }), [['a', 1], ['b', 2]])
  t.alike (pairs ({}), [])
})

test ('fromPairs and pairs are inverses for simple objects', (t) => {
  const obj = { a: 1, b: 2, c: 3 }
  t.alike (fromPairs (pairs (obj)), obj)
})

// =============================================================================
// Traversable
// =============================================================================

test ('traverse maps values through an applicative', (t) => {
  const apOf  = Array.of
  const apAp  = (ff) => (fa) => ff.flatMap ((f) => fa.map (f))
  const apMap = (f)  => (fa) => fa.map (f)
  const result = traverse (apOf) (apAp) (apMap) ((v) => [v, v * 2]) ({ a: 1 })
  // { a: 1 } → f(1) = [1, 2] → [{ a: 1 }, { a: 2 }]
  t.is (result.length, 2)
  t.alike (result[0], { a: 1 })
  t.alike (result[1], { a: 2 })
})

test ('traverse on empty map returns lifted empty object', (t) => {
  const apOf  = Array.of
  const apAp  = (ff) => (fa) => ff.flatMap ((f) => fa.map (f))
  const apMap = (f)  => (fa) => fa.map (f)
  const result = traverse (apOf) (apAp) (apMap) ((v) => [v]) ({})
  t.is (result.length, 1)
  t.alike (result[0], {})
})

test ('traverse preserves all keys in the output', (t) => {
  const apOf  = Array.of
  const apAp  = (ff) => (fa) => ff.flatMap ((f) => fa.map (f))
  const apMap = (f)  => (fa) => fa.map (f)
  // f returns a singleton array — identity-like traverse
  const result = traverse (apOf) (apAp) (apMap) ((v) => [v * 10]) ({ a: 1, b: 2 })
  t.is (result.length, 1)
  t.alike (result[0], { a: 10, b: 20 })
})
