import test from 'brittle'
import {
  failure, success,
  isFailure, isSuccess, isValidation,
  fromPredicate, fromNullable,
  validation,
  map, mapFailure, bimap,
  of, ap, alt,
  fold, traverse,
  toMaybe, toEither, fromEither,
  getFailure, failures, successes, partition,
} from '../lib/validation.js'
import { isJust, isNothing } from '../lib/maybe.js'
import { isLeft, isRight, left, right } from '../lib/either.js'

// =============================================================================
// Constructors
// =============================================================================

test ('failure wraps errors in the Failure constructor', (t) => {
  const va = failure (['too short'])
  t.is (va.tag, 'failure')
  t.alike (va.failure, ['too short'])
})

test ('success wraps a value in the Success constructor', (t) => {
  const va = success (42)
  t.is (va.tag, 'success')
  t.is (va.value, 42)
})

// =============================================================================
// Guards
// =============================================================================

test ('isFailure returns true only for Failure', (t) => {
  t.ok (isFailure (failure (['err'])))
  t.absent (isFailure (success (1)))
  t.absent (isFailure (null))
  t.absent (isFailure (42))
})

test ('isSuccess returns true only for Success', (t) => {
  t.ok (isSuccess (success (1)))
  t.absent (isSuccess (failure (['err'])))
  t.absent (isSuccess (null))
  t.absent (isSuccess (42))
})

test ('isValidation returns true for Failure or Success', (t) => {
  t.ok (isValidation (failure (['e'])))
  t.ok (isValidation (success (1)))
  t.absent (isValidation (42))
  t.absent (isValidation (null))
  t.absent (isValidation ({ tag: 'other' }))
})

// =============================================================================
// Constructors from predicates / nullables
// =============================================================================

test ('fromPredicate returns Success when predicate holds', (t) => {
  const va = fromPredicate ((x) => x > 0) (['must be positive']) (3)
  t.ok (isSuccess (va))
  t.is (va.value, 3)
})

test ('fromPredicate returns Failure when predicate fails', (t) => {
  const va = fromPredicate ((x) => x > 0) (['must be positive']) (-1)
  t.ok (isFailure (va))
  t.alike (va.failure, ['must be positive'])
})

test ('fromPredicate returns Failure for boundary value that fails', (t) => {
  const va = fromPredicate ((x) => x > 0) (['must be positive']) (0)
  t.ok (isFailure (va))
})

test ('fromNullable returns Success for a non-null value', (t) => {
  const va = fromNullable (['required']) (42)
  t.ok (isSuccess (va))
  t.is (va.value, 42)
})

test ('fromNullable returns Success for falsy non-null values', (t) => {
  t.ok (isSuccess (fromNullable (['required']) (0)))
  t.ok (isSuccess (fromNullable (['required']) ('')))
  t.ok (isSuccess (fromNullable (['required']) (false)))
})

test ('fromNullable returns Failure for null', (t) => {
  const va = fromNullable (['required']) (null)
  t.ok (isFailure (va))
  t.alike (va.failure, ['required'])
})

test ('fromNullable returns Failure for undefined', (t) => {
  const va = fromNullable (['required']) (undefined)
  t.ok (isFailure (va))
  t.alike (va.failure, ['required'])
})

// =============================================================================
// Destructor
// =============================================================================

test ('validation applies onSuccess to Success', (t) => {
  t.is (validation ((es) => es.join (', ')) ((x) => x * 2) (success (21)), 42)
})

test ('validation applies onFailure to Failure', (t) => {
  t.is (validation ((es) => es.join (', ')) ((x) => x) (failure (['oops'])), 'oops')
})

test ('validation handles multiple errors', (t) => {
  const result = validation ((es) => es.join (' | ')) ((x) => x) (failure (['err1', 'err2']))
  t.is (result, 'err1 | err2')
})

// =============================================================================
// Functor
// =============================================================================

test ('map applies f to Success value', (t) => {
  const va = map ((x) => x + 1) (success (1))
  t.ok (isSuccess (va))
  t.is (va.value, 2)
})

test ('map passes Failure through unchanged', (t) => {
  const va = map ((x) => x + 1) (failure (['err']))
  t.ok (isFailure (va))
  t.alike (va.failure, ['err'])
})

test ('mapFailure applies f to Failure errors', (t) => {
  const va = mapFailure ((es) => es.map ((e) => `Error: ${e}`)) (failure (['oops']))
  t.ok (isFailure (va))
  t.alike (va.failure, ['Error: oops'])
})

test ('mapFailure passes Success through unchanged', (t) => {
  const va = mapFailure ((es) => es.map ((e) => `Error: ${e}`)) (success (1))
  t.ok (isSuccess (va))
  t.is (va.value, 1)
})

test ('bimap maps Success with fr', (t) => {
  const va = bimap ((es) => es.length) ((x) => x * 2) (success (3))
  t.ok (isSuccess (va))
  t.is (va.value, 6)
})

test ('bimap maps Failure with fl', (t) => {
  const va = bimap ((es) => es.length) ((x) => x * 2) (failure (['a', 'b']))
  t.ok (isFailure (va))
  t.is (va.failure, 2)
})

// =============================================================================
// Applicative — the key feature of Validation
// =============================================================================

test ('of lifts a value into Success', (t) => {
  const va = of (42)
  t.ok (isSuccess (va))
  t.is (va.value, 42)
})

test ('ap applies Success function to Success value', (t) => {
  const apArr = ap ((a) => (b) => a.concat (b))
  const va = apArr (success ((x) => x + 1)) (success (2))
  t.ok (isSuccess (va))
  t.is (va.value, 3)
})

test ('ap returns Failure when function is Failure', (t) => {
  const apArr = ap ((a) => (b) => a.concat (b))
  const va = apArr (failure (['bad fn'])) (success (2))
  t.ok (isFailure (va))
  t.alike (va.failure, ['bad fn'])
})

test ('ap returns Failure when value is Failure', (t) => {
  const apArr = ap ((a) => (b) => a.concat (b))
  const va = apArr (success ((x) => x + 1)) (failure (['bad val']))
  t.ok (isFailure (va))
  t.alike (va.failure, ['bad val'])
})

test ('ap ACCUMULATES errors when both are Failure — key difference from Either', (t) => {
  const apArr = ap ((a) => (b) => a.concat (b))
  const va = apArr (failure (['bad fn'])) (failure (['bad val']))
  t.ok (isFailure (va))
  t.alike (va.failure, ['bad fn', 'bad val'])
})

test ('ap accumulates errors with custom semigroup', (t) => {
  const apStr = ap ((a) => (b) => a + b)
  const va = apStr (failure ('fn-err')) (failure ('val-err'))
  t.ok (isFailure (va))
  t.is (va.failure, 'fn-errval-err')
})

test ('ap accumulates all errors across multiple validations', (t) => {
  const apArr = ap ((a) => (b) => a.concat (b))
  const v1 = failure (['err1'])
  const v2 = failure (['err2'])
  const v3 = failure (['err3'])
  const combined = apArr (apArr (v1) (v2)) (v3)
  t.ok (isFailure (combined))
  t.alike (combined.failure, ['err1', 'err2', 'err3'])
})

// =============================================================================
// Alt
// =============================================================================

test ('alt returns the first Success', (t) => {
  const va = alt (success (2)) (success (1))
  t.ok (isSuccess (va))
  t.is (va.value, 1)
})

test ('alt returns the second when first is Failure', (t) => {
  const va = alt (success (2)) (failure (['e']))
  t.ok (isSuccess (va))
  t.is (va.value, 2)
})

test ('alt returns the second when both are Failure', (t) => {
  const va = alt (failure (['b'])) (failure (['a']))
  t.ok (isFailure (va))
  t.alike (va.failure, ['b'])
})

// =============================================================================
// Foldable
// =============================================================================

test ('fold reduces Success with f and init', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (success (5)), 5)
  t.is (fold ((acc) => (x) => acc + x) (10) (success (5)), 15)
})

test ('fold returns init for Failure', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (failure (['err'])), 0)
  t.is (fold ((acc) => (x) => acc + x) (42) (failure (['err'])), 42)
})

// =============================================================================
// Traversable
// =============================================================================

test ('traverse maps Success through an applicative', (t) => {
  const result = traverse (Array.of) ((f) => (xs) => xs.map (f)) ((x) => [x, -x]) (success (1))
  t.alike (result, [success (1), success (-1)])
})

test ('traverse lifts Failure into the applicative', (t) => {
  const result = traverse (Array.of) ((f) => (xs) => xs.map (f)) ((x) => [x]) (failure (['e']))
  t.alike (result, [failure (['e'])])
})

// =============================================================================
// Conversions
// =============================================================================

test ('toMaybe converts Success to Just', (t) => {
  const m = toMaybe (success (1))
  t.ok (isJust (m))
  t.is (m.value, 1)
})

test ('toMaybe converts Failure to Nothing', (t) => {
  t.ok (isNothing (toMaybe (failure (['err']))))
})

test ('toEither converts Success to Right', (t) => {
  const e = toEither (success (42))
  t.ok (isRight (e))
  t.is (e.right, 42)
})

test ('toEither converts Failure to Left', (t) => {
  const e = toEither (failure (['err']))
  t.ok (isLeft (e))
  t.alike (e.left, ['err'])
})

test ('fromEither converts Right to Success', (t) => {
  const va = fromEither (right (42))
  t.ok (isSuccess (va))
  t.is (va.value, 42)
})

test ('fromEither converts Left to Failure', (t) => {
  const va = fromEither (left (['err']))
  t.ok (isFailure (va))
  t.alike (va.failure, ['err'])
})

test ('toEither and fromEither are inverses for Success', (t) => {
  const original = success (42)
  t.ok (isSuccess (fromEither (toEither (original))))
  t.is (fromEither (toEither (original)).value, 42)
})

test ('toEither and fromEither are inverses for Failure', (t) => {
  const original = failure (['err'])
  t.ok (isFailure (fromEither (toEither (original))))
  t.alike (fromEither (toEither (original)).failure, ['err'])
})

// =============================================================================
// Utilities
// =============================================================================

test ('getFailure returns the failure array for Failure', (t) => {
  t.alike (getFailure (failure (['a', 'b'])), ['a', 'b'])
})

test ('getFailure returns an empty array for Success', (t) => {
  t.alike (getFailure (success (1)), [])
})

test ('failures collects all Failure errors from an array', (t) => {
  const result = failures ([success (1), failure (['a']), failure (['b']), success (2)])
  t.alike (result, ['a', 'b'])
})

test ('failures returns empty array when all are Success', (t) => {
  t.alike (failures ([success (1), success (2)]), [])
})

test ('failures returns empty array for empty input', (t) => {
  t.alike (failures ([]), [])
})

test ('successes collects all Success values from an array', (t) => {
  const result = successes ([success (1), failure (['e']), success (2)])
  t.alike (result, [1, 2])
})

test ('successes returns empty array when all are Failure', (t) => {
  t.alike (successes ([failure (['a']), failure (['b'])]), [])
})

test ('successes returns empty array for empty input', (t) => {
  t.alike (successes ([]), [])
})

test ('partition splits into [successes, failures]', (t) => {
  const [ss, fs] = partition ([success (1), failure (['e']), success (2)])
  t.alike (ss, [1, 2])
  t.alike (fs, [['e']])
})

test ('partition with all Success gives empty failures', (t) => {
  const [ss, fs] = partition ([success (1), success (2)])
  t.alike (ss, [1, 2])
  t.alike (fs, [])
})

test ('partition with all Failure gives empty successes', (t) => {
  const [ss, fs] = partition ([failure (['a']), failure (['b'])])
  t.alike (ss, [])
  t.alike (fs, [['a'], ['b']])
})

test ('partition on empty array returns two empty arrays', (t) => {
  const [ss, fs] = partition ([])
  t.alike (ss, [])
  t.alike (fs, [])
})
