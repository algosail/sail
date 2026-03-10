import test from 'brittle'
import {
  of, empty, range, unfold, chainRec,
  equals, lte,
  isOutOfBounds, size,
  all, any, none, elem,
  array, lookup, head, last, tail, init,
  find, findMap,
  reduce, scanl, foldMap, joinWith,
  concat, append, prepend,
  map, filter, reject, partition,
  chain, flatten, ap,
  reverse, sort, sortBy, nub,
  extend,
  replicate,
  span, break_, splitAt, until,
  take, drop, takeLast, dropLast, takeWhile, dropWhile,
  intercalate, groupBy,
  zip, zipWith, traverse,
  mapM, forM,
} from '../lib/array.js'
import { just, nothing, isJust, isNothing } from '../lib/maybe.js'
import { just as mJust, nothing as mNothing, chain as mChain, isJust as mIsJust, isNothing as mIsNothing } from '../lib/maybe.js'
import { compare, comparing } from '../lib/ordering.js'

// =============================================================================
// Constructors
// =============================================================================

test ('of wraps a value in a single-element array', (t) => {
  t.alike (of (1), [1])
  t.alike (of ('x'), ['x'])
  t.alike (of (null), [null])
})

test ('empty returns an empty array', (t) => {
  t.alike (empty (), [])
})

test ('range produces an ascending range (exclusive end)', (t) => {
  t.alike (range (1) (5), [1, 2, 3, 4])
  t.alike (range (0) (3), [0, 1, 2])
})

test ('range returns empty array when lo equals hi', (t) => {
  t.alike (range (5) (5), [])
})

test ('range returns empty array when lo > hi', (t) => {
  t.alike (range (5) (1), [])
})

test ('unfold builds an array from a seed', (t) => {
  const countdown = unfold ((n) => n <= 0 ? nothing () : just ([n, n - 1])) (5)
  t.alike (countdown, [5, 4, 3, 2, 1])
})

test ('unfold returns empty array when seed immediately yields Nothing', (t) => {
  t.alike (unfold ((_) => nothing ()) (0), [])
})

test ('chainRec is stack-safe', (t) => {
  const result = chainRec (
    (next, done, n) => n <= 0 ? [done (0)] : [next (n - 1)]
  ) (10000)
  t.alike (result, [0])
})

// =============================================================================
// Eq / Ord
// =============================================================================

test ('equals returns true for element-wise equal arrays', (t) => {
  t.ok (equals ((a) => (b) => a === b) ([1, 2, 3]) ([1, 2, 3]))
  t.ok (equals ((a) => (b) => a === b) ([]) ([]))
})

test ('equals returns false for arrays of different lengths', (t) => {
  t.absent (equals ((a) => (b) => a === b) ([1, 2]) ([1, 2, 3]))
})

test ('equals returns false when any element differs', (t) => {
  t.absent (equals ((a) => (b) => a === b) ([1, 2, 3]) ([1, 9, 3]))
})

test ('lte returns true when first array is lexicographically <= second', (t) => {
  t.ok (lte ((a) => (b) => a <= b) ([1, 2]) ([1, 3]))
  t.ok (lte ((a) => (b) => a <= b) ([1, 2]) ([1, 2]))
  t.ok (lte ((a) => (b) => a <= b) ([]) ([1]))
  t.ok (lte ((a) => (b) => a <= b) ([]) ([]))
})

test ('lte returns false when first array is lexicographically > second', (t) => {
  t.absent (lte ((a) => (b) => a <= b) ([1, 3]) ([1, 2]))
  t.absent (lte ((a) => (b) => a <= b) ([1, 2, 3]) ([1, 2]))
})

// =============================================================================
// Guards / Accessors
// =============================================================================

test ('isOutOfBounds returns true for out-of-range indices', (t) => {
  t.ok (isOutOfBounds (3) ([1, 2, 3]))
  t.ok (isOutOfBounds (-1) ([1, 2, 3]))
  t.ok (isOutOfBounds (0) ([]))
})

test ('isOutOfBounds returns false for valid indices', (t) => {
  t.absent (isOutOfBounds (0) ([1, 2, 3]))
  t.absent (isOutOfBounds (2) ([1, 2, 3]))
})

test ('size returns the number of elements', (t) => {
  t.is (size ([1, 2, 3]), 3)
  t.is (size ([]), 0)
})

test ('all returns true when every element satisfies the predicate', (t) => {
  t.ok (all ((x) => x > 0) ([1, 2, 3]))
  t.ok (all ((x) => x > 0) ([]))
})

test ('all returns false when any element fails', (t) => {
  t.absent (all ((x) => x > 0) ([1, -1, 3]))
})

test ('any returns true when at least one element satisfies the predicate', (t) => {
  t.ok (any ((x) => x > 2) ([1, 2, 3]))
})

test ('any returns false when no element satisfies', (t) => {
  t.absent (any ((x) => x > 10) ([1, 2, 3]))
  t.absent (any ((x) => x > 0) ([]))
})

test ('none returns true when no element satisfies the predicate', (t) => {
  t.ok (none ((x) => x > 10) ([1, 2, 3]))
  t.ok (none ((x) => x > 0) ([]))
})

test ('none returns false when any element satisfies', (t) => {
  t.absent (none ((x) => x > 2) ([1, 2, 3]) )
})

test ('elem returns true when value is present', (t) => {
  t.ok (elem ((a) => (b) => a === b) (2) ([1, 2, 3]))
})

test ('elem returns false when value is absent', (t) => {
  t.absent (elem ((a) => (b) => a === b) (9) ([1, 2, 3]))
  t.absent (elem ((a) => (b) => a === b) (1) ([]))
})

test ('array performs case analysis', (t) => {
  t.is (array ('empty') ((h) => (_t) => `head:${h}`) ([1, 2, 3]), 'head:1')
  t.is (array ('empty') ((h) => (_t) => `head:${h}`) ([]), 'empty')
})

test ('lookup returns Just for a valid index', (t) => {
  const m = lookup (1) ([10, 20, 30])
  t.ok (isJust (m))
  t.is (m.value, 20)
})

test ('lookup returns Nothing for an out-of-bounds index', (t) => {
  t.ok (isNothing (lookup (5) ([1, 2, 3])))
  t.ok (isNothing (lookup (-1) ([1, 2, 3])))
  t.ok (isNothing (lookup (0) ([])))
})

test ('head returns Just of the first element', (t) => {
  const m = head ([1, 2, 3])
  t.ok (isJust (m))
  t.is (m.value, 1)
})

test ('head returns Nothing for empty array', (t) => {
  t.ok (isNothing (head ([])))
})

test ('last returns Just of the last element', (t) => {
  const m = last ([1, 2, 3])
  t.ok (isJust (m))
  t.is (m.value, 3)
})

test ('last returns Nothing for empty array', (t) => {
  t.ok (isNothing (last ([])))
})

test ('tail returns Just of the array without its first element', (t) => {
  const m = tail ([1, 2, 3])
  t.ok (isJust (m))
  t.alike (m.value, [2, 3])
})

test ('tail returns Just of empty array for single-element array', (t) => {
  const m = tail ([1])
  t.ok (isJust (m))
  t.alike (m.value, [])
})

test ('tail returns Nothing for empty array', (t) => {
  t.ok (isNothing (tail ([])))
})

test ('init returns Just of the array without its last element', (t) => {
  const m = init ([1, 2, 3])
  t.ok (isJust (m))
  t.alike (m.value, [1, 2])
})

test ('init returns Just of empty array for single-element array', (t) => {
  const m = init ([1])
  t.ok (isJust (m))
  t.alike (m.value, [])
})

test ('init returns Nothing for empty array', (t) => {
  t.ok (isNothing (init ([])))
})

test ('find returns Just the first matching element', (t) => {
  const m = find ((x) => x > 2) ([1, 2, 3, 4])
  t.ok (isJust (m))
  t.is (m.value, 3)
})

test ('find returns Nothing when no element matches', (t) => {
  t.ok (isNothing (find ((x) => x > 10) ([1, 2, 3])))
})

test ('findMap returns Just the first mapped Just result', (t) => {
  const m = findMap ((x) => x > 2 ? just (x * 10) : nothing ()) ([1, 2, 3, 4])
  t.ok (isJust (m))
  t.is (m.value, 30)
})

test ('findMap returns Nothing when no mapping yields Just', (t) => {
  t.ok (isNothing (findMap ((_x) => nothing ()) ([1, 2, 3])))
})

// =============================================================================
// Folds
// =============================================================================

test ('reduce folds left with a curried function', (t) => {
  t.is (reduce ((acc) => (x) => acc + x) (0) ([1, 2, 3, 4]), 10)
  t.is (reduce ((acc) => (x) => acc + x) (0) ([]), 0)
})

test ('scanl produces an array of accumulated values', (t) => {
  t.alike (scanl ((acc) => (x) => acc + x) (0) ([1, 2, 3]), [0, 1, 3, 6])
  t.alike (scanl ((acc) => (x) => acc + x) (0) ([]), [0])
})

test ('foldMap maps elements into a monoid and concatenates', (t) => {
  const result = foldMap ((a) => (b) => a.concat (b)) ([]) ((x) => [x * 2]) ([1, 2, 3])
  t.alike (result, [2, 4, 6])
})

test ('joinWith joins array elements with a separator', (t) => {
  t.is (joinWith ('-') (['a', 'b', 'c']), 'a-b-c')
  t.is (joinWith (', ') (['x', 'y']), 'x, y')
  t.is (joinWith ('-') ([]), '')
})

// =============================================================================
// Combining
// =============================================================================

test ('concat appends two arrays', (t) => {
  t.alike (concat ([1, 2]) ([3, 4]), [1, 2, 3, 4])
  t.alike (concat ([]) ([1, 2]), [1, 2])
  t.alike (concat ([1, 2]) ([]), [1, 2])
})

test ('append adds an element to the end', (t) => {
  t.alike (append (4) ([1, 2, 3]), [1, 2, 3, 4])
  t.alike (append (1) ([]), [1])
})

test ('prepend adds an element to the beginning', (t) => {
  t.alike (prepend (0) ([1, 2, 3]), [0, 1, 2, 3])
  t.alike (prepend (1) ([]), [1])
})

// =============================================================================
// Transformers
// =============================================================================

test ('map applies f to each element', (t) => {
  t.alike (map ((x) => x * 2) ([1, 2, 3]), [2, 4, 6])
  t.alike (map ((x) => x * 2) ([]), [])
})

test ('filter keeps elements satisfying the predicate', (t) => {
  t.alike (filter ((x) => x > 2) ([1, 2, 3, 4]), [3, 4])
  t.alike (filter ((x) => x > 10) ([1, 2, 3]), [])
})

test ('reject removes elements satisfying the predicate', (t) => {
  t.alike (reject ((x) => x > 2) ([1, 2, 3, 4]), [1, 2])
  t.alike (reject ((x) => x > 10) ([1, 2, 3]), [1, 2, 3])
})

test ('partition splits into [matching, non-matching]', (t) => {
  const [yes, no] = partition ((x) => x > 2) ([1, 2, 3, 4])
  t.alike (yes, [3, 4])
  t.alike (no, [1, 2])
})

test ('partition handles empty array', (t) => {
  const [yes, no] = partition ((x) => x > 0) ([])
  t.alike (yes, [])
  t.alike (no, [])
})

test ('chain flat-maps over an array', (t) => {
  t.alike (chain ((x) => [x, x * 2]) ([1, 2, 3]), [1, 2, 2, 4, 3, 6])
  t.alike (chain ((x) => [x]) ([]), [])
})

test ('flatten removes one level of nesting', (t) => {
  t.alike (flatten ([[1, 2], [3], [4, 5]]), [1, 2, 3, 4, 5])
  t.alike (flatten ([[], [1], []]), [1])
  t.alike (flatten ([]), [])
})

test ('ap applies an array of functions to an array of values', (t) => {
  t.alike (ap ([(x) => x + 1, (x) => x * 2]) ([10, 20]), [11, 21, 20, 40])
})

test ('reverse reverses the array without mutating', (t) => {
  const arr = [1, 2, 3]
  const rev = reverse (arr)
  t.alike (rev, [3, 2, 1])
  t.alike (arr, [1, 2, 3])
})

// array.sort uses a boolean lte comparator: (a -> a -> Boolean)
// array.sortBy uses (lteKey)(toKey)(arr)

test ('sort sorts using a boolean lte comparator', (t) => {
  t.alike (sort ((a) => (b) => a <= b) ([3, 1, 2]), [1, 2, 3])
  t.alike (sort ((a) => (b) => a <= b) ([]), [])
})

test ('sort is stable — equal elements preserve original order', (t) => {
  const lte = (a) => (b) => a.v <= b.v
  const arr = [{ v: 1, i: 0 }, { v: 1, i: 1 }, { v: 1, i: 2 }]
  const sorted = sort (lte) (arr)
  t.alike (sorted.map ((x) => x.i), [0, 1, 2])
})

test ('sortBy sorts by a projection function using a boolean lte on keys', (t) => {
  const people = [{ name: 'Carol', age: 35 }, { name: 'Alice', age: 25 }, { name: 'Bob', age: 30 }]
  const sorted = sortBy ((a) => (b) => a <= b) ((x) => x.age) (people)
  t.alike (sorted.map ((p) => p.name), ['Alice', 'Bob', 'Carol'])
})

test ('nub removes duplicate elements keeping first occurrences', (t) => {
  t.alike (nub ((a) => (b) => a === b) ([1, 2, 1, 3, 2, 4]), [1, 2, 3, 4])
  t.alike (nub ((a) => (b) => a === b) ([]), [])
})

test ('nub preserves order', (t) => {
  t.alike (nub ((a) => (b) => a === b) ([3, 1, 2, 1, 3]), [3, 1, 2])
})

// =============================================================================
// Slicing / Spanning
// =============================================================================

test ('extend applies f to each suffix starting at that index', (t) => {
  const result = extend ((xs) => xs[0]) ([1, 2, 3])
  t.alike (result, [1, 2, 3])
})

// take/drop/takeLast/dropLast all return Maybe — Just when 0 <= n <= length, Nothing otherwise

test ('take returns Just of the first n elements when n is in bounds', (t) => {
  const m1 = take (2) ([1, 2, 3, 4])
  t.ok (isJust (m1))
  t.alike (m1.value, [1, 2])

  const m2 = take (0) ([1, 2, 3])
  t.ok (isJust (m2))
  t.alike (m2.value, [])

  const m3 = take (3) ([1, 2, 3])
  t.ok (isJust (m3))
  t.alike (m3.value, [1, 2, 3])
})

test ('take returns Nothing when n > array length', (t) => {
  t.ok (isNothing (take (5) ([1, 2, 3])))
  t.ok (isNothing (take (1) ([])))
})

test ('drop returns Just of the array after dropping n elements', (t) => {
  const m1 = drop (2) ([1, 2, 3, 4])
  t.ok (isJust (m1))
  t.alike (m1.value, [3, 4])

  const m2 = drop (0) ([1, 2, 3])
  t.ok (isJust (m2))
  t.alike (m2.value, [1, 2, 3])

  const m3 = drop (3) ([1, 2, 3])
  t.ok (isJust (m3))
  t.alike (m3.value, [])
})

test ('drop returns Nothing when n > array length', (t) => {
  t.ok (isNothing (drop (5) ([1, 2, 3])))
  t.ok (isNothing (drop (1) ([])))
})

test ('takeLast returns Just of the last n elements', (t) => {
  const m1 = takeLast (2) ([1, 2, 3, 4])
  t.ok (isJust (m1))
  t.alike (m1.value, [3, 4])

  const m2 = takeLast (0) ([1, 2, 3])
  t.ok (isJust (m2))
  t.alike (m2.value, [])

  const m3 = takeLast (3) ([1, 2, 3])
  t.ok (isJust (m3))
  t.alike (m3.value, [1, 2, 3])
})

test ('takeLast returns Nothing when n > array length', (t) => {
  t.ok (isNothing (takeLast (5) ([1, 2, 3])))
  t.ok (isNothing (takeLast (1) ([])))
})

test ('dropLast returns Just of the array with last n elements removed', (t) => {
  const m1 = dropLast (2) ([1, 2, 3, 4])
  t.ok (isJust (m1))
  t.alike (m1.value, [1, 2])

  const m2 = dropLast (0) ([1, 2, 3])
  t.ok (isJust (m2))
  t.alike (m2.value, [1, 2, 3])

  const m3 = dropLast (3) ([1, 2, 3])
  t.ok (isJust (m3))
  t.alike (m3.value, [])
})

test ('dropLast returns Nothing when n > array length', (t) => {
  t.ok (isNothing (dropLast (5) ([1, 2, 3])))
  t.ok (isNothing (dropLast (1) ([])))
})

test ('takeWhile takes elements while predicate holds', (t) => {
  t.alike (takeWhile ((x) => x < 3) ([1, 2, 3, 4]), [1, 2])
  t.alike (takeWhile ((x) => x > 0) ([]), [])
  t.alike (takeWhile ((x) => x > 10) ([1, 2, 3]), [])
})

test ('dropWhile drops elements while predicate holds', (t) => {
  t.alike (dropWhile ((x) => x < 3) ([1, 2, 3, 4]), [3, 4])
  t.alike (dropWhile ((x) => x > 0) ([]), [])
  t.alike (dropWhile ((x) => x > 10) ([1, 2, 3]), [1, 2, 3])
})

// =============================================================================
// Grouping / Zipping
// =============================================================================

test ('intercalate inserts separator between subarrays', (t) => {
  t.alike (intercalate ([0]) ([[1, 2], [3, 4], [5]]), [1, 2, 0, 3, 4, 0, 5])
  t.alike (intercalate ([0]) ([]), [])
  t.alike (intercalate ([0]) ([[1]]), [1])
})

test ('groupBy groups consecutive elements by equality', (t) => {
  t.alike (groupBy ((a) => (b) => a === b) ([1, 1, 2, 2, 1]), [[1, 1], [2, 2], [1]])
  t.alike (groupBy ((a) => (b) => a === b) ([]), [])
  t.alike (groupBy ((a) => (b) => a === b) ([1, 2, 3]), [[1], [2], [3]])
})

test ('zip pairs elements from two arrays up to the shorter length', (t) => {
  t.alike (zip ([1, 2, 3]) ([4, 5, 6]), [[1, 4], [2, 5], [3, 6]])
  t.alike (zip ([1, 2]) ([4, 5, 6, 7]), [[1, 4], [2, 5]])
  t.alike (zip ([]) ([1, 2, 3]), [])
})

test ('zipWith combines pairs with a function', (t) => {
  t.alike (zipWith ((a) => (b) => a + b) ([1, 2, 3]) ([4, 5, 6]), [5, 7, 9])
  t.alike (zipWith ((a) => (b) => a * b) ([1, 2]) ([3, 4, 5]), [3, 8])
})

// =============================================================================
// Traversable
// =============================================================================

// array.traverse :: (apOf)(apAp)(apMap)(f)(arr)
// apAp :: f (a -> b) -> f a -> f b
// apMap :: (a -> b) -> f a -> f b
const apOf  = Array.of
const apAp  = (fs) => (xs) => fs.flatMap ((f) => xs.map (f))
const apMap = (f)  => (xs) => xs.map (f)

test ('traverse maps over array collecting effects', (t) => {
  const result = traverse (apOf) (apAp) (apMap) ((x) => [x, -x]) ([1, 2])
  t.is (result.length, 4)
  t.alike (result[0], [1, 2])
  t.alike (result[1], [1, -2])
  t.alike (result[2], [-1, 2])
  t.alike (result[3], [-1, -2])
})

test ('traverse on empty array returns the lifted empty array', (t) => {
  const result = traverse (apOf) (apAp) (apMap) ((x) => [x]) ([])
  t.alike (result, [[]])
})

// =============================================================================
// replicate
// =============================================================================

test ('replicate returns n copies of x', (t) => {
  t.alike (replicate (3) ('x'), ['x', 'x', 'x'])
  t.alike (replicate (1) (42), [42])
  t.alike (replicate (5) (true), [true, true, true, true, true])
})

test ('replicate with n=0 returns empty array', (t) => {
  t.alike (replicate (0) ('x'), [])
  t.alike (replicate (0) (null), [])
})

test ('replicate with n=1 returns singleton', (t) => {
  t.alike (replicate (1) (99), [99])
})

test ('replicate works with object values (all same reference)', (t) => {
  const obj = { x: 1 }
  const result = replicate (3) (obj)
  t.is (result.length, 3)
  t.is (result[0], obj)
  t.is (result[1], obj)
  t.is (result[2], obj)
})

// =============================================================================
// span
// =============================================================================

test ('span splits at the first element failing the predicate', (t) => {
  const [a, b] = span ((x) => x < 3) ([1, 2, 3, 4])
  t.alike (a, [1, 2])
  t.alike (b, [3, 4])
})

test ('span returns [[], arr] when first element fails', (t) => {
  const [a, b] = span ((x) => x < 0) ([1, 2, 3])
  t.alike (a, [])
  t.alike (b, [1, 2, 3])
})

test ('span returns [arr, []] when all elements pass', (t) => {
  const [a, b] = span ((x) => x > 0) ([1, 2, 3])
  t.alike (a, [1, 2, 3])
  t.alike (b, [])
})

test ('span on empty array returns [[], []]', (t) => {
  const [a, b] = span ((x) => x > 0) ([])
  t.alike (a, [])
  t.alike (b, [])
})

test ('span satisfies concat(a)(b) === original', (t) => {
  const arr = [1, 2, 3, 4, 5]
  const [a, b] = span ((x) => x <= 3) (arr)
  t.alike ([...a, ...b], arr)
})

// =============================================================================
// break_
// =============================================================================

test ('break_ splits at the first element satisfying the predicate', (t) => {
  const [a, b] = break_ ((x) => x > 2) ([1, 2, 3, 4])
  t.alike (a, [1, 2])
  t.alike (b, [3, 4])
})

test ('break_ returns [[], arr] when first element satisfies predicate', (t) => {
  const [a, b] = break_ ((x) => x > 0) ([1, 2, 3])
  t.alike (a, [])
  t.alike (b, [1, 2, 3])
})

test ('break_ returns [arr, []] when no element satisfies predicate', (t) => {
  const [a, b] = break_ ((x) => x < 0) ([1, 2, 3])
  t.alike (a, [1, 2, 3])
  t.alike (b, [])
})

test ('break_ on empty array returns [[], []]', (t) => {
  const [a, b] = break_ ((x) => x > 0) ([])
  t.alike (a, [])
  t.alike (b, [])
})

test ('break_ is complement of span', (t) => {
  const arr = [1, 2, 3, 4, 5]
  const pred = (x) => x > 3
  const [sa, sb] = span ((x) => !pred (x)) (arr)
  const [ba, bb] = break_ (pred) (arr)
  t.alike (sa, ba)
  t.alike (sb, bb)
})

test ('break_ satisfies concat(a)(b) === original', (t) => {
  const arr = [1, 2, 3, 4, 5]
  const [a, b] = break_ ((x) => x > 3) (arr)
  t.alike ([...a, ...b], arr)
})

// =============================================================================
// splitAt
// =============================================================================

test ('splitAt splits array at the given index', (t) => {
  const [a, b] = splitAt (2) ([1, 2, 3, 4])
  t.alike (a, [1, 2])
  t.alike (b, [3, 4])
})

test ('splitAt with n=0 returns [[], arr]', (t) => {
  const [a, b] = splitAt (0) ([1, 2, 3])
  t.alike (a, [])
  t.alike (b, [1, 2, 3])
})

test ('splitAt with n >= length returns [arr, []]', (t) => {
  const [a, b] = splitAt (5) ([1, 2, 3])
  t.alike (a, [1, 2, 3])
  t.alike (b, [])
})

test ('splitAt with n = length returns [arr, []]', (t) => {
  const [a, b] = splitAt (3) ([1, 2, 3])
  t.alike (a, [1, 2, 3])
  t.alike (b, [])
})

test ('splitAt on empty array returns [[], []]', (t) => {
  const [a, b] = splitAt (2) ([])
  t.alike (a, [])
  t.alike (b, [])
})

test ('splitAt satisfies concat(a)(b) === original', (t) => {
  const arr = [1, 2, 3, 4, 5]
  const [a, b] = splitAt (3) (arr)
  t.alike ([...a, ...b], arr)
})

test ('splitAt with n=1 returns singleton prefix', (t) => {
  const [a, b] = splitAt (1) ([10, 20, 30])
  t.alike (a, [10])
  t.alike (b, [20, 30])
})

// =============================================================================
// until
// =============================================================================

test ('until applies f repeatedly until pred holds', (t) => {
  t.is (until ((x) => x > 100) ((x) => x * 2) (1), 128)
})

test ('until returns x immediately when pred is already true', (t) => {
  t.is (until ((x) => x > 0) ((x) => x + 1) (5), 5)
})

test ('until counts down to zero', (t) => {
  t.is (until ((x) => x === 0) ((x) => x - 1) (5), 0)
})

test ('until works with string accumulation', (t) => {
  t.is (until ((s) => s.length >= 5) ((s) => s + 'a') (''), 'aaaaa')
})

test ('until with array growth', (t) => {
  const result = until ((arr) => arr.length >= 4) ((arr) => [...arr, arr.length]) ([])
  t.alike (result, [0, 1, 2, 3])
})

// =============================================================================
// mapM
// =============================================================================

test ('mapM collects Just results when all succeed', (t) => {
  const result = mapM (mChain) ((xs) => mJust (xs)) ((x) => x > 0 ? mJust (x) : mNothing ()) ([1, 2, 3])
  t.ok (mIsJust (result))
  t.alike (result.value, [1, 2, 3])
})

test ('mapM returns Nothing when any element fails', (t) => {
  const result = mapM (mChain) ((xs) => mJust (xs)) ((x) => x > 0 ? mJust (x) : mNothing ()) ([1, -1, 3])
  t.ok (mIsNothing (result))
})

test ('mapM on empty array returns lifted empty array', (t) => {
  const result = mapM (mChain) ((xs) => mJust (xs)) ((x) => mJust (x)) ([])
  t.ok (mIsJust (result))
  t.alike (result.value, [])
})

test ('mapM short-circuits on first Nothing', (t) => {
  let callCount = 0
  const f = (x) => {
    callCount++
    return x > 0 ? mJust (x) : mNothing ()
  }
  mapM (mChain) ((xs) => mJust (xs)) (f) ([1, -1, 3])
  t.is (callCount, 2)
})

test ('mapM transforms values inside the monad', (t) => {
  const result = mapM (mChain) ((xs) => mJust (xs)) ((x) => mJust (x * 2)) ([1, 2, 3])
  t.ok (mIsJust (result))
  t.alike (result.value, [2, 4, 6])
})

// =============================================================================
// forM
// =============================================================================

test ('forM is mapM with array and function flipped', (t) => {
  const result = forM (mChain) ((xs) => mJust (xs)) ([1, 2, 3]) ((x) => x > 0 ? mJust (x) : mNothing ())
  t.ok (mIsJust (result))
  t.alike (result.value, [1, 2, 3])
})

test ('forM returns Nothing when any element fails', (t) => {
  const result = forM (mChain) ((xs) => mJust (xs)) ([1, -1, 3]) ((x) => x > 0 ? mJust (x) : mNothing ())
  t.ok (mIsNothing (result))
})

test ('forM on empty array returns lifted empty array', (t) => {
  const result = forM (mChain) ((xs) => mJust (xs)) ([]) ((x) => mJust (x))
  t.ok (mIsJust (result))
  t.alike (result.value, [])
})

test ('forM and mapM produce identical results', (t) => {
  const f = (x) => mJust (x * 3)
  const arr = [1, 2, 3]
  const ofArr = (xs) => mJust (xs)
  const rm = mapM (mChain) (ofArr) (f) (arr)
  const rf = forM (mChain) (ofArr) (arr) (f)
  t.alike (rm.value, rf.value)
})
