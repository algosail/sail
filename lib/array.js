// array.js
// Array utilities: constructors, folds, and transformers.

import * as M from './maybe.js'
import { lt as ordLT, eq as ordEQ, gt as ordGT, toComparator } from './ordering.js'
import { pair } from './pair.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Lifts a single value into a singleton array — the Applicative `pure`/`return`
 * for Array. Used by `traverse`, `mapM`, and other Applicative/Monad combinators
 * whenever a plain value needs to be promoted into the Array context.
 * Combine with `chain` or `ap` to build larger array computations.
 * @example
 * // of :: a -> Array a
 * of ('Alice')
 * // => ['Alice']
 * of (42)
 * // => [42]
 */
export function of (a) {
  return [a]
}

/**
 * Returns a new empty array — the Monoid identity element for Array.
 * Because `concat (empty ()) (xs)` and `concat (xs) (empty ())` both equal `xs`,
 * `empty` is the safe neutral starting point for any accumulation.
 * Use it wherever an "initial value" of type `Array a` is needed.
 * @example
 * // empty :: () -> Array a
 * empty ()
 * // => []
 */
export function empty () {
  return []
}

/**
 * Generates the half-open integer interval `[from, to)` — every integer `n`
 * satisfying `from <= n < to`. The exclusive upper bound matches Python's
 * `range` convention and guarantees `range (0) (n).length === n`, making it
 * easy to produce index arrays. Returns `[]` when `from >= to`.
 * @example
 * // range :: Integer -> Integer -> Array Integer
 * range (0) (5)
 * // => [0, 1, 2, 3, 4]
 * range (2) (6)
 * // => [2, 3, 4, 5]
 * range (5) (5)
 * // => []
 */
export function range (from) {
  return (to) => {
    const result = []
    for (let n = from; n < to; n++) result.push (n)
    return result
  }
}

/**
 * The anamorphism (unfold) for Array — builds a list from a seed by repeatedly
 * applying `f` until it returns `Nothing`. This is the dual of `reduce`:
 * where `reduce` collapses a list to a value, `unfold` expands a value into a
 * list. Use it to generate number sequences, lazy pagination results, countdown
 * timers, or any corecursive structure without writing an explicit loop.
 * @example
 * // unfold :: (b -> Maybe [a, b]) -> b -> Array a
 * unfold (n => n <= 0 ? M.nothing () : M.just ([n, n - 1])) (4)
 * // => [4, 3, 2, 1]
 * unfold (n => n > 5 ? M.nothing () : M.just ([n * n, n + 1])) (1)
 * // => [1, 4, 9, 16, 25]
 */
export function unfold (f) {
  return (seed) => {
    const result = []
    let s = seed
    while (true) {
      const m = f (s)
      if (M.isNothing (m)) return result
      result.push (m.value[0])
      s = m.value[1]
    }
  }
}

/**
 * Stack-safe recursive array expansion via a trampoline. Unlike a naive
 * recursive `chain`, `chainRec` never grows the JS call stack, making it
 * safe for deep graph traversals or large tree enumerations. The step
 * function receives `next` (enqueue a seed for further expansion) and `done`
 * (emit a result value), and returns an array of steps so one seed can fan
 * out into many continuations in a single step.
 * @example
 * // chainRec :: ((a -> Step, b -> Step, a) -> Array Step) -> a -> Array b
 * chainRec ((next, done, x) => x <= 0 ? [done (x)] : [next (x - 1), next (x - 1)]) (2)
 * // => [0, 0, 0, 0]
 */
export function chainRec (f) {
  return (seed) => {
    const next  = (value) => ({ done: false, value })
    const done  = (value) => ({ done: true,  value })
    const result = []
    let todo = [seed]
    while (todo.length > 0) {
      const pending = []
      for (const step of f (next, done, todo.shift ())) {
        if (step.done) result.push (step.value)
        else pending.push (step.value)
      }
      todo = pending.concat (todo)
    }
    return result
  }
}

// =============================================================================
// Eq / Ord
// =============================================================================

/**
 * Element-wise equality using a curried comparator. Two arrays are equal when
 * they have the same length and every pair of corresponding elements satisfies
 * the comparator. The comparator can encode any domain equality — case-
 * insensitive string comparison, numeric tolerance, or structural equality.
 * @example
 * // equals :: (a -> a -> Boolean) -> Array a -> Array a -> Boolean
 * equals (a => b => a === b) (['alice', 'bob']) (['alice', 'bob'])
 * // => true
 * equals (a => b => a === b) (['alice', 'bob']) (['alice', 'eve'])
 * // => false
 * equals (a => b => a === b) ([1, 2]) ([1, 2, 3])
 * // => false
 */
export function equals (eq) {
  return (a) => (b) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!eq (a[i]) (b[i])) return false
    }
    return true
  }
}

/**
 * Lexicographic less-than-or-equal comparison for arrays using a curried
 * element comparator. Compares element by element left-to-right; the first
 * differing position determines the result. A strict prefix is always `lte`
 * its extension. Useful for sorting multi-key records or checking ordering
 * without constructing a dedicated comparator.
 * @example
 * // lte :: (a -> a -> Boolean) -> Array a -> Array a -> Boolean
 * lte (a => b => a <= b) ([1, 2, 3]) ([1, 2, 4])
 * // => true
 * lte (a => b => a <= b) ([1, 3]) ([1, 2])
 * // => false
 * lte (a => b => a <= b) ([1, 2]) ([1, 2, 0])
 * // => true
 */
export function lte (lteElem) {
  return (a) => (b) => {
    for (let i = 0; i < a.length; i++) {
      if (i >= b.length) return false
      const aLteB = lteElem (a[i]) (b[i])
      const bLteA = lteElem (b[i]) (a[i])
      if (!(aLteB && bLteA)) return aLteB
    }
    return true
  }
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns `true` when `index` is negative or greater than or equal to the
 * array's length. Use it as a guard before unsafe index access, or pair it
 * with `lookup`, which already calls it internally to produce a safe `Maybe`.
 * @example
 * // isOutOfBounds :: Integer -> Array a -> Boolean
 * isOutOfBounds (3) ([1, 2, 3])
 * // => true
 * isOutOfBounds (2) ([1, 2, 3])
 * // => false
 * isOutOfBounds (-1) ([1, 2, 3])
 * // => true
 */
export function isOutOfBounds (index) {
  return (a) => index < 0 || index >= a.length
}

/**
 * Returns the number of elements in the array. A thin curried wrapper around
 * `arr.length` that can be passed to higher-order combinators such as `map`
 * or used in point-free style where a plain property access would not compose.
 * @example
 * // size :: Array a -> Integer
 * size (['alice', 'bob', 'carol'])
 * // => 3
 * size ([])
 * // => 0
 */
export function size (arr) {
  return arr.length
}

/**
 * Returns `true` when every element of the array satisfies the predicate.
 * Short-circuits on the first failing element. Useful for validating inputs
 * or checking invariants across a whole collection before processing it.
 * @example
 * // all :: (a -> Boolean) -> Array a -> Boolean
 * all (x => x > 0) ([1, 5, 12])
 * // => true
 * all (x => x > 0) ([1, -3, 5])
 * // => false
 * all (x => typeof x === 'string') (['hello', 'world'])
 * // => true
 */
export function all (pred) {
  return (arr) => arr.every (pred)
}

/**
 * Returns `true` when at least one element satisfies the predicate.
 * Short-circuits as soon as a matching element is found. The existential
 * counterpart to `all`; together they cover universal and existential
 * quantification over arrays.
 * @example
 * // any :: (a -> Boolean) -> Array a -> Boolean
 * any (x => x > 10) ([3, 7, 15])
 * // => true
 * any (x => x < 0) ([1, 2, 3])
 * // => false
 */
export function any (pred) {
  return (arr) => arr.some (pred)
}

/**
 * Returns `true` when no element satisfies the predicate. Equivalent to
 * `!any (pred) (arr)` but reads more naturally in validation contexts, e.g.
 * "none of the prices are negative". Pair with `all` and `any` to express
 * rich constraints over collections.
 * @example
 * // none :: (a -> Boolean) -> Array a -> Boolean
 * none (x => x < 0) ([3, 7, 12])
 * // => true
 * none (x => x > 5) ([1, 3, 7])
 * // => false
 */
export function none (pred) {
  return (arr) => !arr.some (pred)
}

/**
 * Tests whether `x` is a member of `arr` using a curried equality function.
 * Passing a custom comparator makes it easy to check membership by a specific
 * field, e.g. whether a user name exists in a list. Equivalent to
 * `any (eq (x)) (arr)`.
 * @example
 * // elem :: (a -> a -> Boolean) -> a -> Array a -> Boolean
 * elem (a => b => a === b) ('bob') (['alice', 'bob', 'carol'])
 * // => true
 * elem (a => b => a === b) ('dave') (['alice', 'bob', 'carol'])
 * // => false
 */
export function elem (eq) {
  return (x) => (arr) => arr.some ((a) => eq (a) (x))
}

// =============================================================================
// Accessors
// =============================================================================

/**
 * The catamorphism for Array — deconstructs an array into two cases: the
 * empty array returns `empty_`, and a non-empty array calls `nonEmpty` with
 * the head and tail. This is the safest way to pattern-match on an array's
 * shape in a functional pipeline, guaranteeing exhaustive handling of both
 * cases without unchecked index access.
 * @example
 * // array :: b -> (a -> Array a -> b) -> Array a -> b
 * array ('none') (h => _ => h) (['alice', 'bob', 'carol'])
 * // => 'alice'
 * array ('none') (h => _ => h) ([])
 * // => 'none'
 * array (0) (h => t => h + t.length) ([10, 20, 30])
 * // => 12
 */
export function array (empty_) {
  return (nonEmpty) => (arr) =>
    arr.length === 0 ? empty_ : nonEmpty (arr[0]) (arr.slice (1))
}

/**
 * Safe index access that returns `Just` the element at `index`, or `Nothing`
 * when the index is out of bounds. Eliminates the risk of returning `undefined`
 * from an out-of-range access and forces callers to handle the missing case
 * explicitly. Pair with `M.map` or `M.chain` to transform the result in a
 * pipeline, or `M.withDefault` to supply a fallback.
 * @example
 * // lookup :: Integer -> Array a -> Maybe a
 * lookup (1) (['alice', 'bob', 'carol'])
 * // => just('bob')
 * lookup (0) ([99.99])
 * // => just(99.99)
 * lookup (5) (['alice', 'bob'])
 * // => nothing()
 */
export function lookup (index) {
  return (a) => isOutOfBounds (index) (a) ? M.nothing () : M.just (a[index])
}

/**
 * Safe access to the first element, returning `Just a` for a non-empty array
 * or `Nothing` for an empty one. Avoids the `undefined` pitfall of `arr[0]`
 * and forces handling the empty case. In a pipeline, chain the result with
 * `M.map` to transform it, or use `M.withDefault` to supply a fallback value.
 * @example
 * // head :: Array a -> Maybe a
 * head (['alice', 'bob', 'carol'])
 * // => just('alice')
 * head ([42])
 * // => just(42)
 * head ([])
 * // => nothing()
 */
export function head (arr) {
  return arr.length > 0 ? M.just (arr[0]) : M.nothing ()
}

/**
 * Safe access to the last element, returning `Just a` for a non-empty array
 * or `Nothing` for an empty one. The symmetric counterpart to `head`; both
 * avoid the `undefined` pitfall of unchecked index access on an empty array.
 * Use `M.withDefault` to provide a fallback in case the array is empty.
 * @example
 * // last :: Array a -> Maybe a
 * last ([10, 20, 30])
 * // => just(30)
 * last (['only'])
 * // => just('only')
 * last ([])
 * // => nothing()
 */
export function last (arr) {
  return arr.length > 0 ? M.just (arr[arr.length - 1]) : M.nothing ()
}

/**
 * Safe access to all elements after the first, returning `Just (Array a)` for
 * a non-empty array or `Nothing` for an empty one. Useful for recursive list
 * processing where the empty case must be handled explicitly. Pair with `head`
 * to safely destructure the first element and the rest of the list.
 * @example
 * // tail :: Array a -> Maybe (Array a)
 * tail ([1, 2, 3])
 * // => just([2, 3])
 * tail (['only'])
 * // => just([])
 * tail ([])
 * // => nothing()
 */
export function tail (arr) {
  return arr.length > 0 ? M.just (arr.slice (1)) : M.nothing ()
}

/**
 * Safe access to all elements except the last, returning `Just (Array a)` for
 * a non-empty array or `Nothing` for an empty one. The symmetric counterpart
 * to `tail`; together they let you walk a list from either end without ever
 * producing `undefined`. Use in pipelines that need to strip a trailing element.
 * @example
 * // init :: Array a -> Maybe (Array a)
 * init ([1, 2, 3])
 * // => just([1, 2])
 * init (['only'])
 * // => just([])
 * init ([])
 * // => nothing()
 */
export function init (arr) {
  return arr.length > 0 ? M.just (arr.slice (0, -1)) : M.nothing ()
}

/**
 * Returns `Just` the first element satisfying the predicate, or `Nothing` if
 * no element matches. Safer than native `Array.prototype.find`, which returns
 * `undefined` on failure. Pair with `M.map` to transform the found value, or
 * `M.withDefault` to supply a fallback.
 * @example
 * // find :: (a -> Boolean) -> Array a -> Maybe a
 * find (u => u.role === 'admin') ([{ name: 'alice', role: 'user' }, { name: 'bob', role: 'admin' }])
 * // => just({ name: 'bob', role: 'admin' })
 * find (x => x > 100) ([1, 2, 3])
 * // => nothing()
 */
export function find (pred) {
  return (arr) => {
    for (const x of arr) if (pred (x)) return M.just (x)
    return M.nothing ()
  }
}

/**
 * Finds the first element for which `f` returns `Just`, and returns that
 * wrapped value. Combines a search and a transformation in a single pass,
 * avoiding redundant iterations. More efficient than mapping and then finding
 * when the transformation itself is the membership test.
 * @example
 * // findMap :: (a -> Maybe b) -> Array a -> Maybe b
 * findMap (x => x > 0 ? M.just (x * 10) : M.nothing ()) ([-2, -1, 3, 5])
 * // => just(30)
 * findMap (x => x > 100 ? M.just (x) : M.nothing ()) ([1, 2, 3])
 * // => nothing()
 */
export function findMap (f) {
  return (arr) => {
    for (const x of arr) {
      const r = f (x)
      if (M.isJust (r)) return r
    }
    return M.nothing ()
  }
}

// =============================================================================
// Folds
// =============================================================================

/**
 * Left fold over an array with a curried binary accumulator function.
 * The foundational building block for most aggregation: summing prices,
 * merging objects into a map, or building strings. Processes elements
 * left-to-right; pair with `scanl` when you also need the intermediate
 * accumulators, not just the final result.
 * @example
 * // reduce :: (b -> a -> b) -> b -> Array a -> b
 * reduce (acc => x => acc + x) (0) ([12.5, 7.0, 3.5])
 * // => 23
 * reduce (acc => item => ({ ...acc, [item.id]: item.value })) ({}) ([{ id: 'a', value: 1 }, { id: 'b', value: 2 }])
 * // => { a: 1, b: 2 }
 */
export function reduce (f) {
  return (init) => (arr) =>
    arr.reduce ((acc, x) => f (acc) (x), init)
}

/**
 * Left scan — like `reduce` but returns an array containing the initial value
 * followed by every intermediate accumulator. Use it for running totals,
 * progress indicators, or undo stacks where the full history of an
 * accumulation matters. The output length is always `arr.length + 1`.
 * @example
 * // scanl :: (b -> a -> b) -> b -> Array a -> Array b
 * scanl (acc => x => acc + x) (0) ([10, 20, 30])
 * // => [0, 10, 30, 60]
 * scanl (acc => x => acc * x) (1) ([2, 3, 4])
 * // => [1, 2, 6, 24]
 */
export function scanl (f) {
  return (init) => (arr) => {
    const result = [init]
    let acc = init
    for (const x of arr) {
      acc = f (acc) (x)
      result.push (acc)
    }
    return result
  }
}

/**
 * Maps each element to a monoidal value and concatenates them using the
 * supplied `concat` and `empty` (identity). This is the standard Foldable
 * `foldMap` operation; choosing different monoids (sum, string, array) gives
 * different aggregation behaviours through a uniform interface.
 * @example
 * // foldMap :: (b -> b -> b) -> b -> (a -> b) -> Array a -> b
 * foldMap (a => b => a + b) (0) (x => x * 2) ([5, 10, 15])
 * // => 60
 * foldMap (a => b => a + b) ('') (s => s.toUpperCase ()) (['hello', ' ', 'world'])
 * // => 'HELLO WORLD'
 */
export function foldMap (concat) {
  return (empty) => (f) => (arr) =>
    arr.reduce ((acc, x) => concat (acc) (f (x)), empty)
}

/**
 * Joins an array of strings into a single string, inserting `sep` between
 * every adjacent pair. A thin curried wrapper around `Array.prototype.join`
 * that fits naturally into point-free pipelines. Returns an empty string for
 * an empty array regardless of the separator.
 * @example
 * // joinWith :: String -> Array String -> String
 * joinWith (', ') (['alice', 'bob', 'carol'])
 * // => 'alice, bob, carol'
 * joinWith ('/') (['home', 'user', 'docs'])
 * // => 'home/user/docs'
 * joinWith (',') ([])
 * // => ''
 */
export function joinWith (sep) {
  return (arr) => arr.join (sep)
}

// =============================================================================
// Transformers
// =============================================================================

/**
 * Concatenates two arrays, returning a new array with elements of `a` followed
 * by elements of `b`. This is the Semigroup/Monoid `append` operation for
 * Array; pair it with `empty` to get the full Monoid. Useful for building up
 * arrays incrementally in a pipeline or `reduce`.
 * @example
 * // concat :: Array a -> Array a -> Array a
 * concat (['alice', 'bob']) (['carol', 'dave'])
 * // => ['alice', 'bob', 'carol', 'dave']
 * concat ([1, 2]) ([])
 * // => [1, 2]
 */
export function concat (a) {
  return (b) => a.concat (b)
}

/**
 * Appends a single element to the end of an array, returning a new array
 * without mutating the original. Use in a `reduce` accumulator when building
 * up a list one element at a time, or as the curried equivalent of
 * `arr.concat ([x])`.
 * @example
 * // append :: a -> Array a -> Array a
 * append ('dave') (['alice', 'bob', 'carol'])
 * // => ['alice', 'bob', 'carol', 'dave']
 * append (0) ([1, 2, 3])
 * // => [1, 2, 3, 0]
 */
export function append (x) {
  return (arr) => arr.concat ([x])
}

/**
 * Prepends a single element to the front of an array, returning a new array
 * without mutating the original. The symmetric counterpart to `append`; use it
 * to cons-up lists in head-first order, or as the stack-push operation in a
 * purely-functional style.
 * @example
 * // prepend :: a -> Array a -> Array a
 * prepend ('alice') (['bob', 'carol'])
 * // => ['alice', 'bob', 'carol']
 * prepend (0) ([1, 2, 3])
 * // => [0, 1, 2, 3]
 */
export function prepend (x) {
  return (arr) => [x].concat (arr)
}

/**
 * The Functor instance for Array — applies `f` to every element, returning a
 * new array of the same length. This is the primary way to transform array
 * contents while preserving structure. Compose with `filter` and `chain` to
 * build expressive data pipelines over collections of domain objects.
 * @example
 * // map :: (a -> b) -> Array a -> Array b
 * map (u => u.name) ([{ name: 'alice', age: 30 }, { name: 'bob', age: 25 }])
 * // => ['alice', 'bob']
 * map (price => price * 1.2) ([9.99, 19.99, 4.99])
 * // => [11.988, 23.988, 5.988]
 */
export function map (f) {
  return (arr) => arr.map (f)
}

/**
 * Keeps only the elements that satisfy the predicate, preserving order.
 * The complement `reject` removes matching elements instead. Use `partition`
 * when you need both the passing and failing subsets in a single pass over
 * the array.
 * @example
 * // filter :: (a -> Boolean) -> Array a -> Array a
 * filter (u => u.active) ([{ name: 'alice', active: true }, { name: 'bob', active: false }])
 * // => [{ name: 'alice', active: true }]
 * filter (x => x > 0) ([-3, 1, -1, 2])
 * // => [1, 2]
 */
export function filter (pred) {
  return (arr) => arr.filter (pred)
}

/**
 * Removes every element that satisfies the predicate, keeping the rest.
 * The exact complement of `filter`: `reject (pred) (arr)` is equivalent to
 * `filter (x => !pred (x)) (arr)`. Use `partition` when you need both the
 * passing and failing subsets simultaneously.
 * @example
 * // reject :: (a -> Boolean) -> Array a -> Array a
 * reject (u => u.banned) ([{ name: 'alice', banned: false }, { name: 'mallory', banned: true }])
 * // => [{ name: 'alice', banned: false }]
 * reject (x => x % 2 === 0) ([1, 2, 3, 4, 5])
 * // => [1, 3, 5]
 */
export function reject (pred) {
  return (arr) => arr.filter ((x) => !pred (x))
}

/**
 * Splits an array into a pair `[passing, failing]` based on a predicate in a
 * single pass. More efficient than calling `filter` and `reject` separately
 * when both subsets are needed — for example, separating valid orders from
 * invalid ones before processing each group differently.
 * @example
 * // partition :: (a -> Boolean) -> Array a -> [Array a, Array a]
 * partition (x => x > 0) ([-2, 3, -1, 4, 0])
 * // => [[3, 4], [-2, -1, 0]]
 * partition (u => u.role === 'admin') ([{ name: 'alice', role: 'admin' }, { name: 'bob', role: 'user' }])
 * // => [[{ name: 'alice', role: 'admin' }], [{ name: 'bob', role: 'user' }]]
 */
export function partition (pred) {
  return (arr) => {
    const yes = []
    const no  = []
    for (const x of arr) (pred (x) ? yes : no).push (x)
    return pair (yes) (no)
  }
}

/**
 * Monadic bind (flatMap) for Array — maps `f` over each element and
 * concatenates the resulting arrays. Solves the 1-to-many expansion problem:
 * each input produces zero or more outputs. Return `[]` for unwanted elements
 * to combine filtering and transformation in a single pass. Chain multiple
 * `chain` calls to compose multi-step expansions.
 * @example
 * // chain :: (a -> Array b) -> Array a -> Array b
 * chain (tag => ['#' + tag, tag.toUpperCase ()]) (['js', 'fp'])
 * // => ['#js', 'JS', '#fp', 'FP']
 * chain (x => x > 0 ? [x] : []) ([-1, 2, -3, 4])
 * // => [2, 4]
 */
export function chain (f) {
  return (arr) => arr.flatMap (f)
}

/**
 * Flattens exactly one level of array nesting. Equivalent to `chain (x => x)`
 * or `Array.prototype.flat (1)`. Use when `map` has produced an
 * `Array (Array a)` and you want to collapse it. For deeper nesting, apply
 * `flatten` multiple times or use `chain` recursively.
 * @example
 * // flatten :: Array (Array a) -> Array a
 * flatten ([[1, 2], [3], [4, 5]])
 * // => [1, 2, 3, 4, 5]
 * flatten ([['alice', 'bob'], [], ['carol']])
 * // => ['alice', 'bob', 'carol']
 */
export function flatten (arr) {
  return arr.flat (1)
}

/**
 * Applies an array of functions to an array of values, collecting every
 * (function, value) pair — the Applicative instance for Array. The result is
 * the Cartesian product with `fns.length * arr.length` elements. Useful for
 * generating all combinations of options, e.g. every size × colour variant
 * of a product.
 * @example
 * // ap :: Array (a -> b) -> Array a -> Array b
 * ap ([x => x + 1, x => x * 10]) ([5, 20])
 * // => [6, 21, 50, 200]
 * ap ([s => 'small ' + s, s => 'large ' + s]) (['red', 'blue'])
 * // => ['small red', 'small blue', 'large red', 'large blue']
 */
export function ap (fns) {
  return (arr) => fns.flatMap ((f) => arr.map (f))
}

/**
 * Returns a new array with elements in reversed order without mutating the
 * original. Safe to use in pipelines where immutability matters, unlike
 * `Array.prototype.reverse` which sorts in place.
 * @example
 * // reverse :: Array a -> Array a
 * reverse ([1, 2, 3, 4, 5])
 * // => [5, 4, 3, 2, 1]
 * reverse (['alice', 'bob', 'carol'])
 * // => ['carol', 'bob', 'alice']
 */
export function reverse (arr) {
  return [...arr].reverse ()
}

/**
 * Stable sort using a curried `lte` (≤) comparator. Elements with equal keys
 * preserve their original relative order. Pass a plain `a => b => a <= b` for
 * natural ordering, or use `toComparator` from `ordering.js` to convert an
 * `Ordering`-returning comparison function.
 * @example
 * // sort :: (a -> a -> Boolean) -> Array a -> Array a
 * sort (a => b => a <= b) ([30, 10, 20])
 * // => [10, 20, 30]
 * sort (a => b => a >= b) ([30, 10, 20])
 * // => [30, 20, 10]
 */
export function sort (lteElem) {
  return (arr) => {
    const cmp = (a) => (b) => {
      const ab = lteElem (a) (b)
      const ba = lteElem (b) (a)
      if (ab && ba) return ordEQ
      return ab ? ordLT : ordGT
    }
    const indexed = arr.map ((x, i) => [x, i])
    indexed.sort (([a, i], [b, j]) => {
      const r = toComparator (cmp) (a, b)
      return r === 0 ? i - j : r
    })
    return indexed.map (([x]) => x)
  }
}

/**
 * Stable sort on a projected key using a curried `lte` comparator. Avoids
 * manually extracting the key inside a comparator; supply the key extractor
 * as `toKey`. Very practical for sorting arrays of objects by a specific
 * field, e.g. sorting products by price or users by name.
 * @example
 * // sortBy :: (b -> b -> Boolean) -> (a -> b) -> Array a -> Array a
 * sortBy (a => b => a <= b) (p => p.price) ([{ name: 'widget', price: 9.99 }, { name: 'gadget', price: 4.99 }])
 * // => [{ name: 'gadget', price: 4.99 }, { name: 'widget', price: 9.99 }]
 * sortBy (a => b => a <= b) (u => u.name) ([{ name: 'carol' }, { name: 'alice' }, { name: 'bob' }])
 * // => [{ name: 'alice' }, { name: 'bob' }, { name: 'carol' }]
 */
export function sortBy (lteKey) {
  return (toKey) => (arr) => {
    const cmp = (a) => (b) => {
      const ka = toKey (a)
      const kb = toKey (b)
      const ab = lteKey (ka) (kb)
      const ba = lteKey (kb) (ka)
      if (ab && ba) return ordEQ
      return ab ? ordLT : ordGT
    }
    const indexed = arr.map ((x, i) => [x, i])
    indexed.sort (([a, i], [b, j]) => {
      const r = toComparator (cmp) (a, b)
      return r === 0 ? i - j : r
    })
    return indexed.map (([x]) => x)
  }
}

/**
 * Deduplicates an array by removing later occurrences of elements already
 * seen, keeping the first. Uses a curried equality function so it works for
 * any type: primitives with `===`, objects compared by a specific field, or
 * custom domain equality. The order of the remaining elements is preserved.
 * @example
 * // nub :: (a -> a -> Boolean) -> Array a -> Array a
 * nub (a => b => a === b) (['alice', 'bob', 'alice', 'carol', 'bob'])
 * // => ['alice', 'bob', 'carol']
 * nub (a => b => a.id === b.id) ([{ id: 1, v: 'a' }, { id: 2, v: 'b' }, { id: 1, v: 'c' }])
 * // => [{ id: 1, v: 'a' }, { id: 2, v: 'b' }]
 */
export function nub (eq) {
  return (arr) => arr.filter ((x, i) =>
    arr.findIndex ((y) => eq (x) (y)) === i,
  )
}

/**
 * Comonad `extend` for Array — applies `f` to every suffix of the array and
 * collects the results. The suffix starting at index `i` is `arr.slice (i)`.
 * Useful for sliding-window computations such as running aggregates or local
 * context extraction, where each position needs access to its own tail.
 * @example
 * // extend :: (Array a -> b) -> Array a -> Array b
 * extend (xs => xs.length) ([10, 20, 30])
 * // => [3, 2, 1]
 * extend (head) ([5, 6, 7])
 * // => [just(5), just(6), just(7)]
 */
export function extend (f) {
  return (arr) => arr.map ((_, idx) => f (arr.slice (idx)))
}

// =============================================================================
// Slicing
// =============================================================================

/**
 * Returns `Just` the first `n` elements when `0 <= n <= arr.length`, or
 * `Nothing` when `n` is out of range. Unlike `Array.prototype.slice`, this
 * forces you to handle the case where the array is shorter than expected.
 * Use `M.withDefault ([])` to fall back to an empty array silently.
 * @example
 * // take :: Integer -> Array a -> Maybe (Array a)
 * take (2) (['alice', 'bob', 'carol'])
 * // => just(['alice', 'bob'])
 * take (0) ([1, 2, 3])
 * // => just([])
 * take (5) ([1, 2, 3])
 * // => nothing()
 */
export function take (n) {
  return (arr) =>
    n >= 0 && n <= arr.length ? M.just (arr.slice (0, n)) : M.nothing ()
}

/**
 * Returns `Just` the array after discarding the first `n` elements when
 * `0 <= n <= arr.length`, or `Nothing` if `n` is out of range. Use this
 * instead of unchecked slicing when the caller cannot guarantee the array is
 * long enough. Pair with `take` for safe prefix/suffix splitting.
 * @example
 * // drop :: Integer -> Array a -> Maybe (Array a)
 * drop (2) (['alice', 'bob', 'carol'])
 * // => just(['carol'])
 * drop (0) ([1, 2, 3])
 * // => just([1, 2, 3])
 * drop (5) ([1, 2, 3])
 * // => nothing()
 */
export function drop (n) {
  return (arr) =>
    n >= 0 && n <= arr.length ? M.just (arr.slice (n)) : M.nothing ()
}

/**
 * Returns `Just` the last `n` elements when `0 <= n <= arr.length`, or
 * `Nothing` when `n` is out of range. The symmetric counterpart to `take`;
 * useful for extracting a trailing window such as the most recent N log
 * entries from a history array.
 * @example
 * // takeLast :: Integer -> Array a -> Maybe (Array a)
 * takeLast (2) ([10, 20, 30, 40])
 * // => just([30, 40])
 * takeLast (0) ([1, 2, 3])
 * // => just([])
 * takeLast (5) ([1, 2, 3])
 * // => nothing()
 */
export function takeLast (n) {
  return (arr) =>
    n >= 0 && n <= arr.length ? M.just (arr.slice (arr.length - n)) : M.nothing ()
}

/**
 * Returns `Just` the array with the last `n` elements removed when
 * `0 <= n <= arr.length`, or `Nothing` if `n` is out of range. The symmetric
 * counterpart to `drop`; use it to strip a trailing sentinel or page marker
 * from a fetched list before further processing.
 * @example
 * // dropLast :: Integer -> Array a -> Maybe (Array a)
 * dropLast (2) ([10, 20, 30, 40])
 * // => just([10, 20])
 * dropLast (0) ([1, 2, 3])
 * // => just([1, 2, 3])
 * dropLast (5) ([1, 2, 3])
 * // => nothing()
 */
export function dropLast (n) {
  return (arr) =>
    n >= 0 && n <= arr.length ? M.just (arr.slice (0, arr.length - n)) : M.nothing ()
}

/**
 * Creates an array of exactly `n` copies of `x`. Useful for initialising a
 * fixed-size buffer, producing a default value array, or generating test data
 * without writing an explicit loop. Returns `[]` when `n` is zero or negative.
 * @example
 * // replicate :: Integer -> a -> Array a
 * replicate (3) ('*')
 * // => ['*', '*', '*']
 * replicate (4) (0)
 * // => [0, 0, 0, 0]
 * replicate (0) ('x')
 * // => []
 */
export function replicate (n) {
  return (x) => {
    const result = []
    for (let i = 0; i < n; i++) result.push (x)
    return result
  }
}

/**
 * Splits an array into `[prefix, rest]` where `prefix` is the longest leading
 * run of elements satisfying the predicate, and `rest` is everything from the
 * first failing element onward. Use `break_` for the complementary split
 * (splits at the first passing element), or `splitAt` for an index-based
 * variant. Both parts together always reconstruct the original array.
 * @example
 * // span :: (a -> Boolean) -> Array a -> [Array a, Array a]
 * span (x => x < 5) ([1, 3, 5, 7])
 * // => [[1, 3], [5, 7]]
 * span (x => x < 0) ([1, 2, 3])
 * // => [[], [1, 2, 3]]
 * span (x => x > 0) ([1, 2, 3])
 * // => [[1, 2, 3], []]
 */
export function span (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && pred (arr[i])) i++
    return [arr.slice (0, i), arr.slice (i)]
  }
}

/**
 * Splits an array at the first element satisfying the predicate, returning
 * `[prefix, rest]`. Equivalent to `span (complement (pred))`; the prefix runs
 * until the first element that passes the test. Use `span` when you want to
 * split on the first failure, and `break_` when you want to split on the first
 * success.
 * @example
 * // break_ :: (a -> Boolean) -> Array a -> [Array a, Array a]
 * break_ (x => x > 3) ([1, 2, 4, 5])
 * // => [[1, 2], [4, 5]]
 * break_ (x => x > 0) ([1, 2, 3])
 * // => [[], [1, 2, 3]]
 * break_ (x => x < 0) ([1, 2, 3])
 * // => [[1, 2, 3], []]
 */
export function break_ (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && !pred (arr[i])) i++
    return [arr.slice (0, i), arr.slice (i)]
  }
}

/**
 * Splits the array at index `n`, returning `[arr.slice (0, n), arr.slice (n)]`.
 * When `n <= 0` the prefix is `[]`; when `n >= arr.length` the suffix is `[]`.
 * Unlike `take` and `drop`, `splitAt` never returns `Nothing` — it clamps
 * silently. Use for fixed-offset partitioning such as header/body separation.
 * @example
 * // splitAt :: Integer -> Array a -> [Array a, Array a]
 * splitAt (2) (['a', 'b', 'c', 'd'])
 * // => [['a', 'b'], ['c', 'd']]
 * splitAt (0) ([1, 2, 3])
 * // => [[], [1, 2, 3]]
 * splitAt (5) ([1, 2, 3])
 * // => [[1, 2, 3], []]
 */
export function splitAt (n) {
  return (arr) => [arr.slice (0, n), arr.slice (n)]
}

/**
 * Iterates `f` starting from `x`, returning the first value that satisfies
 * `pred`. Models a while-loop in purely-functional style and is useful for
 * numeric convergence, binary search seed generation, or repeated
 * transformation until a stable state. Diverges if `pred` never becomes true.
 * @example
 * // until :: (a -> Boolean) -> (a -> a) -> a -> a
 * until (x => x > 100) (x => x * 2) (1)
 * // => 128
 * until (x => x <= 1) (x => Math.floor (x / 2)) (100)
 * // => 0
 */
export function until (pred) {
  return (f) => (x) => {
    let v = x
    while (!pred (v)) v = f (v)
    return v
  }
}

/**
 * Returns the longest leading prefix of elements satisfying the predicate.
 * Unlike `take`, the cutoff is determined by data content rather than a fixed
 * count. Use `span` when you also need the remainder, or `dropWhile` for the
 * complement. Returns `[]` if the first element already fails the predicate.
 * @example
 * // takeWhile :: (a -> Boolean) -> Array a -> Array a
 * takeWhile (x => x < 5) ([1, 3, 5, 7, 2])
 * // => [1, 3]
 * takeWhile (x => x > 0) ([4, 2, -1, 3])
 * // => [4, 2]
 * takeWhile (x => x < 0) ([1, 2, 3])
 * // => []
 */
export function takeWhile (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && pred (arr[i])) i++
    return arr.slice (0, i)
  }
}

/**
 * Drops the longest leading prefix of elements satisfying the predicate and
 * returns the remainder. The complement of `takeWhile`; together they form
 * `span`. Useful for skipping over a run of sentinels or headers at the start
 * of a list before processing the meaningful payload.
 * @example
 * // dropWhile :: (a -> Boolean) -> Array a -> Array a
 * dropWhile (x => x < 5) ([1, 3, 5, 7, 2])
 * // => [5, 7, 2]
 * dropWhile (x => x > 0) ([4, 2, -1, 3])
 * // => [-1, 3]
 * dropWhile (x => x > 0) ([1, 2, 3])
 * // => []
 */
export function dropWhile (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && pred (arr[i])) i++
    return arr.slice (i)
  }
}

// =============================================================================
// Combining
// =============================================================================

/**
 * Inserts a separator array between each sub-array and flattens one level,
 * producing a single combined array. The array-level analogue of `joinWith`.
 * Useful for interleaving delimiters between runs of elements, e.g. inserting
 * divider items between groups. Returns `[]` for an empty outer array.
 * @example
 * // intercalate :: Array a -> Array (Array a) -> Array a
 * intercalate ([0]) ([[1, 2], [3, 4], [5]])
 * // => [1, 2, 0, 3, 4, 0, 5]
 * intercalate ([',']) ([['a', 'b'], ['c']])
 * // => ['a', 'b', ',', 'c']
 */
export function intercalate (sep) {
  return (arr) => {
    if (arr.length === 0) return []
    return arr.reduce ((acc, x, i) => i === 0 ? [...x] : [...acc, ...sep, ...x])
  }
}

/**
 * Groups adjacent elements into sub-arrays using a curried equality predicate.
 * Only consecutive equal elements are grouped; sort the array first if you
 * want all occurrences of a value merged. Useful for run-length encoding,
 * collapsing duplicate log entries, or splitting a sorted list into equal
 * runs before aggregating each group.
 * @example
 * // groupBy :: (a -> a -> Boolean) -> Array a -> Array (Array a)
 * groupBy (a => b => a === b) ([1, 1, 2, 2, 2, 3])
 * // => [[1, 1], [2, 2, 2], [3]]
 * groupBy (a => b => a.dept === b.dept) ([{ name: 'alice', dept: 'eng' }, { name: 'bob', dept: 'eng' }, { name: 'carol', dept: 'hr' }])
 * // => [[{ name: 'alice', dept: 'eng' }, { name: 'bob', dept: 'eng' }], [{ name: 'carol', dept: 'hr' }]]
 */
export function groupBy (f) {
  return (arr) => {
    if (arr.length === 0) return []
    let x0 = arr[0]
    let active = [x0]
    const result = [active]
    for (let i = 1; i < arr.length; i++) {
      const x = arr[i]
      if (f (x0) (x)) active.push (x)
      else result.push ((active = [(x0 = x)]))
    }
    return result
  }
}

/**
 * Pairs elements from two arrays position-by-position, truncating to the
 * shorter length. Excess elements of the longer array are discarded. Use
 * `zipWith` to apply a combining function instead of producing raw pairs, or
 * pass the result to `reduce` to build a lookup map.
 * @example
 * // zip :: Array a -> Array b -> Array [a, b]
 * zip (['alice', 'bob', 'carol']) ([10, 20])
 * // => [['alice', 10], ['bob', 20]]
 * zip ([1, 2, 3]) ([4, 5, 6])
 * // => [[1, 4], [2, 5], [3, 6]]
 */
export function zip (xs) {
  return (ys) => {
    const n = Math.min (xs.length, ys.length)
    const result = new Array (n)
    for (let i = 0; i < n; i++) result[i] = [xs[i], ys[i]]
    return result
  }
}

/**
 * Combines corresponding elements from two arrays using `f`, truncating to
 * the shorter length. A generalisation of `zip`: where `zip` always produces
 * pairs, `zipWith` can produce any value, making it useful for vector
 * arithmetic, parallel transformation, or merging related datasets by position.
 * @example
 * // zipWith :: (a -> b -> c) -> Array a -> Array b -> Array c
 * zipWith (name => score => ({ name, score })) (['alice', 'bob']) ([95, 87])
 * // => [{ name: 'alice', score: 95 }, { name: 'bob', score: 87 }]
 * zipWith (a => b => a + b) ([1, 2, 3]) ([10, 20])
 * // => [11, 22]
 */
export function zipWith (f) {
  return (xs) => (ys) => {
    const n = Math.min (xs.length, ys.length)
    const result = new Array (n)
    for (let i = 0; i < n; i++) result[i] = f (xs[i]) (ys[i])
    return result
  }
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Applicative traversal — maps an effectful function `f` over an array and
 * sequences the effects, collecting all results into a single wrapped array.
 * With Maybe this gives "all-or-nothing" semantics: if any element produces
 * `Nothing`, the entire traversal short-circuits to `Nothing`. Unlike `map`,
 * `traverse` propagates and combines the effects of each step. Pass the target
 * Applicative's `of`, `ap`, and `map` explicitly so this works with any
 * Applicative (Maybe, Either, Array, Promise, etc.).
 *
 * apOf  :: b -> f b                        (pure / of)
 * apAp  :: f (a -> b) -> f a -> f b        (ap, curried)
 * apMap :: (a -> b) -> f a -> f b          (map, curried)
 *
 * @example
 * // traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Array a -> f (Array b)
 * const apOf  = x  => M.just (x)
 * const apAp  = ff => fa => M.chain (f => M.map (f) (fa)) (ff)
 * const apMap = f  => fa => M.map (f) (fa)
 * traverse (apOf) (apAp) (apMap) (x => x > 0 ? M.just (x) : M.nothing ()) ([1, 2, 3])
 * // => just([1, 2, 3])
 * traverse (apOf) (apAp) (apMap) (x => x > 0 ? M.just (x) : M.nothing ()) ([1, -1, 3])
 * // => nothing()
 */
export function traverse (apOf) {
  return (apAp) => (apMap) => (f) => (arr) => {
    if (arr.length === 0) return apOf ([])
    // Start with f(head) lifted into a singleton array inside the functor
    const init = apMap ((x) => [x]) (f (arr[0]))
    // For each remaining element, ap-append it to the accumulated array
    return arr.slice (1).reduce (
      (acc, x) => apAp (apMap ((xs) => (x) => [...xs, x]) (acc)) (f (x)),
      init,
    )
  }
}

/**
 * Maps a monadic function over an array and sequences the effects, collecting
 * results — the monadic `mapM` from Haskell. Requires the monad's `chain` and
 * `of` to be passed explicitly so it is monad-agnostic. Use it instead of
 * `traverse` when you have a monad rather than a general Applicative. If any
 * step returns a failing monad (e.g. `Nothing`, `Left`), the whole computation
 * short-circuits.
 *
 * mapM (chain) (of) (f) (xs)
 *   ≡ sequence through xs applying f to each element
 *
 * @example
 * // mapM :: (m b -> (b -> m c) -> m c) -> (Array b -> m (Array b)) -> (a -> m b) -> Array a -> m (Array b)
 * mapM (M.chain) (xs => M.just (xs)) (x => x > 0 ? M.just (x) : M.nothing ()) ([5, 10, 15])
 * // => just([5, 10, 15])
 * mapM (M.chain) (xs => M.just (xs)) (x => x > 0 ? M.just (x) : M.nothing ()) ([5, -1, 15])
 * // => nothing()
 */
export function mapM (chain) {
  return (of_) => (f) => (arr) => {
    const go = (i, acc) => {
      if (i >= arr.length) return of_ (acc)
      return chain ((v) => go (i + 1, [...acc, v])) (f (arr[i]))
    }
    return go (0, [])
  }
}

/**
 * Like `mapM` but with the array and function arguments swapped — useful when
 * the array is known upfront and you want to express "for each element of xs,
 * do this effectful thing". The name mirrors Haskell's `forM`. Internally
 * delegates to `mapM (chain) (of_) (f) (arr)`.
 *
 * forM (chain) (of) (xs) (f) ≡ mapM (chain) (of) (f) (xs)
 *
 * @example
 * // forM :: (m b -> (b -> m c) -> m c) -> (Array b -> m (Array b)) -> Array a -> (a -> m b) -> m (Array b)
 * forM (M.chain) (xs => M.just (xs)) ([1, 2, 3]) (x => x > 0 ? M.just (x * 2) : M.nothing ())
 * // => just([2, 4, 6])
 * forM (M.chain) (xs => M.just (xs)) ([1, -2, 3]) (x => x > 0 ? M.just (x) : M.nothing ())
 * // => nothing()
 */
export function forM (chain) {
  return (of_) => (arr) => (f) => mapM (chain) (of_) (f) (arr)
}
