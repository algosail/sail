import test from 'brittle'
import { isBool, equals } from '../lib/boolean.js'

// =============================================================================
// boolean.js
// =============================================================================

test ('isBool returns true for boolean primitives', (t) => {
  t.ok (isBool (true))
  t.ok (isBool (false))
})

test ('isBool returns false for non-booleans', (t) => {
  t.absent (isBool (1))
  t.absent (isBool (0))
  t.absent (isBool ('true'))
  t.absent (isBool (null))
  t.absent (isBool (undefined))
  t.absent (isBool ({}))
})

test ('equals returns true for same boolean values', (t) => {
  t.ok (equals (true) (true))
  t.ok (equals (false) (false))
})

test ('equals returns false for different boolean values', (t) => {
  t.absent (equals (true) (false))
  t.absent (equals (false) (true))
})

test ('equals returns false when either argument is not a boolean', (t) => {
  t.absent (equals (true) (1))
  t.absent (equals (1) (true))
  t.absent (equals (true) ('true'))
  t.absent (equals (null) (null))
})
