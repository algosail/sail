import test from 'brittle'
import {
  lt, eq, gt,
  isOrdering, isLT, isEQ, isGT,
  equals, concat, empty,
  ordering, toNumber, fromNumber,
  compare, comparing, invert,
  toComparator, sortWith, concatComparators,
} from '../lib/ordering.js'

// =============================================================================
// Constructors
// =============================================================================

test ('lt has tag LT', (t) => {
  t.is (lt.tag, 'LT')
})

test ('eq has tag EQ', (t) => {
  t.is (eq.tag, 'EQ')
})

test ('gt has tag GT', (t) => {
  t.is (gt.tag, 'GT')
})

test ('empty is eq', (t) => {
  t.is (empty, eq)
})

// =============================================================================
// Guards
// =============================================================================

test ('isOrdering returns true only for lt, eq, gt', (t) => {
  t.ok (isOrdering (lt))
  t.ok (isOrdering (eq))
  t.ok (isOrdering (gt))
  t.absent (isOrdering (0))
  t.absent (isOrdering ('LT'))
  t.absent (isOrdering (null))
  t.absent (isOrdering ({ tag: 'LT' }))
})

test ('isLT returns true only for lt', (t) => {
  t.ok (isLT (lt))
  t.absent (isLT (eq))
  t.absent (isLT (gt))
})

test ('isEQ returns true only for eq', (t) => {
  t.ok (isEQ (eq))
  t.absent (isEQ (lt))
  t.absent (isEQ (gt))
})

test ('isGT returns true only for gt', (t) => {
  t.ok (isGT (gt))
  t.absent (isGT (lt))
  t.absent (isGT (eq))
})

// =============================================================================
// Eq
// =============================================================================

test ('equals returns true for the same constructor', (t) => {
  t.ok (equals (lt) (lt))
  t.ok (equals (eq) (eq))
  t.ok (equals (gt) (gt))
})

test ('equals returns false for different constructors', (t) => {
  t.absent (equals (lt) (eq))
  t.absent (equals (lt) (gt))
  t.absent (equals (eq) (gt))
  t.absent (equals (gt) (lt))
})

// =============================================================================
// Semigroup / Monoid
// =============================================================================

test ('concat returns the first non-EQ value', (t) => {
  t.is (concat (lt) (gt), lt)
  t.is (concat (gt) (lt), gt)
  t.is (concat (lt) (lt), lt)
  t.is (concat (gt) (gt), gt)
})

test ('concat returns the second when first is EQ', (t) => {
  t.is (concat (eq) (gt), gt)
  t.is (concat (eq) (lt), lt)
  t.is (concat (eq) (eq), eq)
})

test ('concat satisfies left identity: concat(empty)(x) === x', (t) => {
  t.is (concat (empty) (lt), lt)
  t.is (concat (empty) (eq), eq)
  t.is (concat (empty) (gt), gt)
})

test ('concat satisfies right identity: concat(x)(empty) === x', (t) => {
  t.is (concat (lt) (empty), lt)
  t.is (concat (eq) (empty), eq)
  t.is (concat (gt) (empty), gt)
})

// =============================================================================
// Destructor
// =============================================================================

test ('ordering selects the correct branch', (t) => {
  t.is (ordering (-1) (0) (1) (lt), -1)
  t.is (ordering (-1) (0) (1) (eq), 0)
  t.is (ordering (-1) (0) (1) (gt), 1)
})

test ('ordering works with non-numeric values', (t) => {
  t.is (ordering ('less') ('equal') ('greater') (lt), 'less')
  t.is (ordering ('less') ('equal') ('greater') (eq), 'equal')
  t.is (ordering ('less') ('equal') ('greater') (gt), 'greater')
})

// =============================================================================
// Conversion
// =============================================================================

test ('toNumber converts Ordering to -1 | 0 | 1', (t) => {
  t.is (toNumber (lt), -1)
  t.is (toNumber (eq), 0)
  t.is (toNumber (gt), 1)
})

test ('fromNumber converts negative to lt', (t) => {
  t.is (fromNumber (-1), lt)
  t.is (fromNumber (-100), lt)
})

test ('fromNumber converts zero to eq', (t) => {
  t.is (fromNumber (0), eq)
})

test ('fromNumber converts positive to gt', (t) => {
  t.is (fromNumber (1), gt)
  t.is (fromNumber (100), gt)
})

// =============================================================================
// Comparison utilities
// =============================================================================

test ('compare returns lt when a < b', (t) => {
  t.is (compare (1) (2), lt)
  t.is (compare ('a') ('b'), lt)
})

test ('compare returns eq when a === b', (t) => {
  t.is (compare (2) (2), eq)
  t.is (compare ('x') ('x'), eq)
})

test ('compare returns gt when a > b', (t) => {
  t.is (compare (3) (2), gt)
  t.is (compare ('b') ('a'), gt)
})

test ('comparing builds a comparator from a projection function', (t) => {
  t.is (comparing ((x) => x.age) ({ age: 30 }) ({ age: 25 }), gt)
  t.is (comparing ((x) => x.age) ({ age: 25 }) ({ age: 30 }), lt)
  t.is (comparing ((x) => x.age) ({ age: 25 }) ({ age: 25 }), eq)
})

test ('invert swaps LT and GT, keeps EQ', (t) => {
  t.is (invert (lt), gt)
  t.is (invert (gt), lt)
  t.is (invert (eq), eq)
})

test ('invert is its own inverse', (t) => {
  t.is (invert (invert (lt)), lt)
  t.is (invert (invert (gt)), gt)
  t.is (invert (invert (eq)), eq)
})

// =============================================================================
// sortWith
// =============================================================================

test ('sortWith sorts an array using an Ordering comparator', (t) => {
  t.alike (sortWith (compare) ([3, 1, 2]), [1, 2, 3])
})

test ('sortWith sorts descending when using inverted comparator', (t) => {
  const descCompare = (a) => (b) => invert (compare (a) (b))
  t.alike (sortWith (descCompare) ([3, 1, 2]), [3, 2, 1])
})

test ('sortWith sorts objects by a projection', (t) => {
  const byAge = comparing ((x) => x.age)
  const people = [{ name: 'Bob', age: 30 }, { name: 'Alice', age: 25 }, { name: 'Carol', age: 35 }]
  const sorted = sortWith (byAge) (people)
  t.alike (sorted.map ((p) => p.name), ['Alice', 'Bob', 'Carol'])
})

test ('sortWith is stable — preserves order of equal elements', (t) => {
  const byAge = comparing ((x) => x.age)
  const people = [{ name: 'A', age: 25 }, { name: 'B', age: 25 }, { name: 'C', age: 25 }]
  const sorted = sortWith (byAge) (people)
  t.alike (sorted.map ((p) => p.name), ['A', 'B', 'C'])
})

test ('sortWith does not mutate the original array', (t) => {
  const arr = [3, 1, 2]
  const sorted = sortWith (compare) (arr)
  t.alike (arr, [3, 1, 2])
  t.alike (sorted, [1, 2, 3])
})

test ('sortWith handles an empty array', (t) => {
  t.alike (sortWith (compare) ([]), [])
})

test ('sortWith handles a single element', (t) => {
  t.alike (sortWith (compare) ([42]), [42])
})

// =============================================================================
// toComparator
// =============================================================================

test ('toComparator converts to a JS-style comparator usable with Array.sort', (t) => {
  const result = [3, 1, 2].sort (toComparator (compare))
  t.alike (result, [1, 2, 3])
})

test ('toComparator returns negative for LT', (t) => {
  t.ok (toComparator (compare) (1, 2) < 0)
})

test ('toComparator returns 0 for EQ', (t) => {
  t.is (toComparator (compare) (2, 2), 0)
})

test ('toComparator returns positive for GT', (t) => {
  t.ok (toComparator (compare) (3, 2) > 0)
})

// =============================================================================
// concatComparators
// =============================================================================

test ('concatComparators uses first comparator when it is not EQ', (t) => {
  const byAge  = comparing ((x) => x.age)
  const byName = comparing ((x) => x.name)
  const combined = concatComparators (byAge) (byName)
  t.is (combined ({ age: 25, name: 'Z' }) ({ age: 30, name: 'A' }), lt)
})

test ('concatComparators falls back to second when first is EQ', (t) => {
  const byAge  = comparing ((x) => x.age)
  const byName = comparing ((x) => x.name)
  const combined = concatComparators (byAge) (byName)
  t.is (combined ({ age: 25, name: 'Alice' }) ({ age: 25, name: 'Bob' }), lt)
})

test ('concatComparators returns EQ when both comparators return EQ', (t) => {
  const byAge  = comparing ((x) => x.age)
  const byName = comparing ((x) => x.name)
  const combined = concatComparators (byAge) (byName)
  t.is (combined ({ age: 25, name: 'Alice' }) ({ age: 25, name: 'Alice' }), eq)
})

test ('concatComparators enables stable multi-field sort', (t) => {
  const byAge  = comparing ((x) => x.age)
  const byName = comparing ((x) => x.name)
  const people = [
    { name: 'Carol', age: 30 },
    { name: 'Alice', age: 25 },
    { name: 'Bob',   age: 30 },
    { name: 'Dave',  age: 25 },
  ]
  const sorted = sortWith (concatComparators (byAge) (byName)) (people)
  t.alike (sorted.map ((p) => p.name), ['Alice', 'Dave', 'Bob', 'Carol'])
})
