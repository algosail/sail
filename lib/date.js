// date.js – Date constructors, comparison, and arithmetic.
// All operations treat Date as an immutable value and return new Date instances.
// Equality and ordering are based on milliseconds since epoch (valueOf()).
// All day-boundary operations work in UTC to avoid DST surprises.

import * as M from './maybe.js'

const MS_PER_DAY  = 86400000
const MS_PER_HOUR = 3600000

// =============================================================================
// Constructors
// =============================================================================

/**
 * Returns the current date and time.
 * @example
 * // now :: () -> Date
 * now () // => Date (current instant)
 */
export function now () {
  return new Date ()
}

/**
 * Returns today's date with the time set to midnight UTC.
 * @example
 * // today :: () -> Date
 * today () // => Date (today at 00:00:00 UTC)
 */
export function today () {
  return startOfDay (new Date ())
}

/**
 * Constructs a Date from milliseconds since the Unix epoch.
 * @example
 * // fromMs :: Integer -> Date
 * fromMs (0) // => new Date(0)
 */
export function fromMs (ms) {
  return new Date (ms)
}

/**
 * Parses an ISO 8601 date string — Just(Date) on success, Nothing on invalid input.
 * @example
 * // parseDate :: String -> Maybe Date
 * parseDate ('2020-01-01') // => just(new Date('2020-01-01'))
 * parseDate ('not a date') // => nothing()
 */
export function parseDate (s) {
  const d = new Date (s)
  return isNaN (d.valueOf ()) ? M.nothing () : M.just (d)
}

// =============================================================================
// Accessors
// =============================================================================

/**
 * Returns the milliseconds since the Unix epoch.
 * @example
 * // toMs :: Date -> Integer
 * toMs (new Date (0)) // => 0
 */
export function toMs (d) {
  return d.valueOf ()
}

// =============================================================================
// Eq / Ord
// =============================================================================

/**
 * True when both dates represent the same instant.
 * @example
 * // equals :: Date -> Date -> Boolean
 * equals (new Date (0)) (new Date (0)) // => true
 * equals (new Date (0)) (new Date (1)) // => false
 */
export function equals (a) {
  return (b) => a.valueOf () === b.valueOf ()
}

/**
 * True when a is at or before b.
 * @example
 * // lte :: Date -> Date -> Boolean
 * lte (new Date (0)) (new Date (1)) // => true
 * lte (new Date (1)) (new Date (0)) // => false
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
 * Clamps a date between lo and hi (inclusive).
 * @example
 * // clamp :: Date -> Date -> Date -> Date
 * clamp (new Date (0)) (new Date (10)) (new Date (15)) // => new Date(10)
 * clamp (new Date (0)) (new Date (10)) (new Date (5))  // => new Date(5)
 */
export function clamp (lo) {
  return (hi) => (x) => (lte (x) (lo) ? lo : lte (hi) (x) ? hi : x)
}

// =============================================================================
// Arithmetic
// =============================================================================

/**
 * Returns a new Date offset by n whole days (may be negative).
 * @example
 * // addDays :: Integer -> Date -> Date
 * addDays (1) (new Date ('2020-01-01')) // => new Date('2020-01-02')
 * addDays (-1) (new Date ('2020-01-01')) // => new Date('2019-12-31')
 */
export function addDays (n) {
  return (d) => new Date (d.valueOf () + n * MS_PER_DAY)
}

/**
 * Returns the signed number of whole days between two dates (b - a).
 * @example
 * // diffDays :: Date -> Date -> Integer
 * diffDays (new Date ('2020-01-01')) (new Date ('2020-01-04')) // => 3
 * diffDays (new Date ('2020-01-04')) (new Date ('2020-01-01')) // => -3
 */
export function diffDays (a) {
  return (b) => Math.trunc ((b.valueOf () - a.valueOf ()) / MS_PER_DAY)
}

// =============================================================================
// Day boundaries (UTC)
// =============================================================================

/**
 * Returns a new Date set to midnight (00:00:00.000) UTC on the same day.
 * @example
 * // startOfDay :: Date -> Date
 * startOfDay (new Date ('2020-06-15T14:30:00Z')) // => new Date('2020-06-15T00:00:00.000Z')
 */
export function startOfDay (d) {
  return new Date (Date.UTC (d.getUTCFullYear (), d.getUTCMonth (), d.getUTCDate ()))
}

/**
 * Returns a new Date set to one millisecond before midnight UTC (23:59:59.999) on the same day.
 * @example
 * // endOfDay :: Date -> Date
 * endOfDay (new Date ('2020-06-15T00:00:00Z')) // => new Date('2020-06-15T23:59:59.999Z')
 */
export function endOfDay (d) {
  return new Date (Date.UTC (d.getUTCFullYear (), d.getUTCMonth (), d.getUTCDate (), 23, 59, 59, 999))
}

/**
 * Returns a new Date offset by n whole hours (may be negative).
 * @example
 * // addHours :: Integer -> Date -> Date
 * addHours (2) (new Date ('2020-01-01T00:00:00Z')) // => new Date('2020-01-01T02:00:00.000Z')
 * addHours (-3) (new Date ('2020-01-01T01:00:00Z')) // => new Date('2019-12-31T22:00:00.000Z')
 */
export function addHours (n) {
  return (d) => new Date (d.valueOf () + n * MS_PER_HOUR)
}

/**
 * Returns a new Date with n months added (may be negative).
 * The day is clamped to the last valid day of the resulting month.
 * @example
 * // addMonths :: Integer -> Date -> Date
 * addMonths (1) (new Date ('2020-01-31')) // => new Date('2020-02-29') (2020 is a leap year)
 * addMonths (-1) (new Date ('2020-03-31')) // => new Date('2020-02-29')
 */
export function addMonths (n) {
  return (d) => {
    const year  = d.getUTCFullYear ()
    const month = d.getUTCMonth () + n
    const day   = d.getUTCDate ()
    // Create the 1st of the target month, then clamp day to its length
    const target     = new Date (Date.UTC (year, month, 1))
    const daysInMonth = new Date (Date.UTC (target.getUTCFullYear (), target.getUTCMonth () + 1, 0)).getUTCDate ()
    return new Date (Date.UTC (target.getUTCFullYear (), target.getUTCMonth (), Math.min (day, daysInMonth)))
  }
}

/**
 * Returns a new Date with n years added (may be negative).
 * Feb 29 in a leap year is clamped to Feb 28 in non-leap target years.
 * @example
 * // addYears :: Integer -> Date -> Date
 * addYears (1) (new Date ('2020-02-29')) // => new Date('2021-02-28')
 * addYears (-1) (new Date ('2021-03-15')) // => new Date('2020-03-15')
 */
export function addYears (n) {
  return (d) => addMonths (n * 12) (d)
}

/**
 * Returns a new Date set to midnight UTC on the first day of the month.
 * @example
 * // startOfMonth :: Date -> Date
 * startOfMonth (new Date ('2020-06-15')) // => new Date('2020-06-01T00:00:00.000Z')
 */
export function startOfMonth (d) {
  return new Date (Date.UTC (d.getUTCFullYear (), d.getUTCMonth (), 1))
}

/**
 * Returns a new Date set to 23:59:59.999 UTC on the last day of the month.
 * @example
 * // endOfMonth :: Date -> Date
 * endOfMonth (new Date ('2020-06-15')) // => new Date('2020-06-30T23:59:59.999Z')
 * endOfMonth (new Date ('2020-02-01')) // => new Date('2020-02-29T23:59:59.999Z')
 */
export function endOfMonth (d) {
  return new Date (Date.UTC (d.getUTCFullYear (), d.getUTCMonth () + 1, 0, 23, 59, 59, 999))
}

/**
 * Returns a new Date set to midnight UTC on the Monday of the week containing d.
 * Uses ISO week convention (Monday = first day of week).
 * @example
 * // startOfWeek :: Date -> Date
 * startOfWeek (new Date ('2020-06-17')) // => new Date('2020-06-15T00:00:00.000Z')  (Wednesday → Monday)
 * startOfWeek (new Date ('2020-06-15')) // => new Date('2020-06-15T00:00:00.000Z')  (Monday → Monday)
 */
export function startOfWeek (d) {
  const day = d.getUTCDay ()                    // 0 = Sun, 1 = Mon, …, 6 = Sat
  const daysToMonday = (day + 6) % 7            // Mon=0, Tue=1, …, Sun=6
  return startOfDay (new Date (d.valueOf () - daysToMonday * MS_PER_DAY))
}

/**
 * Returns a new Date set to 23:59:59.999 UTC on the Sunday of the week containing d.
 * Uses ISO week convention (Sunday = last day of week).
 * @example
 * // endOfWeek :: Date -> Date
 * endOfWeek (new Date ('2020-06-17')) // => new Date('2020-06-21T23:59:59.999Z')  (Wednesday → Sunday)
 * endOfWeek (new Date ('2020-06-21')) // => new Date('2020-06-21T23:59:59.999Z')  (Sunday → Sunday)
 */
export function endOfWeek (d) {
  const day        = d.getUTCDay ()
  const daysToSun  = (7 - day) % 7
  const sunday     = new Date (d.valueOf () + daysToSun * MS_PER_DAY)
  return endOfDay (sunday)
}
