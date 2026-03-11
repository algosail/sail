// map.js
// Functional Map with arbitrary keys.
//
// Unlike strmap.js (which is limited to String keys), Map supports any key
// type by accepting an explicit equality function wherever key comparison
// is needed.  Internally the map is stored as an Array of [key, value] pairs
// in insertion order — this keeps the implementation dependency-free and
// transparent, while remaining correct for all key types (objects, arrays,
// custom ADTs, etc.).
//
// Map k v = Array [k, v]
//
// All operations are immutable — every "mutating" function returns a new Map.

import * as M from './maybe.js'

// =============================================================================
// Internal helpers
// =============================================================================

// findIndex :: (k -> k -> Boolean) -> k -> Map k v -> Integer | -1
function findIndex (eq) {
  return (key) => (m) => {
    for (let i = 0; i < m.length; i++) {
      if (eq (m[i][0]) (key)) return i
    }
    return -1
  }
}

// =============================================================================
// Constructors
// =============================================================================

/**
 * Creates a new empty Map with no entries — the starting point when building a
 * Map incrementally via `insert`. Because every operation returns a new Map,
 * `empty()` is safe to share as a constant initial value without risk of
 * accidental mutation.
 * @example
 * // empty :: () -> Map k v
 * empty ()
 * // => []
 */
export function empty () {
  return []
}

/**
 * Creates a Map holding exactly one entry. Useful when you need to lift a
 * single key-value pair into Map context before combining it with other maps
 * via `union`, or when constructing small lookup tables inline. Unlike
 * plain objects, the key may be any type — including objects and arrays.
 * @example
 * // singleton :: k -> v -> Map k v
 * singleton ({ id: 1 }) ('Alice')
 * // => [[{ id: 1 }, 'Alice']]
 * singleton ('theme') ('dark')
 * // => [['theme', 'dark']]
 */
export function singleton (key) {
  return (val) => [[key, val]]
}

/**
 * Builds a Map from an array of `[key, value]` pairs using an explicit
 * equality function to detect duplicate keys — later entries win on duplicates.
 * This is the primary way to bulk-load data into a Map when keys are objects,
 * for example loading records keyed by their ID objects from an API response.
 * @example
 * // fromPairs :: (k -> k -> Boolean) -> Array [k, v] -> Map k v
 * const eqById = a => b => a.id === b.id
 * fromPairs (eqById) ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => [[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']]
 * fromPairs (a => b => a === b) ([['x', 1], ['x', 2]])
 * // => [['x', 2]]
 */
export function fromPairs (eq) {
  return (pairs) => {
    let m = []
    for (const [k, v] of pairs) m = insert (eq) (k) (v) (m)
    return m
  }
}

/**
 * Returns a shallow copy of the Map's internal `[key, value]` array. Use this
 * to escape the Map abstraction when you need to pass entries to a plain-array
 * operation or serialize them for storage or transmission without going through
 * the full fold API.
 * @example
 * // toPairs :: Map k v -> Array [k, v]
 * toPairs ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => [[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']]
 */
export function toPairs (m) {
  return m.slice ()
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns the number of key-value pairs currently in the Map. Because the Map
 * tracks uniqueness via an equality function rather than hashing, `size` is
 * always exact with no hash-collision corner cases.
 * @example
 * // size :: Map k v -> Integer
 * size ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => 2
 * size ([])
 * // => 0
 */
export function size (m) {
  return m.length
}

/**
 * Returns `true` when the Map contains no entries. Useful as a cheap guard
 * before attempting a fold or lookup so you can short-circuit immediately
 * rather than traversing an empty structure.
 * @example
 * // isEmpty :: Map k v -> Boolean
 * isEmpty ([])
 * // => true
 * isEmpty ([[{ id: 1 }, 'Alice']])
 * // => false
 */
export function isEmpty (m) {
  return m.length === 0
}

/**
 * Checks whether a key exists in the Map using the provided equality function.
 * Because keys can be arbitrary objects, standard `===` fails on structurally
 * equal but distinct objects — the equality parameter makes it possible to
 * treat two `{ id: 1 }` values as the same key.
 * @example
 * // member :: (k -> k -> Boolean) -> k -> Map k v -> Boolean
 * const eqById = a => b => a.id === b.id
 * member (eqById) ({ id: 2 }) ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => true
 * member (eqById) ({ id: 9 }) ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => false
 */
export function member (eq) {
  return (key) => (m) => findIndex (eq) (key) (m) !== -1
}

/**
 * The complement of `member` — returns `true` when no entry in the Map has a
 * key equivalent to the given one. Use it as a guard before inserting to avoid
 * unintentional overwrites, or to validate that a set of IDs has no conflicts
 * with an existing map.
 * @example
 * // notMember :: (k -> k -> Boolean) -> k -> Map k v -> Boolean
 * const eqById = a => b => a.id === b.id
 * notMember (eqById) ({ id: 9 }) ([[{ id: 1 }, 'Alice']])
 * // => true
 * notMember (eqById) ({ id: 1 }) ([[{ id: 1 }, 'Alice']])
 * // => false
 */
export function notMember (eq) {
  return (key) => (m) => findIndex (eq) (key) (m) === -1
}

// =============================================================================
// Lookup
// =============================================================================

/**
 * Safely retrieves the value associated with a key, returning `Just(value)`
 * when found and `Nothing` otherwise. Using Maybe instead of `undefined`
 * forces callers to handle the missing-key case explicitly, preventing
 * null-reference bugs that are otherwise easy to introduce with object keys.
 * @example
 * // lookup :: (k -> k -> Boolean) -> k -> Map k v -> Maybe v
 * const eqById = a => b => a.id === b.id
 * lookup (eqById) ({ id: 1 }) ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => just('Alice')
 * lookup (eqById) ({ id: 9 }) ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => nothing()
 */
export function lookup (eq) {
  return (key) => (m) => {
    const i = findIndex (eq) (key) (m)
    return i === -1 ? M.nothing () : M.just (m[i][1])
  }
}

/**
 * Retrieves the value for a key if present, or falls back to a supplied
 * default. This is a convenient short-circuit for the common pattern
 * `maybe(def)(id)(lookup(eq)(key)(m))` and is useful for reading config values
 * that have sensible defaults when not explicitly set.
 * @example
 * // findWithDefault :: (k -> k -> Boolean) -> v -> k -> Map k v -> v
 * const eqId = a => b => a.id === b.id
 * findWithDefault (eqId) ('Anonymous') ({ id: 1 }) ([[{ id: 1 }, 'Alice']])
 * // => 'Alice'
 * findWithDefault (eqId) ('Anonymous') ({ id: 9 }) ([[{ id: 1 }, 'Alice']])
 * // => 'Anonymous'
 */
export function findWithDefault (eq) {
  return (def) => (key) => (m) => {
    const i = findIndex (eq) (key) (m)
    return i === -1 ? def : m[i][1]
  }
}

// =============================================================================
// Insert / Delete / Update
// =============================================================================

/**
 * Adds or replaces a key-value pair in the Map, returning a new Map. Key
 * identity is determined by the equality function, so `{ id: 1 }` will
 * correctly overwrite an existing entry for an equal key even though the two
 * objects are not reference-equal. If the key is absent it is appended.
 * @example
 * // insert :: (k -> k -> Boolean) -> k -> v -> Map k v -> Map k v
 * const eqById = a => b => a.id === b.id
 * insert (eqById) ({ id: 2 }) ('Bob') ([[{ id: 1 }, 'Alice']])
 * // => [[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']]
 * insert (eqById) ({ id: 1 }) ('Alicia') ([[{ id: 1 }, 'Alice']])
 * // => [[{ id: 1 }, 'Alicia']]
 */
export function insert (eq) {
  return (key) => (val) => (m) => {
    const i = findIndex (eq) (key) (m)
    if (i === -1) return [...m, [key, val]]
    const copy = m.slice ()
    copy[i] = [key, val]
    return copy
  }
}

/**
 * Adds a new key-value pair only when the key does not yet exist, leaving the
 * Map unchanged for existing keys. This is the safe "don't overwrite"
 * alternative to `insert` and is useful when you want to register a default
 * value without clobbering something already set by the caller.
 * @example
 * // insertWith :: (k -> k -> Boolean) -> k -> v -> Map k v -> Map k v
 * const eqById = a => b => a.id === b.id
 * insertWith (eqById) ({ id: 1 }) ('NewAlice') ([[{ id: 1 }, 'Alice']])
 * // => [[{ id: 1 }, 'Alice']]
 * insertWith (eqById) ({ id: 3 }) ('Carol') ([[{ id: 1 }, 'Alice']])
 * // => [[{ id: 1 }, 'Alice'], [{ id: 3 }, 'Carol']]
 */
export function insertWith (eq) {
  return (key) => (val) => (m) => {
    const i = findIndex (eq) (key) (m)
    return i === -1 ? [...m, [key, val]] : m
  }
}

/**
 * Adds a key-value pair to the Map, but when the key already exists the two
 * values are merged using `f(newVal)(oldVal)` instead of being replaced. Ideal
 * for aggregation scenarios such as accumulating event counts per user ID or
 * merging partial records from multiple sources into one Map.
 * @example
 * // insertWithCombine :: (k -> k -> Boolean) -> (v -> v -> v) -> k -> v -> Map k v -> Map k v
 * const eqById = a => b => a.id === b.id
 * insertWithCombine (eqById) (a => b => a + b) ({ id: 1 }) (5) ([[{ id: 1 }, 10]])
 * // => [[{ id: 1 }, 15]]
 * insertWithCombine (a => b => a === b) (a => b => a + b) ('hits') (3) ([['hits', 7]])
 * // => [['hits', 10]]
 */
export function insertWithCombine (eq) {
  return (f) => (key) => (val) => (m) => {
    const i = findIndex (eq) (key) (m)
    if (i === -1) return [...m, [key, val]]
    const copy = m.slice ()
    copy[i] = [key, f (val) (m[i][1])]
    return copy
  }
}

/**
 * Deletes the entry for the given key and returns a new Map, leaving the
 * original unchanged. The equality function is used to find the matching key,
 * so structural equality works correctly — removing `{ id: 1 }` will find and
 * delete the entry even if the stored key is a different object instance.
 * @example
 * // remove :: (k -> k -> Boolean) -> k -> Map k v -> Map k v
 * const eqById = a => b => a.id === b.id
 * remove (eqById) ({ id: 1 }) ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => [[{ id: 2 }, 'Bob']]
 * remove (eqById) ({ id: 9 }) ([[{ id: 1 }, 'Alice']])
 * // => [[{ id: 1 }, 'Alice']]
 */
export function remove (eq) {
  return (key) => (m) => {
    const i = findIndex (eq) (key) (m)
    return i === -1 ? m : [...m.slice (0, i), ...m.slice (i + 1)]
  }
}

/**
 * Applies a function to the value at a key: `Just(newValue)` replaces the old
 * value, while `Nothing` removes the entry entirely. This models a conditional
 * update-or-delete in one step, avoiding a separate `lookup` followed by either
 * `insert` or `remove`.
 * @example
 * // update :: (k -> k -> Boolean) -> (v -> Maybe v) -> k -> Map k v -> Map k v
 * const eq = a => b => a === b
 * update (eq) (v => v > 1 ? M.just (v - 1) : M.nothing ()) ('lives') ([['lives', 2]])
 * // => [['lives', 1]]
 * update (eq) (v => v > 1 ? M.just (v - 1) : M.nothing ()) ('lives') ([['lives', 1]])
 * // => []
 */
export function update (eq) {
  return (f) => (key) => (m) => {
    const i = findIndex (eq) (key) (m)
    if (i === -1) return m
    const result = f (m[i][1])
    if (M.isNothing (result)) return [...m.slice (0, i), ...m.slice (i + 1)]
    const copy = m.slice ()
    copy[i] = [key, result.value]
    return copy
  }
}

/**
 * Updates an existing entry using `f` when the key is present, or inserts the
 * given default value when the key is absent. This is the idiomatic way to
 * implement a "get-or-create" pattern in a functional Map without first
 * querying and then branching on the result.
 * @example
 * // upsert :: (k -> k -> Boolean) -> (v -> v) -> k -> v -> Map k v -> Map k v
 * const eq = a => b => a === b
 * upsert (eq) (n => n + 1) ('visits') (1) ([['visits', 4]])
 * // => [['visits', 5]]
 * upsert (eq) (n => n + 1) ('visits') (1) ([])
 * // => [['visits', 1]]
 */
export function upsert (eq) {
  return (f) => (key) => (val) => (m) => {
    const i = findIndex (eq) (key) (m)
    if (i === -1) return [...m, [key, val]]
    const copy = m.slice ()
    copy[i] = [key, f (m[i][1])]
    return copy
  }
}

// =============================================================================
// Functor / Filterable
// =============================================================================

/**
 * Transforms every value in the Map by applying `f`, returning a new Map with
 * the same keys and insertion order unchanged. This is the Functor instance for
 * Map and is useful when you need to process all values uniformly — for example,
 * converting raw scores to letter grades while keeping user-ID keys intact.
 * @example
 * // map :: (a -> b) -> Map k a -> Map k b
 * map (u => u.name) ([[{ id: 1 }, { name: 'Alice', score: 82 }], [{ id: 2 }, { name: 'Bob', score: 60 }]])
 * // => [[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']]
 * map (v => v * 2) ([['a', 1], ['b', 2]])
 * // => [['a', 2], ['b', 4]]
 */
export function map (f) {
  return (m) => m.map (([k, v]) => [k, f (v)])
}

/**
 * Like `map`, but the transformation also receives the key. This is useful
 * when the output needs to embed key information — for instance, annotating
 * each user record with its own ID, or building a reverse map from values to
 * keys.
 * @example
 * // mapWithKey :: (k -> a -> b) -> Map k a -> Map k b
 * mapWithKey (k => v => `user-${k.id}: ${v}`) ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => [[{ id: 1 }, 'user-1: Alice'], [{ id: 2 }, 'user-2: Bob']]
 * mapWithKey (k => v => ({ key: k, score: v })) ([['a', 10]])
 * // => [['a', { key: 'a', score: 10 }]]
 */
export function mapWithKey (f) {
  return (m) => m.map (([k, v]) => [k, f (k) (v)])
}

/**
 * Returns a new Map retaining only the entries whose value satisfies the
 * predicate. Use this to narrow down a lookup table — for example, keeping
 * only users with an active status or entries whose scores exceed a threshold.
 * @example
 * // filter :: (v -> Boolean) -> Map k v -> Map k v
 * filter (v => v.active) ([[{ id: 1 }, { name: 'Alice', active: true }], [{ id: 2 }, { name: 'Bob', active: false }]])
 * // => [[{ id: 1 }, { name: 'Alice', active: true }]]
 * filter (v => v > 50) ([['a', 80], ['b', 30], ['c', 95]])
 * // => [['a', 80], ['c', 95]]
 */
export function filter (pred) {
  return (m) => m.filter (([, v]) => pred (v))
}

/**
 * Like `filter`, but the predicate also receives the key — useful when
 * retention decisions depend on both the key and the value. For example, you
 * could keep entries where the key's ID is within a specific range and the
 * value meets a quality threshold.
 * @example
 * // filterWithKey :: (k -> v -> Boolean) -> Map k v -> Map k v
 * filterWithKey (k => v => k.id < 3 && v > 0) ([[{ id: 1 }, 5], [{ id: 2 }, -1], [{ id: 3 }, 8]])
 * // => [[{ id: 1 }, 5]]
 * filterWithKey (k => v => k !== 'internal' && v !== null) ([['name', 'Alice'], ['internal', null]])
 * // => [['name', 'Alice']]
 */
export function filterWithKey (pred) {
  return (m) => m.filter (([k, v]) => pred (k) (v))
}

/**
 * Combines `map` and `filter` in one pass: applies `f` to each value and keeps
 * the entry only when `f` returns `Just`. Efficient for transformations that
 * can fail per-entry — for example, parsing or validating each value and
 * silently dropping invalid ones rather than aborting the whole traversal.
 * @example
 * // filterMap :: (a -> Maybe b) -> Map k a -> Map k b
 * filterMap (v => v > 0 ? M.just (v * 10) : M.nothing ()) ([['a', 2], ['b', -1], ['c', 5]])
 * // => [['a', 20], ['c', 50]]
 * filterMap (v => Number.isFinite (v) ? M.just (v) : M.nothing ()) ([['x', 1], ['y', NaN], ['z', 3]])
 * // => [['x', 1], ['z', 3]]
 */
export function filterMap (f) {
  return (m) => {
    const result = []
    for (const [k, v] of m) {
      const r = f (v)
      if (M.isJust (r)) result.push ([k, r.value])
    }
    return result
  }
}

// =============================================================================
// Fold
// =============================================================================

/**
 * Folds all values in the Map into a single result, traversing entries in
 * insertion order. Use this to compute aggregates that don't require key
 * information — summing scores, concatenating names, or building a flat array
 * from a Map of lists.
 * @example
 * // reduce :: (b -> v -> b) -> b -> Map k v -> b
 * reduce (acc => v => acc + v) (0) ([['alice', 42], ['bob', 17], ['carol', 99]])
 * // => 158
 * reduce (acc => v => [...acc, v]) ([]) ([['a', 1], ['b', 2]])
 * // => [1, 2]
 */
export function reduce (f) {
  return (init) => (m) => m.reduce ((acc, [, v]) => f (acc) (v), init)
}

/**
 * Like `reduce`, but the folding function also receives the key at each step.
 * This lets you build outputs that depend on both keys and values, such as
 * constructing an inverted index, serializing entries to a query string, or
 * accumulating a StrMap from a Map with object keys.
 * @example
 * // foldWithKey :: (b -> k -> v -> b) -> b -> Map k v -> b
 * foldWithKey (acc => k => v => acc + `${k.id}:${v} `) ('') ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => '1:Alice 2:Bob '
 * foldWithKey (acc => k => v => ({ ...acc, [k]: v * 2 })) ({}) ([['a', 1], ['b', 2]])
 * // => { a: 2, b: 4 }
 */
export function foldWithKey (f) {
  return (init) => (m) => m.reduce ((acc, [k, v]) => f (acc) (k) (v), init)
}

// =============================================================================
// Combine
// =============================================================================

/**
 * Merges two Maps into one; when both contain an equivalent key the entry from
 * `b` wins (right-biased). This right-biased behaviour makes it natural for
 * applying a set of overrides on top of a base map while keeping all entries
 * from both.
 * @example
 * // union :: (k -> k -> Boolean) -> Map k v -> Map k v -> Map k v
 * const eq = a => b => a.id === b.id
 * union (eq) ([[{ id: 1 }, 'Alice']]) ([[{ id: 2 }, 'Bob']])
 * // => [[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']]
 * union (eq) ([[{ id: 1 }, 'Alice']]) ([[{ id: 1 }, 'Alicia'], [{ id: 2 }, 'Bob']])
 * // => [[{ id: 1 }, 'Alicia'], [{ id: 2 }, 'Bob']]
 */
export function union (eq) {
  return (a) => (b) => {
    let m = a.slice ()
    for (const [k, v] of b) m = insert (eq) (k) (v) (m)
    return m
  }
}

/**
 * Merges two Maps with the *left* map winning on duplicate keys. Use this to
 * merge a partial user-supplied config over a full defaults map — the user's
 * explicit values are preserved while any missing keys are filled in from the
 * defaults.
 * @example
 * // unionLeft :: (k -> k -> Boolean) -> Map k v -> Map k v -> Map k v
 * const eq = a => b => a === b
 * unionLeft (eq) ([['timeout', 5000]]) ([['timeout', 30000], ['retries', 3]])
 * // => [['timeout', 5000], ['retries', 3]]
 * unionLeft (eq) ([['a', 1]]) ([['a', 9], ['b', 2]])
 * // => [['a', 1], ['b', 2]]
 */
export function unionLeft (eq) {
  return (a) => (b) => {
    let m = a.slice ()
    for (const [k, v] of b) m = insertWith (eq) (k) (v) (m)
    return m
  }
}

/**
 * Like `union`, but instead of overwriting a duplicate key it combines the two
 * values using `f(aVal)(bVal)`. The right tool for merging maps that represent
 * counts, histograms, or partial data where both entries contribute to the
 * final value.
 * @example
 * // unionWith :: (k -> k -> Boolean) -> (v -> v -> v) -> Map k v -> Map k v -> Map k v
 * const eq = a => b => a === b
 * unionWith (eq) (a => b => a + b) ([['views', 10]]) ([['views', 5], ['clicks', 2]])
 * // => [['views', 15], ['clicks', 2]]
 * unionWith (eq) (a => b => Math.max (a, b)) ([['score', 80]]) ([['score', 95]])
 * // => [['score', 95]]
 */
export function unionWith (eq) {
  return (f) => (a) => (b) => {
    let m = a.slice ()
    for (const [k, v] of b) m = insertWithCombine (eq) (f) (k) (v) (m)
    return m
  }
}

/**
 * Returns a Map containing only the entries whose keys appear in *both* input
 * maps, taking values from `b`. Use this when `b` carries updated or enriched
 * data and you want to apply it only to keys that already exist in your current
 * map `a`, discarding any new keys from `b`.
 * @example
 * // intersection :: (k -> k -> Boolean) -> Map k a -> Map k b -> Map k b
 * const eq = a => b => a === b
 * intersection (eq) ([['a', 1], ['b', 2]]) ([['b', 99], ['c', 3]])
 * // => [['b', 99]]
 * intersection (eq) ([['x', 1]]) ([['y', 2]])
 * // => []
 */
export function intersection (eq) {
  return (a) => (b) =>
    b.filter (([k]) => member (eq) (k) (a))
}

/**
 * Like `intersection`, but instead of discarding the value from `a` it
 * combines both values using `f(aVal)(bVal)`. Useful when the intersection
 * of two maps should produce derived values — for example, computing score
 * deltas between a baseline and a result map.
 * @example
 * // intersectionWith :: (k -> k -> Boolean) -> (a -> b -> c) -> Map k a -> Map k b -> Map k c
 * const eq = a => b => a === b
 * intersectionWith (eq) (a => b => a - b) ([['alice', 100], ['bob', 70]]) ([['alice', 85], ['carol', 90]])
 * // => [['alice', 15]]
 * intersectionWith (eq) (a => b => a + b) ([['x', 1], ['y', 2]]) ([['x', 10]])
 * // => [['x', 11]]
 */
export function intersectionWith (eq) {
  return (f) => (a) => (b) => {
    const result = []
    for (const [k, av] of a) {
      const i = findIndex (eq) (k) (b)
      if (i !== -1) result.push ([k, f (av) (b[i][1])])
    }
    return result
  }
}

/**
 * Returns a Map of the entries in `a` whose keys have no match in `b`. Useful
 * for computing what needs to be added when syncing — for example, finding all
 * records in a source map that are absent from a destination map.
 * @example
 * // difference :: (k -> k -> Boolean) -> Map k a -> Map k b -> Map k a
 * const eq = a => b => a === b
 * difference (eq) ([['a', 1], ['b', 2], ['c', 3]]) ([['b', 99]])
 * // => [['a', 1], ['c', 3]]
 * difference (eq) ([['x', 1]]) ([['x', 2], ['y', 3]])
 * // => []
 */
export function difference (eq) {
  return (a) => (b) =>
    a.filter (([k]) => notMember (eq) (k) (b))
}

// =============================================================================
// Eq
// =============================================================================

/**
 * Compares two Maps for structural equality by checking that every key-value
 * pair in `a` has a corresponding pair in `b` with an equivalent key and value,
 * and that both maps have the same size. Insertion order is irrelevant, making
 * this safe to use after operations that may alter order.
 * @example
 * // equals :: (k -> k -> Boolean) -> (v -> v -> Boolean) -> Map k v -> Map k v -> Boolean
 * const eqId = a => b => a.id === b.id
 * const eqStr = a => b => a === b
 * equals (eqId) (eqStr) ([[{ id: 1 }, 'Alice']]) ([[{ id: 1 }, 'Alice']])
 * // => true
 * equals (eqId) (eqStr) ([[{ id: 1 }, 'Alice']]) ([[{ id: 1 }, 'Bob']])
 * // => false
 */
export function equals (eqK) {
  return (eqV) => (a) => (b) => {
    if (a.length !== b.length) return false
    for (const [k, av] of a) {
      const i = findIndex (eqK) (k) (b)
      if (i === -1) return false
      if (!eqV (av) (b[i][1])) return false
    }
    return true
  }
}

// =============================================================================
// Accessors
// =============================================================================

/**
 * Extracts all keys from the Map in insertion order as a plain array. Use this
 * when you need to iterate over the key space — for example, to render a list
 * of user IDs in a UI or to diff the keys of two Maps.
 * @example
 * // keys :: Map k v -> Array k
 * keys ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => [{ id: 1 }, { id: 2 }]
 * keys ([['a', 1], ['b', 2]])
 * // => ['a', 'b']
 */
export function keys (m) {
  return m.map (([k]) => k)
}

/**
 * Extracts all values from the Map in insertion order, discarding the keys.
 * Use this when you only need the payload — for example, collecting all records
 * to pass to a rendering function or computing an aggregate over every entry.
 * @example
 * // values :: Map k v -> Array v
 * values ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => ['Alice', 'Bob']
 * values ([['a', 10], ['b', 20]])
 * // => [10, 20]
 */
export function values (m) {
  return m.map (([, v]) => v)
}

/**
 * Returns `true` only when every value in the Map satisfies the predicate. Use
 * it to validate a whole collection at once — for instance, confirming all
 * retrieved records are non-null before proceeding with a batch operation.
 * @example
 * // all :: (v -> Boolean) -> Map k v -> Boolean
 * all (v => v !== null) ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => true
 * all (v => v > 50) ([['a', 80], ['b', 30]])
 * // => false
 */
export function all (pred) {
  return (m) => m.every (([, v]) => pred (v))
}

/**
 * Returns `true` when at least one value in the Map satisfies the predicate.
 * Use this as a quick membership check on the value space — for example,
 * detecting whether any user has admin rights or whether any cached result is
 * stale.
 * @example
 * // any :: (v -> Boolean) -> Map k v -> Boolean
 * any (v => v.role === 'admin') ([[{ id: 1 }, { role: 'user' }], [{ id: 2 }, { role: 'admin' }]])
 * // => true
 * any (v => v < 0) ([['a', 1], ['b', 2]])
 * // => false
 */
export function any (pred) {
  return (m) => m.some (([, v]) => pred (v))
}

/**
 * Returns `true` when none of the Map's values satisfy the predicate — the
 * complement of `any`. Use this as a guard to confirm that no entry is in an
 * error state before proceeding with further processing.
 * @example
 * // none :: (v -> Boolean) -> Map k v -> Boolean
 * none (v => v === null) ([[{ id: 1 }, 'Alice'], [{ id: 2 }, 'Bob']])
 * // => true
 * none (v => v.banned) ([[{ id: 1 }, { banned: false }], [{ id: 2 }, { banned: true }]])
 * // => false
 */
export function none (pred) {
  return (m) => !m.some (([, v]) => pred (v))
}
