import test from 'brittle'
import {
  just, nothing, fromNullable, fromPredicate, tryCatch,
  isJust, isNothing,
  maybe, fromMaybe, fromMaybe_, toNull, toUndefined, toEither,
  map, filter, ap, chain, chainNullable,
  alt, fold, traverse,
  zip, justs, mapMaybe,
} from '../lib/maybe.js'
import { isRight, isLeft } from '../lib/either.js'

// =============================================================================
// Constructors
// =============================================================================

test ('just wraps a value', (t) => {
  const m = just (1)
  t.is (m.tag, 'just')
  t.is (m.value, 1)
})

test ('nothing has the nothing tag', (t) => {
  const m = nothing ()
  t.is (m.tag, 'nothing')
})

test ('fromNullable returns Just for non-null values', (t) => {
  t.ok (isJust (fromNullable (1)))
  t.ok (isJust (fromNullable (0)))
  t.ok (isJust (fromNullable ('')))
  t.ok (isJust (fromNullable (false)))
})

test ('fromNullable returns Nothing for null and undefined', (t) => {
  t.ok (isNothing (fromNullable (null)))
  t.ok (isNothing (fromNullable (undefined)))
})

test ('fromPredicate returns Just when predicate holds', (t) => {
  const m = fromPredicate ((x) => x > 0) (5)
  t.ok (isJust (m))
  t.is (m.value, 5)
})

test ('fromPredicate returns Nothing when predicate fails', (t) => {
  t.ok (isNothing (fromPredicate ((x) => x > 0) (-1)))
  t.ok (isNothing (fromPredicate ((x) => x > 0) (0)))
})

test ('tryCatch returns Just on success', (t) => {
  const m = tryCatch (() => JSON.parse ('{"a":1}'))
  t.ok (isJust (m))
  t.alike (m.value, { a: 1 })
})

test ('tryCatch returns Nothing on throw', (t) => {
  t.ok (isNothing (tryCatch (() => JSON.parse ('bad json'))))
})

// =============================================================================
// Guards
// =============================================================================

test ('isJust returns true only for Just', (t) => {
  t.ok (isJust (just (1)))
  t.absent (isJust (nothing ()))
  t.absent (isJust (null))
  t.absent (isJust (undefined))
  t.absent (isJust (42))
})

test ('isNothing returns true only for Nothing', (t) => {
  t.ok (isNothing (nothing ()))
  t.absent (isNothing (just (1)))
  t.absent (isNothing (null))
  t.absent (isNothing (42))
})

// =============================================================================
// Destructors
// =============================================================================

test ('maybe calls onJust for Just', (t) => {
  t.is (maybe (() => 0) ((x) => x + 1) (just (1)), 2)
})

test ('maybe calls onNothing thunk for Nothing', (t) => {
  t.is (maybe (() => 0) ((x) => x + 1) (nothing ()), 0)
})

test ('maybe onNothing is lazy — not called for Just', (t) => {
  let called = false
  maybe (() => { called = true; return 0 }) ((x) => x) (just (5))
  t.absent (called)
})

test ('fromMaybe returns value for Just', (t) => {
  t.is (fromMaybe (0) (just (5)), 5)
})

test ('fromMaybe returns default for Nothing', (t) => {
  t.is (fromMaybe (0) (nothing ()), 0)
})

test ('fromMaybe_ returns value for Just', (t) => {
  t.is (fromMaybe_ (() => 0) (just (5)), 5)
})

test ('fromMaybe_ calls thunk for Nothing', (t) => {
  let called = false
  const result = fromMaybe_ (() => { called = true; return 99 }) (nothing ())
  t.is (result, 99)
  t.ok (called)
})

test ('fromMaybe_ thunk is NOT called for Just', (t) => {
  let called = false
  fromMaybe_ (() => { called = true; return 0 }) (just (1))
  t.absent (called)
})

test ('toNull returns value for Just, null for Nothing', (t) => {
  t.is (toNull (just (42)), 42)
  t.is (toNull (nothing ()), null)
})

test ('toUndefined returns value for Just, undefined for Nothing', (t) => {
  t.is (toUndefined (just (42)), 42)
  t.is (toUndefined (nothing ()), undefined)
})

test ('toEither returns Right for Just', (t) => {
  const e = toEither ('err') (just (1))
  t.ok (isRight (e))
  t.is (e.right, 1)
})

test ('toEither returns Left with default for Nothing', (t) => {
  const e = toEither ('err') (nothing ())
  t.ok (isLeft (e))
  t.is (e.left, 'err')
})

// =============================================================================
// Functor
// =============================================================================

test ('map applies f to Just value', (t) => {
  const m = map ((x) => x + 1) (just (1))
  t.ok (isJust (m))
  t.is (m.value, 2)
})

test ('map passes Nothing through', (t) => {
  t.ok (isNothing (map ((x) => x + 1) (nothing ())))
})

// =============================================================================
// Filterable
// =============================================================================

test ('filter keeps Just when predicate holds', (t) => {
  const m = filter ((x) => x > 0) (just (1))
  t.ok (isJust (m))
  t.is (m.value, 1)
})

test ('filter returns Nothing when predicate fails on Just', (t) => {
  t.ok (isNothing (filter ((x) => x > 0) (just (-1))))
})

test ('filter passes Nothing through', (t) => {
  t.ok (isNothing (filter ((x) => x > 0) (nothing ())))
})

// =============================================================================
// Applicative
// =============================================================================

test ('ap applies Just function to Just value', (t) => {
  const m = ap (just ((x) => x + 1)) (just (1))
  t.ok (isJust (m))
  t.is (m.value, 2)
})

test ('ap returns Nothing when function is Nothing', (t) => {
  t.ok (isNothing (ap (nothing ()) (just (1))))
})

test ('ap returns Nothing when value is Nothing', (t) => {
  t.ok (isNothing (ap (just ((x) => x + 1)) (nothing ())))
})

test ('ap returns Nothing when both are Nothing', (t) => {
  t.ok (isNothing (ap (nothing ()) (nothing ())))
})

// =============================================================================
// Monad
// =============================================================================

test ('chain applies f to Just value', (t) => {
  const m = chain ((x) => just (x + 1)) (just (1))
  t.ok (isJust (m))
  t.is (m.value, 2)
})

test ('chain passes Nothing through', (t) => {
  t.ok (isNothing (chain ((x) => just (x + 1)) (nothing ())))
})

test ('chain flattens when f returns Nothing', (t) => {
  t.ok (isNothing (chain (() => nothing ()) (just (1))))
})

test ('chainNullable lifts nullable result into Maybe', (t) => {
  const m = chainNullable ((x) => x.name) (just ({ name: 'Alice' }))
  t.ok (isJust (m))
  t.is (m.value, 'Alice')
})

test ('chainNullable returns Nothing for null result', (t) => {
  t.ok (isNothing (chainNullable ((x) => x.name) (just ({}))))
})

test ('chainNullable passes Nothing through', (t) => {
  t.ok (isNothing (chainNullable ((x) => x.name) (nothing ())))
})

// =============================================================================
// Alt
// =============================================================================

test ('alt returns first when it is Just', (t) => {
  const m = alt (just (2)) (just (1))
  t.is (m.value, 1)
})

test ('alt returns second when first is Nothing', (t) => {
  const m = alt (just (2)) (nothing ())
  t.is (m.value, 2)
})

test ('alt returns Nothing when both are Nothing', (t) => {
  t.ok (isNothing (alt (nothing ()) (nothing ())))
})

// =============================================================================
// Foldable
// =============================================================================

test ('fold applies f for Just', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (just (5)), 5)
})

test ('fold returns init for Nothing', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (nothing ()), 0)
})

// =============================================================================
// Traversable
// =============================================================================

test ('traverse maps Just value through applicative', (t) => {
  const result = traverse (Array.of) ((f) => (xs) => xs.map (f)) ((x) => [x, -x]) (just (1))
  t.alike (result, [just (1), just (-1)])
})

test ('traverse lifts Nothing into the applicative', (t) => {
  const result = traverse (Array.of) ((f) => (xs) => xs.map (f)) ((x) => [x]) (nothing ())
  t.alike (result, [nothing ()])
})

// =============================================================================
// Utilities
// =============================================================================

test ('zip combines two Justs into a pair', (t) => {
  const m = zip (just (1)) (just (2))
  t.ok (isJust (m))
  t.alike (m.value, [1, 2])
})

test ('zip returns Nothing when first is Nothing', (t) => {
  t.ok (isNothing (zip (nothing ()) (just (2))))
})

test ('zip returns Nothing when second is Nothing', (t) => {
  t.ok (isNothing (zip (just (1)) (nothing ())))
})

test ('justs collects Just values from an array', (t) => {
  t.alike (justs ([just (1), nothing (), just (2), nothing (), just (3)]), [1, 2, 3])
})

test ('justs returns empty array for all Nothings', (t) => {
  t.alike (justs ([nothing (), nothing ()]), [])
})

test ('justs returns empty array for empty input', (t) => {
  t.alike (justs ([]), [])
})

test ('mapMaybe maps and collects only Just results', (t) => {
  const result = mapMaybe ((x) => x > 0 ? just (x) : nothing ()) ([1, -2, 3, -4, 5])
  t.alike (result, [1, 3, 5])
})

test ('mapMaybe returns empty array when all results are Nothing', (t) => {
  t.alike (mapMaybe (() => nothing ()) ([1, 2, 3]), [])
})
