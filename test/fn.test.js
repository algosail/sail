import test from 'brittle'
import {
  id, always, thrush, tap, flip, on, once, memoize,
  allPass, anyPass,
  pipe, compose, juxt, converge,
  uncurry, curry,
  map, ap, of, chain, contramap, promap, extend, pipeK, chainRec,
  handleThrow, pipeWith,
} from '../lib/fn.js'

// =============================================================================
// Core combinators
// =============================================================================

test ('id returns its argument unchanged', (t) => {
  t.is (id (42), 42)
  t.is (id ('hello'), 'hello')
  t.ok (id (null) === null)
  const obj = { a: 1 }
  t.is (id (obj), obj)
})

test ('always returns a constant function', (t) => {
  t.is (always (42) ('ignored'), 42)
  t.is (always (42) (null), 42)
  t.is (always ('x') (999), 'x')
})

test ('thrush applies argument to function', (t) => {
  t.is (thrush (42) ((x) => x + 1), 43)
  t.is (thrush (3) ((x) => x * x), 9)
})

test ('tap runs side-effect and returns original value', (t) => {
  let seen = null
  const result = tap ((x) => { seen = x }) (42)
  t.is (seen, 42)
  t.is (result, 42)
})

test ('flip swaps the first two arguments', (t) => {
  t.is (flip ((a) => (b) => a - b) (1) (3), 2)
  t.is (flip ((a) => (b) => `${a},${b}`) ('y') ('x'), 'x,y')
})

test ('on maps both arguments before applying the binary function', (t) => {
  t.is (on ((a) => (b) => a + b) ((x) => x * 2) (3) (4), 14)
  t.is (on ((a) => (b) => a === b) ((x) => x.length) ('abc') ('xyz'), true)
})

test ('once calls the function at most once', (t) => {
  let count = 0
  const f = once ((x) => { count++; return x + 1 })
  t.is (f (1), 2)
  t.is (f (99), 2)
  t.is (count, 1)
})

test ('memoize caches results by argument', (t) => {
  let count = 0
  const f = memoize ((x) => { count++; return x * 2 })
  t.is (f (5), 10)
  t.is (f (5), 10)
  t.is (count, 1)
  t.is (f (6), 12)
  t.is (count, 2)
})

// =============================================================================
// Predicate combinators
// =============================================================================

test ('allPass returns true only when both predicates hold', (t) => {
  const p = allPass ((x) => x > 0) ((x) => x < 10)
  t.ok (p (5))
  t.absent (p (0))
  t.absent (p (10))
  t.absent (p (-1))
})

test ('anyPass returns true when at least one predicate holds', (t) => {
  const p = anyPass ((x) => x < 0) ((x) => x > 10)
  t.ok (p (15))
  t.ok (p (-1))
  t.absent (p (5))
})

// =============================================================================
// Composition and piping
// =============================================================================

test ('pipe threads value left-to-right through functions', (t) => {
  t.is (pipe ([(x) => x + 1, Math.sqrt]) (99), 10)
  t.is (pipe ([(x) => x * 2, (x) => x + 1]) (3), 7)
  t.is (pipe ([]) (42), 42)
})

test ('compose composes two functions right-to-left', (t) => {
  t.is (compose ((x) => x * 2) ((x) => x + 1) (3), 8)
  t.is (compose ((x) => x.toUpperCase ()) ((x) => x.trim ()) ('  hi  '), 'HI')
})

test ('juxt applies each function to the same value', (t) => {
  t.alike (juxt ([(x) => x + 1, (x) => x * 2]) (3), [4, 6])
  t.alike (juxt ([]) (42), [])
})

test ('converge splits and merges with a binary function', (t) => {
  t.is (converge ((x) => (y) => x + y) ((x) => x * 2) ((x) => x + 1) (3), 10)
})

// =============================================================================
// Arity / currying helpers
// =============================================================================

test ('uncurry converts a curried function to take a pair', (t) => {
  t.is (uncurry ((a) => (b) => a + b) ([1, 2]), 3)
  t.is (uncurry ((a) => (b) => a * b) ([3, 4]), 12)
})

test ('curry converts a pair function to a curried binary function', (t) => {
  t.is (curry (([a, b]) => a + b) (1) (2), 3)
  t.is (curry (([a, b]) => `${a}-${b}`) ('x') ('y'), 'x-y')
})

// =============================================================================
// Reader monad
// =============================================================================

test ('map (Reader) post-composes f over a reader', (t) => {
  t.is (map ((x) => x + 1) ((x) => x * 2) (3), 7)
})

test ('ap (Reader) is the S combinator', (t) => {
  t.is (ap ((e) => (x) => e + x) ((e) => e * 2) (3), 9)
})

test ('of (Reader) lifts a constant value', (t) => {
  t.is (of (42) ('ignored'), 42)
  t.is (of (42) (null), 42)
})

test ('chain (Reader) threads the environment', (t) => {
  t.is (chain ((a) => (e) => a + e) ((e) => e * 2) (3), 9)
})

test ('contramap pre-composes over the input', (t) => {
  t.is (contramap ((x) => x + 1) ((x) => x * 2) (3), 8)
})

test ('promap contramaps the input and maps the output', (t) => {
  t.is (promap ((x) => x + 1) ((x) => x * 2) ((x) => x) (3), 8)
})

test ('extend widens the environment with concatEnv', (t) => {
  t.is (extend ((x) => (y) => x + y) ((f) => f (0)) ((e) => e * 2) (3), 6)
})

test ('pipeK chains Reader actions left-to-right', (t) => {
  const double = (a) => (e) => a * 2
  const addEnv = (a) => (e) => a + e
  t.is (pipeK ([double, addEnv]) ((e) => e) (5), 15)
})

test ('chainRec is stack-safe', (t) => {
  const action = chainRec (
    (next, done, n) => (_) => n <= 0 ? done (n) : next (n - 1),
  ) (10000)
  t.is (action (null), 0)
})

// =============================================================================
// pipeWith
// =============================================================================

test ('pipeWith threads a value through ADT steps using a bind combinator', (t) => {
  // Inline minimal Maybe to avoid dynamic import
  const just    = (x) => ({ tag: 'just', value: x })
  const nothing = ()  => ({ tag: 'nothing' })
  const isJust  = (m) => m?.tag === 'just'
  const isNothing = (m) => m?.tag === 'nothing'
  const chain   = (f) => (m) => m?.tag === 'just' ? f (m.value) : m

  const pos  = (x) => x > 0  ? just (x)     : nothing ()
  const lt10 = (x) => x < 10 ? just (x * 2) : nothing ()

  const good = pipeWith (chain) (just (4))  ([pos, lt10])
  t.ok (isJust (good))
  t.is (good.value, 8)

  const bad = pipeWith (chain) (just (-1)) ([pos, lt10])
  t.ok (isNothing (bad))
})

test ('pipeWith with empty steps returns the original value', (t) => {
  const bind = (f) => (x) => f (x)
  t.is (pipeWith (bind) (42) ([]), 42)
})

test ('pipeWith works as a map-only pipeline', (t) => {
  // Use plain function application as bind
  const bind = (f) => (x) => f (x)
  const result = pipeWith (bind) (3) ([
    (x) => x + 1,
    (x) => x * 2,
    (x) => x - 1,
  ])
  t.is (result, 7)  // ((3 + 1) * 2) - 1
})

// =============================================================================
// Error handling
// =============================================================================

test ('handleThrow routes success to onResult', (t) => {
  const result = handleThrow (JSON.parse) ((r) => (_args) => r) ((_) => (_args) => null) ('{"a":1}')
  t.alike (result, { a: 1 })
})

test ('handleThrow routes thrown error to onThrow', (t) => {
  const result = handleThrow (JSON.parse) ((r) => (_args) => r) ((_) => (_args) => null) ('bad json')
  t.is (result, null)
})

test ('handleThrow passes args to callbacks', (t) => {
  let capturedArgs = null
  handleThrow ((x) => x) ((_r) => (args) => { capturedArgs = args }) ((_) => (_) => null) ('test')
  t.alike (capturedArgs, ['test'])
})
