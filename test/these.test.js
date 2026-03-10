import test from 'brittle'
import {
  this_, that, both,
  isThis, isThat, isBoth, isThese, hasThis, hasThat,
  these, getThis, getThat, fromThis, fromThat,
  equals, concat,
  map, mapThis, bimap,
  of, ap, chain,
  fold, toMaybe, toEither, swap,
} from '../lib/these.js'
import { isJust, isNothing } from '../lib/maybe.js'
import { isLeft, isRight } from '../lib/either.js'

// =============================================================================
// Constructors
// =============================================================================

test ('this_ wraps a left value', (t) => {
  const th = this_ ('warn')
  t.is (th.tag, 'this')
  t.is (th.this, 'warn')
})

test ('that wraps a right value', (t) => {
  const th = that (42)
  t.is (th.tag, 'that')
  t.is (th.that, 42)
})

test ('both wraps both values simultaneously', (t) => {
  const th = both ('warn') (42)
  t.is (th.tag, 'both')
  t.is (th.this, 'warn')
  t.is (th.that, 42)
})

// =============================================================================
// Guards
// =============================================================================

test ('isThis returns true only for This', (t) => {
  t.ok (isThis (this_ ('x')))
  t.absent (isThis (that (1)))
  t.absent (isThis (both ('w') (1)))
  t.absent (isThis (null))
  t.absent (isThis (42))
})

test ('isThat returns true only for That', (t) => {
  t.ok (isThat (that (1)))
  t.absent (isThat (this_ ('x')))
  t.absent (isThat (both ('w') (1)))
  t.absent (isThat (null))
})

test ('isBoth returns true only for Both', (t) => {
  t.ok (isBoth (both ('w') (1)))
  t.absent (isBoth (this_ ('x')))
  t.absent (isBoth (that (1)))
  t.absent (isBoth (null))
})

test ('isThese returns true for any These variant', (t) => {
  t.ok (isThese (this_ ('x')))
  t.ok (isThese (that (1)))
  t.ok (isThese (both ('w') (1)))
  t.absent (isThese (42))
  t.absent (isThese (null))
  t.absent (isThese ({ tag: 'other' }))
})

test ('hasThis returns true for This and Both', (t) => {
  t.ok (hasThis (this_ ('w')))
  t.ok (hasThis (both ('w') (1)))
  t.absent (hasThis (that (1)))
})

test ('hasThat returns true for That and Both', (t) => {
  t.ok (hasThat (that (1)))
  t.ok (hasThat (both ('w') (1)))
  t.absent (hasThat (this_ ('w')))
})

// =============================================================================
// Destructor
// =============================================================================

test ('these applies onThis for This', (t) => {
  const result = these ((a) => `warn:${a}`) ((b) => b * 2) ((a) => (b) => b) (this_ ('oops'))
  t.is (result, 'warn:oops')
})

test ('these applies onThat for That', (t) => {
  const result = these ((a) => `warn:${a}`) ((b) => b * 2) ((a) => (b) => b) (that (21))
  t.is (result, 42)
})

test ('these applies onBoth for Both', (t) => {
  const result = these ((a) => `warn:${a}`) ((b) => b * 2) ((a) => (b) => b) (both ('w') (21))
  t.is (result, 21)
})

test ('these passes both values to onBoth', (t) => {
  const result = these ((_) => null) ((_) => null) ((a) => (b) => `${a}:${b}`) (both ('key') ('val'))
  t.is (result, 'key:val')
})

// =============================================================================
// Accessors
// =============================================================================

test ('getThis returns Just the left value for This', (t) => {
  const m = getThis (this_ ('w'))
  t.ok (isJust (m))
  t.is (m.value, 'w')
})

test ('getThis returns Just the left value for Both', (t) => {
  const m = getThis (both ('w') (1))
  t.ok (isJust (m))
  t.is (m.value, 'w')
})

test ('getThis returns Nothing for That', (t) => {
  t.ok (isNothing (getThis (that (1))))
})

test ('getThat returns Just the right value for That', (t) => {
  const m = getThat (that (1))
  t.ok (isJust (m))
  t.is (m.value, 1)
})

test ('getThat returns Just the right value for Both', (t) => {
  const m = getThat (both ('w') (1))
  t.ok (isJust (m))
  t.is (m.value, 1)
})

test ('getThat returns Nothing for This', (t) => {
  t.ok (isNothing (getThat (this_ ('w'))))
})

test ('fromThis extracts the left value or returns default', (t) => {
  t.is (fromThis ('def') (this_ ('w')), 'w')
  t.is (fromThis ('def') (both ('w') (1)), 'w')
  t.is (fromThis ('def') (that (1)), 'def')
})

test ('fromThat extracts the right value or returns default', (t) => {
  t.is (fromThat (0) (that (1)), 1)
  t.is (fromThat (0) (both ('w') (1)), 1)
  t.is (fromThat (0) (this_ ('w')), 0)
})

// =============================================================================
// Eq
// =============================================================================

test ('equals returns true for structurally equal This values', (t) => {
  const eqA = (a) => (b) => a === b
  const eqB = (a) => (b) => a === b
  t.ok (equals (eqA) (eqB) (this_ ('w')) (this_ ('w')))
})

test ('equals returns true for structurally equal That values', (t) => {
  const eqA = (a) => (b) => a === b
  const eqB = (a) => (b) => a === b
  t.ok (equals (eqA) (eqB) (that (1)) (that (1)))
})

test ('equals returns true for structurally equal Both values', (t) => {
  const eqA = (a) => (b) => a === b
  const eqB = (a) => (b) => a === b
  t.ok (equals (eqA) (eqB) (both ('w') (1)) (both ('w') (1)))
})

test ('equals returns false when constructors differ', (t) => {
  const eqA = (a) => (b) => a === b
  const eqB = (a) => (b) => a === b
  t.absent (equals (eqA) (eqB) (this_ ('w')) (that (1)))
  t.absent (equals (eqA) (eqB) (that (1)) (both ('w') (1)))
  t.absent (equals (eqA) (eqB) (this_ ('w')) (both ('w') (1)))
})

test ('equals returns false when values differ', (t) => {
  const eqA = (a) => (b) => a === b
  const eqB = (a) => (b) => a === b
  t.absent (equals (eqA) (eqB) (this_ ('a')) (this_ ('b')))
  t.absent (equals (eqA) (eqB) (that (1)) (that (2)))
  t.absent (equals (eqA) (eqB) (both ('w') (1)) (both ('w') (2)))
  t.absent (equals (eqA) (eqB) (both ('w1') (1)) (both ('w2') (1)))
})

test ('equals uses the provided comparators', (t) => {
  const approx = (a) => (b) => Math.abs (a - b) < 0.01
  t.ok (equals (approx) (approx) (that (1.001)) (that (1.002)))
  t.absent (equals (approx) (approx) (that (1)) (that (2)))
})

// =============================================================================
// Semigroup
// =============================================================================

const concatStr = (a) => (b) => a + b
const concatNum = (a) => (b) => a + b
const c = concat (concatStr) (concatNum)

test ('concat This + This = This with concatenated left values', (t) => {
  const result = c (this_ ('a')) (this_ ('b'))
  t.ok (isThis (result))
  t.is (result.this, 'ab')
})

test ('concat This + That = Both', (t) => {
  const result = c (this_ ('a')) (that (1))
  t.ok (isBoth (result))
  t.is (result.this, 'a')
  t.is (result.that, 1)
})

test ('concat This + Both = Both with concatenated left values', (t) => {
  const result = c (this_ ('a')) (both ('b') (1))
  t.ok (isBoth (result))
  t.is (result.this, 'ab')
  t.is (result.that, 1)
})

test ('concat That + This = Both', (t) => {
  const result = c (that (1)) (this_ ('b'))
  t.ok (isBoth (result))
  t.is (result.this, 'b')
  t.is (result.that, 1)
})

test ('concat That + That = That with concatenated right values', (t) => {
  const result = c (that (1)) (that (2))
  t.ok (isThat (result))
  t.is (result.that, 3)
})

test ('concat That + Both = Both with concatenated right values', (t) => {
  const result = c (that (1)) (both ('b') (2))
  t.ok (isBoth (result))
  t.is (result.this, 'b')
  t.is (result.that, 3)
})

test ('concat Both + This = Both with concatenated left values', (t) => {
  const result = c (both ('a') (1)) (this_ ('b'))
  t.ok (isBoth (result))
  t.is (result.this, 'ab')
  t.is (result.that, 1)
})

test ('concat Both + That = Both with concatenated right values', (t) => {
  const result = c (both ('a') (1)) (that (2))
  t.ok (isBoth (result))
  t.is (result.this, 'a')
  t.is (result.that, 3)
})

test ('concat Both + Both = Both with both sides concatenated', (t) => {
  const result = c (both ('a') (1)) (both ('b') (2))
  t.ok (isBoth (result))
  t.is (result.this, 'ab')
  t.is (result.that, 3)
})

// =============================================================================
// Functor (maps over b / right side)
// =============================================================================

test ('map applies f to That value', (t) => {
  const result = map ((x) => x + 1) (that (1))
  t.ok (isThat (result))
  t.is (result.that, 2)
})

test ('map applies f to the right value of Both', (t) => {
  const result = map ((x) => x + 1) (both ('w') (1))
  t.ok (isBoth (result))
  t.is (result.this, 'w')
  t.is (result.that, 2)
})

test ('map passes This through unchanged', (t) => {
  const result = map ((x) => x + 1) (this_ ('w'))
  t.ok (isThis (result))
  t.is (result.this, 'w')
})

test ('mapThis applies f to This value', (t) => {
  const result = mapThis ((x) => x + '!') (this_ ('w'))
  t.ok (isThis (result))
  t.is (result.this, 'w!')
})

test ('mapThis applies f to the left value of Both', (t) => {
  const result = mapThis ((x) => x + '!') (both ('w') (1))
  t.ok (isBoth (result))
  t.is (result.this, 'w!')
  t.is (result.that, 1)
})

test ('mapThis passes That through unchanged', (t) => {
  const result = mapThis ((x) => x + '!') (that (1))
  t.ok (isThat (result))
  t.is (result.that, 1)
})

test ('bimap maps both sides independently', (t) => {
  const result = bimap ((a) => a + '!') ((b) => b * 2) (both ('w') (3))
  t.ok (isBoth (result))
  t.is (result.this, 'w!')
  t.is (result.that, 6)
})

test ('bimap maps That with the right function', (t) => {
  const result = bimap ((a) => a + '!') ((b) => b * 2) (that (3))
  t.ok (isThat (result))
  t.is (result.that, 6)
})

test ('bimap maps This with the left function', (t) => {
  const result = bimap ((a) => a + '!') ((b) => b * 2) (this_ ('w'))
  t.ok (isThis (result))
  t.is (result.this, 'w!')
})

// =============================================================================
// Applicative
// =============================================================================

test ('of lifts a value as That', (t) => {
  const result = of (42)
  t.ok (isThat (result))
  t.is (result.that, 42)
})

test ('ap That(f) applied to That(x) = That(f(x))', (t) => {
  const apStr = ap (concatStr)
  const result = apStr (that ((x) => x + 1)) (that (2))
  t.ok (isThat (result))
  t.is (result.that, 3)
})

test ('ap This(e) applied to anything = This(e)', (t) => {
  const apStr = ap (concatStr)
  t.ok (isThis (apStr (this_ ('e1')) (that (2))))
  t.ok (isThis (apStr (this_ ('e1')) (this_ ('e2'))))
})

test ('ap That(f) applied to This(e) = This(e)', (t) => {
  const apStr = ap (concatStr)
  const result = apStr (that ((x) => x + 1)) (this_ ('e2'))
  t.ok (isThis (result))
  t.is (result.this, 'e2')
})

test ('ap accumulates left values from two This values', (t) => {
  const apStr = ap (concatStr)
  const result = apStr (this_ ('e1')) (this_ ('e2'))
  t.ok (isThis (result))
  t.is (result.this, 'e1e2')
})

test ('ap Both(w)(f) applied to That(x) = Both(w)(f(x))', (t) => {
  const apStr = ap (concatStr)
  const result = apStr (both ('w') ((x) => x + 1)) (that (2))
  t.ok (isBoth (result))
  t.is (result.this, 'w')
  t.is (result.that, 3)
})

test ('ap Both(w1)(f) applied to Both(w2)(x) = Both(w1+w2)(f(x))', (t) => {
  const apStr = ap (concatStr)
  const result = apStr (both ('w1') ((x) => x + 1)) (both ('w2') (2))
  t.ok (isBoth (result))
  t.is (result.this, 'w1w2')
  t.is (result.that, 3)
})

// =============================================================================
// Monad
// =============================================================================

test ('chain applies f to That value', (t) => {
  const chainStr = chain (concatStr)
  const result = chainStr ((x) => that (x + 1)) (that (2))
  t.ok (isThat (result))
  t.is (result.that, 3)
})

test ('chain passes This through without calling f', (t) => {
  const chainStr = chain (concatStr)
  let called = false
  const result = chainStr ((_) => { called = true; return that (0) }) (this_ ('e'))
  t.ok (isThis (result))
  t.is (result.this, 'e')
  t.absent (called)
})

test ('chain Both: applies f to right value and prepends left value', (t) => {
  const chainStr = chain (concatStr)
  const result = chainStr ((x) => both ('w2') (x + 1)) (both ('w1') (2))
  t.ok (isBoth (result))
  t.is (result.this, 'w1w2')
  t.is (result.that, 3)
})

test ('chain Both + f returns That: combines left side with That', (t) => {
  const chainStr = chain (concatStr)
  const result = chainStr ((x) => that (x + 1)) (both ('w1') (2))
  t.ok (isBoth (result))
  t.is (result.this, 'w1')
  t.is (result.that, 3)
})

test ('chain Both + f returns This: concatenates left values', (t) => {
  const chainStr = chain (concatStr)
  const result = chainStr ((_x) => this_ ('e')) (both ('w') (2))
  t.ok (isThis (result))
  t.is (result.this, 'we')
})

// =============================================================================
// Foldable
// =============================================================================

test ('fold reduces That value with f and init', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (that (5)), 5)
  t.is (fold ((acc) => (x) => acc + x) (10) (that (5)), 15)
})

test ('fold reduces Both right value with f and init', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (both ('w') (5)), 5)
})

test ('fold returns init for This', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (this_ ('w')), 0)
  t.is (fold ((acc) => (x) => acc + x) (42) (this_ ('w')), 42)
})

// =============================================================================
// Conversions
// =============================================================================

test ('toMaybe converts That to Just', (t) => {
  const m = toMaybe (that (1))
  t.ok (isJust (m))
  t.is (m.value, 1)
})

test ('toMaybe converts Both to Just of the right value', (t) => {
  const m = toMaybe (both ('w') (1))
  t.ok (isJust (m))
  t.is (m.value, 1)
})

test ('toMaybe converts This to Nothing', (t) => {
  t.ok (isNothing (toMaybe (this_ ('w'))))
})

test ('toEither converts That to Right', (t) => {
  const e = toEither (that (1))
  t.ok (isRight (e))
  t.is (e.right, 1)
})

test ('toEither converts Both to Right of the right value', (t) => {
  const e = toEither (both ('w') (1))
  t.ok (isRight (e))
  t.is (e.right, 1)
})

test ('toEither converts This to Left', (t) => {
  const e = toEither (this_ ('w'))
  t.ok (isLeft (e))
  t.is (e.left, 'w')
})

test ('swap converts This to That', (t) => {
  const result = swap (this_ ('w'))
  t.ok (isThat (result))
  t.is (result.that, 'w')
})

test ('swap converts That to This', (t) => {
  const result = swap (that (1))
  t.ok (isThis (result))
  t.is (result.this, 1)
})

test ('swap swaps Both sides', (t) => {
  const result = swap (both ('w') (1))
  t.ok (isBoth (result))
  t.is (result.this, 1)
  t.is (result.that, 'w')
})

test ('swap is its own inverse for This', (t) => {
  const th = this_ ('w')
  const roundTrip = swap (swap (th))
  t.ok (isThis (roundTrip))
  t.is (roundTrip.this, 'w')
})

test ('swap is its own inverse for That', (t) => {
  const th = that (42)
  const roundTrip = swap (swap (th))
  t.ok (isThat (roundTrip))
  t.is (roundTrip.that, 42)
})

test ('swap is its own inverse for Both', (t) => {
  const th = both ('w') (1)
  const roundTrip = swap (swap (th))
  t.ok (isBoth (roundTrip))
  t.is (roundTrip.this, 'w')
  t.is (roundTrip.that, 1)
})
