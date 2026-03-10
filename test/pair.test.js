import test from 'brittle'
import {
  pair, of,
  fst, snd, fold,
  map, mapFst, mapSnd, bimap,
  ap, swap, traverse,
} from '../lib/pair.js'

// =============================================================================
// Constructors
// =============================================================================

test ('pair constructs a 2-element tuple', (t) => {
  t.alike (pair (1) (2), [1, 2])
  t.alike (pair ('a') ('b'), ['a', 'b'])
  t.alike (pair (null) (undefined), [null, undefined])
})

test ('of pairs a value with itself', (t) => {
  t.alike (of (3), [3, 3])
  t.alike (of ('x'), ['x', 'x'])
})

// =============================================================================
// Destructors
// =============================================================================

test ('fst extracts the first element', (t) => {
  t.is (fst ([1, 2]), 1)
  t.is (fst (['a', 'b']), 'a')
  t.is (fst ([null, 42]), null)
})

test ('snd extracts the second element', (t) => {
  t.is (snd ([1, 2]), 2)
  t.is (snd (['a', 'b']), 'b')
  t.is (snd ([null, 42]), 42)
})

test ('fold applies a curried binary function to the pair elements', (t) => {
  t.is (fold ((a) => (b) => a + b) ([1, 2]), 3)
  t.is (fold ((a) => (b) => `${a}-${b}`) (['x', 'y']), 'x-y')
  t.is (fold ((a) => (b) => a * b) ([3, 4]), 12)
})

test ('fold uses first as left argument and second as right argument', (t) => {
  t.is (fold ((a) => (b) => a - b) ([10, 3]), 7)
})

// =============================================================================
// Functor / Bifunctor
// =============================================================================

test ('map applies f to the second element (Functor slot), leaves first unchanged', (t) => {
  t.alike (map ((x) => x + 1) ([1, 2]), [1, 3])
  t.alike (map ((x) => x * 2) (['a', 5]), ['a', 10])
})

test ('map does not affect the first element', (t) => {
  const p = map ((x) => x.toUpperCase ()) ([42, 'hello'])
  t.is (fst (p), 42)
  t.is (snd (p), 'HELLO')
})

test ('mapFst applies f to the first element, leaves second unchanged', (t) => {
  t.alike (mapFst ((x) => x + 1) ([1, 2]), [2, 2])
  t.alike (mapFst ((x) => x * 2) ([3, 'b']), [6, 'b'])
})

test ('mapFst does not affect the second element', (t) => {
  const p = mapFst ((x) => x.toUpperCase ()) (['hello', 42])
  t.is (fst (p), 'HELLO')
  t.is (snd (p), 42)
})

test ('mapSnd applies f to the second element, leaves first unchanged', (t) => {
  t.alike (mapSnd ((x) => x + 1) ([1, 2]), [1, 3])
  t.alike (mapSnd ((x) => x * 2) (['a', 5]), ['a', 10])
})

test ('mapSnd does not affect the first element', (t) => {
  const p = mapSnd ((x) => x.toUpperCase ()) ([42, 'hello'])
  t.is (fst (p), 42)
  t.is (snd (p), 'HELLO')
})

test ('map and mapSnd are equivalent', (t) => {
  const f = (x) => x * 3
  const p = [7, 5]
  t.alike (map (f) (p), mapSnd (f) (p))
})

test ('bimap maps both elements independently', (t) => {
  t.alike (bimap ((x) => x + 1) ((x) => x * 2) ([1, 3]), [2, 6])
  t.alike (bimap ((x) => x.toUpperCase ()) ((x) => x + '!') (['hi', 'bye']), ['HI', 'bye!'])
})

test ('bimap with identity on both sides returns the same pair', (t) => {
  const p = [42, 'hello']
  t.alike (bimap ((x) => x) ((x) => x) (p), p)
})

// =============================================================================
// Applicative
// =============================================================================

test ('ap applies the function in the first slot to the value in the second', (t) => {
  t.is (ap ([(x) => x + 1, 5]), 6)
  t.is (ap ([(x) => x * 2, 10]), 20)
  t.is (ap ([(x) => x.toUpperCase (), 'hello']), 'HELLO')
})

test ('ap works with multi-argument results', (t) => {
  const result = ap ([(x) => [x, x * 2], 3])
  t.alike (result, [3, 6])
})

// =============================================================================
// Swap
// =============================================================================

test ('swap exchanges the two elements', (t) => {
  t.alike (swap ([1, 2]), [2, 1])
  t.alike (swap (['a', 'b']), ['b', 'a'])
  t.alike (swap ([null, 42]), [42, null])
})

test ('swap is its own inverse', (t) => {
  const p = [1, 2]
  t.alike (swap (swap (p)), p)
})

test ('swap applied to of(x) still gives a pair with same elements in reverse', (t) => {
  const p = of (5)
  t.alike (swap (p), [5, 5])
})

// =============================================================================
// Traversable
// =============================================================================

const apOf  = Array.of
const apMap = (f) => (xs) => xs.map (f)

test ('traverse maps the first element through an applicative', (t) => {
  const result = traverse (apOf) (apMap) ((x) => [x, -x]) ([1, 2])
  t.alike (result, [[1, 2], [-1, 2]])
})

test ('traverse preserves the second element unchanged', (t) => {
  const result = traverse (apOf) (apMap) ((x) => [x * 10]) ([3, 'side'])
  t.is (result.length, 1)
  t.alike (result[0], [30, 'side'])
})

test ('traverse with identity applicative (single-element array) is a no-op', (t) => {
  const result = traverse (apOf) (apMap) ((x) => [x]) ([42, 99])
  t.alike (result, [[42, 99]])
})

test ('traverse distributes over two choices', (t) => {
  // f produces [x, x+100], so pair [1, 'z'] should give [[1,'z'], [101,'z']]
  const result = traverse (apOf) (apMap) ((x) => [x, x + 100]) ([1, 'z'])
  t.alike (result, [[1, 'z'], [101, 'z']])
})

// =============================================================================
// Laws
// =============================================================================

test ('fold is the inverse of pair: fold(pair)(p) === p', (t) => {
  const p = [7, 13]
  t.alike (fold ((a) => (b) => pair (a) (b)) (p), p)
})

test ('map(f) is consistent with bimap(id)(f) — Functor maps second element', (t) => {
  const f = (x) => x + 1
  const p = [3, 99]
  t.alike (map (f) (p), bimap ((x) => x) (f) (p))
})

test ('mapFst(f) is consistent with bimap(f)(id)', (t) => {
  const f = (x) => x + 1
  const p = [3, 99]
  t.alike (mapFst (f) (p), bimap (f) ((x) => x) (p))
})

test ('mapSnd(f) is consistent with bimap(id)(f)', (t) => {
  const f = (x) => x * 2
  const p = [3, 5]
  t.alike (mapSnd (f) (p), bimap ((x) => x) (f) (p))
})
