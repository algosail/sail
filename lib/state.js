// state.js
// The State monad.
// State s a = s -> [a, s]
//
// A State action is a plain function that takes a state and returns a pair
// [value, newState].  There is no wrapper object — the type IS the function.
// This keeps the implementation minimal and the interop with plain JS trivial.
//
// All combinators are curried and follow the same style as the rest of sail.

// =============================================================================
// Constructor
// =============================================================================

/**
 * Wraps a state-transition function into the State monad.
 * The function must have type  s -> [a, s].
 * @example
 * // state :: (s -> [a, s]) -> State s a
 * state (s => [s + 1, s + 1]) // a State action that increments and returns
 */
export function state (f) {
  return f
}

// =============================================================================
// Primitive actions
// =============================================================================

/**
 * Retrieves the current state as the result value without modifying it. This
 * makes the state observable inside a `chain` pipeline — once you have the
 * state as a value you can branch on it, compute from it, or pass it to the
 * next step. It is the fundamental read operation of the State monad.
 * @example
 * // get :: State s s
 * run (get) (42)
 * // => [42, 42]
 * run (chain (s => of (s * s)) (get)) (7)
 * // => [49, 7]
 */
export const get = (s) => [s, s]

/**
 * Replaces the entire state with a given value, discarding the current state
 * and returning `null` as the result. Use it inside a `chain` pipeline when
 * you need to reset or completely overwrite the state — for example, to store a
 * value computed from the old state back after reading it with `get`.
 * @example
 * // put :: s -> State s null
 * run (put (99)) (0)
 * // => [null, 99]
 * run (chain (s => put (s * 2)) (get)) (7)
 * // => [null, 14]
 */
export function put (s) {
  return (_) => [null, s]
}

/**
 * Applies a transformation function to the current state and stores the result
 * as the new state, returning `null` as the result value. It is the most common
 * state operation in practice — a convenient shorthand for reading, transforming,
 * and writing back in one step. Ideal for incrementing counters, pushing to
 * stacks, or updating record fields inside a stateful pipeline.
 * @example
 * // modify :: (s -> s) -> State s null
 * run (modify (s => s + 1)) (0)
 * // => [null, 1]
 * run (modify (stack => ['item', ...stack])) ([])
 * // => [null, ['item']]
 * run (modify (s => ({ ...s, visited: s.visited + 1 }))) ({ visited: 4 })
 * // => [null, { visited: 5 }]
 */
export function modify (f) {
  return (s) => [null, f (s)]
}

/**
 * Projects a derived value from the current state without modifying it. It is
 * a convenient shorthand for `chain (s => of (f (s))) (get)` and is useful
 * whenever you need a computed slice of the state — such as the length of a
 * list or a field of a record — as the result of a pipeline step.
 * @example
 * // gets :: (s -> a) -> State s a
 * run (gets (s => s * 2)) (21)
 * // => [42, 21]
 * run (gets (s => s.length)) ([1, 2, 3])
 * // => [3, [1, 2, 3]]
 * run (gets (s => s.name.toUpperCase ())) ({ name: 'alice', role: 'admin' })
 * // => ['ALICE', { name: 'alice', role: 'admin' }]
 */
export function gets (f) {
  return (s) => [f (s), s]
}

// =============================================================================
// Runner
// =============================================================================

/**
 * Executes a State computation starting from an initial state, returning a
 * pair `[result, finalState]`. This is the primary runner — the point at which
 * a pure description of stateful computation is interpreted into an actual
 * value and updated state. Call it at the edge of your program after building
 * a pipeline with `chain`, `modify`, and friends.
 * @example
 * // run :: State s a -> s -> [a, s]
 * run (of (42)) (0)
 * // => [42, 0]
 * run (chain (n => of (n + 1)) (get)) (10)
 * // => [11, 10]
 * const counter = chain (() => get) (modify (n => n + 1))
 * run (counter) (0)
 * // => [1, 1]
 */
export function run (action) {
  return (s) => action (s)
}

/**
 * Runs a State computation and returns only the result value, discarding the
 * final state. Use it when you care about the computed answer but have no
 * further need for the state — for example, evaluating an expression inside an
 * environment without needing the environment back.
 * @example
 * // eval :: State s a -> s -> a
 * eval_ (of (42)) (0)
 * // => 42
 * eval_ (gets (s => s * 2)) (21)
 * // => 42
 */
export function eval_ (action) {
  return (s) => action (s) [0]
}

/**
 * Runs a State computation and returns only the final state, discarding the
 * result value. Use it when you care about the side-effect on the state rather
 * than the computed value — for example, after running a series of `modify`
 * steps to build up a data structure.
 * @example
 * // exec :: State s a -> s -> s
 * exec (put (99)) (0)
 * // => 99
 * exec (modify (s => s + 1)) (5)
 * // => 6
 * const push = val => modify (stack => [val, ...stack])
 * exec (chain (() => push (2)) (push (1))) ([])
 * // => [2, 1]
 */
export function exec (action) {
  return (s) => action (s) [1]
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Transforms the result value produced by a State action while leaving the
 * state transition completely unchanged. It is the Functor instance for State,
 * letting you post-process a computation's output — format a number, extract a
 * field — without restructuring the stateful pipeline around it.
 * @example
 * // map :: (a -> b) -> State s a -> State s b
 * run (map (x => x * 2) (of (21))) (0)
 * // => [42, 0]
 * run (map (x => x.toUpperCase ()) (gets (s => s.name))) ({ name: 'alice' })
 * // => ['ALICE', { name: 'alice' }]
 */
export function map (f) {
  return (action) => (s) => {
    const [a, s1] = action (s)
    return [f (a), s1]
  }
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Lifts a plain value into State without inspecting or modifying the state in
 * any way. It is the `pure`/`return` of the State monad — the identity action
 * that simply injects a known result into a stateful pipeline. Use it to
 * convert ordinary values into State actions so they can participate in `chain`
 * or `ap` compositions.
 * @example
 * // of :: a -> State s a
 * run (of (42)) (99)
 * // => [42, 99]
 * run (of ('hello')) ({ count: 0 })
 * // => ['hello', { count: 0 }]
 */
export function of (a) {
  return (s) => [a, s]
}

/**
 * Applies a State action that carries a function to a State action that carries
 * a value, threading state through both in sequence. It is the Applicative
 * instance for State, enabling you to combine independent stateful computations
 * without a full `chain` when the second action does not depend on the first's
 * result. Prefer `chain` when there is a data dependency between steps.
 * @example
 * // ap :: State s (a -> b) -> State s a -> State s b
 * run (ap (of (x => x + 1)) (of (41))) (0)
 * // => [42, 0]
 * run (ap (gets (s => x => x + s)) (of (10))) (5)
 * // => [15, 5]
 */
export function ap (af) {
  return (aa) => (s) => {
    const [f, s1] = af (s)
    const [a, s2] = aa (s1)
    return [f (a), s2]
  }
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Sequences two State actions so the second can depend on the value produced
 * by the first, with state flowing through both steps in order. It is the
 * monadic bind (`>>=`) for State and the primary building block for stateful
 * pipelines: each step may read and modify the current state, and the updated
 * state is automatically forwarded to every subsequent step without any shared
 * mutable variable.
 * @example
 * // chain :: (a -> State s b) -> State s a -> State s b
 * const action = chain (n => put (n * 2)) (get)
 * run (action) (5)
 * // => [null, 10]
 * const push = val => modify (stack => [val, ...stack])
 * const action2 = chain (() => gets (s => s.length)) (push ('a'))
 * run (action2) ([])
 * // => [1, ['a']]
 */
export function chain (f) {
  return (action) => (s) => {
    const [a, s1] = action (s)
    return f (a) (s1)
  }
}

/**
 * Sequences two State actions, discarding the value of the first.
 * Haskell: (>>)
 * @example
 * // andThen :: State s b -> State s a -> State s b
 * run (andThen (of (42)) (put (99))) (0)
 * // => [42, 99]
 */
export function andThen (next) {
  return chain ((_) => next)
}

// =============================================================================
// Stack-safe recursion
// =============================================================================

/**
 * Stack-safe tail-recursive State bind (Fantasy Land ChainRec).
 * f receives (next, done, a) and must return a State action that yields a Step.
 * @example
 * // chainRec :: ((a -> Step, b -> Step, a) -> State s Step) -> a -> State s b
 * // Count down from n, accumulating increments in state:
 * const action = chainRec ((next, done, n) =>
 *   n <= 0 ? of (done (0)) : chain ((_) => of (next (n - 1))) (modify (s => s + 1))
 * ) (5)
 * run (action) (0)
 * // => [0, 5]
 */
export function chainRec (f) {
  return (seed) => (s) => {
    const next  = (value) => ({ done: false, value })
    const done  = (value) => ({ done: true,  value })
    let step    = next (seed)
    let current = s
    while (!step.done) {
      const [s2, st2] = f (next, done, step.value) (current)
      step    = s2
      current = st2
    }
    return [step.value, current]
  }
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Runs a list of State actions in sequence, collecting all values.
 * The state threads through each action left to right.
 * @example
 * // sequence :: Array (State s a) -> State s (Array a)
 * run (sequence ([of (1), of (2), of (3)])) (0)
 * // => [[1, 2, 3], 0]
 */
export function sequence (actions) {
  return (s) => {
    const values = []
    let current  = s
    for (const action of actions) {
      const [a, s1] = action (current)
      values.push (a)
      current = s1
    }
    return [values, current]
  }
}

/**
 * Maps f over an array, running each resulting State action in sequence and
 * collecting the values.  Equivalent to sequence (xs.map (f)).
 * @example
 * // traverse :: (a -> State s b) -> Array a -> State s (Array b)
 * run (traverse (x => of (x * 2)) ([1, 2, 3])) (0)
 * // => [[2, 4, 6], 0]
 */
export function traverse (f) {
  return (xs) => sequence (xs.map (f))
}

/**
 * Runs two State actions and combines their values with a curried binary
 * function.  Useful for point-free style when you don't need intermediate
 * binds.
 * @example
 * // lift2 :: (a -> b -> c) -> State s a -> State s b -> State s c
 * run (lift2 (a => b => a + b) (of (1)) (of (2))) (0)
 * // => [3, 0]
 */
export function lift2 (f) {
  return (fa) => (fb) => ap (map (f) (fa)) (fb)
}
