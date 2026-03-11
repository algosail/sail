// nonempty.js
// NonEmptyArray: an array guaranteed to have at least one element.
// NonEmptyArray a = { tag: 'nonempty', head: a, tail: Array a }
//
// Unlike Array, NonEmptyArray is a Semigroup but not a Monoid (no empty),
// and head / last always return a value — never Maybe.

import * as M from './maybe.js'
import { toComparator } from './ordering.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Constructs a `NonEmptyArray` from an explicit head element and a (possibly empty) tail array.
 * This is the primitive constructor — all other constructors delegate to it. The separation of
 * `head` and `tail` makes the non-emptiness guarantee structurally explicit: the type cannot
 * be constructed without providing at least one element.
 * @example
 * // of :: a -> Array a -> NonEmptyArray a
 * of (1) ([2, 3])
 * // => { tag: 'nonempty', head: 1, tail: [2, 3] }
 * of ('alice') ([])
 * // => { tag: 'nonempty', head: 'alice', tail: [] }
 */
export function of (head) {
  return (tail) => ({ tag: 'nonempty', head, tail })
}

/**
 * Constructs the minimal `NonEmptyArray` — a single element with an empty tail.
 * Use this when you have a guaranteed value and want to bring it into the `NonEmptyArray`
 * world to compose with other non-empty arrays via `concat`, `map`, or `chain`.
 * @example
 * // singleton :: a -> NonEmptyArray a
 * singleton (42)
 * // => { tag: 'nonempty', head: 42, tail: [] }
 * singleton ('admin')
 * // => { tag: 'nonempty', head: 'admin', tail: [] }
 */
export function singleton (a) {
  return of (a) ([])
}

/**
 * Safely converts a plain array to a `NonEmptyArray`, returning `Just(NonEmptyArray)` when
 * the array has at least one element and `Nothing` when it is empty. This is the boundary
 * function that bridges the unguaranteed world of plain arrays and the guaranteed world of
 * `NonEmptyArray` — it forces explicit handling of the empty case exactly once, at the entry point.
 * @example
 * // fromArray :: Array a -> Maybe (NonEmptyArray a)
 * fromArray ([1, 2, 3])
 * // => just(of(1)([2, 3]))
 * fromArray (['only'])
 * // => just(singleton('only'))
 * fromArray ([])
 * // => nothing()
 */
export function fromArray (arr) {
  return arr.length > 0
    ? M.just (of (arr[0]) (arr.slice (1)))
    : M.nothing ()
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns `true` when the value is a `NonEmptyArray` — a runtime membership check.
 * Note that a plain JavaScript array is not a `NonEmptyArray` even if it is non-empty;
 * use `fromArray` to convert and validate in one step, or this guard after an explicit
 * `of` / `singleton` construction.
 * @example
 * // isNonEmpty :: a -> Boolean
 * isNonEmpty (singleton (1))
 * // => true
 * isNonEmpty (of (1) ([2, 3]))
 * // => true
 * isNonEmpty ([1, 2])
 * // => false
 */
export function isNonEmpty (a) {
  return Boolean (a?.tag === 'nonempty')
}

// =============================================================================
// Destructors
// =============================================================================

/**
 * Extracts the first element of the `NonEmptyArray` — always safe, never wrapped in `Maybe`.
 * Because the type guarantees at least one element, `head` returns a plain value without any
 * wrapping. This eliminates the boilerplate of `fromMaybe` or `getOrElse` calls that would
 * be required when calling `head` on a plain array.
 * @example
 * // head :: NonEmptyArray a -> a
 * head (of (1) ([2, 3]))
 * // => 1
 * head (singleton ('admin'))
 * // => 'admin'
 */
export function head (nea) {
  return nea.head
}

/**
 * Returns all elements after the first as a plain array — which may be empty.
 * The result is a plain `Array`, not a `NonEmptyArray`, because there is no guarantee
 * that the original had more than one element. Use `fromArray` on the result if you
 * need to continue in the `NonEmptyArray` world.
 * @example
 * // tail :: NonEmptyArray a -> Array a
 * tail (of (1) ([2, 3]))
 * // => [2, 3]
 * tail (singleton (1))
 * // => []
 */
export function tail (nea) {
  return nea.tail
}

/**
 * Extracts the last element of the `NonEmptyArray` — always safe, never wrapped in `Maybe`.
 * Like `head`, the non-emptiness guarantee makes this unconditionally safe. Use it instead
 * of `arr[arr.length - 1]` — which is `undefined` for empty arrays — when you know the
 * array is non-empty and want to make that invariant explicit in the type.
 * @example
 * // last :: NonEmptyArray a -> a
 * last (of (1) ([2, 3]))
 * // => 3
 * last (singleton (7))
 * // => 7
 */
export function last (nea) {
  return nea.tail.length > 0 ? nea.tail[nea.tail.length - 1] : nea.head
}

/**
 * Returns all elements except the last as a plain array — which may be empty.
 * The symmetric counterpart to `last`, mirroring the relationship between `head` and `tail`.
 * The result is a plain `Array` because a single-element `NonEmptyArray` has an empty `init`,
 * so the non-emptiness guarantee cannot be preserved.
 * @example
 * // init :: NonEmptyArray a -> Array a
 * init (of (1) ([2, 3]))
 * // => [1, 2]
 * init (singleton (1))
 * // => []
 */
export function init (nea) {
  return nea.tail.length > 0
    ? [nea.head, ...nea.tail.slice (0, -1)]
    : []
}

/**
 * Converts a `NonEmptyArray` to a plain JavaScript array by prepending the `head` to the `tail`.
 * Use this at the boundary where `NonEmptyArray`-specific combinators hand off to standard array
 * operations, or when interfacing with APIs that expect a plain `Array`. The resulting array is
 * always non-empty, but that fact is no longer tracked in the type.
 * @example
 * // toArray :: NonEmptyArray a -> Array a
 * toArray (of (1) ([2, 3]))
 * // => [1, 2, 3]
 * toArray (singleton ('only'))
 * // => ['only']
 */
export function toArray (nea) {
  return [nea.head, ...nea.tail]
}

/**
 * Returns the total number of elements — always at least `1`.
 * Because `NonEmptyArray` is always non-empty, `size` is guaranteed to return a positive
 * integer. Use it instead of `toArray(nea).length` to avoid the allocation of an intermediate array.
 * @example
 * // size :: NonEmptyArray a -> Integer
 * size (of (1) ([2, 3]))
 * // => 3
 * size (singleton (42))
 * // => 1
 */
export function size (nea) {
  return 1 + nea.tail.length
}

/**
 * The canonical eliminator for `NonEmptyArray` — passes `head` and `tail` to a curried function.
 * Use this for custom destructuring logic that needs to treat the first element specially,
 * such as using the head as the initial accumulator in a reduce-style operation without
 * requiring a separate initial value.
 * @example
 * // fold :: (a -> Array a -> b) -> NonEmptyArray a -> b
 * fold (h => t => [h, ...t].join (', ')) (of (1) ([2, 3]))
 * // => '1, 2, 3'
 * fold (h => t => h + t.length) (of (10) ([20, 30]))
 * // => 12
 */
export function fold (f) {
  return (nea) => f (nea.head) (nea.tail)
}

// =============================================================================
// Eq / Ord
// =============================================================================

/**
 * Tests element-wise equality between two `NonEmptyArray` values using the given comparator.
 * Two `NonEmptyArray` values are equal when they contain the same number of elements and each
 * corresponding pair satisfies `eq`. Converting to plain arrays internally means size difference
 * is detected early without comparing elements unnecessarily.
 * @example
 * // equals :: (a -> a -> Boolean) -> NonEmptyArray a -> NonEmptyArray a -> Boolean
 * equals (a => b => a === b) (of (1) ([2, 3])) (of (1) ([2, 3]))
 * // => true
 * equals (a => b => a === b) (of (1) ([2])) (of (1) ([3]))
 * // => false
 */
export function equals (eq) {
  return (a) => (b) => {
    const as = toArray (a)
    const bs = toArray (b)
    if (as.length !== bs.length) return false
    for (let i = 0; i < as.length; i++) {
      if (!eq (as[i]) (bs[i])) return false
    }
    return true
  }
}

// =============================================================================
// Semigroup  (no Monoid — there is no empty NonEmptyArray)
// =============================================================================

/**
 * Concatenates two `NonEmptyArrays` into a single `NonEmptyArray` — the `Semigroup` instance.
 * Because both operands are guaranteed non-empty, the result is always non-empty too, so unlike
 * a plain array `concat` no `Maybe` wrapper is required. Note that `NonEmptyArray` has no
 * `Monoid` instance: there is no empty element.
 * @example
 * // concat :: NonEmptyArray a -> NonEmptyArray a -> NonEmptyArray a
 * concat (of (1) ([2])) (of (3) ([4]))
 * // => of(1)([2, 3, 4])
 * concat (singleton ('a')) (of ('b') (['c']))
 * // => of('a')(['b', 'c'])
 */
export function concat (a) {
  return (b) => of (a.head) ([...a.tail, ...toArray (b)])
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies `f` to every element, preserving the `NonEmptyArray` structure.
 * Because mapping cannot remove elements, the result is still guaranteed non-empty — no `Maybe`
 * is required on the return type. Use this instead of `toArray(nea).map(f)` to avoid
 * converting to a plain array and back.
 * @example
 * // map :: (a -> b) -> NonEmptyArray a -> NonEmptyArray b
 * map (x => x * 2) (of (1) ([2, 3]))
 * // => of(2)([4, 6])
 * map (s => s.toUpperCase()) (of ('alice') (['bob']))
 * // => of('ALICE')(['BOB'])
 */
export function map (f) {
  return (nea) => of (f (nea.head)) (nea.tail.map (f))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Applies each function in `nef` to each value in `nea`, producing all combinations.
 * Because both inputs are non-empty, the result is guaranteed non-empty — the Cartesian
 * product of two non-empty sets is always non-empty. The order is: all values produced
 * by the first function, then all values produced by the second function, and so on.
 * @example
 * // ap :: NonEmptyArray (a -> b) -> NonEmptyArray a -> NonEmptyArray b
 * ap (of (x => x + 1) ([x => x * 10])) (of (2) ([3]))
 * // => of(3)([4, 20, 30])
 */
export function ap (nef) {
  return (nea) => {
    const fs  = toArray (nef)
    const xs  = toArray (nea)
    const all = fs.flatMap ((f) => xs.map (f))
    return of (all[0]) (all.slice (1))
  }
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Applies `f` to every element and concatenates the resulting `NonEmptyArrays`.
 * Because `f` produces a `NonEmptyArray` for each input and both the input and each result
 * are non-empty, the overall result is guaranteed non-empty. Use this when each element
 * expands into multiple elements — an operation sometimes called `concatMap` or `flatMap`.
 * @example
 * // chain :: (a -> NonEmptyArray b) -> NonEmptyArray a -> NonEmptyArray b
 * chain (x => of (x) ([x * 2])) (of (1) ([2]))
 * // => of(1)([2, 2, 4])
 * chain (x => singleton (x + 10)) (of (1) ([2, 3]))
 * // => of(11)([12, 13])
 */
export function chain (f) {
  return (nea) => {
    const all = toArray (nea).flatMap ((x) => toArray (f (x)))
    return of (all[0]) (all.slice (1))
  }
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Left fold over all elements with a curried binary function and an explicit initial value.
 * Converts the `NonEmptyArray` to a plain array and reduces it, starting from `init`.
 * Use `reduce1` instead when the fold combines elements of the same type and the first
 * element can serve as the natural seed value.
 * @example
 * // reduce :: (b -> a -> b) -> b -> NonEmptyArray a -> b
 * reduce (acc => x => acc + x) (0) (of (1) ([2, 3]))
 * // => 6
 * reduce (acc => x => [...acc, x * 2]) ([]) (of (1) ([2, 3]))
 * // => [2, 4, 6]
 */
export function reduce (f) {
  return (init) => (nea) =>
    toArray (nea).reduce ((acc, x) => f (acc) (x), init)
}

/**
 * Left fold using the `head` as the initial accumulator — no explicit seed needed.
 * This is the key advantage of `NonEmptyArray` over plain `Array`: `foldl1` (Haskell's name)
 * is unconditionally safe. Use it to reduce homogeneous non-empty arrays — summing numbers,
 * merging objects, or finding the maximum — without providing a dummy initial value.
 * @example
 * // reduce1 :: (a -> a -> a) -> NonEmptyArray a -> a
 * reduce1 (acc => x => acc + x) (of (1) ([2, 3]))
 * // => 6
 * reduce1 (acc => x => Math.max (acc, x)) (of (3) ([1, 4, 1, 5]))
 * // => 5
 */
export function reduce1 (f) {
  return (nea) =>
    nea.tail.reduce ((acc, x) => f (acc) (x), nea.head)
}

// =============================================================================
// Filtering  (returns Maybe because the result may become empty)
// =============================================================================

/**
 * Filters elements by a predicate, returning `Just(NonEmptyArray)` if any pass and `Nothing` if all fail.
 * The result is wrapped in `Maybe` because filtering can empty the array — which would violate the
 * `NonEmptyArray` invariant. Handle the `Nothing` case explicitly to avoid silently losing all elements.
 * @example
 * // filter :: (a -> Boolean) -> NonEmptyArray a -> Maybe (NonEmptyArray a)
 * filter (x => x > 1) (of (1) ([2, 3]))
 * // => just(of(2)([3]))
 * filter (x => x > 99) (of (1) ([2, 3]))
 * // => nothing()
 */
export function filter (pred) {
  return (nea) => fromArray (toArray (nea).filter (pred))
}

// =============================================================================
// Other utilities
// =============================================================================

/**
 * Reverses the `NonEmptyArray`, placing the last element first and the first element last.
 * Reversing can never empty the array, so the result remains a `NonEmptyArray` — no `Maybe`
 * needed. Use this before `head` or `last` to access the "other end" without converting
 * to a plain array first.
 * @example
 * // reverse :: NonEmptyArray a -> NonEmptyArray a
 * reverse (of (1) ([2, 3]))
 * // => of(3)([2, 1])
 * reverse (singleton (5))
 * // => singleton(5)
 */
export function reverse (nea) {
  const arr = toArray (nea).reverse ()
  return of (arr[0]) (arr.slice (1))
}

/**
 * Appends a single element to the end of the `NonEmptyArray`.
 * Adding an element can never empty the array, so the result is still a `NonEmptyArray`.
 * This is more semantically clear than spreading into a new `of` call, and composes
 * naturally in a `reduce` pipeline that accumulates elements one at a time.
 * @example
 * // append :: a -> NonEmptyArray a -> NonEmptyArray a
 * append (4) (of (1) ([2, 3]))
 * // => of(1)([2, 3, 4])
 * append ('end') (singleton ('start'))
 * // => of('start')(['end'])
 */
export function append (x) {
  return (nea) => of (nea.head) ([...nea.tail, x])
}

/**
 * Prepends a single element to the front of the `NonEmptyArray`.
 * The prepended element becomes the new `head`, shifting all existing elements into the `tail`.
 * Like `append`, this preserves the `NonEmptyArray` invariant — adding an element can never
 * produce an empty array.
 * @example
 * // prepend :: a -> NonEmptyArray a -> NonEmptyArray a
 * prepend (0) (of (1) ([2, 3]))
 * // => of(0)([1, 2, 3])
 * prepend ('start') (singleton ('end'))
 * // => of('start')(['end'])
 */
export function prepend (x) {
  return (nea) => of (x) (toArray (nea))
}

/**
 * Stably sorts the `NonEmptyArray` using a curried `Ordering` comparator.
 * Sorting can never empty the array, so the result is still a `NonEmptyArray` — no wrapping
 * in `Maybe` is required. Elements that compare as `EQ` retain their original relative order,
 * making this safe to chain with `concatComparators` for multi-field sorts.
 * @example
 * // sort :: (a -> a -> Ordering) -> NonEmptyArray a -> NonEmptyArray a
 * sort (compare) (of (3) ([1, 2]))
 * // => of(1)([2, 3])
 * sort (compare) (of ('banana') (['apple', 'cherry']))
 * // => of('apple')(['banana', 'cherry'])
 */
export function sort (cmp) {
  return (nea) => {
    const arr = toArray (nea).slice ()
    arr.sort (toComparator (cmp))
    return of (arr[0]) (arr.slice (1))
  }
}

/**
 * Applicative traversal — maps `f` over every element collecting effects into the outer applicative.
 * Because the array is non-empty, at least one effect is always run and the result is always
 * non-empty inside the applicative. Accepts explicit `apOf`/`apAp`/`apMap` to remain
 * functor-agnostic and work with any applicative functor.
 *
 * apOf  :: b -> f b                        (pure / of)
 * apAp  :: f (a -> b) -> f a -> f b        (ap, curried)
 * apMap :: (a -> b) -> f a -> f b          (map, curried)
 *
 * @example
 * // traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> NonEmptyArray a -> f (NonEmptyArray b)
 * const apOf  = Array.of
 * const apAp  = ff => fa => ff.flatMap (f => fa.map (f))
 * const apMap = f  => fa => fa.map (f)
 * traverse (apOf) (apAp) (apMap) (x => [x, -x]) (of (1) ([2]))
 * // => [of(1)([2]), of(1)([-2]), of(-1)([2]), of(-1)([-2])]
 */
export function traverse (apOf) {
  return (apAp) => (apMap) => (f) => (nea) => {
    const xs = toArray (nea)
    // Start with f(head) mapped into a singleton NonEmptyArray inside the functor
    const init = apMap ((v) => of (v) ([])) (f (xs[0]))
    // For each tail element, ap-append it into the accumulated NonEmptyArray
    return xs.slice (1).reduce (
      (acc, x) => apAp (apMap ((nea_) => (v) => append (v) (nea_)) (acc)) (f (x)),
      init,
    )
  }
}
