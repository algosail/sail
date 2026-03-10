import test from 'brittle'
import {
  identity, isIdentity, extract,
  equals, lte,
  map, of, ap, chain,
  fold, traverse, extend,
} from '../lib/identity.js'

// =============================================================================
// Constructor
// =============================================================================

test ('identity wraps a value', (t) => {
  const fa = identity (42)
  t.is (fa.tag, 'identity')
  t.is (fa.value, 42)
})

test ('identity wraps any value including null and objects', (t) => {
  t.is (identity (null).value, null)
  t.is (identity (undefined).value, undefined)
  const obj = { x: 1 }
  t.is (identity (obj).value, obj)
})

// =============================================================================
// Guard
// =============================================================================

test ('isIdentity returns true for Identity values', (t) => {
  t.ok (isIdentity (identity (1)))
  t.ok (isIdentity (identity (null)))
  t.ok (isIdentity (identity (false)))
})

test ('isIdentity returns false for non-Identity values', (t) => {
  t.absent (isIdentity (42))
  t.absent (isIdentity (null))
  t.absent (isIdentity (undefined))
  t.absent (isIdentity ({ tag: 'other', value: 1 }))
  t.absent (isIdentity ({ value: 1 }))
  t.absent (isIdentity ([]))
})

// =============================================================================
// Destructor
// =============================================================================

test ('extract unwraps the value from Identity', (t) => {
  t.is (extract (identity (42)), 42)
  t.is (extract (identity ('hello')), 'hello')
  t.is (extract (identity (null)), null)
})

test ('extract is the inverse of identity', (t) => {
  const x = { a: 1 }
  t.is (extract (identity (x)), x)
})

// =============================================================================
// Eq / Ord
// =============================================================================

test ('equals returns true when wrapped values are equal', (t) => {
  t.ok (equals ((a) => (b) => a === b) (identity (1)) (identity (1)))
  t.ok (equals ((a) => (b) => a === b) (identity ('x')) (identity ('x')))
})

test ('equals returns false when wrapped values differ', (t) => {
  t.absent (equals ((a) => (b) => a === b) (identity (1)) (identity (2)))
  t.absent (equals ((a) => (b) => a === b) (identity ('a')) (identity ('b')))
})

test ('equals uses the provided comparator', (t) => {
  const approx = (a) => (b) => Math.abs (a - b) < 0.01
  t.ok (equals (approx) (identity (1.001)) (identity (1.002)))
  t.absent (equals (approx) (identity (1)) (identity (2)))
})

test ('lte returns true when first is <= second under comparator', (t) => {
  t.ok (lte ((a) => (b) => a <= b) (identity (1)) (identity (2)))
  t.ok (lte ((a) => (b) => a <= b) (identity (2)) (identity (2)))
})

test ('lte returns false when first is > second', (t) => {
  t.absent (lte ((a) => (b) => a <= b) (identity (3)) (identity (2)))
})

// =============================================================================
// Functor
// =============================================================================

test ('map applies f to the wrapped value and re-wraps', (t) => {
  const fa = map ((x) => x + 1) (identity (1))
  t.ok (isIdentity (fa))
  t.is (fa.value, 2)
})

test ('map with identity function returns an equal Identity', (t) => {
  const fa = identity (42)
  const fb = map ((x) => x) (fa)
  t.ok (isIdentity (fb))
  t.is (fb.value, fa.value)
})

test ('map composition: map(g ∘ f) === map(g) ∘ map(f)', (t) => {
  const f = (x) => x + 1
  const g = (x) => x * 2
  const fa = identity (3)
  t.is (map ((x) => g (f (x))) (fa).value, map (g) (map (f) (fa)).value)
})

// =============================================================================
// Applicative
// =============================================================================

test ('of lifts a value into Identity', (t) => {
  const fa = of (42)
  t.ok (isIdentity (fa))
  t.is (fa.value, 42)
})

test ('of is an alias for identity', (t) => {
  t.is (of (5).value, identity (5).value)
  t.is (of (5).tag, identity (5).tag)
})

test ('ap applies the function inside the first Identity to the value in the second', (t) => {
  const ff = identity ((x) => x + 1)
  const fa = identity (2)
  const fb = ap (ff) (fa)
  t.ok (isIdentity (fb))
  t.is (fb.value, 3)
})

test ('ap with multi-arg function', (t) => {
  const ff = identity ((x) => x * 10)
  const fa = identity (5)
  t.is (ap (ff) (fa).value, 50)
})

test ('ap identity law: ap(of(id))(fa) === fa', (t) => {
  const fa = identity (7)
  const result = ap (of ((x) => x)) (fa)
  t.is (result.value, fa.value)
})

// =============================================================================
// Monad
// =============================================================================

test ('chain applies f to the wrapped value', (t) => {
  const fb = chain ((x) => identity (x + 1)) (identity (2))
  t.ok (isIdentity (fb))
  t.is (fb.value, 3)
})

test ('chain left identity law: chain(f)(of(a)) === f(a)', (t) => {
  const f = (x) => identity (x * 2)
  const a = 5
  t.is (chain (f) (of (a)).value, f (a).value)
})

test ('chain right identity law: chain(of)(fa) === fa', (t) => {
  const fa = identity (42)
  t.is (chain (of) (fa).value, fa.value)
})

test ('chain associativity: chain(g)(chain(f)(fa)) === chain(x => chain(g)(f(x)))(fa)', (t) => {
  const f = (x) => identity (x + 1)
  const g = (x) => identity (x * 2)
  const fa = identity (3)
  const lhs = chain (g) (chain (f) (fa)).value
  const rhs = chain ((x) => chain (g) (f (x))) (fa).value
  t.is (lhs, rhs)
})

// =============================================================================
// Foldable
// =============================================================================

test ('fold reduces the single wrapped value', (t) => {
  t.is (fold ((acc) => (x) => acc + x) (0) (identity (5)), 5)
  t.is (fold ((acc) => (x) => acc + x) (10) (identity (5)), 15)
  t.is (fold ((acc) => (x) => `${acc}-${x}`) ('init') (identity ('val')), 'init-val')
})

test ('fold with identity binary function returns init combined with value', (t) => {
  const result = fold ((acc) => (x) => x) (0) (identity (42))
  t.is (result, 42)
})

// =============================================================================
// Traversable
// =============================================================================

test ('traverse maps the wrapped value through an applicative', (t) => {
  const apOf  = Array.of
  const apMap = (f) => (xs) => xs.map (f)
  const result = traverse (apOf) (apMap) ((x) => [x, -x]) (identity (1))
  t.alike (result, [identity (1), identity (-1)])
})

test ('traverse with single-element applicative is a no-op', (t) => {
  const apOf  = Array.of
  const apMap = (f) => (xs) => xs.map (f)
  const result = traverse (apOf) (apMap) ((x) => [x]) (identity (42))
  t.alike (result, [identity (42)])
})

test ('traverse identity: traverse(apOf)(apMap)(of)(fa) lifts Identity into array applicative', (t) => {
  const apOf  = Array.of
  const apMap = (f) => (xs) => xs.map (f)
  const fa    = identity (7)
  const result = traverse (apOf) (apMap) (Array.of) (fa)
  t.is (result.length, 1)
  t.ok (isIdentity (result[0]))
  t.is (result[0].value, 7)
})

// =============================================================================
// Comonad
// =============================================================================

test ('extend wraps the whole Identity via f', (t) => {
  const fb = extend ((fa) => fa.value + 1) (identity (2))
  t.ok (isIdentity (fb))
  t.is (fb.value, 3)
})

test ('extend with extract is the identity comonad law: extend(extract)(fa) === fa', (t) => {
  const fa = identity (42)
  const result = extend (extract) (fa)
  t.ok (isIdentity (result))
  t.is (result.value, fa.value)
})

test ('extend with a constant function always produces that constant', (t) => {
  const fb = extend ((_fa) => 99) (identity (1))
  t.ok (isIdentity (fb))
  t.is (fb.value, 99)
})

test ('extend passes the full Identity to f, not just the value', (t) => {
  let received = null
  const fa = identity (42)
  extend ((x) => { received = x; return 0 }) (fa)
  t.ok (isIdentity (received))
  t.is (received.value, 42)
})
