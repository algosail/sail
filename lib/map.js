// map.js – Functional Map with arbitrary keys.
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
 * Returns a new empty Map.
 * @example
 * // empty :: () -> Map k v
 * empty () // => []
 */
export function empty () {
  return []
}

/**
 * Creates a Map with a single key-value pair.
 * @example
 * // singleton :: k -> v -> Map k v
 * singleton ('a') (1) // => [['a', 1]]
 */
export function singleton (key) {
  return (val) => [[key, val]]
}

/**
 * Builds a Map from an array of [key, value] pairs using the given equality.
 * Later entries win on duplicate keys.
 * @example
 * // fromPairs :: (k -> k -> Boolean) -> Array [k, v] -> Map k v
 * fromPairs (a => b => a === b) ([['a', 1], ['b', 2], ['a', 3]])
 * // => [['a', 3], ['b', 2]]
 */
export function fromPairs (eq) {
  return (pairs) => {
    let m = []
    for (const [k, v] of pairs) m = insert (eq) (k) (v) (m)
    return m
  }
}

/**
 * Converts the Map to an array of [key, value] pairs.
 * @example
 * // toPairs :: Map k v -> Array [k, v]
 * toPairs ([['a', 1], ['b', 2]]) // => [['a', 1], ['b', 2]]
 */
export function toPairs (m) {
  return m.slice ()
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns the number of entries in the Map.
 * @example
 * // size :: Map k v -> Integer
 * size ([['a', 1], ['b', 2]]) // => 2
 * size ([])                   // => 0
 */
export function size (m) {
  return m.length
}

/**
 * True when the Map has no entries.
 * @example
 * // isEmpty :: Map k v -> Boolean
 * isEmpty ([])          // => true
 * isEmpty ([['a', 1]]) // => false
 */
export function isEmpty (m) {
  return m.length === 0
}

/**
 * True when the Map contains the given key.
 * @example
 * // member :: (k -> k -> Boolean) -> k -> Map k v -> Boolean
 * member (a => b => a === b) ('a') ([['a', 1]]) // => true
 * member (a => b => a === b) ('z') ([['a', 1]]) // => false
 */
export function member (eq) {
  return (key) => (m) => findIndex (eq) (key) (m) !== -1
}

/**
 * True when the Map does NOT contain the given key.
 * @example
 * // notMember :: (k -> k -> Boolean) -> k -> Map k v -> Boolean
 * notMember (a => b => a === b) ('z') ([['a', 1]]) // => true
 */
export function notMember (eq) {
  return (key) => (m) => findIndex (eq) (key) (m) === -1
}

// =============================================================================
// Lookup
// =============================================================================

/**
 * Returns Just(v) if the key is in the Map, Nothing otherwise.
 * @example
 * // lookup :: (k -> k -> Boolean) -> k -> Map k v -> Maybe v
 * lookup (a => b => a === b) ('a') ([['a', 1]]) // => just(1)
 * lookup (a => b => a === b) ('z') ([['a', 1]]) // => nothing()
 */
export function lookup (eq) {
  return (key) => (m) => {
    const i = findIndex (eq) (key) (m)
    return i === -1 ? M.nothing () : M.just (m[i][1])
  }
}

/**
 * Returns the value for the key, or the provided default if absent.
 * @example
 * // findWithDefault :: (k -> k -> Boolean) -> v -> k -> Map k v -> v
 * findWithDefault (a => b => a === b) (0) ('a') ([['a', 1]]) // => 1
 * findWithDefault (a => b => a === b) (0) ('z') ([['a', 1]]) // => 0
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
 * Returns a new Map with the key set to val.
 * If the key already exists its value is replaced.
 * @example
 * // insert :: (k -> k -> Boolean) -> k -> v -> Map k v -> Map k v
 * insert (a => b => a === b) ('b') (2) ([['a', 1]]) // => [['a', 1], ['b', 2]]
 * insert (a => b => a === b) ('a') (9) ([['a', 1]]) // => [['a', 9]]
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
 * Inserts a key only if it is not already present — existing values are kept.
 * @example
 * // insertWith :: (k -> k -> Boolean) -> k -> v -> Map k v -> Map k v
 * insertWith (a => b => a === b) ('a') (9) ([['a', 1]]) // => [['a', 1]]
 * insertWith (a => b => a === b) ('b') (2) ([['a', 1]]) // => [['a', 1], ['b', 2]]
 */
export function insertWith (eq) {
  return (key) => (val) => (m) => {
    const i = findIndex (eq) (key) (m)
    return i === -1 ? [...m, [key, val]] : m
  }
}

/**
 * Inserts, or combines the new value with the existing one using f(newVal)(oldVal).
 * @example
 * // insertWithCombine :: (k -> k -> Boolean) -> (v -> v -> v) -> k -> v -> Map k v -> Map k v
 * insertWithCombine (a => b => a === b) (a => b => a + b) ('a') (10) ([['a', 1]])
 * // => [['a', 11]]
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
 * Removes the entry with the given key. No-op if absent.
 * @example
 * // remove :: (k -> k -> Boolean) -> k -> Map k v -> Map k v
 * remove (a => b => a === b) ('a') ([['a', 1], ['b', 2]]) // => [['b', 2]]
 * remove (a => b => a === b) ('z') ([['a', 1]])            // => [['a', 1]]
 */
export function remove (eq) {
  return (key) => (m) => {
    const i = findIndex (eq) (key) (m)
    return i === -1 ? m : [...m.slice (0, i), ...m.slice (i + 1)]
  }
}

/**
 * Applies f to the value at key if present; removes the entry if f returns Nothing.
 * @example
 * // update :: (k -> k -> Boolean) -> (v -> Maybe v) -> k -> Map k v -> Map k v
 * update (a => b => a === b) (v => v > 1 ? just(v - 1) : nothing()) ('a') ([['a', 2]])
 * // => [['a', 1]]
 * update (a => b => a === b) (v => v > 1 ? just(v - 1) : nothing()) ('a') ([['a', 1]])
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
 * Applies f to the value at key if present; inserts val if absent.
 * @example
 * // upsert :: (k -> k -> Boolean) -> (v -> v) -> k -> v -> Map k v -> Map k v
 * upsert (a => b => a === b) (v => v + 1) ('a') (0) ([['a', 5]]) // => [['a', 6]]
 * upsert (a => b => a === b) (v => v + 1) ('b') (0) ([['a', 5]]) // => [['a', 5], ['b', 0]]
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
 * Applies f to every value, preserving keys and order.
 * @example
 * // map :: (a -> b) -> Map k a -> Map k b
 * map (v => v * 2) ([['a', 1], ['b', 2]]) // => [['a', 2], ['b', 4]]
 */
export function map (f) {
  return (m) => m.map (([k, v]) => [k, f (v)])
}

/**
 * Applies f to every key-value pair.
 * @example
 * // mapWithKey :: (k -> a -> b) -> Map k a -> Map k b
 * mapWithKey (k => v => `${k}:${v}`) ([['a', 1]]) // => [['a', 'a:1']]
 */
export function mapWithKey (f) {
  return (m) => m.map (([k, v]) => [k, f (k) (v)])
}

/**
 * Keeps entries whose value satisfies pred.
 * @example
 * // filter :: (v -> Boolean) -> Map k v -> Map k v
 * filter (v => v > 1) ([['a', 1], ['b', 2], ['c', 3]]) // => [['b', 2], ['c', 3]]
 */
export function filter (pred) {
  return (m) => m.filter (([, v]) => pred (v))
}

/**
 * Keeps entries whose key and value satisfy pred.
 * @example
 * // filterWithKey :: (k -> v -> Boolean) -> Map k v -> Map k v
 * filterWithKey (k => v => k !== 'a' && v > 0) ([['a', 1], ['b', 2]]) // => [['b', 2]]
 */
export function filterWithKey (pred) {
  return (m) => m.filter (([k, v]) => pred (k) (v))
}

/**
 * Maps f over values, keeping Just results and discarding Nothing.
 * @example
 * // filterMap :: (a -> Maybe b) -> Map k a -> Map k b
 * filterMap (v => v > 1 ? just(v * 10) : nothing()) ([['a', 1], ['b', 2]])
 * // => [['b', 20]]
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
 * Left fold over values in insertion order with a curried function.
 * @example
 * // reduce :: (b -> v -> b) -> b -> Map k v -> b
 * reduce (acc => v => acc + v) (0) ([['a', 1], ['b', 2]]) // => 3
 */
export function reduce (f) {
  return (init) => (m) => m.reduce ((acc, [, v]) => f (acc) (v), init)
}

/**
 * Left fold over key-value pairs in insertion order.
 * @example
 * // foldWithKey :: (b -> k -> v -> b) -> b -> Map k v -> b
 * foldWithKey (acc => k => v => [...acc, `${k}=${v}`]) ([]) ([['a', 1], ['b', 2]])
 * // => ['a=1', 'b=2']
 */
export function foldWithKey (f) {
  return (init) => (m) => m.reduce ((acc, [k, v]) => f (acc) (k) (v), init)
}

// =============================================================================
// Combine
// =============================================================================

/**
 * Right-biased union — keys from b overwrite keys from a.
 * @example
 * // union :: (k -> k -> Boolean) -> Map k v -> Map k v -> Map k v
 * union (a => b => a === b) ([['a', 1]]) ([['b', 2]])       // => [['a', 1], ['b', 2]]
 * union (a => b => a === b) ([['a', 1]]) ([['a', 9], ['b', 2]]) // => [['a', 9], ['b', 2]]
 */
export function union (eq) {
  return (a) => (b) => {
    let m = a.slice ()
    for (const [k, v] of b) m = insert (eq) (k) (v) (m)
    return m
  }
}

/**
 * Left-biased union — keys from a take priority over keys from b.
 * @example
 * // unionLeft :: (k -> k -> Boolean) -> Map k v -> Map k v -> Map k v
 * unionLeft (a => b => a === b) ([['a', 1]]) ([['a', 9], ['b', 2]]) // => [['a', 1], ['b', 2]]
 */
export function unionLeft (eq) {
  return (a) => (b) => {
    let m = a.slice ()
    for (const [k, v] of b) m = insertWith (eq) (k) (v) (m)
    return m
  }
}

/**
 * Union with a combining function for duplicate keys: f(aVal)(bVal).
 * @example
 * // unionWith :: (k -> k -> Boolean) -> (v -> v -> v) -> Map k v -> Map k v -> Map k v
 * unionWith (a => b => a === b) (a => b => a + b) ([['a', 1]]) ([['a', 2], ['b', 3]])
 * // => [['a', 3], ['b', 3]]
 */
export function unionWith (eq) {
  return (f) => (a) => (b) => {
    let m = a.slice ()
    for (const [k, v] of b) m = insertWithCombine (eq) (f) (k) (v) (m)
    return m
  }
}

/**
 * Keeps only entries whose key appears in both maps; values come from b.
 * @example
 * // intersection :: (k -> k -> Boolean) -> Map k a -> Map k b -> Map k b
 * intersection (a => b => a === b) ([['a', 1], ['b', 2]]) ([['b', 9], ['c', 3]])
 * // => [['b', 9]]
 */
export function intersection (eq) {
  return (a) => (b) =>
    b.filter (([k]) => member (eq) (k) (a))
}

/**
 * Intersection keeping values from a, combined with values from b via f(aVal)(bVal).
 * @example
 * // intersectionWith :: (k -> k -> Boolean) -> (a -> b -> c) -> Map k a -> Map k b -> Map k c
 * intersectionWith (a => b => a === b) (a => b => a + b) ([['a', 1], ['b', 2]]) ([['b', 3]])
 * // => [['b', 5]]
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
 * Keeps entries from a whose key does NOT appear in b.
 * @example
 * // difference :: (k -> k -> Boolean) -> Map k a -> Map k b -> Map k a
 * difference (a => b => a === b) ([['a', 1], ['b', 2]]) ([['b', 9]])
 * // => [['a', 1]]
 */
export function difference (eq) {
  return (a) => (b) =>
    a.filter (([k]) => notMember (eq) (k) (b))
}

// =============================================================================
// Eq
// =============================================================================

/**
 * True when both Maps contain the same key-value pairs (key equality via eqK,
 * value equality via eqV), regardless of insertion order.
 * @example
 * // equals :: (k -> k -> Boolean) -> (v -> v -> Boolean) -> Map k v -> Map k v -> Boolean
 * equals (a => b => a === b) (a => b => a === b) ([['a', 1]]) ([['a', 1]]) // => true
 * equals (a => b => a === b) (a => b => a === b) ([['a', 1]]) ([['a', 2]]) // => false
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
 * Returns all keys in insertion order.
 * @example
 * // keys :: Map k v -> Array k
 * keys ([['a', 1], ['b', 2]]) // => ['a', 'b']
 */
export function keys (m) {
  return m.map (([k]) => k)
}

/**
 * Returns all values in insertion order.
 * @example
 * // values :: Map k v -> Array v
 * values ([['a', 1], ['b', 2]]) // => [1, 2]
 */
export function values (m) {
  return m.map (([, v]) => v)
}

/**
 * True when every value satisfies pred.
 * @example
 * // all :: (v -> Boolean) -> Map k v -> Boolean
 * all (v => v > 0) ([['a', 1], ['b', 2]]) // => true
 * all (v => v > 1) ([['a', 1], ['b', 2]]) // => false
 */
export function all (pred) {
  return (m) => m.every (([, v]) => pred (v))
}

/**
 * True when at least one value satisfies pred.
 * @example
 * // any :: (v -> Boolean) -> Map k v -> Boolean
 * any (v => v > 1) ([['a', 1], ['b', 2]]) // => true
 * any (v => v > 9) ([['a', 1], ['b', 2]]) // => false
 */
export function any (pred) {
  return (m) => m.some (([, v]) => pred (v))
}

/**
 * True when no value satisfies pred.
 * @example
 * // none :: (v -> Boolean) -> Map k v -> Boolean
 * none (v => v > 9) ([['a', 1], ['b', 2]]) // => true
 * none (v => v > 1) ([['a', 1], ['b', 2]]) // => false
 */
export function none (pred) {
  return (m) => !m.some (([, v]) => pred (v))
}
