// number.js – Number predicates and operations.

import * as M from './maybe.js'

/**
 * Returns true only for finite or infinite (non-NaN) numbers.
 * @example
 * // isNum :: a -> Boolean
 * isNum (42) // => true;  isNum (NaN) // => false
 */
export function isNum (a) {
  return typeof a === 'number' && !Number.isNaN (a)
}

/**
 * Structural equality: NaN equals NaN, +0 equals -0.
 * @example
 * // equals :: Number -> Number -> Boolean
 * equals (NaN) (NaN) // => true
 */
export function equals (a) {
  return (b) => {
    const x = isNum (a) ? a : NaN
    const y = isNum (b) ? b : NaN
    return (Number.isNaN (x) && Number.isNaN (y)) || x === y
  }
}

/**
 * Total ordering — NaN is treated as the minimum value.
 * @example
 * // lte :: Number -> Number -> Boolean
 * lte (1) (2) // => true
 */
export function lte (a) {
  return (b) => {
    const x = isNum (a) ? a : NaN
    const y = isNum (b) ? b : NaN
    return Number.isNaN (x) || x <= y
  }
}

/**
 * Strict less-than.
 * @example
 * // lt :: Number -> Number -> Boolean
 * lt (1) (2) // => true
 */
export function lt (a) {
  return (b) => lte (a) (b) && !lte (b) (a)
}

/**
 * Greater-than-or-equal.
 * @example
 * // gte :: Number -> Number -> Boolean
 * gte (2) (1) // => true
 */
export function gte (a) {
  return (b) => lte (b) (a)
}

/**
 * Strict greater-than.
 * @example
 * // gt :: Number -> Number -> Boolean
 * gt (2) (1) // => true
 */
export function gt (a) {
  return (b) => lte (b) (a) && !lte (a) (b)
}

/**
 * Returns the smaller number.
 * @example
 * // min :: Number -> Number -> Number
 * min (1) (2) // => 1
 */
export function min (a) {
  return (b) => (lte (a) (b) ? a : b)
}

/**
 * Returns the larger number.
 * @example
 * // max :: Number -> Number -> Number
 * max (1) (2) // => 2
 */
export function max (a) {
  return (b) => (lte (b) (a) ? a : b)
}

/**
 * Clamps x between lo and hi inclusive.
 * @example
 * // clamp :: Number -> Number -> Number -> Number
 * clamp (0) (10) (15) // => 10
 */
export function clamp (lo) {
  return (hi) => (x) => (lte (x) (lo) ? lo : lte (hi) (x) ? hi : x)
}

/**
 * Negates a number.
 * @example
 * // negate :: Number -> Number
 * negate (3) // => -3
 */
export function negate (n) {
  return -n
}

/**
 * Adds two numbers.
 * @example
 * // add :: Number -> Number -> Number
 * add (1) (2) // => 3
 */
export function add (x) {
  return (y) => x + y
}

/**
 * Subtracts — sub(n)(x) = x - n.
 * @example
 * // sub :: Number -> Number -> Number
 * sub (1) (3) // => 2
 */
export function sub (y) {
  return (x) => x - y
}

/**
 * Multiplies two numbers.
 * @example
 * // mult :: Number -> Number -> Number
 * mult (2) (3) // => 6
 */
export function mult (x) {
  return (y) => x * y
}

/**
 * Divides — div(n)(x) = x / n.
 * @example
 * // div :: Number -> Number -> Number
 * div (2) (10) // => 5
 */
export function div (y) {
  return (x) => x / y
}

/**
 * Raises base to exponent — pow(exp)(base) = base ** exp.
 * @example
 * // pow :: Number -> Number -> Number
 * pow (2) (3) // => 9
 */
export function pow (exp) {
  return (base) => Math.pow (base, exp)
}

/**
 * Sums all numbers in the array.
 * @example
 * // sum :: Array Number -> Number
 * sum ([1, 2, 3]) // => 6
 */
export function sum (ns) {
  return ns.reduce ((a, b) => a + b, 0)
}

/**
 * Multiplies all numbers in the array.
 * @example
 * // product :: Array Number -> Number
 * product ([2, 3, 4]) // => 24
 */
export function product (ns) {
  return ns.reduce ((a, b) => a * b, 1)
}

/**
 * Returns true for even integers.
 * @example
 * // even :: Integer -> Boolean
 * even (4) // => true
 */
export function even (n) {
  return n % 2 === 0
}

/**
 * Returns true for odd integers.
 * @example
 * // odd :: Integer -> Boolean
 * odd (3) // => true
 */
export function odd (n) {
  return n % 2 !== 0
}

const _validFloat =
  /^\s*[+-]?(?:Infinity|NaN|(?:[0-9]+|[0-9]+[.][0-9]+|[0-9]+[.]|[.][0-9]+)(?:[Ee][+-]?[0-9]+)?)\s*$/

/**
 * Parses a float string strictly — Just on success, Nothing otherwise.
 * @example
 * // parseFloat_ :: String -> Maybe Number
 * parseFloat_ ('3.14') // => just(3.14)
 */
export function parseFloat_ (s) {
  return _validFloat.test (s) ? M.just (parseFloat (s)) : M.nothing ()
}

/**
 * Parses an integer string in radix 2–36 — stricter than built-in parseInt.
 * @example
 * // parseInt_ :: Integer -> String -> Maybe Integer
 * parseInt_ (16) ('ff') // => just(255)
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
