import test from 'brittle'
import {
  state, get, put, modify, gets,
  run, eval_, exec,
  map, of, ap, chain, andThen,
  chainRec,
  sequence, traverse, lift2,
} from '../lib/state.js'

// =============================================================================
// Constructor
// =============================================================================

test ('state wraps a state-transition function', (t) => {
  const action = state ((s) => [s + 1, s + 1])
  const result = run (action) (5)
  t.alike (result, [6, 6])
})

// =============================================================================
// Primitive actions
// =============================================================================

test ('get returns the current state as value, leaving state unchanged', (t) => {
  t.alike (run (get) (42), [42, 42])
  t.alike (run (get) (0), [0, 0])
  t.alike (run (get) ('hello'), ['hello', 'hello'])
})

test ('put replaces the state and returns null', (t) => {
  t.alike (run (put (99)) (0), [null, 99])
  t.alike (run (put ('new')) ('old'), [null, 'new'])
})

test ('put always returns null as the value regardless of initial state', (t) => {
  t.is (eval_ (put (42)) (0), null)
  t.is (eval_ (put (42)) (999), null)
})

test ('modify applies a function to the state, returning null', (t) => {
  t.alike (run (modify ((s) => s + 1)) (0), [null, 1])
  t.alike (run (modify ((s) => s * 2)) (5), [null, 10])
})

test ('modify does not change the returned value (always null)', (t) => {
  t.is (eval_ (modify ((s) => s + 1)) (0), null)
})

test ('gets projects a value from the state without changing it', (t) => {
  t.alike (run (gets ((s) => s * 2)) (21), [42, 21])
  t.alike (run (gets ((s) => s.length)) ('hello'), [5, 'hello'])
})

test ('gets leaves the state unchanged', (t) => {
  t.is (exec (gets ((s) => s * 100)) (7), 7)
})

// =============================================================================
// Runners
// =============================================================================

test ('run returns [value, finalState]', (t) => {
  t.alike (run (of (42)) (0), [42, 0])
  t.alike (run (get) (5), [5, 5])
})

test ('eval_ returns only the final value', (t) => {
  t.is (eval_ (of (42)) (0), 42)
  t.is (eval_ (get) (5), 5)
  t.is (eval_ (gets ((s) => s * 2)) (21), 42)
})

test ('exec returns only the final state', (t) => {
  t.is (exec (put (99)) (0), 99)
  t.is (exec (modify ((s) => s + 1)) (0), 1)
  t.is (exec (of (42)) (7), 7)
})

// =============================================================================
// Functor
// =============================================================================

test ('map transforms the produced value without affecting the state', (t) => {
  t.alike (run (map ((x) => x * 2) (of (21))) (0), [42, 0])
  t.alike (run (map ((x) => x + 1) (get)) (5), [6, 5])
})

test ('map does not change the final state', (t) => {
  t.is (exec (map ((x) => x * 1000) (put (99))) (0), 99)
})

test ('map identity law: map(id)(action) behaves same as action', (t) => {
  const action = gets ((s) => s + 1)
  const s0 = 10
  t.alike (run (map ((x) => x) (action)) (s0), run (action) (s0))
})

test ('map composition: map(g ∘ f) === map(g) ∘ map(f)', (t) => {
  const f = (x) => x + 1
  const g = (x) => x * 2
  const action = of (3)
  const s0 = 0
  const lhs = eval_ (map ((x) => g (f (x))) (action)) (s0)
  const rhs = eval_ (map (g) (map (f) (action))) (s0)
  t.is (lhs, rhs)
})

// =============================================================================
// Applicative
// =============================================================================

test ('of lifts a pure value into State — state passes through unchanged', (t) => {
  t.alike (run (of (42)) (99), [42, 99])
  t.alike (run (of ('hello')) (0), ['hello', 0])
})

test ('ap threads state through both actions', (t) => {
  t.alike (run (ap (of ((x) => x + 1)) (of (41))) (0), [42, 0])
})

test ('ap applies the function from the first action to the value of the second', (t) => {
  const apResult = eval_ (ap (of ((x) => x * 2)) (of (21))) (0)
  t.is (apResult, 42)
})

test ('ap threads state left-to-right through both actions', (t) => {
  // First action increments state, second reads it
  const af = map ((_) => (s) => s) (modify ((s) => s + 1))
  const aa = get
  const result = run (ap (af) (aa)) (5)
  // af runs first: state becomes 6, value is (s => s)
  // aa runs next with state 6: value is 6
  // applied: (s => s)(6) = 6
  t.alike (result, [6, 6])
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
  t.alike (run (action) (0), [null, 1])
  t.alike (run (action) (5), [null, 6])
})

test ('chain left identity: chain(f)(of(a)) === f(a)', (t) => {
  const f = (x) => of (x * 2)
  const a = 5
  const s0 = 0
  t.alike (run (chain (f) (of (a))) (s0), run (f (a)) (s0))
})

test ('chain right identity: chain(of)(action) === action', (t) => {
  const action = gets ((s) => s + 1)
  const s0 = 10
  t.alike (run (chain (of) (action)) (s0), run (action) (s0))
})

test ('chain threads state correctly through a sequence of operations', (t) => {
  const inc = modify ((s) => s + 1)
  const readDouble = gets ((s) => s * 2)
  const action = chain ((_) => readDouble) (chain ((_) => inc) (inc))
  // start: 0 → inc → 1 → inc → 2 → readDouble → [4, 2]
  t.alike (run (action) (0), [4, 2])
})

test ('chain associativity', (t) => {
  const f = (x) => of (x + 1)
  const g = (x) => of (x * 2)
  const action = of (3)
  const s0 = 0
  const lhs = eval_ (chain (g) (chain (f) (action))) (s0)
  const rhs = eval_ (chain ((x) => chain (g) (f (x))) (action)) (s0)
  t.is (lhs, rhs)
})

test ('andThen sequences two actions, discarding the first value', (t) => {
  t.alike (run (andThen (of (42)) (put (99))) (0), [42, 99])
  t.alike (run (andThen (get) (put (5))) (0), [5, 5])
})

test ('andThen is equivalent to chain ignoring first value', (t) => {
  const first = modify ((s) => s + 1)
  const second = of (42)
  const s0 = 0
  t.alike (run (andThen (second) (first)) (s0), run (chain ((_) => second) (first)) (s0))
})

// =============================================================================
// Stack-safe recursion
// =============================================================================

test ('chainRec is stack-safe for large iterations', (t) => {
  const action = chainRec ((next, done, n) =>
    n <= 0 ? of (done (0)) : chain ((_) => of (next (n - 1))) (modify ((s) => s + 1)),
  ) (10000)
  t.alike (run (action) (0), [0, 10000])
})

test ('chainRec terminates immediately when done is returned on first step', (t) => {
  const action = chainRec ((next, done, n) => of (done (n * 2))) (21)
  t.alike (run (action) (0), [42, 0])
})

test ('chainRec accumulates state through each step', (t) => {
  const action = chainRec ((next, done, n) =>
    n <= 0 ? of (done ('finished')) : chain ((_) => of (next (n - 1))) (modify ((s) => s + 1)),
  ) (5)
  t.alike (run (action) (0), ['finished', 5])
})

// =============================================================================
// sequence
// =============================================================================

test ('sequence runs all actions and collects values', (t) => {
  t.alike (run (sequence ([of (1), of (2), of (3)])) (0), [[1, 2, 3], 0])
})

test ('sequence threads state through each action', (t) => {
  const actions = [modify ((s) => s + 1), modify ((s) => s + 1), modify ((s) => s + 1)]
  t.alike (run (sequence (actions)) (0), [[null, null, null], 3])
})

test ('sequence on empty array returns empty array without changing state', (t) => {
  t.alike (run (sequence ([])) (42), [[], 42])
})

test ('sequence preserves order of values', (t) => {
  const actions = [gets ((s) => s), modify ((s) => s + 10), gets ((s) => s)]
  const [values] = run (sequence (actions)) (5)
  t.alike (values, [5, null, 15])
})

// =============================================================================
// traverse
// =============================================================================

test ('traverse maps f over an array and sequences the results', (t) => {
  t.alike (run (traverse ((x) => of (x * 2)) ([1, 2, 3])) (0), [[2, 4, 6], 0])
})

test ('traverse threads state through each mapped action', (t) => {
  const action = traverse ((_x) => modify ((s) => s + 1)) ([1, 2, 3])
  t.alike (run (action) (0), [[null, null, null], 3])
})

test ('traverse on empty array returns empty array', (t) => {
  t.alike (run (traverse ((x) => of (x)) ([])) (99), [[], 99])
})

test ('traverse is equivalent to sequence(xs.map(f))', (t) => {
  const f = (x) => of (x + 1)
  const xs = [1, 2, 3]
  const s0 = 0
  t.alike (
    run (traverse (f) (xs)) (s0),
    run (sequence (xs.map (f))) (s0),
  )
})

// =============================================================================
// lift2
// =============================================================================

test ('lift2 combines values from two actions with a binary function', (t) => {
  t.alike (run (lift2 ((a) => (b) => a + b) (of (1)) (of (2))) (0), [3, 0])
})

test ('lift2 threads state through both actions', (t) => {
  const a1 = gets ((s) => s)
  const a2 = gets ((s) => s * 2)
  t.alike (run (lift2 ((a) => (b) => a + b) (a1) (a2)) (5), [15, 5])
})

test ('lift2 state passes from first to second action', (t) => {
  const a1 = map ((_) => 'a') (modify ((s) => s + 1))
  const a2 = map ((_) => 'b') (modify ((s) => s + 10))
  const result = run (lift2 ((a) => (b) => `${a}${b}`) (a1) (a2)) (0)
  // a1: state 0→1, value 'a'
  // a2: state 1→11, value 'b'
  t.alike (result, ['ab', 11])
})

// =============================================================================
// Integration — realistic stateful computation
// =============================================================================

test ('counter: increment three times and read', (t) => {
  const inc = modify ((s) => s + 1)
  const counter = chain ((_) => chain ((_) => chain ((_) => get) (inc)) (inc)) (inc)
  t.alike (run (counter) (0), [3, 3])
})

test ('stack: push and pop operations', (t) => {
  const push = (x) => modify ((stack) => [x, ...stack])
  const pop  = chain ((stack) =>
    stack.length === 0
      ? of (null)
      : chain ((_) => of (stack[0])) (put (stack.slice (1))),
  ) (get)

  const program = chain ((_) =>
    chain ((_) =>
      chain ((_) => pop) (push (3)),
    ) (push (2)),
  ) (push (1))

  // push 1, push 2, push 3 → stack is [3,2,1], then pop → value 3, stack [2,1]
  t.alike (run (program) ([]), [3, [2, 1]])
})

test ('accumulator: running total via state', (t) => {
  const addToState = (n) => modify ((s) => s + n)
  const program = sequence ([
    addToState (10),
    addToState (20),
    addToState (12),
    get,
  ])
  const [values, finalState] = run (program) (0)
  t.is (finalState, 42)
  t.is (values[3], 42)
})
