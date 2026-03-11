// ordering.js
// The Ordering type (LT | EQ | GT).
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
 * The "less-than" Ordering — a constant value, not a function.
 * Returned by `compare(a)(b)` when `a < b`, and used directly when constructing sort keys
 * or as input to `concat` for multi-field comparison chains.
 * @example
 * // lt :: Ordering
 * lt
 * // => { tag: 'LT' }
 */
export const lt = { tag: 'LT' }

/**
 * The "equal" Ordering — a constant value, not a function.
 * This is also the identity element (empty) of the Ordering `Monoid`: `concat(eq)(x) === x`
 * for any `x`. Use `eq` directly when you want to express "no preference" in a sort key,
 * or as the starting value when folding a list of comparators.
 * @example
 * // eq :: Ordering
 * eq
 * // => { tag: 'EQ' }
 */
export const eq = { tag: 'EQ' }

/**
 * The "greater-than" Ordering — a constant value, not a function.
 * Returned by `compare(a)(b)` when `a > b`. Combine with `invert` to turn a `gt` into `lt`
 * and thereby reverse the sort direction without rewriting the entire comparator.
 * @example
 * // gt :: Ordering
 * gt
 * // => { tag: 'GT' }
 */
export const gt = { tag: 'GT' }

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns `true` when the value is one of the three `Ordering` constants: `lt`, `eq`, or `gt`.
 * Use as a runtime guard when accepting comparison results from external sources or when
 * asserting that a custom comparator function actually returns a valid `Ordering`.
 * @example
 * // isOrdering :: a -> Boolean
 * isOrdering (lt)
 * // => true
 * isOrdering (eq)
 * // => true
 * isOrdering (0)
 * // => false
 */
export function isOrdering (a) {
  return a === lt || a === eq || a === gt
}

/**
 * Returns `true` when the Ordering is LT.
 * Use as a guard when you need to branch specifically on the "less than" case, for example
 * to apply a discount only when the input is below a threshold.
 * @example
 * // isLT :: Ordering -> Boolean
 * isLT (lt)
 * // => true
 * isLT (eq)
 * // => false
 */
export function isLT (o) {
  return o.tag === 'LT'
}

/**
 * Returns `true` when the Ordering is EQ.
 * Use as a guard to detect a tie before falling through to a secondary comparator,
 * or to confirm that two values compare as identical under a given sort key.
 * @example
 * // isEQ :: Ordering -> Boolean
 * isEQ (eq)
 * // => true
 * isEQ (lt)
 * // => false
 */
export function isEQ (o) {
  return o.tag === 'EQ'
}

/**
 * Returns `true` when the Ordering is GT.
 * Use as a guard to detect the "greater than" case — for example to reject values that
 * exceed a maximum, or to apply a surcharge when demand outpaces a threshold.
 * @example
 * // isGT :: Ordering -> Boolean
 * isGT (gt)
 * // => true
 * isGT (eq)
 * // => false
 */
export function isGT (o) {
  return o.tag === 'GT'
}

// =============================================================================
// Eq
// =============================================================================

/**
 * Returns `true` when both `Ordering` values share the same constructor tag.
 * Since there are only three distinct `Ordering` values, this is effectively reference equality.
 * Use it when you need to compare two comparison results — for example, asserting that a sort
 * key produces the expected outcome in a test.
 * @example
 * // equals :: Ordering -> Ordering -> Boolean
 * equals (lt) (lt)
 * // => true
 * equals (eq) (eq)
 * // => true
 * equals (lt) (gt)
 * // => false
 */
export function equals (a) {
  return (b) => a.tag === b.tag
}

// =============================================================================
// Semigroup / Monoid
// =============================================================================

/**
 * The `Monoid` concatenation for `Ordering` — returns the first non-`EQ` value, or `EQ` if both are equal.
 * This encodes lexicographic priority: the first comparison that "breaks the tie" wins, and `EQ`
 * means "defer to the next comparator". Chain multiple `concat` calls — or use `concatComparators`
 * — to sort by a primary key, then a secondary key, then a tertiary key, and so on.
 * @example
 * // concat :: Ordering -> Ordering -> Ordering
 * concat (lt) (gt)
 * // => lt
 * concat (eq) (gt)
 * // => gt
 * concat (eq) (eq)
 * // => eq
 */
export function concat (a) {
  return (b) => isEQ (a) ? b : a
}

/**
 * The identity element of the `Ordering` `Monoid` — equal to `eq`.
 * `concat(empty)(x)` is always `x`, making `empty` the correct starting value when
 * folding a list of `Ordering` values, such as when reducing a sequence of sort keys
 * down to a single comparison result.
 * @example
 * // empty :: Ordering
 * empty
 * // => { tag: 'EQ' }
 */
export const empty = eq

// =============================================================================
// Destructor
// =============================================================================

/**
 * Case analysis on an `Ordering` — returns one of three values based on the constructor.
 * The arguments are plain values, not functions, because `Ordering` carries no payload.
 * Use this as a clean alternative to `if (isLT(o)) ... else if (isGT(o)) ...` chains —
 * for example when mapping an `Ordering` to a CSS class, a sign character, or a label.
 * @example
 * // ordering :: a -> a -> a -> Ordering -> a
 * ordering ('ascending') ('equal') ('descending') (lt)
 * // => 'ascending'
 * ordering ('ascending') ('equal') ('descending') (eq)
 * // => 'equal'
 * ordering ('ascending') ('equal') ('descending') (gt)
 * // => 'descending'
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
 * Converts an `Ordering` to the conventional JS comparator integer: `-1`, `0`, or `1`.
 * Use this when bridging to APIs that expect a native comparator number — for example,
 * passing an `Ordering`-based comparator to `Array.prototype.sort` via `toComparator`,
 * or serialising a comparison result as a numeric score.
 * @example
 * // toNumber :: Ordering -> -1 | 0 | 1
 * toNumber (lt)
 * // => -1
 * toNumber (eq)
 * // => 0
 * toNumber (gt)
 * // => 1
 */
export function toNumber (o) {
  if (isLT (o)) return -1
  if (isGT (o)) return 1
  return 0
}

/**
 * Converts a native JS comparator integer (negative / zero / positive) to an `Ordering`.
 * Use this to wrap the raw numeric output of `String.prototype.localeCompare`, `Date`
 * subtraction, or any other signed-number comparison, bringing it into the `Ordering` world
 * where it can be composed with `concat`, `invert`, and `concatComparators`.
 * @example
 * // fromNumber :: Number -> Ordering
 * fromNumber (-3)
 * // => lt
 * fromNumber (0)
 * // => eq
 * fromNumber (7)
 * // => gt
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
 * Compares two values using JavaScript's built-in `<` and `>` operators, returning an `Ordering`.
 * This is the primary building block for sort keys — pass it directly to `sortWith`, or combine
 * with `comparing` to project a field before comparing. Works correctly for numbers, strings,
 * and any other type that supports native JS ordering.
 * @example
 * // compare :: a -> a -> Ordering
 * compare (1) (2)
 * // => lt
 * compare ('banana') ('apple')
 * // => gt
 * compare (5) (5)
 * // => eq
 */
export function compare (a) {
  return (b) => a < b ? lt : a > b ? gt : eq
}

/**
 * Builds an `Ordering` comparator by projecting both values through `f` before comparing.
 * This is the primary tool for sorting objects by a field — equivalent to Haskell's `comparing`.
 * Combine multiple `comparing` calls with `concatComparators` for multi-field sorts, and wrap
 * the result with `invert` to sort descending.
 * @example
 * // comparing :: Ord b => (a -> b) -> a -> a -> Ordering
 * comparing (x => x.age) ({ age: 25 }) ({ age: 30 })
 * // => lt
 * comparing (x => x.name) ({ name: 'alice' }) ({ name: 'alice' })
 * // => eq
 * comparing (x => x.score) ({ score: 99 }) ({ score: 80 })
 * // => gt
 */
export function comparing (f) {
  return (a) => (b) => compare (f (a)) (f (b))
}

/**
 * Reverses an `Ordering` — swaps `LT` with `GT` and keeps `EQ` unchanged.
 * The primary way to flip a comparator to sort descending: wrap any `comparing` call with
 * `a => b => invert (comparator (a) (b))` or use it after `concatComparators` to reverse
 * the combined ordering without rebuilding the comparator.
 * @example
 * // invert :: Ordering -> Ordering
 * invert (lt)
 * // => gt
 * invert (gt)
 * // => lt
 * invert (eq)
 * // => eq
 */
export function invert (o) {
  if (isLT (o)) return gt
  if (isGT (o)) return lt
  return eq
}

/**
 * Converts a curried `Ordering` comparator to a native JS `(a, b) => number` comparator,
 * suitable for passing directly to `Array.prototype.sort`. This bridges the functional
 * `Ordering` world to the imperative sorting API, letting you build composable comparators
 * with `comparing` and `concatComparators` and then discharge them in a single `.sort()` call.
 * @example
 * // toComparator :: (a -> a -> Ordering) -> (a, a) -> Number
 * [3, 1, 2].sort (toComparator (compare))
 * // => [1, 2, 3]
 * [{ n: 3 }, { n: 1 }].sort (toComparator (comparing (x => x.n)))
 * // => [{ n: 1 }, { n: 3 }]
 */
export function toComparator (cmp) {
  return (a, b) => toNumber (cmp (a) (b))
}

/**
 * Performs a stable sort of an array using a curried `Ordering` comparator.
 * Unlike the native `Array.prototype.sort`, this is non-mutating and guarantees stability
 * by using the original indices as a tiebreaker. Use it instead of `arr.sort(toComparator(cmp))`
 * to keep the original order of equal elements intact.
 * @example
 * // sortWith :: (a -> a -> Ordering) -> Array a -> Array a
 * sortWith (compare) ([3, 1, 2])
 * // => [1, 2, 3]
 * sortWith (comparing (x => x.name)) ([{ name: 'charlie' }, { name: 'alice' }, { name: 'bob' }])
 * // => [{ name: 'alice' }, { name: 'bob' }, { name: 'charlie' }]
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
 * Combines two `Ordering` comparators — the second is consulted only when the first returns `EQ`.
 * This is `concat` lifted to comparator functions and is the idiomatic tool for multi-field
 * sorting: sort by the primary key first, break ties with the secondary key, and chain further
 * calls for tertiary keys. Pass the result directly to `sortWith` or `toComparator`.
 * @example
 * // concatComparators :: (a -> a -> Ordering) -> (a -> a -> Ordering) -> a -> a -> Ordering
 * const byName = comparing (x => x.name)
 * const byAge  = comparing (x => x.age)
 * sortWith (concatComparators (byName) (byAge)) ([{ name: 'alice', age: 30 }, { name: 'alice', age: 25 }, { name: 'bob', age: 20 }])
 * // => [{ name: 'alice', age: 25 }, { name: 'alice', age: 30 }, { name: 'bob', age: 20 }]
 */
export function concatComparators (c1) {
  return (c2) => (a) => (b) => concat (c1 (a) (b)) (c2 (a) (b))
}
