// lens.js – Functional lenses for immutable data access and update.
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
 * Constructs a Lens from a getter and a curried setter.
 * @example
 * // lens :: (s -> a) -> (a -> s -> s) -> Lens s a
 * const nameLens = lens (p => p.name) (v => p => ({ ...p, name: v }))
 * view (nameLens) ({ name: 'Alice', age: 30 }) // => 'Alice'
 */
export function lens (get) {
  return (set) => ({ get, set })
}

// =============================================================================
// Primitive lenses
// =============================================================================

/**
 * Focuses on the value at a given key in a plain object.
 * `set` returns a shallow copy with the key updated.
 * @example
 * // prop :: String -> Lens Object a
 * view (prop ('name')) ({ name: 'Alice' }) // => 'Alice'
 * over (prop ('age')) (x => x + 1) ({ name: 'Alice', age: 30 }) // => { name: 'Alice', age: 31 }
 */
export function prop (key) {
  return lens
    ((obj)  => obj[key])
    ((val)  => (obj)  => ({ ...obj, [key]: val }))
}

/**
 * Focuses on the element at a given array index.
 * `get` returns Just(element) when in bounds, Nothing otherwise.
 * `set` returns the array with the element replaced, or the original array
 * if the index is out of bounds.
 * @example
 * // index :: Integer -> Lens (Array a) (Maybe a)
 * view (index (1)) ([10, 20, 30]) // => just(20)
 * view (index (9)) ([10, 20, 30]) // => nothing()
 * over (index (1)) (M.map (x => x * 2)) ([10, 20, 30]) // => [10, 40, 30]
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
 * Reads the focused value out of a structure.
 * @example
 * // view :: Lens s a -> s -> a
 * view (prop ('x')) ({ x: 42 }) // => 42
 */
export function view (l) {
  return (s) => l.get (s)
}

/**
 * Replaces the focused value in a structure.
 * @example
 * // set :: Lens s a -> a -> s -> s
 * set (prop ('x')) (99) ({ x: 42, y: 1 }) // => { x: 99, y: 1 }
 */
export function set (l) {
  return (val) => (s) => l.set (val) (s)
}

/**
 * Applies a function to the focused value, returning an updated structure.
 * @example
 * // over :: Lens s a -> (a -> a) -> s -> s
 * over (prop ('x')) (x => x + 1) ({ x: 42 }) // => { x: 43 }
 */
export function over (l) {
  return (f) => (s) => l.set (f (l.get (s))) (s)
}

// =============================================================================
// Composition
// =============================================================================

/**
 * Composes two lenses left-to-right: the first lens focuses on a part of `s`,
 * the second focuses on a part of that part.
 *
 * compose (prop ('address')) (prop ('city'))
 * focuses on the `city` field inside the `address` field of a structure.
 *
 * @example
 * // composeLens :: Lens s a -> Lens a b -> Lens s b
 * const cityLens = composeLens (prop ('address')) (prop ('city'))
 * view (cityLens) ({ address: { city: 'Oslo' } })           // => 'Oslo'
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
 * Modifies the focused value only when the predicate holds.
 * Returns the structure unchanged if the predicate fails.
 * @example
 * // overWhen :: Lens s a -> (a -> Boolean) -> (a -> a) -> s -> s
 * overWhen (prop ('age')) (x => x >= 18) (x => x + 1) ({ age: 20 }) // => { age: 21 }
 * overWhen (prop ('age')) (x => x >= 18) (x => x + 1) ({ age: 10 }) // => { age: 10 }
 */
export function overWhen (l) {
  return (pred) => (f) => (s) => {
    const a = l.get (s)
    return pred (a) ? l.set (f (a)) (s) : s
  }
}

/**
 * Collects the focused value from each element of an array.
 * @example
 * // toListOf :: Lens s a -> Array s -> Array a
 * toListOf (prop ('name')) ([{ name: 'Alice' }, { name: 'Bob' }])
 * // => ['Alice', 'Bob']
 */
export function toListOf (l) {
  return (ss) => ss.map (l.get)
}
