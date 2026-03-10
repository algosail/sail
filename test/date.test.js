import test from 'brittle'
import {
  now, today, fromMs, parseDate,
  toMs,
  equals, lte, lt, gte, gt, min, max, clamp,
  addDays, diffDays,
  startOfDay, endOfDay,
} from '../lib/date.js'
import { isJust, isNothing } from '../lib/maybe.js'

// =============================================================================
// Constructors
// =============================================================================

test ('now returns a Date instance', (t) => {
  const d = now ()
  t.ok (d instanceof Date)
  t.absent (isNaN (d.valueOf ()))
})

test ('now returns a date close to the current time', (t) => {
  const before = Date.now ()
  const d = now ()
  const after = Date.now ()
  t.ok (d.valueOf () >= before)
  t.ok (d.valueOf () <= after)
})

test ('today returns a Date at midnight UTC', (t) => {
  const d = today ()
  t.ok (d instanceof Date)
  t.is (d.getUTCHours (), 0)
  t.is (d.getUTCMinutes (), 0)
  t.is (d.getUTCSeconds (), 0)
  t.is (d.getUTCMilliseconds (), 0)
})

test ('fromMs constructs a Date from milliseconds since epoch', (t) => {
  const d = fromMs (0)
  t.ok (d instanceof Date)
  t.is (d.valueOf (), 0)
})

test ('fromMs with non-zero value', (t) => {
  const ms = 1577836800000 // 2020-01-01T00:00:00.000Z
  const d = fromMs (ms)
  t.is (d.valueOf (), ms)
})

test ('parseDate returns Just(Date) for a valid ISO date string', (t) => {
  const m = parseDate ('2020-01-01')
  t.ok (isJust (m))
  t.ok (m.value instanceof Date)
  t.absent (isNaN (m.value.valueOf ()))
})

test ('parseDate returns Just(Date) for a full ISO datetime string', (t) => {
  const m = parseDate ('2020-06-15T12:30:00.000Z')
  t.ok (isJust (m))
  t.is (m.value.getUTCFullYear (), 2020)
  t.is (m.value.getUTCMonth (), 5)  // June = 5 (zero-indexed)
  t.is (m.value.getUTCDate (), 15)
})

test ('parseDate returns Nothing for an invalid string', (t) => {
  t.ok (isNothing (parseDate ('not a date')))
  t.ok (isNothing (parseDate ('32/13/2020')))
  t.ok (isNothing (parseDate ('')))
})

// =============================================================================
// Accessors
// =============================================================================

test ('toMs returns the milliseconds since epoch', (t) => {
  t.is (toMs (new Date (0)), 0)
  t.is (toMs (new Date (1000)), 1000)
})

test ('toMs and fromMs are inverses', (t) => {
  const ms = 1609459200000
  t.is (toMs (fromMs (ms)), ms)
})

// =============================================================================
// Eq / Ord
// =============================================================================

test ('equals returns true when both dates represent the same instant', (t) => {
  t.ok (equals (new Date (0)) (new Date (0)))
  t.ok (equals (new Date (1000)) (new Date (1000)))
})

test ('equals returns false for different instants', (t) => {
  t.absent (equals (new Date (0)) (new Date (1)))
  t.absent (equals (new Date (1000)) (new Date (999)))
})

test ('lte returns true when a <= b', (t) => {
  t.ok (lte (new Date (0)) (new Date (1)))
  t.ok (lte (new Date (1)) (new Date (1)))
  t.absent (lte (new Date (2)) (new Date (1)))
})

test ('lt returns true when a < b', (t) => {
  t.ok (lt (new Date (0)) (new Date (1)))
  t.absent (lt (new Date (1)) (new Date (1)))
  t.absent (lt (new Date (2)) (new Date (1)))
})

test ('gte returns true when a >= b', (t) => {
  t.ok (gte (new Date (1)) (new Date (0)))
  t.ok (gte (new Date (1)) (new Date (1)))
  t.absent (gte (new Date (0)) (new Date (1)))
})

test ('gt returns true when a > b', (t) => {
  t.ok (gt (new Date (1)) (new Date (0)))
  t.absent (gt (new Date (1)) (new Date (1)))
  t.absent (gt (new Date (0)) (new Date (1)))
})

test ('min returns the earlier date', (t) => {
  const d1 = new Date (0)
  const d2 = new Date (1000)
  t.is (min (d1) (d2), d1)
  t.is (min (d2) (d1), d1)
  t.is (min (d1) (d1), d1)
})

test ('max returns the later date', (t) => {
  const d1 = new Date (0)
  const d2 = new Date (1000)
  t.is (max (d1) (d2), d2)
  t.is (max (d2) (d1), d2)
  t.is (max (d1) (d1), d1)
})

test ('clamp restricts a date to the given range', (t) => {
  const lo = new Date (100)
  const hi = new Date (900)
  t.ok (equals (clamp (lo) (hi) (new Date (500))) (new Date (500)))
  t.is (clamp (lo) (hi) (new Date (50)),  lo)
  t.is (clamp (lo) (hi) (new Date (999)), hi)
  t.is (clamp (lo) (hi) (lo),             lo)
  t.is (clamp (lo) (hi) (hi),             hi)
})

test ('clamp returns lo when value equals lo', (t) => {
  const lo = new Date (0)
  const hi = new Date (100)
  t.ok (equals (clamp (lo) (hi) (new Date (0))) (lo))
})

test ('clamp returns hi when value equals hi', (t) => {
  const lo = new Date (0)
  const hi = new Date (100)
  t.ok (equals (clamp (lo) (hi) (new Date (100))) (hi))
})

// =============================================================================
// Arithmetic
// =============================================================================

test ('addDays adds whole days to a date', (t) => {
  const base = new Date ('2020-01-01T00:00:00.000Z')
  const result = addDays (1) (base)
  t.ok (result instanceof Date)
  t.is (result.toISOString ().slice (0, 10), '2020-01-02')
})

test ('addDays with zero returns the same instant', (t) => {
  const base = new Date ('2020-01-01T00:00:00.000Z')
  t.ok (equals (addDays (0) (base)) (base))
})

test ('addDays with negative value goes back in time', (t) => {
  const base = new Date ('2020-01-01T00:00:00.000Z')
  const result = addDays (-1) (base)
  t.is (result.toISOString ().slice (0, 10), '2019-12-31')
})

test ('addDays does not mutate the original date', (t) => {
  const base = new Date ('2020-01-01T00:00:00.000Z')
  const original = base.valueOf ()
  addDays (5) (base)
  t.is (base.valueOf (), original)
})

test ('addDays and diffDays are consistent', (t) => {
  const base = new Date ('2020-01-01T00:00:00.000Z')
  const later = addDays (7) (base)
  t.is (diffDays (base) (later), 7)
})

test ('diffDays returns the signed number of whole days between two dates', (t) => {
  const d1 = new Date ('2020-01-01T00:00:00.000Z')
  const d4 = new Date ('2020-01-04T00:00:00.000Z')
  t.is (diffDays (d1) (d4), 3)
  t.is (diffDays (d4) (d1), -3)
})

test ('diffDays returns 0 for the same date', (t) => {
  const d = new Date ('2020-06-15T00:00:00.000Z')
  t.is (diffDays (d) (d), 0)
})

test ('diffDays handles large differences', (t) => {
  const d1 = new Date ('2000-01-01T00:00:00.000Z')
  const d2 = new Date ('2020-01-01T00:00:00.000Z')
  const diff = diffDays (d1) (d2)
  // 20 years ≈ 7305 or 7306 days depending on leap years
  t.ok (diff >= 7305)
  t.ok (diff <= 7306)
})

// =============================================================================
// Day boundaries (UTC)
// =============================================================================

test ('startOfDay returns midnight UTC on the same day', (t) => {
  const d = new Date ('2020-06-15T14:30:00.000Z')
  const start = startOfDay (d)
  t.ok (start instanceof Date)
  t.is (start.toISOString (), '2020-06-15T00:00:00.000Z')
})

test ('startOfDay on a date already at midnight returns the same instant', (t) => {
  const d = new Date ('2020-01-01T00:00:00.000Z')
  t.ok (equals (startOfDay (d)) (d))
})

test ('startOfDay does not mutate the original date', (t) => {
  const d = new Date ('2020-06-15T14:30:00.000Z')
  const original = d.valueOf ()
  startOfDay (d)
  t.is (d.valueOf (), original)
})

test ('endOfDay returns 23:59:59.999 UTC on the same day', (t) => {
  const d = new Date ('2020-06-15T00:00:00.000Z')
  const end = endOfDay (d)
  t.ok (end instanceof Date)
  t.is (end.toISOString (), '2020-06-15T23:59:59.999Z')
})

test ('endOfDay on a date at the end of the day returns the same instant', (t) => {
  const d = new Date ('2020-01-01T23:59:59.999Z')
  t.ok (equals (endOfDay (d)) (d))
})

test ('endOfDay does not mutate the original date', (t) => {
  const d = new Date ('2020-06-15T12:00:00.000Z')
  const original = d.valueOf ()
  endOfDay (d)
  t.is (d.valueOf (), original)
})

test ('startOfDay and endOfDay are on the same UTC day', (t) => {
  const d = new Date ('2020-06-15T14:30:00.000Z')
  const start = startOfDay (d)
  const end   = endOfDay (d)
  t.is (start.getUTCFullYear (), end.getUTCFullYear ())
  t.is (start.getUTCMonth (),   end.getUTCMonth ())
  t.is (start.getUTCDate (),    end.getUTCDate ())
})

test ('endOfDay is strictly after startOfDay', (t) => {
  const d = new Date ('2020-06-15T00:00:00.000Z')
  t.ok (gt (endOfDay (d)) (startOfDay (d)))
})

test ('startOfDay and endOfDay span exactly one day minus 1ms', (t) => {
  const d = new Date ('2020-06-15T00:00:00.000Z')
  const start = startOfDay (d)
  const end   = endOfDay (d)
  t.is (end.valueOf () - start.valueOf (), 86400000 - 1)
})

// =============================================================================
// Roundtrip / integration
// =============================================================================

test ('parseDate and toMs roundtrip', (t) => {
  const m = parseDate ('2020-01-01T00:00:00.000Z')
  t.ok (isJust (m))
  t.is (toMs (m.value), new Date ('2020-01-01T00:00:00.000Z').valueOf ())
})

test ('addDays by 1 then diffDays back is 1', (t) => {
  const base = new Date ('2020-03-15T00:00:00.000Z')
  const next = addDays (1) (base)
  t.is (diffDays (base) (next), 1)
})

test ('chaining addDays is equivalent to single addDays with sum', (t) => {
  const base = new Date ('2020-01-01T00:00:00.000Z')
  const stepByStep = addDays (3) (addDays (4) (base))
  const oneStep    = addDays (7) (base)
  t.ok (equals (stepByStep) (oneStep))
})
