import test from 'brittle'
import {
  lens,
  prop, index,
  view, set, over,
  composeLens,
  overWithResult, overWhen, toListOf,
} from '../lib/lens.js'
import { isJust, isNothing, map as maybeMap } from '../lib/maybe.js'

// =============================================================================
// Helpers
// =============================================================================

const alice  = { name: 'Alice', age: 30 }
const point  = { x: 1, y: 2 }
const nested = { address: { city: 'Oslo', zip: '0150' }, name: 'Bob' }

const nameLens = prop ('name')
const ageLens  = prop ('age')
const xLens    = prop ('x')
const yLens    = prop ('y')

// =============================================================================
// lens constructor
// =============================================================================

test ('lens constructs a lens from a getter and setter', (t) => {
  const l = lens ((s) => s.x) ((v) => (s) => ({ ...s, x: v }))
  t.is (view (l) (point), 1)
  t.alike (set (l) (99) (point), { x: 99, y: 2 })
})

test ('lens getter is accessible via view', (t) => {
  const l = lens ((s) => s.length) ((_v) => (s) => s)
  t.is (view (l) ([1, 2, 3]), 3)
})

test ('lens setter is accessible via set', (t) => {
  const l = lens ((s) => s[0]) ((v) => (s) => [v, ...s.slice (1)])
  t.alike (set (l) (99) ([1, 2, 3]), [99, 2, 3])
})

// =============================================================================
// prop
// =============================================================================

test ('prop view retrieves the value at the given key', (t) => {
  t.is (view (nameLens) (alice), 'Alice')
  t.is (view (ageLens)  (alice), 30)
})

test ('prop view returns undefined for a missing key', (t) => {
  t.is (view (prop ('missing')) (alice), undefined)
})

test ('prop set replaces the value at the key', (t) => {
  const result = set (nameLens) ('Bob') (alice)
  t.is (result.name, 'Bob')
  t.is (result.age,  30)
})

test ('prop set does not mutate the original object', (t) => {
  set (nameLens) ('Bob') (alice)
  t.is (alice.name, 'Alice')
})

test ('prop set adds the key when it was absent', (t) => {
  const result = set (prop ('z')) (3) (point)
  t.is (result.z, 3)
  t.is (result.x, 1)
})

test ('prop over applies a function to the focused value', (t) => {
  const result = over (ageLens) ((n) => n + 1) (alice)
  t.is (result.age,  31)
  t.is (result.name, 'Alice')
})

test ('prop over does not mutate the original object', (t) => {
  over (ageLens) ((n) => n + 1) (alice)
  t.is (alice.age, 30)
})

// =============================================================================
// index
// =============================================================================

test ('index view returns Just for an in-bounds index', (t) => {
  const m = view (index (1)) ([10, 20, 30])
  t.ok (isJust (m))
  t.is (m.value, 20)
})

test ('index view returns Just for index 0', (t) => {
  const m = view (index (0)) ([42])
  t.ok (isJust (m))
  t.is (m.value, 42)
})

test ('index view returns Just for the last in-bounds index', (t) => {
  const arr = [1, 2, 3]
  const m = view (index (2)) (arr)
  t.ok (isJust (m))
  t.is (m.value, 3)
})

test ('index view returns Nothing for an out-of-bounds index', (t) => {
  t.ok (isNothing (view (index (5))  ([1, 2, 3])))
  t.ok (isNothing (view (index (-1)) ([1, 2, 3])))
  t.ok (isNothing (view (index (0))  ([])))
})

test ('index set replaces the element at the given index', (t) => {
  const result = set (index (1)) (99) ([10, 20, 30])
  t.alike (result, [10, 99, 30])
})

test ('index set does not mutate the original array', (t) => {
  const arr = [1, 2, 3]
  set (index (0)) (99) (arr)
  t.alike (arr, [1, 2, 3])
})

test ('index set returns the original array for an out-of-bounds index', (t) => {
  const arr = [1, 2, 3]
  const result = set (index (9)) (99) (arr)
  t.alike (result, arr)
})

test ('index over maps a Just value — set stores the transformed Maybe', (t) => {
  // index.set places whatever f returns directly into the array.
  // f receives Just(20), maybeMap doubles it to Just(40), so the slot holds Just(40).
  const result = over (index (1)) (maybeMap ((x) => x * 2)) ([10, 20, 30])
  t.is (result.length, 3)
  t.is (result[0], 10)
  t.ok (isJust (result[1]))
  t.is (result[1].value, 40)
  t.is (result[2], 30)
})

// =============================================================================
// view
// =============================================================================

test ('view extracts the focused value', (t) => {
  t.is (view (xLens) (point), 1)
  t.is (view (yLens) (point), 2)
})

test ('view is curried — partially applied', (t) => {
  const viewName = view (nameLens)
  t.is (viewName (alice), 'Alice')
  t.is (viewName ({ name: 'Carol', age: 25 }), 'Carol')
})

// =============================================================================
// set
// =============================================================================

test ('set replaces the focused value', (t) => {
  t.alike (set (xLens) (99) (point), { x: 99, y: 2 })
})

test ('set is curried — partially applied', (t) => {
  const resetAge = set (ageLens) (0)
  t.is (resetAge (alice).age, 0)
  t.is (resetAge ({ name: 'Dave', age: 50 }).age, 0)
})

test ('set with the same value returns a structurally equal object', (t) => {
  const result = set (ageLens) (30) (alice)
  t.alike (result, alice)
})

// =============================================================================
// over
// =============================================================================

test ('over applies a function to the focused value', (t) => {
  t.alike (over (xLens) ((n) => n * 10) (point), { x: 10, y: 2 })
})

test ('over with identity function returns a structurally equal object', (t) => {
  t.alike (over (nameLens) ((x) => x) (alice), alice)
})

test ('over is curried — partially applied', (t) => {
  const increment = over (ageLens) ((n) => n + 1)
  t.is (increment (alice).age, 31)
  t.is (increment ({ name: 'X', age: 10 }).age, 11)
})

// =============================================================================
// Lens laws
// =============================================================================

// Law 1 — GetSet: view(l)(set(l)(v)(s)) === v
// What you set is what you get back.

test ('lens law 1 (GetSet): view after set returns the set value — prop', (t) => {
  const s = alice
  const v = 'Carol'
  t.is (view (nameLens) (set (nameLens) (v) (s)), v)
})

test ('lens law 1 (GetSet): view after set returns the set value — index', (t) => {
  const arr = [1, 2, 3]
  const newArr = set (index (1)) (99) (arr)
  const got = view (index (1)) (newArr)
  t.ok (isJust (got))
  t.is (got.value, 99)
})

// Law 2 — SetGet: set(l)(view(l)(s))(s) ≡ s
// Setting what you already have changes nothing.

test ('lens law 2 (SetGet): set with current value is identity — prop', (t) => {
  const s = alice
  t.alike (set (nameLens) (view (nameLens) (s)) (s), s)
})

// Law 3 — SetSet: set(l)(v2)(set(l)(v1)(s)) ≡ set(l)(v2)(s)
// The second set overwrites the first.

test ('lens law 3 (SetSet): second set overwrites first — prop', (t) => {
  const s  = alice
  const v1 = 'Bob'
  const v2 = 'Carol'
  t.alike (
    set (nameLens) (v2) (set (nameLens) (v1) (s)),
    set (nameLens) (v2) (s),
  )
})

// =============================================================================
// composeLens
// =============================================================================

test ('composeLens view drills into nested structure', (t) => {
  const cityLens = composeLens (prop ('address')) (prop ('city'))
  t.is (view (cityLens) (nested), 'Oslo')
})

test ('composeLens set updates the deeply nested value immutably', (t) => {
  const cityLens = composeLens (prop ('address')) (prop ('city'))
  const result   = set (cityLens) ('Bergen') (nested)
  t.is (result.address.city,  'Bergen')
  t.is (result.address.zip,   '0150')
  t.is (result.name,          'Bob')
})

test ('composeLens set does not mutate the original', (t) => {
  const cityLens = composeLens (prop ('address')) (prop ('city'))
  set (cityLens) ('Bergen') (nested)
  t.is (nested.address.city, 'Oslo')
})

test ('composeLens over applies a function to the nested value', (t) => {
  const cityLens = composeLens (prop ('address')) (prop ('city'))
  const result   = over (cityLens) ((s) => s.toUpperCase ()) (nested)
  t.is (result.address.city, 'OSLO')
  t.is (result.name, 'Bob')
})

test ('composeLens satisfies GetSet law on nested structure', (t) => {
  const l = composeLens (prop ('address')) (prop ('zip'))
  const v = '9999'
  t.is (view (l) (set (l) (v) (nested)), v)
})

test ('composeLens satisfies SetSet law on nested structure', (t) => {
  const l  = composeLens (prop ('address')) (prop ('city'))
  const v1 = 'Bergen'
  const v2 = 'Tromsø'
  t.alike (
    set (l) (v2) (set (l) (v1) (nested)),
    set (l) (v2) (nested),
  )
})

test ('composeLens chains three levels deep', (t) => {
  const deep  = { a: { b: { c: 42 } } }
  const abLens = composeLens (prop ('a')) (prop ('b'))
  const abcLens = composeLens (abLens) (prop ('c'))
  t.is (view (abcLens) (deep), 42)
  t.alike (set (abcLens) (99) (deep), { a: { b: { c: 99 } } })
})

// =============================================================================
// overWithResult
// =============================================================================

test ('overWithResult returns [result, updatedStructure]', (t) => {
  const [result, updated] = overWithResult (prop ('n')) ((x) => [x * 2, x + 1]) ({ n: 5 })
  t.is (result,    10)
  t.is (updated.n, 6)
})

test ('overWithResult does not mutate the original', (t) => {
  const obj = { n: 5 }
  overWithResult (prop ('n')) ((x) => [x * 2, x + 1]) (obj)
  t.is (obj.n, 5)
})

test ('overWithResult leaves other keys unchanged', (t) => {
  const obj = { n: 5, label: 'hello' }
  const [, updated] = overWithResult (prop ('n')) ((x) => [x, x * 3]) (obj)
  t.is (updated.label, 'hello')
})

test ('overWithResult with identity transform preserves value', (t) => {
  const obj = { v: 7 }
  const [result, updated] = overWithResult (prop ('v')) ((x) => [x, x]) (obj)
  t.is (result,    7)
  t.is (updated.v, 7)
})

// =============================================================================
// overWhen
// =============================================================================

test ('overWhen applies f when predicate holds', (t) => {
  const result = overWhen (ageLens) ((n) => n >= 18) ((n) => n + 1) (alice)
  t.is (result.age, 31)
})

test ('overWhen leaves structure unchanged when predicate fails', (t) => {
  const minor  = { name: 'Kid', age: 10 }
  const result = overWhen (ageLens) ((n) => n >= 18) ((n) => n + 1) (minor)
  t.alike (result, minor)
})

test ('overWhen does not mutate the original', (t) => {
  overWhen (ageLens) ((n) => n >= 18) ((n) => n + 1) (alice)
  t.is (alice.age, 30)
})

test ('overWhen with always-false predicate is identity', (t) => {
  const result = overWhen (nameLens) ((_) => false) ((_) => 'CHANGED') (alice)
  t.alike (result, alice)
})

test ('overWhen with always-true predicate behaves like over', (t) => {
  const f      = (n) => n * 2
  const via_overWhen = overWhen (ageLens) ((_) => true) (f) (alice)
  const via_over     = over     (ageLens)               (f) (alice)
  t.alike (via_overWhen, via_over)
})

test ('overWhen works with composeLens', (t) => {
  const cityLens = composeLens (prop ('address')) (prop ('city'))
  const result   = overWhen (cityLens) ((c) => c === 'Oslo') ((c) => c + '!') (nested)
  t.is (result.address.city, 'Oslo!')
})

// =============================================================================
// toListOf
// =============================================================================

test ('toListOf collects the focused value from each element', (t) => {
  const people = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }]
  t.alike (toListOf (nameLens) (people), ['Alice', 'Bob', 'Carol'])
})

test ('toListOf on an empty array returns empty array', (t) => {
  t.alike (toListOf (nameLens) ([]), [])
})

test ('toListOf on a single-element array returns a singleton', (t) => {
  t.alike (toListOf (ageLens) ([alice]), [30])
})

test ('toListOf preserves order', (t) => {
  const items = [{ v: 3 }, { v: 1 }, { v: 4 }, { v: 1 }, { v: 5 }]
  t.alike (toListOf (prop ('v')) (items), [3, 1, 4, 1, 5])
})

test ('toListOf does not mutate the source array', (t) => {
  const people = [{ name: 'Alice' }, { name: 'Bob' }]
  toListOf (nameLens) (people)
  t.alike (people, [{ name: 'Alice' }, { name: 'Bob' }])
})

// =============================================================================
// Integration — combining operations
// =============================================================================

test ('view ∘ over is consistent: view(l)(over(l)(f)(s)) === f(view(l)(s))', (t) => {
  const f = (n) => n * 3
  t.is (
    view (ageLens) (over (ageLens) (f) (alice)),
    f (view (ageLens) (alice)),
  )
})

test ('over with set is consistent: over(l)(f)(s) === set(l)(f(view(l)(s)))(s)', (t) => {
  const f = (n) => n + 5
  t.alike (
    over (ageLens) (f) (alice),
    set  (ageLens) (f (view (ageLens) (alice))) (alice),
  )
})

test ('chained set calls on different props are independent', (t) => {
  const s1 = set (nameLens) ('Dave')   (alice)
  const s2 = set (ageLens)  (99)       (s1)
  t.is (s2.name, 'Dave')
  t.is (s2.age,  99)
  t.is (alice.name, 'Alice')
  t.is (alice.age,  30)
})

test ('composeLens + toListOf maps a nested field across an array', (t) => {
  const cityLens = composeLens (prop ('address')) (prop ('city'))
  const people   = [
    { name: 'A', address: { city: 'Oslo'   } },
    { name: 'B', address: { city: 'Bergen' } },
  ]
  t.alike (toListOf (cityLens) (people), ['Oslo', 'Bergen'])
})

test ('composeLens + overWhen conditionally updates nested field', (t) => {
  const zipLens  = composeLens (prop ('address')) (prop ('zip'))
  const result   = overWhen (zipLens) ((z) => z.startsWith ('0')) ((z) => z + '!') (nested)
  t.is (result.address.zip, '0150!')
  t.is (result.name, 'Bob')
})
