import test from 'brittle'
import {
  complement, bool, ifElse, when, unless, cond,
} from '../lib/logic.js'
import { isJust, isNothing } from '../lib/maybe.js'

// =============================================================================
// complement
// =============================================================================

test ('complement negates a predicate', (t) => {
  const notPositive = complement ((x) => x > 0)
  t.ok (notPositive (-1))
  t.ok (notPositive (0))
  t.absent (notPositive (1))
})

test ('complement works with boolean-returning functions', (t) => {
  const notEmpty = complement ((xs) => xs.length === 0)
  t.ok (notEmpty ([1]))
  t.absent (notEmpty ([]))
})

// =============================================================================
// bool
// =============================================================================

test ('bool returns the true branch when condition is true', (t) => {
  t.is (bool ('no') ('yes') (true), 'yes')
})

test ('bool returns the false branch when condition is false', (t) => {
  t.is (bool ('no') ('yes') (false), 'no')
})

test ('bool works with non-string branches', (t) => {
  t.is (bool (0) (1) (true), 1)
  t.is (bool (0) (1) (false), 0)
  t.alike (bool ([]) ([1, 2]) (true), [1, 2])
  t.alike (bool ([]) ([1, 2]) (false), [])
})

// =============================================================================
// ifElse
// =============================================================================

test ('ifElse applies f when predicate holds', (t) => {
  const abs = ifElse ((x) => x < 0) ((x) => -x) ((x) => x)
  t.is (abs (-3), 3)
  t.is (abs (3), 3)
  t.is (abs (0), 0)
})

test ('ifElse applies g when predicate does not hold', (t) => {
  const label = ifElse ((x) => x > 0) ((_) => 'positive') ((_) => 'non-positive')
  t.is (label (5), 'positive')
  t.is (label (-1), 'non-positive')
  t.is (label (0), 'non-positive')
})

// =============================================================================
// when
// =============================================================================

test ('when applies f only when predicate holds', (t) => {
  const clampToZero = when ((x) => x < 0) ((_) => 0)
  t.is (clampToZero (-5), 0)
  t.is (clampToZero (5), 5)
  t.is (clampToZero (0), 0)
})

test ('when returns the value unchanged when predicate does not hold', (t) => {
  const obj = { x: 1 }
  const result = when ((x) => x.x > 10) ((x) => ({ ...x, x: 0 })) (obj)
  t.is (result, obj)
})

// =============================================================================
// unless
// =============================================================================

test ('unless applies f when predicate does NOT hold', (t) => {
  const ensurePositive = unless ((x) => x > 0) ((x) => -x)
  t.is (ensurePositive (-3), 3)
  t.is (ensurePositive (3), 3)
})

test ('unless returns the value unchanged when predicate holds', (t) => {
  const obj = { x: 5 }
  const result = unless ((x) => x.x > 0) ((x) => ({ ...x, x: 0 })) (obj)
  t.is (result, obj)
})

test ('unless is the complement of when', (t) => {
  const pred = (x) => x > 0
  const f = (x) => x * 2
  const x = -3
  t.is (unless (pred) (f) (x), when (complement (pred)) (f) (x))
})

// =============================================================================
// cond
// =============================================================================

test ('cond returns Just of the first matching branch result', (t) => {
  const classify = cond ([
    [(x) => x < 0,  (x) => 'negative'],
    [(x) => x === 0, (_) => 'zero'],
    [(x) => x > 0,  (x) => 'positive'],
  ])
  const r1 = classify (-5)
  t.ok (isJust (r1))
  t.is (r1.value, 'negative')

  const r2 = classify (0)
  t.ok (isJust (r2))
  t.is (r2.value, 'zero')

  const r3 = classify (5)
  t.ok (isJust (r3))
  t.is (r3.value, 'positive')
})

test ('cond returns Nothing when no predicate matches', (t) => {
  const m = cond ([
    [(x) => x < 0, (x) => -x],
  ]) (5)
  t.ok (isNothing (m))
})

test ('cond applies the transform function to the matched value', (t) => {
  const doubled = cond ([
    [(x) => x > 0, (x) => x * 2],
  ]) (7)
  t.ok (isJust (doubled))
  t.is (doubled.value, 14)
})

test ('cond returns Nothing for an empty cases array', (t) => {
  t.ok (isNothing (cond ([]) (42)))
})

test ('cond only uses the first matching branch', (t) => {
  const m = cond ([
    [(x) => x > 0, (_) => 'first'],
    [(x) => x > 0, (_) => 'second'],
  ]) (5)
  t.ok (isJust (m))
  t.is (m.value, 'first')
})
