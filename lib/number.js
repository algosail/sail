// number.js
// Number predicates and operations.

import * as M from './maybe.js'
import * as E from './either.js'

/**
 * Returns `true` when the value is a `number` primitive that is not `NaN`. In
 * JavaScript, `typeof NaN === 'number'`, so this guard is essential before performing
 * arithmetic to avoid silent `NaN` propagation. Use it as a predicate in `filter` to
 * discard non-numeric values, or as a precondition check in numeric pipelines.
 * @example
 * // isNum :: a -> Boolean
 * isNum (42)
 * // => true
 * isNum (NaN)
 * // => false
 * isNum ('42')
 * // => false
 */
export function isNum (a) {
  return typeof a === 'number' && !Number.isNaN (a)
}

/**
 * Compares two numbers for structural equality using `Object.is` semantics: `NaN`
 * equals `NaN`, and `+0` equals `-0`. Unlike `===`, this makes equality reflexive —
 * every value equals itself. The curried form is useful as a predicate in
 * `Array.prototype.find` or for building equality-based lookup functions.
 * @example
 * // equals :: Number -> Number -> Boolean
 * equals (NaN) (NaN)
 * // => true
 * equals (3) (3)
 * // => true
 * equals (1) (2)
 * // => false
 */
export function equals (a) {
  return (b) => {
    const x = isNum (a) ? a : NaN
    const y = isNum (b) ? b : NaN
    return (Number.isNaN (x) && Number.isNaN (y)) || x === y
  }
}

/**
 * Returns `true` when `a ≤ b` under a total order where `NaN` is treated as less than
 * every other number. A total order is required by sorting and range-checking
 * algorithms that would break down if any pair of values were incomparable. The
 * curried form is the foundation from which `lt`, `gte`, and `gt` are all derived.
 * @example
 * // lte :: Number -> Number -> Boolean
 * lte (1) (2)
 * // => true
 * lte (2) (2)
 * // => true
 * lte (3) (2)
 * // => false
 */
export function lte (a) {
  return (b) => {
    const x = isNum (a) ? a : NaN
    const y = isNum (b) ? b : NaN
    return Number.isNaN (x) || x <= y
  }
}

/**
 * Returns `true` when `a` is strictly less than `b`. Being curried, `lt (5)` can be
 * partially applied to produce a reusable "is-less-than-5" predicate that composes
 * cleanly into `filter` or conditional branching without a wrapper lambda.
 * @example
 * // lt :: Number -> Number -> Boolean
 * lt (1) (2)
 * // => true
 * lt (2) (2)
 * // => false
 */
export function lt (a) {
  return (b) => lte (a) (b) && !lte (b) (a)
}

/**
 * Returns `true` when `a ≥ b`, derived from `lte` by flipping its arguments. The
 * curried form — `gte (0)` — produces a reusable "non-negative" predicate suitable
 * for `filter` calls over numeric arrays.
 * @example
 * // gte :: Number -> Number -> Boolean
 * gte (2) (1)
 * // => true
 * gte (2) (2)
 * // => true
 * gte (1) (2)
 * // => false
 */
export function gte (a) {
  return (b) => lte (b) (a)
}

/**
 * Returns `true` when `a` is strictly greater than `b`. The curried form `gt (0)` gives
 * a reusable positive-number predicate that can be passed directly to `filter` without
 * writing an arrow function.
 * @example
 * // gt :: Number -> Number -> Boolean
 * gt (2) (1)
 * // => true
 * gt (2) (2)
 * // => false
 */
export function gt (a) {
  return (b) => lte (b) (a) && !lte (a) (b)
}

/**
 * Returns the smaller of two numbers using the same total order as `lte`. Use the
 * curried form in `reduce` to fold an array down to its minimum value without
 * importing a separate utility.
 * @example
 * // min :: Number -> Number -> Number
 * min (1) (2)
 * // => 1
 * min (5) (3)
 * // => 3
 */
export function min (a) {
  return (b) => (lte (a) (b) ? a : b)
}

/**
 * Returns the larger of two numbers using the same total order as `lte`. Use the
 * curried form in `reduce` to fold an array down to its maximum value without
 * importing a separate utility.
 * @example
 * // max :: Number -> Number -> Number
 * max (1) (2)
 * // => 2
 * max (5) (3)
 * // => 5
 */
export function max (a) {
  return (b) => (lte (b) (a) ? a : b)
}

/**
 * Constrains a number to the closed interval `[lo, hi]`, returning `lo` if the value
 * is below the range and `hi` if it is above. This is a common need when normalising
 * user input or keeping values within API or hardware limits. The three-argument
 * curried form allows the bounds to be fixed once and reused across many values.
 * @example
 * // clamp :: Number -> Number -> Number -> Number
 * clamp (0) (10) (15)
 * // => 10
 * clamp (0) (10) (-3)
 * // => 0
 * clamp (0) (10) (5)
 * // => 5
 */
export function clamp (lo) {
  return (hi) => (x) => (lte (x) (lo) ? lo : lte (hi) (x) ? hi : x)
}

/**
 * Returns the arithmetic negation of a number. It is the functional equivalent of the
 * unary minus operator, making it composable in `map` or `pipe` chains where operators
 * are not first-class values.
 * @example
 * // negate :: Number -> Number
 * negate (3)
 * // => -3
 * negate (-7)
 * // => 7
 */
export function negate (n) {
  return -n
}

/**
 * Returns the sum of two numbers. Its curried form — `add (n)` — produces a reusable
 * incrementer that can be mapped over arrays without writing an arrow function. This is
 * especially useful in `pipe` or `map` calls where you want to shift all values by a
 * constant offset.
 * @example
 * // add :: Number -> Number -> Number
 * add (1) (2)
 * // => 3
 * [1, 2, 3].map (add (10))
 * // => [11, 12, 13]
 */
export function add (x) {
  return (y) => x + y
}

/**
 * Returns `x - y`, where `y` (the subtrahend) is provided first. This argument order
 * means `sub (1)` produces a "decrement by 1" function, matching the FP convention of
 * fixing the "what to subtract" operand and varying the minuend. For example,
 * `map (sub (1))` decrements every element of an array.
 * @example
 * // sub :: Number -> Number -> Number
 * sub (1) (3)
 * // => 2
 * sub (10) (100)
 * // => 90
 */
export function sub (y) {
  return (x) => x - y
}

/**
 * Returns the product of two numbers. Partially applying it — `mult (2)` — gives a
 * reusable doubling function that composes directly into `map` or `pipe` chains without
 * boilerplate lambdas, making scaling transformations concise and readable.
 * @example
 * // mult :: Number -> Number -> Number
 * mult (2) (3)
 * // => 6
 * [1, 2, 3].map (mult (3))
 * // => [3, 6, 9]
 */
export function mult (x) {
  return (y) => x * y
}

/**
 * Returns `x / y`, where `y` (the divisor) is provided first. The argument order means
 * `div (100)` produces a "divide by 100" function, ready to be mapped over raw values
 * to produce percentages or normalised numbers. Beware that dividing by zero yields
 * `Infinity` rather than throwing.
 * @example
 * // div :: Number -> Number -> Number
 * div (2) (10)
 * // => 5
 * div (100) (50)
 * // => 0.5
 */
export function div (y) {
  return (x) => x / y
}

/**
 * Returns `base ** exp`, where the exponent is provided first. Partially applying it —
 * `pow (2)` — gives a squaring function that can be mapped over any numeric array.
 * This argument order mirrors how mathematical notation reads: "raise to the power of 2."
 * @example
 * // pow :: Number -> Number -> Number
 * pow (2) (3)
 * // => 9
 * pow (3) (2)
 * // => 8
 */
export function pow (exp) {
  return (base) => Math.pow (base, exp)
}

/**
 * Returns the absolute (non-negative) magnitude of a number, stripping its sign. It
 * wraps `Math.abs` as a single-argument function, making it composable in `map` or
 * `pipe` chains wherever a point-free transformer is needed.
 * @example
 * // abs :: Number -> Number
 * abs (-3)
 * // => 3
 * abs (3)
 * // => 3
 */
export function abs (n) {
  return Math.abs (n)
}

/**
 * Returns the remainder of `x / n` (i.e. `x % n`), with the sign following the
 * dividend — JavaScript's `%` semantics, not floored modulo. Use the curried form
 * `rem (n)` as a pipeline-ready function to test divisibility or rotate through a
 * fixed-size cycle. Note that the result can be negative when `x` is negative.
 * @example
 * // rem :: Number -> Number -> Number
 * rem (3) (10)
 * // => 1
 * rem (3) (-10)
 * // => -1
 */
export function rem (n) {
  return (x) => x % n
}

/**
 * Rounds a number to the nearest integer, with ties rounding up (`0.5` → `1`). It
 * wraps `Math.round` as a single-argument function so it can be composed in `map` or
 * `pipe` chains without wrapping it in a lambda.
 * @example
 * // round :: Number -> Integer
 * round (3.5)
 * // => 4
 * round (3.4)
 * // => 3
 */
export function round (n) {
  return Math.round (n)
}

/**
 * Returns the largest integer less than or equal to `n` (rounds toward negative
 * infinity). Wraps `Math.floor` as a composable function; use it in pipelines to
 * truncate decimal values safely. Note that for negative numbers this rounds away
 * from zero (e.g. `-3.1` → `-4`).
 * @example
 * // floor :: Number -> Integer
 * floor (3.9)
 * // => 3
 * floor (-3.1)
 * // => -4
 */
export function floor (n) {
  return Math.floor (n)
}

/**
 * Returns the smallest integer greater than or equal to `n` (rounds toward positive
 * infinity). Wraps `Math.ceil` as a composable function; use it when you need
 * conservative over-estimates, such as calculating page counts from item counts.
 * @example
 * // ceil :: Number -> Integer
 * ceil (3.1)
 * // => 4
 * ceil (-3.9)
 * // => -3
 */
export function ceil (n) {
  return Math.ceil (n)
}

/**
 * Sums all numbers in an array, returning `0` for an empty array (the identity for
 * addition). This is equivalent to a left fold with `(+)` and is useful for
 * aggregating the results of a `map` or `filter` step at the end of a pipeline.
 * @example
 * // sum :: Array Number -> Number
 * sum ([1, 2, 3])
 * // => 6
 * sum ([])
 * // => 0
 */
export function sum (ns) {
  return ns.reduce ((a, b) => a + b, 0)
}

/**
 * Multiplies all numbers in an array together, returning `1` for an empty array (the
 * identity for multiplication). Use it to compute factorials, probabilities, or any
 * multiplicative aggregate in a single step at the end of a pipeline.
 * @example
 * // product :: Array Number -> Number
 * product ([2, 3, 4])
 * // => 24
 * product ([])
 * // => 1
 */
export function product (ns) {
  return ns.reduce ((a, b) => a * b, 1)
}

/**
 * Returns `true` when an integer is evenly divisible by 2. The unary form makes it
 * directly usable as a predicate in `filter (even)` or `find (even)` without wrapping
 * it in an arrow function.
 * @example
 * // even :: Integer -> Boolean
 * even (4)
 * // => true
 * even (3)
 * // => false
 */
export function even (n) {
  return n % 2 === 0
}

/**
 * Returns `true` when an integer is not evenly divisible by 2. Like `even`, it is
 * predicate-ready and can be passed directly to `filter` or `find` without a wrapper.
 * @example
 * // odd :: Integer -> Boolean
 * odd (3)
 * // => true
 * odd (4)
 * // => false
 */
export function odd (n) {
  return n % 2 !== 0
}

const _validFloat =
  /^\s*[+-]?(?:Infinity|NaN|(?:[0-9]+|[0-9]+[.][0-9]+|[0-9]+[.]|[.][0-9]+)(?:[Ee][+-]?[0-9]+)?)\s*$/

/**
 * Parses a string as a floating-point number using a strict grammar, returning
 * `Just(n)` on success and `Nothing` on any invalid input. Unlike the native
 * `parseFloat`, it rejects strings with leading junk (e.g. `'12abc'`) and empty
 * strings, making it safe for pipelines that process untrusted string data.
 * @example
 * // parseFloat_ :: String -> Maybe Number
 * parseFloat_ ('3.14')
 * // => just(3.14)
 * parseFloat_ ('-2.5e3')
 * // => just(-2500)
 * parseFloat_ ('abc')
 * // => nothing()
 */
export function parseFloat_ (s) {
  return _validFloat.test (s) ? M.just (parseFloat (s)) : M.nothing ()
}

/**
 * Like `parseFloat_`, but returns `Right(n)` on success and `Left(errorMessage)` on
 * failure, providing a self-describing error suitable for logging or display. Prefer
 * this variant in contexts where you need to report *why* parsing failed rather than
 * simply discarding the value with a `Nothing`.
 * @example
 * // parseFloat_E :: String -> Either String Number
 * parseFloat_E ('3.14')
 * // => right(3.14)
 * parseFloat_E ('abc')
 * // => left('not a valid float: "abc"')
 */
export function parseFloat_E (s) {
  return _validFloat.test (s)
    ? E.right (parseFloat (s))
    : E.left (`not a valid float: "${s}"`)
}

/**
 * Parses a string as an integer in the given radix (2–36), returning `Just(n)` on
 * valid input or `Nothing` otherwise. Unlike the built-in `parseInt`, it rejects
 * strings containing characters invalid for the chosen base and rejects radices outside
 * 2–36, preventing silent partial parses.
 * @example
 * // parseInt_ :: Integer -> String -> Maybe Integer
 * parseInt_ (16) ('ff')
 * // => just(255)
 * parseInt_ (2) ('1010')
 * // => just(10)
 * parseInt_ (10) ('abc')
 * // => nothing()
 */
export function parseInt_ (radix) {
  return (s) => {
    if (!Number.isInteger (radix) || radix < 2 || radix > 36) return M.nothing ()
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice (0, radix)
    const pattern = new RegExp (`^[${charset}]+$`, 'i')
    const t = s.replace (/^[+-]/, '')
    const u = radix === 16 ? t.replace (/^0x/i, '') : t
    if (!pattern.test (u)) return M.nothing ()
    const n = parseInt (s, radix)
    return Number.isInteger (n) ? M.just (n) : M.nothing ()
  }
}

/**
 * Like `parseInt_`, but returns `Right(n)` on success and `Left(errorMessage)` on
 * failure, giving a descriptive error when the input or radix is invalid. Use this
 * variant when you need to surface parsing errors to the caller rather than silently
 * discarding them with a `Nothing`.
 * @example
 * // parseInt_E :: Integer -> String -> Either String Integer
 * parseInt_E (16) ('ff')
 * // => right(255)
 * parseInt_E (10) ('abc')
 * // => left('not a valid base-10 integer: "abc"')
 * parseInt_E (99) ('1')
 * // => left('invalid radix: 99 (must be 2–36)')
 */
export function parseInt_E (radix) {
  return (s) => {
    if (!Number.isInteger (radix) || radix < 2 || radix > 36)
      return E.left (`invalid radix: ${radix} (must be 2–36)`)
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice (0, radix)
    const pattern = new RegExp (`^[${charset}]+$`, 'i')
    const t = s.replace (/^[+-]/, '')
    const u = radix === 16 ? t.replace (/^0x/i, '') : t
    if (!pattern.test (u))
      return E.left (`not a valid base-${radix} integer: "${s}"`)
    const n = parseInt (s, radix)
    return Number.isInteger (n)
      ? E.right (n)
      : E.left (`not a valid base-${radix} integer: "${s}"`)
  }
}
