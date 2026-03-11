// date.js
// Date constructors, comparison, and arithmetic.
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
 * Returns a new `Date` representing the current system time. Each call produces a
 * fresh instance with the current instant, so it is not referentially transparent.
 * Prefer capturing the result once at the boundary of your program and passing it as
 * an argument to keep core logic pure and easily testable.
 * @example
 * // now :: () -> Date
 * now ()
 * // => Date (current instant)
 */
export function now () {
  return new Date ()
}

/**
 * Returns a new `Date` set to midnight UTC on the current calendar day, stripping the
 * time component. Working in UTC avoids the ambiguous or non-existent instants that
 * local-time midnight can produce during DST transitions, making this safe to use
 * across any timezone.
 * @example
 * // today :: () -> Date
 * today ()
 * // => Date (today at 00:00:00.000 UTC)
 */
export function today () {
  return startOfDay (new Date ())
}

/**
 * Constructs a new `Date` from a Unix timestamp in milliseconds since the epoch
 * (1970-01-01T00:00:00.000Z). This is the standard way to deserialise a numeric epoch
 * value — such as one returned by a database or REST API — into a `Date` for further
 * manipulation or display.
 * @example
 * // fromMs :: Integer -> Date
 * fromMs (0)
 * // => new Date('1970-01-01T00:00:00.000Z')
 * fromMs (86400000)
 * // => new Date('1970-01-02T00:00:00.000Z')
 */
export function fromMs (ms) {
  return new Date (ms)
}

/**
 * Parses an ISO 8601 string into a `Date`, returning `Just(date)` on success and
 * `Nothing` for any string that does not produce a valid date. Unlike `new Date(s)`,
 * the `Maybe` return type forces callers to handle the invalid-input case rather than
 * silently propagating an invalid `Date` (whose `valueOf()` is `NaN`) through the
 * pipeline.
 * @example
 * // parseDate :: String -> Maybe Date
 * parseDate ('2020-01-01')
 * // => just(new Date('2020-01-01'))
 * parseDate ('not a date')
 * // => nothing()
 */
export function parseDate (s) {
  const d = new Date (s)
  return isNaN (d.valueOf ()) ? M.nothing () : M.just (d)
}

// =============================================================================
// Accessors
// =============================================================================

/**
 * Returns the number of milliseconds since the Unix epoch (1970-01-01T00:00:00.000Z).
 * This is the canonical way to serialise a `Date` to a number for storage, comparison,
 * or arithmetic, and is the inverse of `fromMs`.
 * @example
 * // toMs :: Date -> Integer
 * toMs (new Date (0))
 * // => 0
 * toMs (new Date ('1970-01-02T00:00:00.000Z'))
 * // => 86400000
 */
export function toMs (d) {
  return d.valueOf ()
}

// =============================================================================
// Eq / Ord
// =============================================================================

/**
 * Returns `true` when both dates represent exactly the same instant, compared by
 * millisecond epoch value. The curried form is useful as a predicate for finding a
 * specific date in an array, or for deduplicating a sorted date list without
 * converting each `Date` to a timestamp manually.
 * @example
 * // equals :: Date -> Date -> Boolean
 * equals (new Date (0)) (new Date (0))
 * // => true
 * equals (new Date (0)) (new Date (1))
 * // => false
 */
export function equals (a) {
  return (b) => a.valueOf () === b.valueOf ()
}

/**
 * Returns `true` when date `a` is at or before date `b`. The curried form —
 * `lte (deadline)` — produces a reusable "on or before the deadline" predicate
 * suitable for `filter` calls, and serves as the base from which `lt`, `gte`, and
 * `gt` are all derived.
 * @example
 * // lte :: Date -> Date -> Boolean
 * lte (new Date (0)) (new Date (1))
 * // => true
 * lte (new Date (1)) (new Date (0))
 * // => false
 */
export function lte (a) {
  return (b) => a.valueOf () <= b.valueOf ()
}

/**
 * Returns `true` when date `a` is strictly earlier than date `b`. Use the curried
 * form to filter an array for dates before a specific cut-off, or to verify that a
 * start date precedes an end date in a form validation step.
 * @example
 * // lt :: Date -> Date -> Boolean
 * lt (new Date (0)) (new Date (1))
 * // => true
 * lt (new Date (1)) (new Date (1))
 * // => false
 */
export function lt (a) {
  return (b) => lte (a) (b) && !lte (b) (a)
}

/**
 * Returns `true` when date `a` is at or after date `b`. The curried form —
 * `gte (start)` — produces a reusable "on or after the start date" predicate, useful
 * for filtering an array of dates to those within an open-ended range.
 * @example
 * // gte :: Date -> Date -> Boolean
 * gte (new Date (1)) (new Date (0))
 * // => true
 * gte (new Date (0)) (new Date (1))
 * // => false
 */
export function gte (a) {
  return (b) => lte (b) (a)
}

/**
 * Returns `true` when date `a` is strictly later than date `b`. Useful for checking
 * that a date is after a specific point in time — for example, rejecting past dates in
 * form validation or filtering for events that have not yet occurred.
 * @example
 * // gt :: Date -> Date -> Boolean
 * gt (new Date (1)) (new Date (0))
 * // => true
 * gt (new Date (0)) (new Date (0))
 * // => false
 */
export function gt (a) {
  return (b) => lte (b) (a) && !lte (a) (b)
}

/**
 * Returns the earlier of two dates. Use it in a `reduce` call to find the earliest
 * date in an array, or to enforce a lower bound — for example, ensuring a date is no
 * earlier than a project start date.
 * @example
 * // min :: Date -> Date -> Date
 * min (new Date (0)) (new Date (1))
 * // => new Date(0)
 * min (new Date (5)) (new Date (2))
 * // => new Date(2)
 */
export function min (a) {
  return (b) => (lte (a) (b) ? a : b)
}

/**
 * Returns the later of two dates. Use it in a `reduce` call to find the most recent
 * date in an array, or to enforce an upper bound — for example, ensuring a date does
 * not exceed a deadline.
 * @example
 * // max :: Date -> Date -> Date
 * max (new Date (0)) (new Date (1))
 * // => new Date(1)
 * max (new Date (5)) (new Date (2))
 * // => new Date(5)
 */
export function max (a) {
  return (b) => (lte (b) (a) ? a : b)
}

/**
 * Constrains a date to a closed interval `[lo, hi]`, returning `lo` if the date is
 * before it and `hi` if it is after. Useful for keeping user-supplied dates inside a
 * valid booking window or scheduling range. The three-argument curried form allows
 * the bounds to be fixed once and applied repeatedly.
 * @example
 * // clamp :: Date -> Date -> Date -> Date
 * clamp (new Date (0)) (new Date (10)) (new Date (15))
 * // => new Date(10)
 * clamp (new Date (0)) (new Date (10)) (new Date (5))
 * // => new Date(5)
 */
export function clamp (lo) {
  return (hi) => (x) => (lte (x) (lo) ? lo : lte (hi) (x) ? hi : x)
}

// =============================================================================
// Arithmetic
// =============================================================================

/**
 * Returns a new `Date` offset by exactly `n` whole days (positive for future, negative
 * for past), preserving the time-of-day component. Always returns a new object — the
 * original `Date` is never mutated. The curried form `addDays (7)` produces a reusable
 * "advance one week" function for use in `map` or `pipe`.
 * @example
 * // addDays :: Integer -> Date -> Date
 * addDays (1) (new Date ('2020-01-01'))
 * // => new Date('2020-01-02')
 * addDays (-1) (new Date ('2020-01-01'))
 * // => new Date('2019-12-31')
 */
export function addDays (n) {
  return (d) => new Date (d.valueOf () + n * MS_PER_DAY)
}

/**
 * Returns the signed number of whole days between two dates, computed as `b − a` and
 * truncated toward zero. A positive result means `b` is after `a`; a negative result
 * means `b` is before `a`. Use this to compute deadlines, durations, or to check
 * whether two dates are within a given number of days of each other.
 * @example
 * // diffDays :: Date -> Date -> Integer
 * diffDays (new Date ('2020-01-01')) (new Date ('2020-01-04'))
 * // => 3
 * diffDays (new Date ('2020-01-04')) (new Date ('2020-01-01'))
 * // => -3
 */
export function diffDays (a) {
  return (b) => Math.trunc ((b.valueOf () - a.valueOf ()) / MS_PER_DAY)
}

// =============================================================================
// Day boundaries (UTC)
// =============================================================================

/**
 * Returns a new `Date` set to midnight (00:00:00.000) UTC on the same calendar day as
 * `d`. Working in UTC avoids the ambiguous or non-existent instants that local-time
 * midnight can produce during DST transitions. Pair it with `endOfDay` to build an
 * inclusive range covering an entire day.
 * @example
 * // startOfDay :: Date -> Date
 * startOfDay (new Date ('2020-06-15T14:30:00Z'))
 * // => new Date('2020-06-15T00:00:00.000Z')
 * startOfDay (new Date ('2020-06-15T00:00:00.000Z'))
 * // => new Date('2020-06-15T00:00:00.000Z')
 */
export function startOfDay (d) {
  return new Date (Date.UTC (d.getUTCFullYear (), d.getUTCMonth (), d.getUTCDate ()))
}

/**
 * Returns a new `Date` set to 23:59:59.999 UTC on the same calendar day as `d`. This
 * is useful for building inclusive date ranges — pair it with `startOfDay` to create a
 * range that covers an entire day without accidentally including the first instant of
 * the following day.
 * @example
 * // endOfDay :: Date -> Date
 * endOfDay (new Date ('2020-06-15T00:00:00Z'))
 * // => new Date('2020-06-15T23:59:59.999Z')
 */
export function endOfDay (d) {
  return new Date (Date.UTC (d.getUTCFullYear (), d.getUTCMonth (), d.getUTCDate (), 23, 59, 59, 999))
}

/**
 * Returns a new `Date` offset by exactly `n` whole hours (positive or negative).
 * Because it adds milliseconds directly, it crosses DST boundaries correctly without
 * the ambiguity of local-time arithmetic. Always returns a new object — the original
 * `Date` is never mutated.
 * @example
 * // addHours :: Integer -> Date -> Date
 * addHours (2) (new Date ('2020-01-01T00:00:00Z'))
 * // => new Date('2020-01-01T02:00:00.000Z')
 * addHours (-3) (new Date ('2020-01-01T01:00:00Z'))
 * // => new Date('2019-12-31T22:00:00.000Z')
 */
export function addHours (n) {
  return (d) => new Date (d.valueOf () + n * MS_PER_HOUR)
}

/**
 * Returns a new `Date` with `n` calendar months added, clamping the day to the last
 * valid day of the target month. This prevents the month overflow that
 * `new Date(y, m + n, d)` causes when `d` exceeds the length of the target month
 * (e.g. January 31 + 1 month → February 28/29, not March 2/3).
 * @example
 * // addMonths :: Integer -> Date -> Date
 * addMonths (1) (new Date ('2020-01-31'))
 * // => new Date('2020-02-29') (2020 is a leap year)
 * addMonths (-1) (new Date ('2020-03-31'))
 * // => new Date('2020-02-29')
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
 * Returns a new `Date` with `n` calendar years added, delegating to
 * `addMonths (n * 12)` so that leap-year day clamping is handled automatically.
 * February 29 in a leap year becomes February 28 in a non-leap target year.
 * @example
 * // addYears :: Integer -> Date -> Date
 * addYears (1) (new Date ('2020-02-29'))
 * // => new Date('2021-02-28')
 * addYears (-1) (new Date ('2021-03-15'))
 * // => new Date('2020-03-15')
 */
export function addYears (n) {
  return (d) => addMonths (n * 12) (d)
}

/**
 * Returns a new `Date` set to midnight UTC on the first day of the month containing
 * `d`. Useful for grouping events by month or for constructing a monthly range
 * alongside `endOfMonth`.
 * @example
 * // startOfMonth :: Date -> Date
 * startOfMonth (new Date ('2020-06-15'))
 * // => new Date('2020-06-01T00:00:00.000Z')
 */
export function startOfMonth (d) {
  return new Date (Date.UTC (d.getUTCFullYear (), d.getUTCMonth (), 1))
}

/**
 * Returns a new `Date` set to 23:59:59.999 UTC on the last day of the month containing
 * `d`. Pair it with `startOfMonth` to build an inclusive monthly interval, for example
 * when querying records within a given month.
 * @example
 * // endOfMonth :: Date -> Date
 * endOfMonth (new Date ('2020-06-15'))
 * // => new Date('2020-06-30T23:59:59.999Z')
 * endOfMonth (new Date ('2020-02-01'))
 * // => new Date('2020-02-29T23:59:59.999Z')
 */
export function endOfMonth (d) {
  return new Date (Date.UTC (d.getUTCFullYear (), d.getUTCMonth () + 1, 0, 23, 59, 59, 999))
}

/**
 * Returns a new `Date` set to midnight UTC on the Monday of the ISO week containing
 * `d` (ISO 8601 defines Monday as the first day of the week). Useful for weekly
 * grouping, calendar views, or building a week range alongside `endOfWeek`.
 * @example
 * // startOfWeek :: Date -> Date
 * startOfWeek (new Date ('2020-06-17'))
 * // => new Date('2020-06-15T00:00:00.000Z')  (Wednesday → Monday)
 * startOfWeek (new Date ('2020-06-15'))
 * // => new Date('2020-06-15T00:00:00.000Z')  (Monday → Monday)
 */
export function startOfWeek (d) {
  const day = d.getUTCDay ()                    // 0 = Sun, 1 = Mon, …, 6 = Sat
  const daysToMonday = (day + 6) % 7            // Mon=0, Tue=1, …, Sun=6
  return startOfDay (new Date (d.valueOf () - daysToMonday * MS_PER_DAY))
}

/**
 * Returns a new `Date` set to 23:59:59.999 UTC on the Sunday of the ISO week
 * containing `d` (ISO 8601 defines Sunday as the last day of the week). Pair it with
 * `startOfWeek` to build a full ISO week interval for scheduling or reporting.
 * @example
 * // endOfWeek :: Date -> Date
 * endOfWeek (new Date ('2020-06-17'))
 * // => new Date('2020-06-21T23:59:59.999Z')  (Wednesday → Sunday)
 * endOfWeek (new Date ('2020-06-21'))
 * // => new Date('2020-06-21T23:59:59.999Z')  (Sunday → Sunday)
 */
export function endOfWeek (d) {
  const day        = d.getUTCDay ()
  const daysToSun  = (7 - day) % 7
  const sunday     = new Date (d.valueOf () + daysToSun * MS_PER_DAY)
  return endOfDay (sunday)
}
