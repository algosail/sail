import test from 'brittle'
import {
  empty, of,
  isNil, isNotNil,
  fromPredicate, fromMaybe,
  map, chain, getOrElse, getOrElse_, alt,
  toMaybe,
} from '../lib/nil.js'
import { just, nothing, isJust, isNothing } from '../lib/maybe.js'

// =============================================================================
// Constructors
// =============================================================================

test ('empty returns null', (t) => {
  t.is (empty (), null)
})

test ('of returns the value when non-nil', (t) => {
  t.is (of (1), 1)
  t.is (of (0), 0)
  t.is (of (''), '')
  t.is (of (false), false)
})

test ('of returns null for null', (t) => {
  t.is (of (null), null)
})

test ('of returns null for undefined', (t) => {
  t.is (of (undefined), null)
})

// =============================================================================
// Guards
// =============================================================================

test ('isNil returns true for null', (t) => {
  t.ok (isNil (null))
})

test ('isNil returns true for undefined', (t) => {
  t.ok (isNil (undefined))
})

test ('isNil returns false for any other value', (t) => {
  t.absent (isNil (0))
  t.absent (isNil (''))
  t.absent (isNil (false))
  t.absent (isNil ([]))
  t.absent (isNil ({}))
})

test ('isNotNil returns true for non-nil values', (t) => {
  t.ok (isNotNil (0))
  t.ok (isNotNil (''))
  t.ok (isNotNil (false))
  t.ok (isNotNil ([]))
  t.ok (isNotNil ({}))
  t.ok (isNotNil (42))
})

test ('isNotNil returns false for null', (t) => {
  t.absent (isNotNil (null))
})

test ('isNotNil returns false for undefined', (t) => {
  t.absent (isNotNil (undefined))
})

// =============================================================================
// Constructors from other types
// =============================================================================

test ('fromPredicate returns the value when predicate holds', (t) => {
  t.is (fromPredicate ((x) => x > 0) (5), 5)
  t.is (fromPredicate ((x) => x > 0) (1), 1)
})

test ('fromPredicate returns null when predicate fails', (t) => {
  t.is (fromPredicate ((x) => x > 0) (-1), null)
  t.is (fromPredicate ((x) => x > 0) (0), null)
})

test ('fromPredicate returns null for nil input regardless of predicate', (t) => {
  t.is (fromPredicate ((_) => true) (null), null)
  t.is (fromPredicate ((_) => true) (undefined), null)
})

test ('fromMaybe converts Just to its value', (t) => {
  t.is (fromMaybe (just (42)), 42)
  t.is (fromMaybe (just (0)), 0)
  t.is (fromMaybe (just ('')), '')
})

test ('fromMaybe converts Nothing to null', (t) => {
  t.is (fromMaybe (nothing ()), null)
})

// =============================================================================
// Transformations
// =============================================================================

test ('map applies f to a non-nil value', (t) => {
  t.is (map ((x) => x + 1) (5), 6)
  t.is (map ((x) => x * 2) (3), 6)
})

test ('map propagates null', (t) => {
  t.is (map ((x) => x + 1) (null), null)
})

test ('map propagates undefined as null', (t) => {
  t.is (map ((x) => x + 1) (undefined), null)
})

test ('map preserves falsy non-nil values', (t) => {
  t.is (map ((x) => x + 1) (0), 1)
  t.is (map ((x) => String (x)) (false), 'false')
})

test ('chain applies f and returns its result for non-nil value', (t) => {
  t.is (chain ((x) => x > 0 ? x * 2 : null) (5), 10)
})

test ('chain propagates null from f', (t) => {
  t.is (chain ((x) => x > 0 ? x * 2 : null) (-1), null)
})

test ('chain propagates null input', (t) => {
  t.is (chain ((x) => x * 2) (null), null)
})

test ('chain propagates undefined input as null', (t) => {
  t.is (chain ((x) => x * 2) (undefined), null)
})

// =============================================================================
// getOrElse / getOrElse_
// =============================================================================

test ('getOrElse returns the value for non-nil', (t) => {
  t.is (getOrElse (0) (5), 5)
  t.is (getOrElse (0) (0), 0)
  t.is (getOrElse (0) (false), false)
})

test ('getOrElse returns the default for null', (t) => {
  t.is (getOrElse (0) (null), 0)
})

test ('getOrElse returns the default for undefined', (t) => {
  t.is (getOrElse (0) (undefined), 0)
})

test ('getOrElse_ returns the value for non-nil', (t) => {
  t.is (getOrElse_ (() => 0) (5), 5)
  t.is (getOrElse_ (() => 0) (0), 0)
})

test ('getOrElse_ calls thunk for null', (t) => {
  let called = false
  const result = getOrElse_ (() => { called = true; return 99 }) (null)
  t.is (result, 99)
  t.ok (called)
})

test ('getOrElse_ calls thunk for undefined', (t) => {
  t.is (getOrElse_ (() => 42) (undefined), 42)
})

test ('getOrElse_ thunk is NOT called for non-nil value', (t) => {
  let called = false
  getOrElse_ (() => { called = true; return 0 }) (5)
  t.absent (called)
})

// =============================================================================
// alt
// =============================================================================

test ('alt returns the first value when it is non-nil', (t) => {
  t.is (alt (5) (3), 3)
  t.is (alt (0) (false), false)
})

test ('alt returns the second value when first is null', (t) => {
  t.is (alt (5) (null), 5)
})

test ('alt returns the second value when first is undefined', (t) => {
  t.is (alt (5) (undefined), 5)
})

test ('alt returns null when both are null', (t) => {
  t.is (alt (null) (null), null)
})

test ('alt returns null when second is null and first is null', (t) => {
  t.is (alt (null) (undefined), null)
})

// =============================================================================
// Conversions
// =============================================================================

test ('toMaybe converts non-nil to Just', (t) => {
  const m = toMaybe (42)
  t.ok (isJust (m))
  t.is (m.value, 42)
})

test ('toMaybe converts falsy non-nil values to Just', (t) => {
  t.ok (isJust (toMaybe (0)))
  t.ok (isJust (toMaybe ('')))
  t.ok (isJust (toMaybe (false)))
})

test ('toMaybe converts null to Nothing', (t) => {
  t.ok (isNothing (toMaybe (null)))
})

test ('toMaybe converts undefined to Nothing', (t) => {
  t.ok (isNothing (toMaybe (undefined)))
})
