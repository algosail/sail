import test from 'brittle'
import {
  isNum, equals, lte, lt, gte, gt, min, max, clamp,
  negate, add, sub, mult, div, pow,
  abs, rem, round, floor, ceil,
  sum, product, even, odd,
  parseFloat_, parseInt_,
} from '../lib/number.js'
import { isJust, isNothing } from '../lib/maybe.js'

// =============================================================================
// isNum
// =============================================================================

test ('isNum returns true for finite numbers', (t) => {
  t.ok (isNum (0))
  t.ok (isNum (42))
  t.ok (isNum (-3.14))
  t.ok (isNum (Infinity))
  t.ok (isNum (-Infinity))
})

test ('isNum returns false for NaN', (t) => {
  t.absent (isNum (NaN))
})

test ('isNum returns false for non-numbers', (t) => {
  t.absent (isNum ('42'))
  t.absent (isNum (null))
  t.absent (isNum (undefined))
  t.absent (isNum (true))
  t.absent (isNum ([]))
})

// =============================================================================
// equals
// =============================================================================

test ('equals returns true for identical numbers', (t) => {
  t.ok (equals (1) (1))
  t.ok (equals (0) (0))
  t.ok (equals (-3.14) (-3.14))
})

test ('equals returns false for different numbers', (t) => {
  t.absent (equals (1) (2))
  t.absent (equals (3) (-3))
})

test ('equals treats +0 and -0 as equal by design', (t) => {
  // The implementation intentionally treats +0 === -0
  t.ok (equals (0) (-0))
})

test ('equals treats NaN as equal to NaN', (t) => {
  t.ok (equals (NaN) (NaN))
})

test ('equals returns false when first operand is a non-number string', (t) => {
  t.absent (equals ('1') (1))
  t.absent (equals (1) ('1'))
})

test ('equals treats two non-numbers as NaN equals NaN', (t) => {
  // null/undefined are not isNum, so both become NaN, and NaN===NaN is true
  t.ok (equals (null) (null))
  t.ok (equals (undefined) (undefined))
})

// =============================================================================
// lte / lt / gte / gt
// =============================================================================

test ('lte returns true when a <= b', (t) => {
  t.ok (lte (1) (2))
  t.ok (lte (2) (2))
  t.absent (lte (3) (2))
})

test ('lte treats NaN as the minimum value', (t) => {
  t.ok (lte (NaN) (0))
  t.ok (lte (NaN) (-Infinity))
})

test ('lt returns true when a < b', (t) => {
  t.ok (lt (1) (2))
  t.absent (lt (2) (2))
  t.absent (lt (3) (2))
})

test ('gte returns true when a >= b', (t) => {
  t.ok (gte (2) (1))
  t.ok (gte (2) (2))
  t.absent (gte (1) (2))
})

test ('gt returns true when a > b', (t) => {
  t.ok (gt (2) (1))
  t.absent (gt (2) (2))
  t.absent (gt (1) (2))
})

// =============================================================================
// min / max / clamp
// =============================================================================

test ('min returns the smaller number', (t) => {
  t.is (min (1) (2), 1)
  t.is (min (5) (3), 3)
  t.is (min (4) (4), 4)
})

test ('max returns the larger number', (t) => {
  t.is (max (1) (2), 2)
  t.is (max (5) (3), 5)
  t.is (max (4) (4), 4)
})

test ('clamp restricts a value to the given range', (t) => {
  t.is (clamp (0) (10) (5), 5)
  t.is (clamp (0) (10) (-3), 0)
  t.is (clamp (0) (10) (15), 10)
  t.is (clamp (0) (10) (0), 0)
  t.is (clamp (0) (10) (10), 10)
})

// =============================================================================
// Arithmetic
// =============================================================================

test ('negate negates a number', (t) => {
  t.is (negate (3), -3)
  t.is (negate (-3), 3)
  t.is (negate (0), -0)
})

test ('add adds two numbers', (t) => {
  t.is (add (1) (2), 3)
  t.is (add (-1) (1), 0)
  t.is (add (0) (0), 0)
})

test ('sub subtracts — sub(n)(x) = x - n', (t) => {
  t.is (sub (1) (3), 2)
  t.is (sub (5) (5), 0)
  t.is (sub (3) (1), -2)
})

test ('mult multiplies two numbers', (t) => {
  t.is (mult (2) (3), 6)
  t.is (mult (0) (100), 0)
  t.is (mult (-2) (3), -6)
})

test ('div divides — div(n)(x) = x / n', (t) => {
  t.is (div (2) (10), 5)
  t.is (div (4) (1), 0.25)
})

test ('pow raises base to exponent — pow(exp)(base)', (t) => {
  t.is (pow (2) (3), 9)
  t.is (pow (0) (100), 1)
  t.is (pow (3) (2), 8)
})

// =============================================================================
// abs / rem / round / floor / ceil
// =============================================================================

test ('abs returns the absolute value', (t) => {
  t.is (abs (-3), 3)
  t.is (abs (3), 3)
  t.is (abs (0), 0)
})

test ('rem computes remainder with sign following the dividend — rem(n)(x) = x % n', (t) => {
  t.is (rem (3) (10), 1)
  t.is (rem (3) (-10), -1)
  t.is (rem (5) (0), 0)
})

test ('round rounds to nearest integer', (t) => {
  t.is (round (3.5), 4)
  t.is (round (3.4), 3)
  t.is (round (-3.5), -3)
})

test ('floor rounds down', (t) => {
  t.is (floor (3.9), 3)
  t.is (floor (-3.1), -4)
  t.is (floor (3), 3)
})

test ('ceil rounds up', (t) => {
  t.is (ceil (3.1), 4)
  t.is (ceil (-3.9), -3)
  t.is (ceil (3), 3)
})

// =============================================================================
// sum / product / even / odd
// =============================================================================

test ('sum adds all numbers in the array', (t) => {
  t.is (sum ([1, 2, 3]), 6)
  t.is (sum ([]), 0)
  t.is (sum ([42]), 42)
  t.is (sum ([-1, 1]), 0)
})

test ('product multiplies all numbers in the array', (t) => {
  t.is (product ([2, 3, 4]), 24)
  t.is (product ([]), 1)
  t.is (product ([5]), 5)
  t.is (product ([0, 100]), 0)
})

test ('even returns true for even integers', (t) => {
  t.ok (even (0))
  t.ok (even (2))
  t.ok (even (-4))
  t.absent (even (1))
  t.absent (even (-3))
})

test ('odd returns true for odd integers', (t) => {
  t.ok (odd (1))
  t.ok (odd (-3))
  t.ok (odd (7))
  t.absent (odd (0))
  t.absent (odd (2))
})

// =============================================================================
// parseFloat_
// =============================================================================

test ('parseFloat_ returns Just for valid float strings', (t) => {
  const m1 = parseFloat_ ('3.14')
  t.ok (isJust (m1))
  t.is (m1.value, 3.14)

  const m2 = parseFloat_ ('42')
  t.ok (isJust (m2))
  t.is (m2.value, 42)

  const m3 = parseFloat_ ('-1.5')
  t.ok (isJust (m3))
  t.is (m3.value, -1.5)

  const m4 = parseFloat_ ('1e3')
  t.ok (isJust (m4))
  t.is (m4.value, 1000)
})

test ('parseFloat_ returns Nothing for invalid strings', (t) => {
  t.ok (isNothing (parseFloat_ ('abc')))
  t.ok (isNothing (parseFloat_ ('')))
  t.ok (isNothing (parseFloat_ ('1.2.3')))
  t.ok (isNothing (parseFloat_ ('  ')))
})

// =============================================================================
// parseInt_
// =============================================================================

test ('parseInt_ returns Just for valid integer strings', (t) => {
  const m1 = parseInt_ (10) ('42')
  t.ok (isJust (m1))
  t.is (m1.value, 42)

  const m2 = parseInt_ (16) ('ff')
  t.ok (isJust (m2))
  t.is (m2.value, 255)

  const m3 = parseInt_ (2) ('1010')
  t.ok (isJust (m3))
  t.is (m3.value, 10)
})

test ('parseInt_ returns Nothing for invalid strings', (t) => {
  t.ok (isNothing (parseInt_ (10) ('abc')))
  t.ok (isNothing (parseInt_ (10) ('')))
  t.ok (isNothing (parseInt_ (10) ('1.5')))
})

test ('parseInt_ returns Nothing for invalid radix', (t) => {
  t.ok (isNothing (parseInt_ (1) ('1')))
  t.ok (isNothing (parseInt_ (37) ('1')))
  t.ok (isNothing (parseInt_ (1.5) ('1')))
})
