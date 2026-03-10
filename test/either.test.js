import test from 'brittle'
import {
  left, right, fromNullable, tryCatch, fromPredicate,
  isLeft, isRight, isEither,
  either, fromLeft, fromRight, fromEither, fold,
  lefts, rights, partition,
  encase, toMaybe, swap,
  map, mapLeft, bimap,
  ap, chain, chainLeft, chainFirst,
  alt, traverse,
} from '../lib/either.js'
import { isJust, isNothing } from '../lib/maybe.js'

// =============================================================================
// Constructors
// =============================================================================

test ('left wraps a value in Left', (t) => {
  const e = left ('err')
  t.is (e.tag, 'left')
  t.is (e.left, 'err')
})

test ('right wraps a value in Right', (t) => {
  const e = right (42)
  t.is (e.tag, 'right')
  t.is (e.right, 42)
})

test ('fromNullable returns Right for non-null value', (t) => {
  const e = fromNullable (() => 'missing') (42)
  t.ok (isRight (e))
  t.is (e.right, 42)
})

test ('fromNullable returns Right for falsy non-null values', (t) => {
  t.ok (isRight (fromNullable (() => 'missing') (0)))
  t.ok (isRight (fromNullable (() => 'missing') ('')))
  t.ok (isRight (fromNullable (() => 'missing') (false)))
})

test ('fromNullable returns Left for null', (t) => {
  const e = fromNullable (() => 'missing') (null)
  t.ok (isLeft (e))
  t.is (e.left, 'missing')
})

test ('fromNullable returns Left for undefined', (t) => {
  const e = fromNullable (() => 'missing') (undefined)
  t.ok (isLeft (e))
  t.is (e.left, 'missing')
})

test ('tryCatch returns Right on success', (t) => {
  const e = tryCatch (JSON.parse) (() => () => 'err') ('{"a":1}')
  t.ok (isRight (e))
  t.alike (e.right, { a: 1 })
})

test ('tryCatch returns Left on throw', (t) => {
  const e = tryCatch (JSON.parse) ((err) => (_args) => err.message) ('bad json')
  t.ok (isLeft (e))
  t.is (typeof e.left, 'string')
})

test ('tryCatch passes error and args to onError', (t) => {
  let capturedArgs = null
  tryCatch (() => { throw new Error ('boom') }) ((_err) => (args) => { capturedArgs = args; return 'x' }) ('a', 'b')
  t.alike (capturedArgs, ['a', 'b'])
})

test ('fromPredicate returns Right when predicate holds', (t) => {
  const e = fromPredicate ((x) => x > 0) ((x) => `${x} is not positive`) (3)
  t.ok (isRight (e))
  t.is (e.right, 3)
})

test ('fromPredicate returns Left when predicate fails', (t) => {
  const e = fromPredicate ((x) => x > 0) ((x) => `${x} is not positive`) (-1)
  t.ok (isLeft (e))
  t.is (e.left, '-1 is not positive')
})

// =============================================================================
// Guards
// =============================================================================

test ('isLeft returns true for Left', (t) => {
  t.ok (isLeft (left ('x')))
  t.absent (isLeft (right (1)))
  t.absent (isLeft (null))
  t.absent (isLeft (42))
})

test ('isRight returns true for Right', (t) => {
  t.ok (isRight (right (1)))
  t.absent (isRight (left ('x')))
  t.absent (isRight (null))
  t.absent (isRight (42))
})

test ('isEither returns true for Left or Right', (t) => {
  t.ok (isEither (left (1)))
  t.ok (isEither (right (1)))
  t.absent (isEither (42))
  t.absent (isEither (null))
  t.absent (isEither ({ tag: 'other' }))
})

// =============================================================================
// Destructors
// =============================================================================

test ('either applies onRight to Right', (t) => {
  t.is (either ((l) => `err: ${l}`) ((r) => r * 2) (right (21)), 42)
})

test ('either applies onLeft to Left', (t) => {
  t.is (either ((l) => `err: ${l}`) ((r) => r * 2) (left ('x')), 'err: x')
})

test ('fromLeft extracts Left value', (t) => {
  t.is (fromLeft ('def') (left ('x')), 'x')
})

test ('fromLeft returns default for Right', (t) => {
  t.is (fromLeft ('def') (right (1)), 'def')
})

test ('fromRight extracts Right value', (t) => {
  t.is (fromRight (0) (right (42)), 42)
})

test ('fromRight returns default for Left', (t) => {
  t.is (fromRight (0) (left ('x')), 0)
})

test ('fromEither extracts value regardless of constructor', (t) => {
  t.is (fromEither (left (42)), 42)
  t.is (fromEither (right (42)), 42)
})

test ('fold reduces Right with f and init', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (right (5)), 5)
})

test ('fold returns init for Left', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (left ('x')), 0)
})

// =============================================================================
// Array utilities
// =============================================================================

test ('lefts filters to Left values and extracts them', (t) => {
  t.alike (lefts ([left (1), right (2), left (3)]), [1, 3])
})

test ('lefts returns empty array when no Lefts', (t) => {
  t.alike (lefts ([right (1), right (2)]), [])
})

test ('rights filters to Right values and extracts them', (t) => {
  t.alike (rights ([left (1), right (2), right (3)]), [2, 3])
})

test ('rights returns empty array when no Rights', (t) => {
  t.alike (rights ([left (1), left (2)]), [])
})

test ('partition splits into [rights, lefts]', (t) => {
  const [rs, ls] = partition ([right (1), left ('e'), right (2)])
  t.alike (rs, [1, 2])
  t.alike (ls, ['e'])
})

test ('partition with all Rights gives empty lefts', (t) => {
  const [rs, ls] = partition ([right (1), right (2)])
  t.alike (rs, [1, 2])
  t.alike (ls, [])
})

test ('partition with all Lefts gives empty rights', (t) => {
  const [rs, ls] = partition ([left ('a'), left ('b')])
  t.alike (rs, [])
  t.alike (ls, ['a', 'b'])
})

// =============================================================================
// Conversions
// =============================================================================

test ('encase returns Right for successful call', (t) => {
  const e = encase (JSON.parse) ('{"a":1}')
  t.ok (isRight (e))
  t.alike (e.right, { a: 1 })
})

test ('encase returns Left with Error for throwing call', (t) => {
  const e = encase (JSON.parse) ('bad json')
  t.ok (isLeft (e))
  t.ok (e.left instanceof Error)
})

test ('toMaybe returns Just for Right', (t) => {
  const m = toMaybe (right (1))
  t.ok (isJust (m))
  t.is (m.value, 1)
})

test ('toMaybe returns Nothing for Left', (t) => {
  t.ok (isNothing (toMaybe (left ('err'))))
})

test ('swap converts Left to Right', (t) => {
  const e = swap (left (1))
  t.ok (isRight (e))
  t.is (e.right, 1)
})

test ('swap converts Right to Left', (t) => {
  const e = swap (right (1))
  t.ok (isLeft (e))
  t.is (e.left, 1)
})

// =============================================================================
// Functor / Bifunctor
// =============================================================================

test ('map applies f to Right value', (t) => {
  const e = map ((x) => x + 1) (right (1))
  t.ok (isRight (e))
  t.is (e.right, 2)
})

test ('map passes Left through unchanged', (t) => {
  const e = map ((x) => x + 1) (left ('err'))
  t.ok (isLeft (e))
  t.is (e.left, 'err')
})

test ('mapLeft applies f to Left value', (t) => {
  const e = mapLeft ((x) => x + '!') (left ('err'))
  t.ok (isLeft (e))
  t.is (e.left, 'err!')
})

test ('mapLeft passes Right through unchanged', (t) => {
  const e = mapLeft ((x) => x + '!') (right (1))
  t.ok (isRight (e))
  t.is (e.right, 1)
})

test ('bimap maps Left with fl', (t) => {
  const e = bimap ((l) => l + '!') ((r) => r + 1) (left ('x'))
  t.ok (isLeft (e))
  t.is (e.left, 'x!')
})

test ('bimap maps Right with fr', (t) => {
  const e = bimap ((l) => l + '!') ((r) => r + 1) (right (2))
  t.ok (isRight (e))
  t.is (e.right, 3)
})

// =============================================================================
// Applicative
// =============================================================================

test ('ap applies Right function to Right value', (t) => {
  const e = ap (right ((x) => x + 1)) (right (2))
  t.ok (isRight (e))
  t.is (e.right, 3)
})

test ('ap returns Left when function is Left', (t) => {
  const e = ap (left ('err')) (right (2))
  t.ok (isLeft (e))
  t.is (e.left, 'err')
})

test ('ap returns Left when value is Left', (t) => {
  const e = ap (right ((x) => x + 1)) (left ('val-err'))
  t.ok (isLeft (e))
  t.is (e.left, 'val-err')
})

test ('ap prefers the function Left when both are Left', (t) => {
  const e = ap (left ('fn-err')) (left ('val-err'))
  t.ok (isLeft (e))
  t.is (e.left, 'fn-err')
})

// =============================================================================
// Monad
// =============================================================================

test ('chain applies f to Right value', (t) => {
  const e = chain ((x) => right (x + 1)) (right (2))
  t.ok (isRight (e))
  t.is (e.right, 3)
})

test ('chain passes Left through', (t) => {
  const e = chain ((x) => right (x + 1)) (left ('err'))
  t.ok (isLeft (e))
  t.is (e.left, 'err')
})

test ('chain propagates Left returned by f', (t) => {
  const e = chain (() => left ('new-err')) (right (1))
  t.ok (isLeft (e))
  t.is (e.left, 'new-err')
})

test ('chainLeft applies f to Left value', (t) => {
  const e = chainLeft ((err) => left (err + '!')) (left ('x'))
  t.ok (isLeft (e))
  t.is (e.left, 'x!')
})

test ('chainLeft passes Right through', (t) => {
  const e = chainLeft ((err) => left (err + '!')) (right (1))
  t.ok (isRight (e))
  t.is (e.right, 1)
})

test ('chainFirst short-circuits to Left when f returns Left', (t) => {
  const e = chainFirst ((_x) => left ('stop')) (right (1))
  t.ok (isLeft (e))
  t.is (e.left, 'stop')
})

test ('chainFirst returns original Right when f returns Right', (t) => {
  const e = chainFirst ((_x) => right ('ok')) (right (1))
  t.ok (isRight (e))
  t.is (e.right, 1)
})

test ('chainFirst passes Left through without calling f', (t) => {
  let called = false
  const e = chainFirst ((_x) => { called = true; return left ('stop') }) (left ('e'))
  t.ok (isLeft (e))
  t.is (e.left, 'e')
  t.absent (called)
})

// =============================================================================
// Alt
// =============================================================================

test ('alt returns first when it is Right', (t) => {
  const e = alt (right (2)) (right (1))
  t.ok (isRight (e))
  t.is (e.right, 1)
})

test ('alt returns second when first is Left', (t) => {
  const e = alt (right (2)) (left ('x'))
  t.ok (isRight (e))
  t.is (e.right, 2)
})

test ('alt returns second when both are Left', (t) => {
  const e = alt (left ('y')) (left ('x'))
  t.ok (isLeft (e))
  t.is (e.left, 'y')
})

// =============================================================================
// Traversable
// =============================================================================

test ('traverse maps Right through applicative', (t) => {
  const result = traverse (Array.of) ((f) => (xs) => xs.map (f)) ((x) => [x, x]) (right (1))
  t.alike (result, [right (1), right (1)])
})

test ('traverse lifts Left into applicative', (t) => {
  const result = traverse (Array.of) ((f) => (xs) => xs.map (f)) ((x) => [x]) (left ('err'))
  t.alike (result, [left ('err')])
})
