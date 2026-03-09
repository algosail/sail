// strMap.js – Plain JS objects used as string maps (StrMap).

import * as M from './maybe.js'

const sortedKeys = (o) => Object.keys (o).sort ()

/**
 * Element-wise equality over sorted keys.
 * @example
 * // equals :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean
 * equals ((a, b) => a === b) ({ a: 1 }) ({ a: 1 }) // => true
 */
export function equals (eq) {
  return (a) => (b) => {
    const aKeys = sortedKeys (a)
    const bKeys = sortedKeys (b)
    if (aKeys.length !== bKeys.length) return false
    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) return false
      if (!eq (a[aKeys[i]], b[bKeys[i]])) return false
    }
    return true
  }
}

/**
 * Lexicographic ordering over sorted keys; values compared on key ties.
 * @example
 * // lte :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean
 * lte ((a, b) => a <= b) ({ a: 1 }) ({ a: 2 }) // => true
 */
export function lte (lteVal) {
  return (a) => (b) => {
    const aKeys = sortedKeys (a)
    const bKeys = sortedKeys (b)
    let ai = 0
    let bi = 0
    while (ai < aKeys.length && bi < bKeys.length) {
      const ak = aKeys[ai++]
      const bk = bKeys[bi++]
      if (ak < bk) return true
      if (ak > bk) return false
      const av = a[ak]
      const bv = b[bk]
      const ab = lteVal (av, bv)
      const ba = lteVal (bv, av)
      if (!(ab && ba)) return ab
    }
    return ai >= aKeys.length // a exhausted first → a ≤ b
  }
}

/**
 * Right-biased merge — keys in b overwrite keys in a.
 * @example
 * // concat :: StrMap v -> StrMap v -> StrMap v
 * concat ({ a: 1 }) ({ b: 2 }) // => {a:1,b:2}
 */
export function concat (a) {
  return (b) => ({ ...a, ...b })
}

/**
 * Returns a new empty object.
 * @example
 * // empty :: () -> StrMap v
 * empty () // => {}
 */
export function empty () {
  return {}
}

/**
 * Keeps only entries whose value satisfies the predicate.
 * @example
 * // filter :: (v -> Boolean) -> StrMap v -> StrMap v
 * filter (v => v > 1) ({ a: 1, b: 2, c: 3 }) // => {b:2,c:3}
 */
export function filter (pred) {
  return (obj) => {
    const result = {}
    for (const k of Object.keys (obj)) {
      if (pred (obj[k])) result[k] = obj[k]
    }
    return result
  }
}

/**
 * Removes entries whose value satisfies the predicate.
 * @example
 * // reject :: (v -> Boolean) -> StrMap v -> StrMap v
 * reject (v => v > 1) ({ a: 1, b: 2 }) // => {a:1}
 */
export function reject (pred) {
  return filter ((v) => !pred (v))
}

/**
 * Applies f to every value.
 * @example
 * // map :: (a -> b) -> StrMap a -> StrMap b
 * map (v => v * 2) ({ a: 1, b: 2 }) // => {a:2,b:4}
 */
export function map (f) {
  return (obj) => {
    const result = {}
    for (const k of Object.keys (obj)) result[k] = f (obj[k])
    return result
  }
}

/**
 * Applies functions to matching keys; only shared keys appear in the result.
 * @example
 * // ap :: StrMap (a -> b) -> StrMap a -> StrMap b
 * ap ({ a: x => x + 1 }) ({ a: 1, b: 2 }) // => {a:2}
 */
export function ap (fns) {
  return (obj) => {
    const result = {}
    for (const k of Object.keys (obj)) {
      if (Object.prototype.hasOwnProperty.call (fns, k)) result[k] = fns[k] (obj[k])
    }
    return result
  }
}

/**
 * Left-biased merge — keys from a overwrite keys from b.
 * @example
 * // alt :: StrMap v -> StrMap v -> StrMap v
 * alt ({ a: 1 }) ({ a: 9, b: 2 }) // => {a:1,b:2}
 */
export function alt (a) {
  return (b) => ({ ...b, ...a })
}

/**
 * Returns an empty StrMap (monoid zero).
 * @example
 * // zero :: () -> StrMap v
 * zero () // => {}
 */
export function zero () {
  return {}
}

/**
 * Left fold over values in sorted key order.
 * @example
 * // reduce :: ((b, v) -> b) -> b -> StrMap v -> b
 * reduce ((acc, v) => acc + v) (0) ({ b: 2, a: 1 }) // => 3
 */
export function reduce (f) {
  return (init) => (obj) =>
    sortedKeys (obj).reduce ((acc, k) => f (acc, obj[k]), init)
}

/**
 * Returns the number of keys.
 * @example
 * // size :: StrMap v -> Integer
 * size ({ a: 1, b: 2 }) // => 2
 */
export function size (obj) {
  return Object.keys (obj).length
}

/**
 * True when every value satisfies the predicate.
 * @example
 * // all :: (v -> Boolean) -> StrMap v -> Boolean
 * all (v => v > 0) ({ a: 1, b: 2 }) // => true
 */
export function all (pred) {
  return (obj) => Object.values (obj).every (pred)
}

/**
 * True when at least one value satisfies the predicate.
 * @example
 * // any :: (v -> Boolean) -> StrMap v -> Boolean
 * any (v => v > 1) ({ a: 1, b: 2 }) // => true
 */
export function any (pred) {
  return (obj) => Object.values (obj).some (pred)
}

/**
 * True when no value satisfies the predicate.
 * @example
 * // none :: (v -> Boolean) -> StrMap v -> Boolean
 * none (v => v > 5) ({ a: 1, b: 2 }) // => true
 */
export function none (pred) {
  return (obj) => !Object.values (obj).some (pred)
}

/**
 * True when x is found among the values using the comparator.
 * @example
 * // elem :: ((v, v) -> Boolean) -> v -> StrMap v -> Boolean
 * elem ((a, b) => a === b) (2) ({ a: 1, b: 2 }) // => true
 */
export function elem (eq) {
  return (x) => (obj) => Object.values (obj).some ((v) => eq (v, x))
}

/**
 * Applicative traversal — passes explicit apOf, apAp, apMap operations.
 * @example
 * // traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (v -> f b) -> StrMap v -> f (StrMap b)
 * traverse (Array.of) (ff => fa => ff.flatMap (f => fa.map (f))) (f => fa => fa.map (f)) (v => [v, v * 2]) ({ a: 1 })
 */
export function traverse (apOf) {
  return (apAp) => (apMap) => (f) => (obj) =>
    Object.keys (obj).reduce (
      (acc, k) =>
        apAp (
          apMap ((o) => (v) => ({ ...o, [k]: v }), acc),
          f (obj[k]),
        ),
      apOf ({}),
    )
}

/**
 * Returns Just(m[k]) if k is an own enumerable property; Nothing otherwise.
 * @example
 * // value :: String -> StrMap a -> Maybe a
 * value ('a') ({ a: 1 }) // => just(1)
 */
export function value (key) {
  return (strMap) =>
    Object.prototype.propertyIsEnumerable.call (strMap, key)
      ? M.just (strMap[key])
      : M.nothing ()
}

/**
 * Creates a single-entry map.
 * @example
 * // singleton :: String -> a -> StrMap a
 * singleton ('a') (1) // => {a:1}
 */
export function singleton (key) {
  return (val) => ({ [key]: val })
}

/**
 * Returns a new map with the key set to val.
 * @example
 * // insert :: String -> a -> StrMap a -> StrMap a
 * insert ('b') (2) ({ a: 1 }) // => {a:1,b:2}
 */
export function insert (key) {
  return (val) => (strMap) => ({ ...strMap, [key]: val })
}

/**
 * Returns a new map with the key deleted.
 * @example
 * // remove :: String -> StrMap a -> StrMap a
 * remove ('a') ({ a: 1, b: 2 }) // => {b:2}
 */
export function remove (key) {
  return (strMap) => {
    const result = { ...strMap }
    delete result[key]
    return result
  }
}

/**
 * Returns all enumerable keys.
 * @example
 * // keys :: StrMap a -> Array String
 * keys ({ b: 2, a: 1 }) // => ['b','a']
 */
export function keys (obj) {
  return Object.keys (obj)
}

/**
 * Returns all enumerable values.
 * @example
 * // values :: StrMap a -> Array a
 * values ({ a: 1, b: 2 }) // => [1,2]
 */
export function values (obj) {
  return Object.values (obj)
}

/**
 * Returns all [key, value] entries.
 * @example
 * // pairs :: StrMap a -> Array [String, a]
 * pairs ({ a: 1 }) // => [['a',1]]
 */
export function pairs (obj) {
  return Object.entries (obj).map (([k, v]) => [k, v])
}

/**
 * Builds a map from [key, value] pairs — last write wins on duplicate keys.
 * @example
 * // fromPairs :: Array [String, a] -> StrMap a
 * fromPairs ([['a', 1], ['b', 2]]) // => {a:1,b:2}
 */
export function fromPairs (ps) {
  return ps.reduce ((acc, [k, v]) => ((acc[k] = v), acc), {})
}

/**
 * Curried-binary left fold; values visited in sorted key order.
 * @example
 * // reduceC :: (b -> a -> b) -> b -> StrMap a -> b
 * reduceC (acc => v => acc + v) (0) ({ b: 2, a: 1 }) // => 3
 */
export function reduceC (f) {
  return (init) => (obj) =>
    sortedKeys (obj).reduce ((acc, k) => f (acc) (obj[k]), init)
}
