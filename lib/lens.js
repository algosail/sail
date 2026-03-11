// lens.js
// Functional lenses for immutable data access and update.
//
// A Lens s a focuses on a part of type `a` inside a whole of type `s`.
// Lenses are represented as plain functions in the van Laarhoven encoding:
//
//   type Lens s a = forall f. Functor f => (a -> f a) -> s -> f s
//
// In practice we use a concrete pair of functions { get, set } and build
// the van Laarhoven form from them.  All combinators work with this pair.
//
// Lens s a = { get :: s -> a, set :: a -> s -> s }

import * as M from './maybe.js'

// =============================================================================
// Constructor
// =============================================================================

/**
 * Constructs a Van Laarhoven lens from a getter and a curried setter, producing
 * a `{ get, set }` pair that is the fundamental unit of focus in this library.
 * A lens pinpoints a single part `a` inside a whole structure `s`, letting you
 * read, replace, or transform that part without ever mutating the original.
 * Every higher-level combinator — `view`, `set`, `over`, `composeLens` — is
 * built on top of this constructor.
 * @example
 * // lens :: (s -> a) -> (a -> s -> s) -> Lens s a
 * const nameLens = lens (p => p.name) (name => p => ({ ...p, name }))
 * view (nameLens) ({ name: 'Alice', age: 30 })
 * // => 'Alice'
 * set (nameLens) ('Bob') ({ name: 'Alice', age: 30 })
 * // => { name: 'Bob', age: 30 }
 */
export function lens (get) {
  return (set) => ({ get, set })
}

// =============================================================================
// Primitive lenses
// =============================================================================

/**
 * Creates a lens that focuses on a named key of a plain object. It is the most
 * commonly used primitive lens — a typed, composable property accessor. The
 * setter returns a shallow copy of the object with only that key updated,
 * making every transform immutable and safe to use in pipelines. Compose
 * multiple `prop` lenses with `composeLens` to reach arbitrarily deep fields.
 * @example
 * // prop :: String -> Lens Object a
 * view (prop ('name')) ({ name: 'Alice', age: 30 })
 * // => 'Alice'
 * set (prop ('name')) ('Bob') ({ name: 'Alice', age: 30 })
 * // => { name: 'Bob', age: 30 }
 * over (prop ('age')) (x => x + 1) ({ name: 'Alice', age: 30 })
 * // => { name: 'Alice', age: 31 }
 */
export function prop (key) {
  return lens
    ((obj)  => obj[key])
    ((val)  => (obj)  => ({ ...obj, [key]: val }))
}

/**
 * Creates a lens that focuses on the element at position `i` in an array.
 * The getter returns `just(element)` when `i` is in bounds and `nothing()`
 * otherwise, making out-of-bounds access safe without throwing exceptions.
 * The setter splices in the replacement value immutably, leaving the original
 * array unchanged when the index is out of range.
 * @example
 * // index :: Integer -> Lens (Array a) (Maybe a)
 * view (index (1)) ([10, 20, 30])
 * // => just(20)
 * view (index (9)) ([10, 20, 30])
 * // => nothing()
 * set (index (0)) (99) ([10, 20, 30])
 * // => [99, 20, 30]
 */
export function index (i) {
  return lens
    ((arr)  => i >= 0 && i < arr.length ? M.just (arr[i]) : M.nothing ())
    ((val)  => (arr)  => {
      const idx = i < 0 ? arr.length + i : i
      if (idx < 0 || idx >= arr.length) return arr
      const copy = arr.slice ()
      copy[idx] = val
      return copy
    })
}

// =============================================================================
// Core operations
// =============================================================================

/**
 * Extracts the value that a lens focuses on from a given structure. It is the
 * read half of the lens interface — the direct counterpart to `set` and `over`.
 * In an FP pipeline, `view` is typically the terminal step that observes a
 * deeply nested value after a chain of `composeLens` calls, without any copying
 * or allocation.
 * @example
 * // view :: Lens s a -> s -> a
 * view (prop ('score')) ({ player: 'Ada', score: 95 })
 * // => 95
 * const cityLens = composeLens (prop ('address')) (prop ('city'))
 * view (cityLens) ({ address: { city: 'Oslo', zip: '0150' } })
 * // => 'Oslo'
 */
export function view (l) {
  return (s) => l.get (s)
}

/**
 * Replaces the focused value inside a structure, returning a new structure
 * with all other parts untouched. Because lenses are composable, `set` works
 * equally well on a top-level key or on a deeply nested field produced by
 * `composeLens`. It is the write half of the read/write lens pair and the
 * simplest way to perform an immutable point update.
 * @example
 * // set :: Lens s a -> a -> s -> s
 * set (prop ('active')) (true) ({ name: 'Alice', active: false })
 * // => { name: 'Alice', active: true }
 * const cityLens = composeLens (prop ('address')) (prop ('city'))
 * set (cityLens) ('Bergen') ({ address: { city: 'Oslo' } })
 * // => { address: { city: 'Bergen' } }
 */
export function set (l) {
  return (val) => (s) => l.set (val) (s)
}

/**
 * Applies a transformation function to the focused value and writes the result
 * back into the structure immutably. It is the most expressive of the core
 * operations because it combines a read and a write in a single pass, making
 * it ideal for incrementing counters, normalising strings, or mapping over
 * nested fields in an FP pipeline.
 * @example
 * // over :: Lens s a -> (a -> a) -> s -> s
 * over (prop ('score')) (x => x + 10) ({ player: 'Ada', score: 85 })
 * // => { player: 'Ada', score: 95 }
 * over (prop ('username')) (s => s.toLowerCase ()) ({ username: 'ALICE' })
 * // => { username: 'alice' }
 * const countLens = composeLens (prop ('cart')) (prop ('count'))
 * over (countLens) (n => n + 1) ({ cart: { count: 2 } })
 * // => { cart: { count: 3 } }
 */
export function over (l) {
  return (f) => (s) => l.set (f (l.get (s))) (s)
}

// =============================================================================
// Composition
// =============================================================================

/**
 * Composes two lenses left-to-right so the combined lens reaches from the
 * outer structure `s` all the way down to the inner field `b`. This is the
 * primary power of the lens abstraction — arbitrarily deep nested access and
 * update become a single, composable unit without writing bespoke accessor
 * functions. Pass the resulting lens to `view`, `set`, or `over` exactly like
 * any primitive lens.
 * @example
 * // composeLens :: Lens s a -> Lens a b -> Lens s b
 * const cityLens = composeLens (prop ('address')) (prop ('city'))
 * view (cityLens) ({ address: { city: 'Oslo' } })
 * // => 'Oslo'
 * set (cityLens) ('Bergen') ({ address: { city: 'Oslo' } })
 * // => { address: { city: 'Bergen' } }
 * over (cityLens) (s => s.toUpperCase ()) ({ address: { city: 'Oslo' } })
 * // => { address: { city: 'OSLO' } }
 */
export function composeLens (outer) {
  return (inner) => lens
    ((s)   => inner.get (outer.get (s)))
    ((val) => (s)   => outer.set (inner.set (val) (outer.get (s))) (s))
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Applies a function to the focused value and returns both the result and
 * the updated structure as a pair [result, newStructure].
 * Useful when the transform function produces a value you want to inspect.
 * @example
 * // overWithResult :: Lens s a -> (a -> [b, a]) -> s -> [b, s]
 * overWithResult (prop ('n')) (x => [x * 2, x + 1]) ({ n: 5 })
 * // => [10, { n: 6 }]
 */
export function overWithResult (l) {
  return (f) => (s) => {
    const [result, newVal] = f (l.get (s))
    return [result, l.set (newVal) (s)]
  }
}

/**
 * Conditionally applies a transformation: modifies the focused value only when
 * the predicate returns `true`, leaving the structure entirely unchanged
 * otherwise. This eliminates explicit `if/else` branches in pipelines and keeps
 * business rules like "only update adults" or "cap a value at a limit"
 * expressible as a single point-free step.
 * @example
 * // overWhen :: Lens s a -> (a -> Boolean) -> (a -> a) -> s -> s
 * overWhen (prop ('age')) (x => x >= 18) (x => x + 1) ({ name: 'Ada', age: 20 })
 * // => { name: 'Ada', age: 21 }
 * overWhen (prop ('age')) (x => x >= 18) (x => x + 1) ({ name: 'Kid', age: 10 })
 * // => { name: 'Kid', age: 10 }
 */
export function overWhen (l) {
  return (pred) => (f) => (s) => {
    const a = l.get (s)
    return pred (a) ? l.set (f (a)) (s) : s
  }
}

/**
 * Applies a lens to each element of an array, collecting the focused value
 * from every element into a new array. It is essentially `Array.map` lifted
 * into lens notation, making it easy to pluck the same field from a collection
 * of records — a common pattern when transforming API responses or building
 * derived arrays in a pipeline.
 * @example
 * // toListOf :: Lens s a -> Array s -> Array a
 * toListOf (prop ('name')) ([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }])
 * // => ['Alice', 'Bob']
 * toListOf (prop ('score')) ([{ player: 'Ada', score: 95 }, { player: 'Zed', score: 70 }])
 * // => [95, 70]
 */
export function toListOf (l) {
  return (ss) => ss.map (l.get)
}
