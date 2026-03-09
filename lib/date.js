// date.js – Plain Date comparison functions.
// Equality and ordering are based on milliseconds since epoch (valueOf()).

import * as M from './maybe.js'

/**
 * True when both dates represent the same instant.
 * @example
 * // equals :: Date -> Date -> Boolean
 * equals (new Date (0)) (new Date (0)) // => true
 */
export function equals (a) {
  return (b) => a.valueOf () === b.valueOf ()
}

/**
 * True when a is at or before b.
 * @example
 * // lte :: Date -> Date -> Boolean
 * lte (new Date (0)) (new Date (1)) // => true
 */
export function lte (a) {
  return (b) => a.valueOf () <= b.valueOf ()
}

/**
 * Strict earlier-than.
 * @example
 * // lt :: Date -> Date -> Boolean
 * lt (new Date (0)) (new Date (1)) // => true
 */
export function lt (a) {
  return (b) => lte (a) (b) && !lte (b) (a)
}

/**
 * True when a is at or after b.
 * @example
 * // gte :: Date -> Date -> Boolean
 * gte (new Date (1)) (new Date (0)) // => true
 */
export function gte (a) {
  return (b) => lte (b) (a)
}

/**
 * Strict later-than.
 * @example
 * // gt :: Date -> Date -> Boolean
 * gt (new Date (1)) (new Date (0)) // => true
 */
export function gt (a) {
  return (b) => lte (b) (a) && !lte (a) (b)
}

/**
 * Returns the earlier of the two dates.
 * @example
 * // min :: Date -> Date -> Date
 * min (new Date (0)) (new Date (1)) // => new Date(0)
 */
export function min (a) {
  return (b) => (lte (a) (b) ? a : b)
}

/**
 * Returns the later of the two dates.
 * @example
 * // max :: Date -> Date -> Date
 * max (new Date (0)) (new Date (1)) // => new Date(1)
 */
export function max (a) {
  return (b) => (lte (b) (a) ? a : b)
}

/**
 * Clamps a date between lo and hi.
 * @example
 * // clamp :: Date -> Date -> Date -> Date
 * clamp (new Date (0)) (new Date (10)) (new Date (15)) // => new Date(10)
 */
export function clamp (lo) {
  return (hi) => (x) => (lte (x) (lo) ? lo : lte (hi) (x) ? hi : x)
}

/**
 * Parses a date string — Just(Date) on success, Nothing for invalid input.
 * @example
 * // parseDate :: String -> Maybe Date
 * parseDate ('2020-01-01') // => just(new Date('2020-01-01'))
 */
export function parseDate (s) {
  const d = new Date (s)
  return isNaN (d.valueOf ()) ? M.nothing () : M.just (d)
}
