// strmap.js
// Plain JS objects used as string maps (StrMap).

import * as M from './maybe.js'

const sortedKeys = (o) => Object.keys (o).sort ()

// =============================================================================
// Eq / Ord
// =============================================================================

/**
 * Compares two StrMaps for equality by checking every key-value pair with the
 * provided value comparator. Both key sets must match exactly and all
 * corresponding values must satisfy `eq`. Useful for asserting that two
 * independently-built config objects are semantically identical after separate
 * derivation paths.
 * @example
 * // equals :: (v -> v -> Boolean) -> StrMap v -> StrMap v -> Boolean
 * equals (a => b => a === b) ({ host: 'localhost', port: 8080 }) ({ host: 'localhost', port: 8080 })
 * // => true
 * equals (a => b => a === b) ({ role: 'admin' }) ({ role: 'user' })
 * // => false
 * equals (a => b => a === b) ({ a: 1 }) ({ a: 1, b: 2 })
 * // => false
 */
export function equals (eq) {
  return (a) => (b) => {
    const aKeys = sortedKeys (a)
    const bKeys = sortedKeys (b)
    if (aKeys.length !== bKeys.length) return false
    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) return false
      if (!eq (a[aKeys[i]]) (b[bKeys[i]])) return false
    }
    return true
  }
}

/**
 * Compares two StrMaps lexicographically for use in sorting or ordered data
 * structures. Keys are compared alphabetically first; when a key appears in
 * both maps its values are then compared with the provided comparator. Returns
 * `true` when `a` should sort before or at the same position as `b`.
 * @example
 * // lte :: (v -> v -> Boolean) -> StrMap v -> StrMap v -> Boolean
 * lte (a => b => a <= b) ({ score: 10 }) ({ score: 20 })
 * // => true
 * lte (a => b => a <= b) ({ score: 20 }) ({ score: 10 })
 * // => false
 * lte (a => b => a <= b) ({ a: 1 }) ({ b: 1 })
 * // => true
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
      const ab = lteVal (av) (bv)
      const ba = lteVal (bv) (av)
      if (!(ab && ba)) return ab
    }
    return ai >= aKeys.length
  }
}

// =============================================================================
// Semigroup / Monoid
// =============================================================================

/**
 * Merges two StrMaps into one, with the right-hand map winning on duplicate
 * keys. This is the Semigroup instance for StrMap and models an "override"
 * pattern — pass your base config as `a` and a set of overrides as `b` to get
 * a merged result where the overrides take precedence over the base.
 * @example
 * // concat :: StrMap v -> StrMap v -> StrMap v
 * concat ({ host: 'localhost', port: 3000 }) ({ port: 8080, debug: true })
 * // => { host: 'localhost', port: 8080, debug: true }
 * concat ({ theme: 'light' }) ({ theme: 'dark' })
 * // => { theme: 'dark' }
 */
export function concat (a) {
  return (b) => ({ ...a, ...b })
}

/**
 * Returns a fresh empty StrMap — the Monoid identity element for `concat`.
 * Concatenating any map with `empty()` leaves it unchanged, making it the
 * safe starting value when building a map by folding over a list of entries.
 * @example
 * // empty :: () -> StrMap v
 * empty ()
 * // => {}
 */
export function empty () {
  return {}
}

// =============================================================================
// Constructors
// =============================================================================

/**
 * Constructs a StrMap containing exactly one key-value pair. Useful when you
 * need to lift a single configuration entry or lookup-table item into map form
 * before merging it with a larger StrMap via `concat` or `alt`.
 * @example
 * // singleton :: String -> a -> StrMap a
 * singleton ('apiUrl') ('https://api.example.com')
 * // => { apiUrl: 'https://api.example.com' }
 * singleton ('retries') (3)
 * // => { retries: 3 }
 */
export function singleton (key) {
  return (val) => ({ [key]: val })
}

/**
 * Builds a StrMap from an array of `[key, value]` pairs — last occurrence wins
 * on duplicate keys. Handy for converting tabular data (CSV rows, API key-value
 * responses) into a fast-lookup structure, or for reconstructing a map from its
 * `pairs()` output.
 * @example
 * // fromPairs :: Array [String, a] -> StrMap a
 * fromPairs ([['name', 'Alice'], ['role', 'admin']])
 * // => { name: 'Alice', role: 'admin' }
 * fromPairs ([['color', 'blue'], ['color', 'red']])
 * // => { color: 'red' }
 */
export function fromPairs (ps) {
  return ps.reduce ((acc, [k, v]) => ((acc[k] = v), acc), {})
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns the number of own enumerable keys in the map. Useful for checking
 * whether a config or lookup table is empty, or for asserting that a required
 * set of keys was fully populated after a batch operation.
 * @example
 * // size :: StrMap v -> Integer
 * size ({ host: 'localhost', port: 8080, debug: true })
 * // => 3
 * size ({})
 * // => 0
 */
export function size (obj) {
  return Object.keys (obj).length
}

/**
 * Returns `true` only when every value in the map satisfies the predicate.
 * Use this to validate that all entries in a config object meet a constraint
 * — for example, confirming that every feature flag is a boolean, or that no
 * numeric setting is negative.
 * @example
 * // all :: (v -> Boolean) -> StrMap v -> Boolean
 * all (v => typeof v === 'number') ({ x: 1, y: 2, z: 3 })
 * // => true
 * all (v => v > 0) ({ pass: 10, fail: -1 })
 * // => false
 */
export function all (pred) {
  return (obj) => Object.values (obj).every (pred)
}

/**
 * Returns `true` when at least one value in the map satisfies the predicate.
 * Handy for quickly checking whether a config or permission map contains at
 * least one entry of a certain kind — e.g. whether any feature flag is enabled
 * or any role grants write access.
 * @example
 * // any :: (v -> Boolean) -> StrMap v -> Boolean
 * any (v => v === true) ({ featureA: false, featureB: true })
 * // => true
 * any (v => v > 100) ({ x: 1, y: 2 })
 * // => false
 */
export function any (pred) {
  return (obj) => Object.values (obj).some (pred)
}

/**
 * Returns `true` when none of the values in the map satisfy the predicate —
 * the logical complement of `any`. Use it for guard checks such as confirming
 * that no required field is `null` or that no error code has been set before
 * proceeding with a downstream operation.
 * @example
 * // none :: (v -> Boolean) -> StrMap v -> Boolean
 * none (v => v === null) ({ host: 'localhost', port: 8080 })
 * // => true
 * none (v => v > 0) ({ a: 0, b: -1 })
 * // => true
 * none (v => v > 0) ({ a: 0, b: 1 })
 * // => false
 */
export function none (pred) {
  return (obj) => !Object.values (obj).some (pred)
}

/**
 * Checks whether a given value exists anywhere in the map using the provided
 * equality function. Useful for reverse-lookup scenarios — for example,
 * detecting whether a username already appears as a value in a role-to-user
 * map before assigning it to a new role.
 * @example
 * // elem :: (v -> v -> Boolean) -> v -> StrMap v -> Boolean
 * elem (a => b => a === b) ('alice') ({ admin: 'alice', viewer: 'bob' })
 * // => true
 * elem (a => b => a === b) ('charlie') ({ admin: 'alice', viewer: 'bob' })
 * // => false
 */
export function elem (eq) {
  return (x) => (obj) => Object.values (obj).some ((v) => eq (v) (x))
}

// =============================================================================
// Lookup / Mutation
// =============================================================================

/**
 * Safely retrieves a value by key, returning `Just(value)` when the key
 * exists and `Nothing` when it does not. This avoids the silent `undefined`
 * from direct bracket access and integrates naturally into Maybe-based
 * pipelines where missing keys must be handled explicitly.
 * @example
 * // lookup :: String -> StrMap a -> Maybe a
 * lookup ('host') ({ host: 'localhost', port: 8080 })
 * // => just('localhost')
 * lookup ('timeout') ({ host: 'localhost', port: 8080 })
 * // => nothing()
 * lookup ('admin') ({ admin: 'alice', viewer: 'bob' })
 * // => just('alice')
 */
export function lookup (key) {
  return (obj) =>
    Object.prototype.propertyIsEnumerable.call (obj, key)
      ? M.just (obj[key])
      : M.nothing ()
}

/**
 * Returns a new StrMap with the given key set to the given value, leaving the
 * original map unchanged. If the key already exists its value is replaced. Use
 * this to build configs immutably or to update a single field without mutating
 * shared state.
 * @example
 * // insert :: String -> a -> StrMap a -> StrMap a
 * insert ('port') (9000) ({ host: 'localhost', port: 3000 })
 * // => { host: 'localhost', port: 9000 }
 * insert ('debug') (true) ({ host: 'localhost' })
 * // => { host: 'localhost', debug: true }
 */
export function insert (key) {
  return (val) => (obj) => ({ ...obj, [key]: val })
}

/**
 * Returns a new StrMap with the specified key removed, leaving all other
 * entries intact and the original map unchanged. Use this to strip sensitive
 * fields — such as passwords or tokens — from a record before serializing
 * or logging it.
 * @example
 * // remove :: String -> StrMap a -> StrMap a
 * remove ('password') ({ username: 'alice', password: 's3cr3t', role: 'admin' })
 * // => { username: 'alice', role: 'admin' }
 * remove ('missing') ({ a: 1 })
 * // => { a: 1 }
 */
export function remove (key) {
  return (obj) => {
    const result = { ...obj }
    delete result[key]
    return result
  }
}

// =============================================================================
// Functor / Filterable
// =============================================================================

/**
 * Transforms every value in the StrMap by applying `f`, returning a new map
 * with the same keys. This is the Functor instance for StrMap and is the right
 * tool for batch-transforming values — for example, normalizing all config
 * strings to lowercase or converting raw API counts to percentages.
 * @example
 * // map :: (a -> b) -> StrMap a -> StrMap b
 * map (v => v.toUpperCase ()) ({ firstName: 'alice', city: 'berlin' })
 * // => { firstName: 'ALICE', city: 'BERLIN' }
 * map (v => v * 1.1) ({ base: 100, bonus: 50 })
 * // => { base: 110, bonus: 55 }
 */
export function map (f) {
  return (obj) => {
    const result = {}
    for (const k of Object.keys (obj)) result[k] = f (obj[k])
    return result
  }
}

/**
 * Like `map`, but the transformation function also receives the key. This lets
 * you produce values that encode information about their own field — for
 * example, annotating each config entry with its field name for debugging, or
 * building labelled audit records from a data map.
 * @example
 * // mapWithKey :: (String -> a -> b) -> StrMap a -> StrMap b
 * mapWithKey (k => v => `${k}: ${v}`) ({ host: 'localhost', port: '8080' })
 * // => { host: 'host: localhost', port: 'port: 8080' }
 * mapWithKey (k => v => ({ field: k, value: v })) ({ name: 'Alice' })
 * // => { name: { field: 'name', value: 'Alice' } }
 */
export function mapWithKey (f) {
  return (obj) => {
    const result = {}
    for (const k of Object.keys (obj)) result[k] = f (k) (obj[k])
    return result
  }
}

/**
 * Returns a new StrMap containing only the entries whose value satisfies the
 * predicate. Use it to strip unwanted or invalid fields from a config or API
 * response — for example, removing all `null` values or retaining only the
 * numeric settings.
 * @example
 * // filter :: (v -> Boolean) -> StrMap v -> StrMap v
 * filter (v => v !== null) ({ host: 'localhost', timeout: null, port: 8080 })
 * // => { host: 'localhost', port: 8080 }
 * filter (v => typeof v === 'number') ({ retries: 3, label: 'prod', timeout: 5000 })
 * // => { retries: 3, timeout: 5000 }
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
 * Like `filter`, but the predicate also receives the key — allowing decisions
 * that depend on both the field name and its value. Useful when the same value
 * is valid for some keys but not others, or when you want to exclude known
 * internal fields by name regardless of their value.
 * @example
 * // filterWithKey :: (String -> v -> Boolean) -> StrMap v -> StrMap v
 * filterWithKey (k => v => !k.startsWith ('_') && v !== null) ({ name: 'Alice', _internal: 'x', age: null })
 * // => { name: 'Alice' }
 * filterWithKey (k => v => k === 'port' || v > 0) ({ port: 0, retries: 3, timeout: -1 })
 * // => { port: 0, retries: 3 }
 */
export function filterWithKey (pred) {
  return (obj) => {
    const result = {}
    for (const k of Object.keys (obj)) {
      if (pred (k) (obj[k])) result[k] = obj[k]
    }
    return result
  }
}

/**
 * Returns a new StrMap omitting every entry whose value satisfies the
 * predicate — the complement of `filter`. Use it to strip known-bad values
 * from a map, such as removing all falsy fields before merging into a defaults
 * object, or discarding disabled feature flags.
 * @example
 * // reject :: (v -> Boolean) -> StrMap v -> StrMap v
 * reject (v => v === null || v === undefined) ({ host: 'localhost', debug: null, port: 8080 })
 * // => { host: 'localhost', port: 8080 }
 * reject (v => v === false) ({ featureA: true, featureB: false, featureC: true })
 * // => { featureA: true, featureC: true }
 */
export function reject (pred) {
  return filter ((v) => !pred (v))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Applies a map of functions to a map of values, pairing them by key. Only
 * keys present in both maps appear in the result. This enables structured,
 * field-level transformations where each field has its own dedicated function
 * — useful for validating or normalizing individual fields of a record.
 * @example
 * // ap :: StrMap (a -> b) -> StrMap a -> StrMap b
 * ap ({ score: x => x * 2, label: s => s.trim () }) ({ score: 5, label: '  hi  ', extra: 1 })
 * // => { score: 10, label: 'hi' }
 * ap ({ age: n => n + 1 }) ({ name: 'Alice', age: 30 })
 * // => { age: 31 }
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

// =============================================================================
// Alt
// =============================================================================

/**
 * Merges two StrMaps with the *left* map winning on duplicate keys — the
 * opposite of `concat`. This models a "fill in defaults" pattern: pass your
 * partially-set config as `a` and a full defaults map as `b`; the result
 * preserves all your explicit values while filling gaps from defaults.
 * @example
 * // alt :: StrMap v -> StrMap v -> StrMap v
 * alt ({ port: 9000 }) ({ host: 'localhost', port: 3000, debug: false })
 * // => { port: 9000, host: 'localhost', debug: false }
 * alt ({ theme: 'dark' }) ({ theme: 'light', lang: 'en' })
 * // => { theme: 'dark', lang: 'en' }
 */
export function alt (a) {
  return (b) => ({ ...b, ...a })
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Folds all values of the StrMap into a single accumulated result, visiting
 * entries in sorted key order. Sorted traversal guarantees a deterministic
 * result regardless of insertion order. Use it to compute aggregates like
 * totals, averages, or string summaries from a config or frequency map.
 * @example
 * // reduce :: (b -> a -> b) -> b -> StrMap a -> b
 * reduce (acc => v => acc + v) (0) ({ views: 120, clicks: 30, signups: 5 })
 * // => 155
 * reduce (acc => v => acc.concat ([v])) ([]) ({ b: 2, a: 1 })
 * // => [1, 2]
 */
export function reduce (f) {
  return (init) => (obj) =>
    sortedKeys (obj).reduce ((acc, k) => f (acc) (obj[k]), init)
}

/**
 * Folds every entry (key + value) into a single result, visiting entries in
 * sorted key order. The key is available to the accumulator so you can build
 * structured outputs — query strings, serialized representations, or an
 * inverted lookup table where values become the new keys.
 * @example
 * // foldWithKey :: (b -> String -> a -> b) -> b -> StrMap a -> b
 * foldWithKey (acc => k => v => `${acc}${k}=${v}&`) ('') ({ lang: 'en', theme: 'dark' })
 * // => 'lang=en&theme=dark&'
 * foldWithKey (acc => k => v => ({ ...acc, [v]: k })) ({}) ({ a: 'x', b: 'y' })
 * // => { x: 'a', y: 'b' }
 */
export function foldWithKey (f) {
  return (init) => (obj) =>
    sortedKeys (obj).reduce ((acc, k) => f (acc) (k) (obj[k]), init)
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Runs each value through an effectful function `f` and reassembles the
 * results into a StrMap inside the target applicative. Provide the
 * applicative's `of`, `ap`, and `map` explicitly so this function remains
 * dependency-free and works with any applicative — Array for non-determinism,
 * Maybe for partial functions, or Either for validated transformations.
 * @example
 * // traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (v -> f b) -> StrMap v -> f (StrMap b)
 * const apOf  = Array.of
 * const apAp  = ff => fa => ff.flatMap (f => fa.map (f))
 * const apMap = f => fa => fa.map (f)
 * traverse (apOf) (apAp) (apMap) (v => [v, v + 1]) ({ x: 10 })
 * // => [{ x: 10 }, { x: 11 }]
 */
export function traverse (apOf) {
  return (apAp) => (apMap) => (f) => (obj) =>
    Object.keys (obj).reduce (
      (acc, k) =>
        apAp (apMap ((o) => (v) => ({ ...o, [k]: v })) (acc)) (f (obj[k])),
      apOf ({}),
    )
}

// =============================================================================
// Accessors
// =============================================================================

/**
 * Returns an array of all own enumerable keys in insertion order. Use this
 * when you need to iterate, display, or validate the field names of a config
 * object without caring about the associated values.
 * @example
 * // keys :: StrMap a -> Array String
 * keys ({ host: 'localhost', port: 8080, debug: true })
 * // => ['host', 'port', 'debug']
 * keys ({})
 * // => []
 */
export function keys (obj) {
  return Object.keys (obj)
}

/**
 * Returns an array of all own enumerable values in insertion order, discarding
 * the keys. Useful when you only care about the data — for instance, summing
 * numeric values across a frequency map or passing all config values to a
 * validation function.
 * @example
 * // values :: StrMap a -> Array a
 * values ({ alice: 42, bob: 17, carol: 99 })
 * // => [42, 17, 99]
 * values ({ active: true, banned: false })
 * // => [true, false]
 */
export function values (obj) {
  return Object.values (obj)
}

/**
 * Returns all own enumerable entries as `[key, value]` pairs in insertion
 * order. This is the inverse of `fromPairs` and is handy for serializing a
 * map to a format that requires explicit key-value pairs, such as URL query
 * parameters or CSV rows.
 * @example
 * // pairs :: StrMap a -> Array [String, a]
 * pairs ({ name: 'Alice', role: 'admin' })
 * // => [['name', 'Alice'], ['role', 'admin']]
 * pairs ({ a: 1, b: 2, c: 3 })
 * // => [['a', 1], ['b', 2], ['c', 3]]
 */
export function pairs (obj) {
  return Object.entries (obj)
}
