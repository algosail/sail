// array.js – Array constructors, getters, and transformers.

import * as M from '@algosail/maybe'

/**
 * Lifts a value into a singleton array.
 * @example 
 * // of :: a -> Array a
 * of (1) // => [1]
 */
export function of (a) {
  return [a]
}

/**
 * Returns a new empty array.
 * @example 
 * // empty :: () -> Array a
 * empty () // => []
 */
export function empty () {
  return []
}

/**
 * Produces [from, from+1, ..., to-1].
 * @example 
 * // range :: Integer -> Integer -> Array Integer
 * range (1) (4) // => [1, 2, 3]
 */
export function range (from) {
  return (to) => {
    const result = []
    for (let n = from; n < to; n++) result.push (n)
    return result
  }
}

/**
 * Generates an array from a seed until the stepper returns Nothing.
 * @example 
 * // unfold :: (b -> Maybe [a, b]) -> b -> Array a
 * unfold (n => n > 3 ? M.nothing () : M.just ([n, n+1])) (1) // => [1, 2, 3]
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
 * Stack-safe recursive array expansion. f receives (next, done, value).
 * @example 
 * // chainRec :: ((a -> Step, b -> Step, a) -> Array Step) -> a -> Array b
 * chainRec ((n, d, x) => x > 2 ? [d (x)] : [n (x + 1), n (x + 2)]) (0)
 */
export function chainRec (f) {
  return (init) => {
    const next = (value) => ({ done: false, value })
    const done = (value) => ({ done: true, value })
    const result = []
    let todo = [init]
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

/**
 * True when index is negative or >= array length.
 * @example 
 * // isOutOfBounds :: Number -> Array a -> Boolean
 * isOutOfBounds (3) ([1, 2, 3]) // => true
 */
export function isOutOfBounds (index) {
  return (a) => index < 0 || index >= a.length
}

/**
 * Returns Just the element at index, or Nothing if out of bounds.
 * @example 
 * // lookup :: Number -> Array a -> Maybe a
 * lookup (0) ([10, 20]) // => just(10)
 */
export function lookup (index) {
  return (a) => (isOutOfBounds (index) (a) ? M.nothing () : M.just (a[index]))
}

/**
 * Returns the number of elements.
 * @example 
 * // size :: Array a -> Integer
 * size ([1, 2, 3]) // => 3
 */
export function size (arr) {
  return arr.length
}

/**
 * Case analysis: returns empty value for [], or nonEmpty(head)(tail).
 * @example 
 * // array :: b -> (a -> Array a -> b) -> Array a -> b
 * array (0) (h => _ => h) ([5, 6]) // => 5
 */
export function array (empty_) {
  return (nonEmpty) => (arr) =>
    arr.length === 0 ? empty_ : nonEmpty (arr[0]) (arr.slice (1))
}

/**
 * Returns Just the first element, or Nothing for empty arrays.
 * @example 
 * // head :: Array a -> Maybe a
 * head ([1, 2, 3]) // => just(1)
 */
export function head (arr) {
  return arr.length > 0 ? M.just (arr[0]) : M.nothing ()
}

/**
 * Returns Just the last element, or Nothing for empty arrays.
 * @example 
 * // last :: Array a -> Maybe a
 * last ([1, 2, 3]) // => just(3)
 */
export function last (arr) {
  return arr.length > 0 ? M.just (arr[arr.length - 1]) : M.nothing ()
}

/**
 * Returns Just all elements after the first, or Nothing for empty.
 * @example 
 * // tail :: Array a -> Maybe (Array a)
 * tail ([1, 2, 3]) // => just([2,3])
 */
export function tail (arr) {
  return arr.length > 0 ? M.just (arr.slice (1)) : M.nothing ()
}

/**
 * Returns Just all elements except the last, or Nothing for empty.
 * @example 
 * // init :: Array a -> Maybe (Array a)
 * init ([1, 2, 3]) // => just([1,2])
 */
export function init (arr) {
  return arr.length > 0 ? M.just (arr.slice (0, -1)) : M.nothing ()
}

/**
 * True when every element satisfies the predicate.
 * @example 
 * // all :: (a -> Boolean) -> Array a -> Boolean
 * all (x => x > 0) ([1, 2, 3]) // => true
 */
export function all (pred) {
  return (arr) => arr.every (pred)
}

/**
 * True when at least one element satisfies the predicate.
 * @example 
 * // any :: (a -> Boolean) -> Array a -> Boolean
 * any (x => x > 2) ([1, 2, 3]) // => true
 */
export function any (pred) {
  return (arr) => arr.some (pred)
}

/**
 * True when no element satisfies the predicate.
 * @example
 * // none :: (a -> Boolean) -> Array a -> Boolean
 * none (x => x > 5) ([1, 2, 3]) // => true
 */
export function none (pred) {
  return (arr) => !arr.some (pred)
}

/**
 * True when x is found in arr using the comparator.
 * @example 
 * // elem :: ((a, a) -> Boolean) -> a -> Array a -> Boolean
 * elem ((a, b) => a === b) (2) ([1, 2, 3]) // => true
 */
export function elem (eq) {
  return (x) => (arr) => arr.some ((a) => eq (a, x))
}

/**
 * Element-wise equality using an explicit comparator.
 * @example 
 * // equals :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean
 * equals ((a, b) => a === b) ([1, 2]) ([1, 2]) // => true
 */
export function equals (eq) {
  return (a) => (b) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!eq (a[i], b[i])) return false
    }
    return true
  }
}

/**
 * Lexicographic ordering using an explicit lte comparator.
 * @example 
 * // lte :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean
 * lte ((a, b) => a <= b) ([1, 2]) ([1, 3]) // => true
 */
export function lte (lteElem) {
  return (a) => (b) => {
    for (let i = 0; i < a.length; i++) {
      if (i >= b.length) return false // a is longer → a > b
      const aLteB = lteElem (a[i], b[i])
      const bLteA = lteElem (b[i], a[i])
      if (!(aLteB && bLteA)) return aLteB // elements differ
    }
    return true // a exhausted first (prefix) or all elements equal
  }
}

/**
 * Returns Just the first element satisfying the predicate, or Nothing.
 * @example 
 * // find :: (a -> Boolean) -> Array a -> Maybe a
 * find (x => x > 2) ([1, 2, 3, 4]) // => just(3)
 */
export function find (pred) {
  return (arr) => {
    for (const x of arr) if (pred (x)) return M.just (x)
    return M.nothing ()
  }
}

/**
 * Returns the first Just result from applying f to each element.
 * @example 
 * // findMap :: (a -> Maybe b) -> Array a -> Maybe b
 * findMap (x => x > 2 ? just (x * 10) : nothing ()) ([1, 2, 3]) // => just(30)
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

/**
 * Joins the array with a separator.
 * @example 
 * // joinWith :: String -> Array String -> String
 * joinWith (',') (['a', 'b', 'c']) // => 'a,b,c'
 */
export function joinWith (sep) {
  return (arr) => arr.join (sep)
}

/**
 * Left fold with an uncurried binary function.
 * @example 
 * // reduce :: ((b, a) -> b) -> b -> Array a -> b
 * reduce ((acc, x) => acc + x) (0) ([1, 2, 3]) // => 6
 */
export function reduce (f) {
  return (init) => (arr) => arr.reduce (f, init)
}

/**
 * Left fold with a curried binary function.
 * @example 
 * // reduceC :: (b -> a -> b) -> b -> Array a -> b
 * reduceC (acc => x => acc + x) (0) ([1, 2, 3]) // => 6
 */
export function reduceC (f) {
  return (init) => (arr) =>
    arr.reduce ((acc, x) => f (acc) (x), init)
}

/**
 * Maps elements to a monoid and concatenates.
 * @example 
 * // foldMap :: ((b, b) -> b) -> b -> (a -> b) -> Array a -> b
 * foldMap ((a, b) => a + b) (0) (x => x * 2) ([1, 2, 3]) // => 12
 */
export function foldMap (concatFn) {
  return (emptyVal) => (f) => (arr) =>
    arr.reduce ((acc, x) => concatFn (acc, f (x)), emptyVal)
}

// =============================================================================
// Transformers — produce a new Array from existing array(s)
// =============================================================================

/**
 * Concatenates two arrays.
 * @example 
 * // concat :: Array a -> Array a -> Array a
 * concat ([1, 2]) ([3, 4]) // => [1,2,3,4]
 */
export function concat (a) {
  return (b) => a.concat (b)
}

/**
 * Appends an element to the end.
 * @example 
 * // append :: a -> Array a -> Array a
 * append (4) ([1, 2, 3]) // => [1,2,3,4]
 */
export function append (x) {
  return (arr) => arr.concat ([x])
}

/**
 * Prepends an element to the front.
 * @example 
 * // prepend :: a -> Array a -> Array a
 * prepend (0) ([1, 2, 3]) // => [0,1,2,3]
 */
export function prepend (x) {
  return (arr) => [x].concat (arr)
}

/**
 * Applies f to every element.
 * @example 
 * // map :: (a -> b) -> Array a -> Array b
 * map (x => x * 2) ([1, 2, 3]) // => [2,4,6]
 */
export function map (f) {
  return (arr) => arr.map (f)
}

/**
 * Keeps elements satisfying the predicate.
 * // filter :: (a -> Boolean) -> Array a -> Array a
 * @example filter (x => x > 1) ([1, 2, 3]) // => [2,3]
 */
export function filter (pred) {
  return (arr) => arr.filter (pred)
}

/**
 * Removes elements satisfying the predicate (complement of filter).
 * @example 
 * // reject :: (a -> Boolean) -> Array a -> Array a
 * reject (x => x > 1) ([1, 2, 3]) // => [1]
 */
export function reject (pred) {
  return (arr) => arr.filter ((x) => !pred (x))
}

/**
 * Maps then flattens one level (monadic bind).
 * // flatmap :: (a -> Array b) -> Array a -> Array b
 * @example flatmap (x => [x, x * 2]) ([1, 2]) // => [1,2,2,4]
 */
export function flatmap (f) {
  return (arr) => arr.flatMap (f)
}

/**
 * Cartesian application — each function applied to each value.
 * @example 
 * // ap :: Array (a -> b) -> Array a -> Array b
 * ap ([x => x + 1, x => x * 2]) ([10, 20]) // => [11,21,20,40]
 */
export function ap (fns) {
  return (arr) => fns.flatMap ((f) => arr.map (f))
}

/**
 * Returns a reversed copy.
 * @example 
 * // reverse :: Array a -> Array a
 * reverse ([1, 2, 3]) // => [3,2,1]
 */
export function reverse (arr) {
  return [...arr].reverse ()
}

/**
 * Stable sort with an explicit lte comparator.
 * @example 
 * // sort :: ((a, a) -> Boolean) -> Array a -> Array a
 * sort ((a, b) => a <= b) ([3, 1, 2]) // => [1,2,3]
 */
export function sort (lteElem) {
  return (arr) => {
    const indexed = arr.map ((x, i) => [x, i])
    indexed.sort (([a, i], [b, j]) => {
      const ab = lteElem (a, b)
      const ba = lteElem (b, a)
      if (ab && ba) return i - j // equal keys → preserve original order
      return ab ? -1 : 1
    }) 
    return indexed.map (([x]) => x)
  }
}

/**
 * Stable sort using a key extractor and an explicit lte for the key type.
 * @example 
 * // sortBy :: ((b, b) -> Boolean) -> (a -> b) -> Array a -> Array a
 * sortBy ((a, b) => a <= b) (x => x.n) ([{n: 2}, {n:1}]) // => [{n:1},{n:2}]
 */
export function sortBy (lteKey) {
  return (toKey) => (arr) => {
    const indexed = arr.map ((x, i) => [x, i, toKey (x)])
    indexed.sort (([, i, ka], [, j, kb]) => {
      const ab = lteKey (ka, kb)
      const ba = lteKey (kb, ka)
      if (ab && ba) return i - j
      return ab ? -1 : 1
    })
    return indexed.map (([x]) => x)
  }
}

/**
 * Cobinds by applying f to each suffix: extend(f)([x,y,z]) = [f([x,y,z]), f([y,z]), f([z])].
 * @example 
 * // extend :: (Array a -> b) -> Array a -> Array b
 * extend (head) ([1, 2, 3]) // => [just(1), just(2), just(3)]
 */
export function extend (f) {
  return (arr) => arr.map ((_, idx) => f (arr.slice (idx)))
}

/**
 * Returns Just the first n elements if 0 <= n <= length, else Nothing.
 * @example 
 * // take :: Integer -> Array a -> Maybe (Array a)
 * take (2) ([1, 2, 3]) // => just([1,2])
 */
export function take (n) {
  return (arr) =>
    n < 0 ? M.nothing () : n <= arr.length ? M.just (arr.slice (0, n)) : M.nothing ()
}

/**
 * Returns Just the array after dropping the first n elements, else Nothing.
 * @example 
 * // drop :: Integer -> Array a -> Maybe (Array a)
 * drop (1) ([1, 2, 3]) // => just([2,3])
 */
export function drop (n) {
  return (arr) =>
    n < 0 ? M.nothing () : n <= arr.length ? M.just (arr.slice (n)) : M.nothing ()
}

/**
 * Returns Just the last n elements if 0 <= n <= length, else Nothing.
 * @example 
 * // takeLast :: Integer -> Array a -> Maybe (Array a)
 * takeLast (2) ([1, 2, 3]) // => just([2,3])
 */
export function takeLast (n) {
  return (arr) => n < 0
    ? M.nothing ()
    : n <= arr.length
      ? M.just (arr.slice (arr.length - n))
      : M.nothing ()
}

/**
 * Returns Just the array with the last n elements removed, else Nothing.
 * @example 
 * // dropLast :: Integer -> Array a -> Maybe (Array a)
 * dropLast (1) ([1, 2, 3]) // => just([1,2])
 */
export function dropLast (n) {
  return (arr) => n < 0
    ? M.nothing ()
    : n <= arr.length
      ? M.just (arr.slice (0, arr.length - n))
      : M.nothing ()
}

/**
 * Takes elements from the front while the predicate holds.
 * @example 
 * // takeWhile :: (a -> Boolean) -> Array a -> Array a
 * takeWhile (x => x < 3) ([1, 2, 3, 4]) // => [1,2]
 */
export function takeWhile (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && pred (arr[i])) i++
    return arr.slice (0, i)
  }
}

/**
 * Drops elements from the front while the predicate holds.
 * @example 
 * // dropWhile :: (a -> Boolean) -> Array a -> Array a
 * dropWhile (x => x < 3) ([1, 2, 3, 4]) // => [3,4]
 */
export function dropWhile (pred) {
  return (arr) => {
    let i = 0
    while (i < arr.length && pred (arr[i])) i++
    return arr.slice (i)
  }
}

/**
 * Inserts sep between sub-arrays and flattens.
 * @example 
 * // intercalate :: Array a -> Array (Array a) -> Array a
 * intercalate ([0]) ([[1, 2], [3, 4]]) // => [1,2,0,3,4]
 */
export function intercalate (sep) {
  return (arr) => {
    if (arr.length === 0) return []
    return arr.reduce ((acc, x, i) => (i === 0 ? [...x] : [...acc, ...sep, ...x]))
  }
}

/**
 * Groups adjacent equal elements into sub-arrays.
 * @example 
 * // groupBy :: (a -> a -> Boolean) -> Array a -> Array (Array a)
 * groupBy (a => b => a === b) ([1, 1, 2, 3, 3]) // => [[1,1],[2],[3,3]]
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
 * Zips two arrays to the length of the shorter.
 * @example 
 * // zip :: Array a -> Array b -> Array [a, b]
 * zip ([1, 2, 3]) (['a', 'b']) // => [[1,'a'],[2,'b']]
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
 * Zips with a combining function, truncating to the shorter length.
 * @example 
 * // zipWith :: (a -> b -> c) -> Array a -> Array b -> Array c
 * zipWith (a => b => a + b) ([1, 2, 3]) ([10, 20]) // => [11, 22]
 */
export function zipWith (f) {
  return (xs) => (ys) => {
    const n = Math.min (xs.length, ys.length)
    const result = new Array (n)
    for (let i = 0; i < n; i++) result[i] = f (xs[i]) (ys[i])
    return result
  }
}

/**
 * Applicative traversal — passes explicit apOf, apAp, apMap operations.
 * @example 
 * // traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Array a -> f (Array b)
 * traverse (Array.of) (ff => fa => ff.flatMap (f => fa.map (f))) (f => fa => fa.map (f)) (x => [x, -x]) ([1, 2])
 */
export function traverse (apOf) {
  return (apAp) => (apMap) => (f) => (arr) => {
    if (arr.length === 0) return apOf ([])
    const lift2 = (fn, fa, fb) => apAp (apMap (fn, fa), fb)
    const go = (idx, n) => {
      switch (n) {
        case 0:
          return apOf ([])
        case 2:
          return lift2 ((a) => (b) => [a, b], f (arr[idx]), f (arr[idx + 1]))
        default: {
          const m = Math.floor (n / 4) * 2
          return lift2 ((a) => (b) => a.concat (b), go (idx, m), go (idx + m, n - m))
        }
      }
    }
    if (arr.length % 2 === 1) {
      return lift2 (
        (a) => (b) => a.concat (b),
        apMap ((x) => [x], f (arr[0])),
        go (1, arr.length - 1),
      )
    }
    return go (0, arr.length)
  }
}
