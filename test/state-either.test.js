import test from 'brittle'
import {
  state, get, put, modify, gets,
  lift,
  run, eval_, exec,
  map, of, ap, chain, andThen, chainFirst,
  chainRec,
  sequence, traverse, lift2,
} from '../lib/state-either.js'
import { left, right, isLeft, isRight } from '../lib/either.js'

// =============================================================================
// Constructor
// =============================================================================

test ('state wraps a state-transition function', (t) => {
  const action = state ((s) => right ([s + 1, s + 1]))
  t.alike (run (action) (5), right ([6, 6]))
})

// =============================================================================
// Primitive actions
// =============================================================================

test ('get returns the current state as value, leaving state unchanged', (t) => {
  t.alike (run (get) (42), right ([42, 42]))
  t.alike (run (get) (0),  right ([0,  0]))
})

test ('put replaces the state and returns null', (t) => {
  t.alike (run (put (99)) (0),     right ([null, 99]))
  t.alike (run (put ('b')) ('a'),  right ([null, 'b']))
})

test ('put always produces null as the value', (t) => {
  t.alike (eval_ (put (42)) (0),   right (null))
  t.alike (eval_ (put (42)) (999), right (null))
})

test ('modify applies a function to the state and returns null', (t) => {
  t.alike (run (modify ((s) => s + 1)) (0), right ([null, 1]))
  t.alike (run (modify ((s) => s * 2)) (5), right ([null, 10]))
})

test ('modify does not change the returned value', (t) => {
  t.alike (eval_ (modify ((s) => s + 1)) (0), right (null))
})

test ('gets projects a value from the state without changing it', (t) => {
  t.alike (run (gets ((s) => s * 2)) (21),        right ([42, 21]))
  t.alike (run (gets ((s) => s.length)) ('hello'), right ([5, 'hello']))
})

test ('gets leaves the state unchanged', (t) => {
  t.alike (exec (gets ((s) => s * 100)) (7), right (7))
})

// =============================================================================
// Lift
// =============================================================================

test ('lift(right(a)) produces the value with state unchanged', (t) => {
  t.alike (run (lift (right (42))) (99), right ([42, 99]))
  t.alike (run (lift (right ('x'))) (0), right (['x', 0]))
})

test ('lift(left(e)) short-circuits regardless of state', (t) => {
  t.alike (run (lift (left ('oops'))) (42), left ('oops'))
  t.alike (run (lift (left ('oops'))) (0),  left ('oops'))
})

test ('lift propagates the exact Left value without wrapping', (t) => {
  const err = { code: 404, msg: 'not found' }
  t.alike (run (lift (left (err))) (0), left (err))
})

// =============================================================================
// Runners
// =============================================================================

test ('run returns Right([value, finalState]) on success', (t) => {
  t.alike (run (of (42)) (0), right ([42, 0]))
  t.alike (run (get) (5),     right ([5,  5]))
})

test ('run returns Left on failure', (t) => {
  t.alike (run (lift (left ('err'))) (0), left ('err'))
})

test ('eval_ returns Right(value) on success', (t) => {
  t.alike (eval_ (of (42)) (0),              right (42))
  t.alike (eval_ (get) (5),                  right (5))
  t.alike (eval_ (gets ((s) => s * 2)) (21), right (42))
})

test ('eval_ returns Left on failure', (t) => {
  t.alike (eval_ (lift (left ('err'))) (0), left ('err'))
})

test ('exec returns Right(finalState) on success', (t) => {
  t.alike (exec (put (99)) (0),                  right (99))
  t.alike (exec (modify ((s) => s + 1)) (0),     right (1))
  t.alike (exec (of (42)) (7),                   right (7))
})

test ('exec returns Left on failure', (t) => {
  t.alike (exec (lift (left ('err'))) (0), left ('err'))
})

// =============================================================================
// Functor
// =============================================================================

test ('map transforms the value without affecting the state', (t) => {
  t.alike (run (map ((x) => x * 2) (of (21))) (0), right ([42, 0]))
  t.alike (run (map ((x) => x + 1) (get)) (5),     right ([6, 5]))
})

test ('map does not change the final state', (t) => {
  t.alike (exec (map ((x) => x * 1000) (put (99))) (0), right (99))
})

test ('map short-circuits on Left — function is never called', (t) => {
  let called = false
  const result = run (map ((_) => { called = true; return 42 }) (lift (left ('err')))) (0)
  t.alike (result, left ('err'))
  t.absent (called)
})

test ('map identity law: map(id)(action) === action', (t) => {
  const action = gets ((s) => s + 1)
  const s0 = 10
  t.alike (run (map ((x) => x) (action)) (s0), run (action) (s0))
})

test ('map composition law: map(g ∘ f) === map(g)(map(f))', (t) => {
  const f = (x) => x + 1
  const g = (x) => x * 2
  const action = of (3)
  const s0 = 0
  t.alike (
    eval_ (map ((x) => g (f (x))) (action)) (s0),
    eval_ (map (g) (map (f) (action))) (s0),
  )
})

// =============================================================================
// Applicative
// =============================================================================

test ('of lifts a pure value — state passes through unchanged', (t) => {
  t.alike (run (of (42)) (99), right ([42, 99]))
  t.alike (run (of ('x')) (0), right (['x', 0]))
})

test ('ap applies function in Right to value in Right', (t) => {
  t.alike (run (ap (of ((x) => x + 1)) (of (41))) (0), right ([42, 0]))
})

test ('ap short-circuits when the function action is Left', (t) => {
  t.ok (isLeft (run (ap (lift (left ('fn failed'))) (of (41))) (0)))
})

test ('ap short-circuits when the value action is Left', (t) => {
  t.ok (isLeft (run (ap (of ((x) => x + 1)) (lift (left ('val failed')))) (0)))
})

test ('ap threads state left-to-right through both actions', (t) => {
  // af: state 5→6, value = (s => s)
  // aa: state 6→6, value = 6
  // applied: 6
  const af = map ((_) => (s) => s) (modify ((s) => s + 1))
  const aa = get
  t.alike (run (ap (af) (aa)) (5), right ([6, 6]))
})

test ('ap identity law: ap(of(id))(fa) === fa', (t) => {
  const fa = of (7)
  const s0 = 0
  t.alike (run (ap (of ((x) => x)) (fa)) (s0), run (fa) (s0))
})

// =============================================================================
// Monad
// =============================================================================

test ('chain sequences two actions where second depends on first value', (t) => {
  const action = chain ((n) => put (n)) (gets ((s) => s + 1))
  t.alike (run (action) (0), right ([null, 1]))
  t.alike (run (action) (5), right ([null, 6]))
})

test ('chain short-circuits when the first action is Left', (t) => {
  let called = false
  const result = run (chain ((_) => { called = true; return of (42) }) (lift (left ('err')))) (0)
  t.alike (result, left ('err'))
  t.absent (called)
})

test ('chain short-circuits when f returns Left', (t) => {
  const result = run (chain ((_) => lift (left ('step 2 failed'))) (of (1))) (0)
  t.alike (result, left ('step 2 failed'))
})

test ('chain left identity law: chain(f)(of(a)) === f(a)', (t) => {
  const f = (x) => of (x * 2)
  const a = 5
  const s0 = 0
  t.alike (run (chain (f) (of (a))) (s0), run (f (a)) (s0))
})

test ('chain right identity law: chain(of)(action) === action', (t) => {
  const action = gets ((s) => s + 1)
  const s0 = 10
  t.alike (run (chain (of) (action)) (s0), run (action) (s0))
})

test ('chain threads state correctly through a sequence', (t) => {
  const inc = modify ((s) => s + 1)
  const readDouble = gets ((s) => s * 2)
  // 0 → inc → 1 → inc → 2 → readDouble → [4, 2]
  const action = chain ((_) => readDouble) (chain ((_) => inc) (inc))
  t.alike (run (action) (0), right ([4, 2]))
})

test ('chain associativity law', (t) => {
  const f = (x) => of (x + 1)
  const g = (x) => of (x * 2)
  const action = of (3)
  const s0 = 0
  t.alike (
    eval_ (chain (g) (chain (f) (action))) (s0),
    eval_ (chain ((x) => chain (g) (f (x))) (action)) (s0),
  )
})

test ('andThen sequences two actions, discarding the first value', (t) => {
  t.alike (run (andThen (of (42)) (put (99))) (0), right ([42, 99]))
  t.alike (run (andThen (get) (put (5))) (0),      right ([5,  5]))
})

test ('andThen short-circuits when the first action is Left', (t) => {
  t.ok (isLeft (run (andThen (of (42)) (lift (left ('err')))) (0)))
})

test ('andThen is equivalent to chain ignoring first value', (t) => {
  const first  = modify ((s) => s + 1)
  const second = of (42)
  const s0     = 0
  t.alike (
    run (andThen (second) (first)) (s0),
    run (chain ((_) => second) (first)) (s0),
  )
})

test ('chainFirst keeps original value when f returns Right', (t) => {
  t.alike (run (chainFirst ((_) => of ('ignored')) (of (1))) (0), right ([1, 0]))
})

test ('chainFirst short-circuits when f returns Left', (t) => {
  t.alike (
    run (chainFirst ((_) => lift (left ('stop'))) (of (1))) (0),
    left ('stop'),
  )
})

test ('chainFirst short-circuits when original action is Left', (t) => {
  let called = false
  const result = run (chainFirst ((_) => { called = true; return of (42) }) (lift (left ('err')))) (0)
  t.ok (isLeft (result))
  t.absent (called)
})

test ('chainFirst threads state from f even though value is discarded', (t) => {
  // f increments state but chainFirst keeps original value
  const sideEffect = modify ((s) => s + 10)
  const action = chainFirst ((_) => sideEffect) (of ('original'))
  t.alike (run (action) (0), right (['original', 10]))
})

// =============================================================================
// Stack-safe recursion
// =============================================================================

test ('chainRec is stack-safe for large iterations', (t) => {
  const action = chainRec ((next, done, n) =>
    n <= 0
      ? of (done (0))
      : andThen (of (next (n - 1))) (modify ((s) => s + 1)),
  ) (10000)
  t.alike (run (action) (0), right ([0, 10000]))
})

test ('chainRec terminates immediately when done on first step', (t) => {
  const action = chainRec ((next, done, n) => of (done (n * 2))) (21)
  t.alike (run (action) (0), right ([42, 0]))
})

test ('chainRec short-circuits on Left', (t) => {
  let steps = 0
  const action = chainRec ((next, done, n) => {
    steps++
    if (n === 3) return lift (left ('hit 3'))
    return of (n <= 0 ? done (0) : next (n - 1))
  }) (5)
  t.alike (run (action) (0), left ('hit 3'))
  t.is (steps, 3) // stepped 5→4→3→Left, stopped
})

test ('chainRec accumulates state through each step', (t) => {
  const action = chainRec ((next, done, n) =>
    n <= 0
      ? of (done ('done'))
      : andThen (of (next (n - 1))) (modify ((s) => s + 1)),
  ) (5)
  t.alike (run (action) (0), right (['done', 5]))
})

// =============================================================================
// sequence
// =============================================================================

test ('sequence runs all actions and collects values', (t) => {
  t.alike (run (sequence ([of (1), of (2), of (3)])) (0), right ([[1, 2, 3], 0]))
})

test ('sequence threads state through each action', (t) => {
  const actions = [
    modify ((s) => s + 1),
    modify ((s) => s + 1),
    modify ((s) => s + 1),
  ]
  t.alike (run (sequence (actions)) (0), right ([[null, null, null], 3]))
})

test ('sequence short-circuits on first Left', (t) => {
  let thirdCalled = false
  const actions = [
    of (1),
    lift (left ('step 2 failed')),
    state ((_) => { thirdCalled = true; return right ([3, 0]) }),
  ]
  t.alike (run (sequence (actions)) (0), left ('step 2 failed'))
  t.absent (thirdCalled)
})

test ('sequence on empty array returns empty array without changing state', (t) => {
  t.alike (run (sequence ([])) (42), right ([[], 42]))
})

test ('sequence preserves order of collected values', (t) => {
  const actions = [gets ((s) => s), modify ((s) => s + 10), gets ((s) => s)]
  const result  = run (sequence (actions)) (5)
  t.alike (result, right ([[5, null, 15], 15]))
})

// =============================================================================
// traverse
// =============================================================================

test ('traverse maps f and sequences results', (t) => {
  t.alike (run (traverse ((x) => of (x * 2)) ([1, 2, 3])) (0), right ([[2, 4, 6], 0]))
})

test ('traverse threads state through each mapped action', (t) => {
  const action = traverse ((_) => modify ((s) => s + 1)) ([1, 2, 3])
  t.alike (run (action) (0), right ([[null, null, null], 3]))
})

test ('traverse short-circuits on first Left', (t) => {
  const action = traverse ((x) =>
    x === 2 ? lift (left (`bad: ${x}`)) : of (x),
  ) ([1, 2, 3])
  t.alike (run (action) (0), left ('bad: 2'))
})

test ('traverse on empty array returns empty array', (t) => {
  t.alike (run (traverse ((x) => of (x)) ([])) (99), right ([[], 99]))
})

test ('traverse is equivalent to sequence(xs.map(f))', (t) => {
  const f  = (x) => of (x + 1)
  const xs = [1, 2, 3]
  const s0 = 0
  t.alike (run (traverse (f) (xs)) (s0), run (sequence (xs.map (f))) (s0))
})

// =============================================================================
// lift2
// =============================================================================

test ('lift2 combines values from two actions with a binary function', (t) => {
  t.alike (run (lift2 ((a) => (b) => a + b) (of (1)) (of (2))) (0), right ([3, 0]))
})

test ('lift2 threads state through both actions', (t) => {
  const a1 = gets ((s) => s)
  const a2 = gets ((s) => s * 2)
  t.alike (run (lift2 ((a) => (b) => a + b) (a1) (a2)) (5), right ([15, 5]))
})

test ('lift2 short-circuits when first action is Left', (t) => {
  t.ok (isLeft (run (lift2 ((a) => (b) => a + b) (lift (left ('err'))) (of (2))) (0)))
})

test ('lift2 short-circuits when second action is Left', (t) => {
  t.ok (isLeft (run (lift2 ((a) => (b) => a + b) (of (1)) (lift (left ('err')))) (0)))
})

test ('lift2 state passes from first to second action', (t) => {
  const a1 = map ((_) => 'a') (modify ((s) => s + 1))
  const a2 = map ((_) => 'b') (modify ((s) => s + 10))
  // a1: state 0→1, value 'a'
  // a2: state 1→11, value 'b'
  t.alike (run (lift2 ((a) => (b) => `${a}${b}`) (a1) (a2)) (0), right (['ab', 11]))
})

// =============================================================================
// Integration — simulated binary parser
// =============================================================================

// Minimal buffer reader built on StateT to mirror the real ByteReader use-case.
// Cursor = { buf: Buffer, offset: number }

const mkCursor = (buf, offset = 0) => ({ buf, offset })

const readBytes = (n) => ({ buf, offset }) => {
  const remaining = buf.byteLength - offset
  if (n > remaining)
    return left (new RangeError (`want ${n}, have ${remaining}`))
  return right ([buf.subarray (offset, offset + n), { buf, offset: offset + n }])
}

const readUInt8 = map ((b) => b.readUInt8 (0)) (readBytes (1))

const readUInt32BE = map ((b) => b.readUInt32BE (0)) (readBytes (4))

const field = (name) => (reader) => (acc) =>
  map ((value) => ({ ...acc, [name]: value })) (reader)

test ('parser: read sequential fields into an object', (t) => {
  const buf = Buffer.alloc (5)
  buf.writeUInt8 (0xAB, 0)
  buf.writeUInt32BE (0xDEADBEEF, 1)

  const parser = chain ((acc) => field ('code') (readUInt32BE) (acc)) (
    field ('tag') (readUInt8) ({}),
  )

  t.alike (eval_ (parser) (mkCursor (buf)), right ({ tag: 0xAB, code: 0xDEADBEEF }))
})

test ('parser: read fails with RangeError when buffer is too short', (t) => {
  const buf    = Buffer.alloc (2)
  const result = eval_ (readUInt32BE) (mkCursor (buf))
  t.ok (isLeft (result))
  t.ok (result.left instanceof RangeError)
})

test ('parser: short-circuit stops at first failed read, cursor unchanged', (t) => {
  const buf = Buffer.alloc (1)
  buf.writeUInt8 (0xFF, 0)

  let secondCalled = false
  const parser = chain ((_) => {
    secondCalled = true
    return readUInt32BE  // would fail anyway, but should not be reached
  }) (chain ((_) => readUInt32BE) (readUInt8))

  // readUInt8 ok → readUInt32BE fails → chain to second never runs
  t.ok (isLeft (eval_ (parser) (mkCursor (buf))))
  t.absent (secondCalled)
})

test ('parser: dependent read — length-prefixed payload', (t) => {
  const payload = Buffer.from ('hello')
  const buf     = Buffer.alloc (1 + payload.length)
  buf.writeUInt8 (payload.length, 0)
  payload.copy (buf, 1)

  const parser = chain ((length) => readBytes (length)) (readUInt8)

  const result = eval_ (parser) (mkCursor (buf))
  t.ok (isRight (result))
  t.alike (result.right, payload)
})

test ('parser: cursor offset advances correctly across reads', (t) => {
  const buf = Buffer.alloc (6)
  buf.writeUInt8 (10, 0)
  buf.writeUInt8 (20, 1)
  buf.writeUInt32BE (0xCAFEBABE, 2)

  const parser = sequence ([readUInt8, readUInt8, readUInt32BE])

  t.alike (eval_ (parser) (mkCursor (buf)), right ([10, 20, 0xCAFEBABE]))
})

test ('parser: reading exact buffer size leaves no remaining bytes', (t) => {
  const buf    = Buffer.alloc (4)
  buf.writeUInt32BE (0x01020304, 0)

  const result = run (readUInt32BE) (mkCursor (buf))
  t.ok (isRight (result))
  t.is (result.right[1].offset, 4)
  t.is (result.right[1].buf.byteLength - result.right[1].offset, 0)
})
