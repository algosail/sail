// ordering.js – The Ordering type (LT | EQ | GT).
//
// Ordering is the canonical result type of a comparison.  It forms a Monoid
// where the empty element is EQ and concat keeps the first non-EQ value —
// which makes it trivial to chain multi-field comparators.
//
// Ordering = LT | EQ | GT

// =============================================================================
// Constructors
// =============================================================================

/**
 * Less-than ordering.
 * @example
 * // lt :: Ordering
 * lt // => { tag: 'LT' }
 */
export const lt = { tag: 'LT' }

/**
 * Equal ordering — the identity element of the Ordering Monoid.
 * @example
 * // eq :: Ordering
 * eq // => { tag: 'EQ' }
 */
export const eq = { tag: 'EQ' }

/**
 * Greater-than ordering.
 * @example
 * // gt :: Ordering
 * gt // => { tag: 'GT' }
 */
export const gt = { tag: 'GT' }

// =============================================================================
// Guards
// =============================================================================

/**
 * True when the value is an Ordering.
 * @example
 * // isOrdering :: a -> Boolean
 * isOrdering (lt) // => true
 * isOrdering (0)  // => false
 */
export function isOrdering (a) {
  return a === lt || a === eq || a === gt
}

/**
 * True when the Ordering is LT.
 * @example
 * // isLT :: Ordering -> Boolean
 * isLT (lt) // => true
 * isLT (eq) // => false
 */
export function isLT (o) {
  return o.tag === 'LT'
}

/**
 * True when the Ordering is EQ.
 * @example
 * // isEQ :: Ordering -> Boolean
 * isEQ (eq) // => true
 * isEQ (lt) // => false
 */
export function isEQ (o) {
  return o.tag === 'EQ'
}

/**
 * True when the Ordering is GT.
 * @example
 * // isGT :: Ordering -> Boolean
 * isGT (gt) // => true
 * isGT (eq) // => false
 */
export function isGT (o) {
  return o.tag === 'GT'
}

// =============================================================================
// Eq
// =============================================================================

/**
 * True when both Orderings are the same constructor.
 * @example
 * // equals :: Ordering -> Ordering -> Boolean
 * equals (lt) (lt) // => true
 * equals (lt) (gt) // => false
 */
export function equals (a) {
  return (b) => a.tag === b.tag
}

// =============================================================================
// Semigroup / Monoid
// =============================================================================

/**
 * Monoid concat — returns the first non-EQ value, or EQ if both are EQ.
 * This is the key operation for chaining multi-field comparators:
 * the first comparison that is not EQ determines the result.
 * @example
 * // concat :: Ordering -> Ordering -> Ordering
 * concat (lt) (gt) // => lt
 * concat (eq) (gt) // => gt
 * concat (eq) (eq) // => eq
 */
export function concat (a) {
  return (b) => isEQ (a) ? b : a
}

/**
 * The identity element for concat — EQ.
 * @example
 * // empty :: Ordering
 * empty // => { tag: 'EQ' }
 */
export const empty = eq

// =============================================================================
// Destructor
// =============================================================================

/**
 * Case analysis on an Ordering.
 * @example
 * // ordering :: a -> a -> a -> Ordering -> a
 * ordering (-1) (0) (1) (lt) // => -1
 * ordering (-1) (0) (1) (eq) // => 0
 * ordering (-1) (0) (1) (gt) // => 1
 */
export function ordering (onLT) {
  return (onEQ) => (onGT) => (o) => {
    if (isLT (o)) return onLT
    if (isGT (o)) return onGT
    return onEQ
  }
}

// =============================================================================
// Conversion
// =============================================================================

/**
 * Converts an Ordering to the conventional JS comparator integer.
 * @example
 * // toNumber :: Ordering -> -1 | 0 | 1
 * toNumber (lt) // => -1
 * toNumber (eq) // => 0
 * toNumber (gt) // => 1
 */
export function toNumber (o) {
  if (isLT (o)) return -1
  if (isGT (o)) return 1
  return 0
}

/**
 * Converts a JS comparator integer (negative / zero / positive) to Ordering.
 * @example
 * // fromNumber :: Number -> Ordering
 * fromNumber (-3) // => lt
 * fromNumber (0)  // => eq
 * fromNumber (7)  // => gt
 */
export function fromNumber (n) {
  if (n < 0) return lt
  if (n > 0) return gt
  return eq
}

// =============================================================================
// Comparison utilities
// =============================================================================

/**
 * Derives an Ordering from a value using its natural JS ordering.
 * Equivalent to Haskell's `compare` for types with (<) and (>).
 * @example
 * // compare :: a -> a -> Ordering
 * compare (1) (2) // => lt
 * compare (2) (2) // => eq
 * compare (3) (2) // => gt
 */
export function compare (a) {
  return (b) => a < b ? lt : a > b ? gt : eq
}

/**
 * Builds a comparator by projecting both values through f before comparing.
 * The primary tool for building sort keys — equivalent to Haskell's
 * `comparing`.
 * @example
 * // comparing :: Ord b => (a -> b) -> a -> a -> Ordering
 * comparing (x => x.age) ({ age: 30 }) ({ age: 25 }) // => gt
 */
export function comparing (f) {
  return (a) => (b) => compare (f (a)) (f (b))
}

/**
 * Reverses an Ordering — swaps LT and GT, keeps EQ.
 * Use with `comparing` to sort descending.
 * @example
 * // invert :: Ordering -> Ordering
 * invert (lt) // => gt
 * invert (eq) // => eq
 * invert (gt) // => lt
 */
export function invert (o) {
  if (isLT (o)) return gt
  if (isGT (o)) return lt
  return eq
}

/**
 * Converts a curried Ordering comparator to a JS-style comparator
 * (a, b) => number, suitable for use with Array.prototype.sort directly.
 * @example
 * // toComparator :: (a -> a -> Ordering) -> (a, a) -> Number
 * [3, 1, 2].sort (toComparator (compare)) // => [1, 2, 3]
 */
export function toComparator (cmp) {
  return (a, b) => toNumber (cmp (a) (b))
}

/**
 * Stable sort of an array using an Ordering comparator.
 * Replaces the boolean-lte sort from array.js with a richer interface.
 * @example
 * // sortWith :: (a -> a -> Ordering) -> Array a -> Array a
 * sortWith (compare) ([3, 1, 2]) // => [1, 2, 3]
 * sortWith (comparing (x => x.n)) ([{ n: 2 }, { n: 1 }]) // => [{ n: 1 }, { n: 2 }]
 */
export function sortWith (cmp) {
  return (arr) => {
    const indexed = arr.map ((x, i) => [x, i])
    indexed.sort (([a, i], [b, j]) => {
      const o = cmp (a) (b)
      if (isEQ (o)) return i - j
      return toNumber (o)
    })
    return indexed.map (([x]) => x)
  }
}

/**
 * Combines two Ordering comparators — the second is used only when the
 * first yields EQ.  This is just `concat` lifted to comparator functions,
 * enabling clean multi-field sorts.
 * @example
 * // concatComparators :: (a -> a -> Ordering) -> (a -> a -> Ordering) -> a -> a -> Ordering
 * const byAge  = comparing (x => x.age)
 * const byName = comparing (x => x.name)
 * sortWith (concatComparators (byAge) (byName)) (people)
 */
export function concatComparators (c1) {
  return (c2) => (a) => (b) => concat (c1 (a) (b)) (c2 (a) (b))
}
