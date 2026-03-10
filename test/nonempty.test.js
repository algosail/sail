import test from 'brittle'
import {
  of, singleton, fromArray,
  isNonEmpty,
  head, tail, last, init, toArray, size, fold,
  equals,
  concat,
  map, ap, chain,
  reduce, reduce1,
  filter,
  reverse, append, prepend, sort, traverse,
} from '../lib/nonempty.js'
import { isJust, isNothing } from '../lib/maybe.js'
import { compare } from '../lib/ordering.js'

// =============================================================================
// Constructors
// =============================================================================

test ('of constructs a NonEmptyArray from head and tail', (t) => {
  const nea = of (1) ([2, 3])
  t.is (nea.tag, 'nonempty')
  t.is (nea.head, 1)
  t.alike (nea.tail, [2, 3])
})

test ('of with empty tail', (t) => {
  const nea = of (1) ([])
  t.is (nea.head, 1)
  t.alike (nea.tail, [])
})

test ('singleton creates a single-element NonEmptyArray', (t) => {
  const nea = singleton (42)
  t.is (nea.tag, 'nonempty')
  t.is (nea.head, 42)
  t.alike (nea.tail, [])
})

test ('fromArray returns Just(NonEmptyArray) for a non-empty array', (t) => {
  const m = fromArray ([1, 2, 3])
  t.ok (isJust (m))
  t.is (m.value.head, 1)
  t.alike (m.value.tail, [2, 3])
})

test ('fromArray returns Just(singleton) for a single-element array', (t) => {
  const m = fromArray ([42])
  t.ok (isJust (m))
  t.is (m.value.head, 42)
  t.alike (m.value.tail, [])
})

test ('fromArray returns Nothing for an empty array', (t) => {
  t.ok (isNothing (fromArray ([])))
})

// =============================================================================
// Guards
// =============================================================================

test ('isNonEmpty returns true for a NonEmptyArray', (t) => {
  t.ok (isNonEmpty (singleton (1)))
  t.ok (isNonEmpty (of (1) ([2, 3])))
})

test ('isNonEmpty returns false for plain arrays', (t) => {
  t.absent (isNonEmpty ([1, 2, 3]))
  t.absent (isNonEmpty ([]))
})

test ('isNonEmpty returns false for non-array values', (t) => {
  t.absent (isNonEmpty (null))
  t.absent (isNonEmpty (42))
  t.absent (isNonEmpty ({ head: 1, tail: [] }))
  t.absent (isNonEmpty ({ tag: 'other', head: 1, tail: [] }))
})

// =============================================================================
// Destructors / Accessors
// =============================================================================

test ('head extracts the first element', (t) => {
  t.is (head (of (1) ([2, 3])), 1)
  t.is (head (singleton (42)), 42)
})

test ('tail returns the tail as a plain array', (t) => {
  t.alike (tail (of (1) ([2, 3])), [2, 3])
  t.alike (tail (singleton (1)), [])
})

test ('last returns the last element', (t) => {
  t.is (last (of (1) ([2, 3])), 3)
  t.is (last (singleton (5)), 5)
  t.is (last (of (1) ([2])), 2)
})

test ('init returns all elements except the last', (t) => {
  t.alike (init (of (1) ([2, 3])), [1, 2])
  t.alike (init (singleton (1)), [])
  t.alike (init (of (1) ([2])), [1])
})

test ('toArray converts a NonEmptyArray to a plain array', (t) => {
  t.alike (toArray (of (1) ([2, 3])), [1, 2, 3])
  t.alike (toArray (singleton (42)), [42])
  t.alike (toArray (of (1) ([])), [1])
})

test ('size returns the total number of elements', (t) => {
  t.is (size (of (1) ([2, 3])), 3)
  t.is (size (singleton (1)), 1)
  t.is (size (of (1) ([2, 3, 4, 5])), 5)
})

test ('fold applies the binary function to head and tail', (t) => {
  t.is (fold ((h) => (t) => h + t.length) (of (1) ([2, 3])), 3)
  t.is (fold ((h) => (tl) => [h, ...tl].join ('-')) (of ('a') (['b', 'c'])), 'a-b-c')
})

test ('fold on singleton receives head and empty tail', (t) => {
  t.is (fold ((h) => (tl) => tl.length === 0 ? h : -1) (singleton (99)), 99)
})

// =============================================================================
// Eq
// =============================================================================

test ('equals returns true for element-wise equal NonEmptyArrays', (t) => {
  const eq = (a) => (b) => a === b
  t.ok (equals (eq) (of (1) ([2, 3])) (of (1) ([2, 3])))
  t.ok (equals (eq) (singleton (5)) (singleton (5)))
})

test ('equals returns false when elements differ', (t) => {
  const eq = (a) => (b) => a === b
  t.absent (equals (eq) (of (1) ([2, 3])) (of (1) ([2, 4])))
  t.absent (equals (eq) (of (1) ([2])) (of (2) ([2])))
})

test ('equals returns false when sizes differ', (t) => {
  const eq = (a) => (b) => a === b
  t.absent (equals (eq) (of (1) ([2, 3])) (of (1) ([2])))
  t.absent (equals (eq) (singleton (1)) (of (1) ([2])))
})

test ('equals uses the provided comparator', (t) => {
  const approxEq = (a) => (b) => Math.abs (a - b) < 0.01
  t.ok (equals (approxEq) (of (1.001) ([2.002])) (of (1.002) ([2.001])))
  t.absent (equals (approxEq) (of (1) ([2])) (of (1) ([3])))
})

// =============================================================================
// Semigroup
// =============================================================================

test ('concat produces a NonEmptyArray from two NonEmptyArrays', (t) => {
  const result = concat (of (1) ([2])) (of (3) ([4]))
  t.ok (isNonEmpty (result))
  t.alike (toArray (result), [1, 2, 3, 4])
})

test ('concat uses first element as head', (t) => {
  const result = concat (singleton (1)) (of (2) ([3]))
  t.is (head (result), 1)
  t.alike (tail (result), [2, 3])
})

test ('concat with singletons', (t) => {
  const result = concat (singleton ('a')) (singleton ('b'))
  t.alike (toArray (result), ['a', 'b'])
})

test ('concat is associative', (t) => {
  const eq = (a) => (b) => a === b
  const a = of (1) ([2])
  const b = of (3) ([4])
  const c = of (5) ([6])
  const lhs = concat (concat (a) (b)) (c)
  const rhs = concat (a) (concat (b) (c))
  t.ok (equals (eq) (lhs) (rhs))
})

// =============================================================================
// Functor
// =============================================================================

test ('map applies f to every element', (t) => {
  const result = map ((x) => x * 2) (of (1) ([2, 3]))
  t.ok (isNonEmpty (result))
  t.alike (toArray (result), [2, 4, 6])
})

test ('map preserves NonEmptyArray structure', (t) => {
  const result = map ((x) => x + 1) (singleton (5))
  t.ok (isNonEmpty (result))
  t.is (head (result), 6)
  t.alike (tail (result), [])
})

test ('map identity law: map(id)(nea) has same elements', (t) => {
  const nea = of (1) ([2, 3])
  const result = map ((x) => x) (nea)
  t.alike (toArray (result), toArray (nea))
})

test ('map composition: map(g ∘ f) === map(g) ∘ map(f)', (t) => {
  const f = (x) => x + 1
  const g = (x) => x * 2
  const nea = of (1) ([2, 3])
  const lhs = map ((x) => g (f (x))) (nea)
  const rhs = map (g) (map (f) (nea))
  t.alike (toArray (lhs), toArray (rhs))
})

// =============================================================================
// Applicative
// =============================================================================

test ('ap applies each function to each value', (t) => {
  const result = ap (of ((x) => x + 1) ([(x) => x * 2])) (of (10) ([20]))
  t.ok (isNonEmpty (result))
  t.alike (toArray (result), [11, 21, 20, 40])
})

test ('ap with singleton function and singleton value', (t) => {
  const result = ap (singleton ((x) => x + 1)) (singleton (5))
  t.ok (isNonEmpty (result))
  t.is (head (result), 6)
})

test ('ap size is product of function count and value count', (t) => {
  const fns = of ((x) => x) ([(x) => x + 1, (x) => x + 2])  // 3 functions
  const vals = of (10) ([20])                                   // 2 values
  const result = ap (fns) (vals)
  t.is (size (result), 6)
})

// =============================================================================
// Monad
// =============================================================================

test ('chain flat-maps over every element', (t) => {
  const result = chain ((x) => of (x) ([x * 2])) (of (1) ([2]))
  t.ok (isNonEmpty (result))
  t.alike (toArray (result), [1, 2, 2, 4])
})

test ('chain with singleton function returning singleton', (t) => {
  const result = chain ((x) => singleton (x * 10)) (of (1) ([2, 3]))
  t.alike (toArray (result), [10, 20, 30])
})

test ('chain left identity: chain(f)(singleton(a)) === f(a)', (t) => {
  const f = (x) => of (x) ([x + 1])
  const a = 5
  const eq = (x) => (y) => x === y
  t.ok (equals (eq) (chain (f) (singleton (a))) (f (a)))
})

// =============================================================================
// Foldable
// =============================================================================

test ('reduce folds all elements left-to-right', (t) => {
  t.is (reduce ((acc) => (x) => acc + x) (0) (of (1) ([2, 3, 4])), 10)
  t.is (reduce ((acc) => (x) => acc + x) (0) (singleton (5)), 5)
})

test ('reduce uses init as the starting accumulator', (t) => {
  t.is (reduce ((acc) => (x) => acc + x) (10) (of (1) ([2])), 13)
})

test ('reduce1 folds with head as the initial value', (t) => {
  t.is (reduce1 ((acc) => (x) => acc + x) (of (1) ([2, 3, 4])), 10)
  t.is (reduce1 ((acc) => (x) => acc + x) (singleton (5)), 5)
})

test ('reduce1 does not need an init value', (t) => {
  const result = reduce1 ((acc) => (x) => Math.max (acc, x)) (of (3) ([1, 4, 1, 5, 9, 2]))
  t.is (result, 9)
})

// =============================================================================
// Filtering
// =============================================================================

test ('filter returns Just(NonEmptyArray) when some elements pass', (t) => {
  const m = filter ((x) => x > 1) (of (1) ([2, 3]))
  t.ok (isJust (m))
  t.alike (toArray (m.value), [2, 3])
})

test ('filter returns Just(singleton) when only one element passes', (t) => {
  const m = filter ((x) => x > 2) (of (1) ([2, 3]))
  t.ok (isJust (m))
  t.alike (toArray (m.value), [3])
})

test ('filter returns Nothing when no elements pass', (t) => {
  t.ok (isNothing (filter ((x) => x > 9) (of (1) ([2, 3]))))
  t.ok (isNothing (filter ((x) => x > 9) (singleton (1))))
})

test ('filter with always-true predicate returns all elements', (t) => {
  const nea = of (1) ([2, 3])
  const m = filter ((_) => true) (nea)
  t.ok (isJust (m))
  t.alike (toArray (m.value), toArray (nea))
})

// =============================================================================
// Utilities
// =============================================================================

test ('reverse reverses the NonEmptyArray', (t) => {
  const result = reverse (of (1) ([2, 3]))
  t.ok (isNonEmpty (result))
  t.alike (toArray (result), [3, 2, 1])
})

test ('reverse of singleton is itself', (t) => {
  const nea = singleton (42)
  t.alike (toArray (reverse (nea)), toArray (nea))
})

test ('reverse is its own inverse', (t) => {
  const nea = of (1) ([2, 3, 4])
  t.alike (toArray (reverse (reverse (nea))), toArray (nea))
})

test ('reverse does not mutate the original', (t) => {
  const nea = of (1) ([2, 3])
  reverse (nea)
  t.alike (toArray (nea), [1, 2, 3])
})

test ('append adds an element to the end', (t) => {
  const result = append (4) (of (1) ([2, 3]))
  t.alike (toArray (result), [1, 2, 3, 4])
})

test ('append on singleton produces a two-element NonEmptyArray', (t) => {
  const result = append (2) (singleton (1))
  t.alike (toArray (result), [1, 2])
})

test ('prepend adds an element to the beginning', (t) => {
  const result = prepend (0) (of (1) ([2, 3]))
  t.alike (toArray (result), [0, 1, 2, 3])
})

test ('prepend on singleton produces a two-element NonEmptyArray', (t) => {
  const result = prepend (0) (singleton (1))
  t.alike (toArray (result), [0, 1])
})

test ('sort sorts using an Ordering comparator', (t) => {
  const result = sort (compare) (of (3) ([1, 4, 1, 5, 2]))
  t.ok (isNonEmpty (result))
  t.alike (toArray (result), [1, 1, 2, 3, 4, 5])
})

test ('sort on singleton returns an equal singleton', (t) => {
  const result = sort (compare) (singleton (42))
  t.alike (toArray (result), [42])
})

test ('sort is stable — equal elements preserve original order', (t) => {
  const cmp = (a) => (b) => compare (a.v) (b.v)
  const nea = of ({ v: 1, i: 0 }) ([{ v: 1, i: 1 }, { v: 1, i: 2 }])
  const result = sort (cmp) (nea)
  t.alike (toArray (result).map ((x) => x.i), [0, 1, 2])
})

test ('sort does not mutate the original', (t) => {
  const nea = of (3) ([1, 2])
  sort (compare) (nea)
  t.alike (toArray (nea), [3, 1, 2])
})

// =============================================================================
// Traversable
// =============================================================================

const apOf  = Array.of
const apAp  = (ff) => (fa) => ff.flatMap ((f) => fa.map (f))
const apMap = (f)  => (fa) => fa.map (f)

test ('traverse on a singleton collects one effect', (t) => {
  const result = traverse (apOf) (apAp) (apMap) ((x) => [x, -x]) (singleton (1))
  t.is (result.length, 2)
  t.ok (result.every (isNonEmpty))
  t.alike (toArray (result[0]), [1])
  t.alike (toArray (result[1]), [-1])
})

test ('traverse on a two-element NonEmptyArray produces cartesian product', (t) => {
  // f(1) = [1, -1], f(2) = [2, -2]  →  4 combinations
  const result = traverse (apOf) (apAp) (apMap) ((x) => [x, -x]) (of (1) ([2]))
  t.is (result.length, 4)
  t.ok (result.every (isNonEmpty))
  t.alike (toArray (result[0]), [1,  2])
  t.alike (toArray (result[1]), [1, -2])
  t.alike (toArray (result[2]), [-1,  2])
  t.alike (toArray (result[3]), [-1, -2])
})

test ('traverse on a three-element NonEmptyArray preserves all values', (t) => {
  // f returns a singleton array — behaves like map
  const result = traverse (apOf) (apAp) (apMap) ((x) => [x * 10]) (of (1) ([2, 3]))
  t.is (result.length, 1)
  t.ok (isNonEmpty (result[0]))
  t.alike (toArray (result[0]), [10, 20, 30])
})

test ('traverse identity: using singleton applicative is like map', (t) => {
  const result = traverse (apOf) (apAp) (apMap) ((x) => [x + 1]) (of (1) ([2, 3]))
  t.is (result.length, 1)
  t.alike (toArray (result[0]), [2, 3, 4])
})

test ('traverse signature: (apOf)(apAp)(apMap)(f)(nea)', (t) => {
  const result = traverse (apOf) (apAp) (apMap) ((x) => [x * 10]) (singleton (5))
  t.is (result.length, 1)
  t.ok (isNonEmpty (result[0]))
  t.is (toArray (result[0])[0], 50)
})
