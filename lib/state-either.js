// state-either.js
// StateT s (Either e) a
// StateT s e a = s -> Either e [a, s]
//
// A StateT action is a plain function  s -> Either e [a, s].
// Right([value, newState]) — success with a new state.
// Left(error)              — failure; the state is discarded.
//
// This is the standard State monad with an Either error layer added.
// Use it when individual steps can fail AND you need to thread state
// through those steps — binary parsers, stateful validators, interpreters.
//
// Relationship to State:
//   State s a   = s ->         [a, s]
//   StateT s e a = s -> Either e [a, s]
//
// All combinators are curried and follow the same style as state.js.

import * as E from './either.js'

// =============================================================================
// Constructor
// =============================================================================

/**
 * The low-level constructor for `StateT` — wraps a raw function
 * `s -> Either e [a, s]` directly. Most of the time you will use higher-level
 * helpers like `of`, `get`, or `lift`, but `state` is available when you need
 * to write a custom transition that cannot be expressed with those combinators.
 * @example
 * // state :: (s -> Either e [a, s]) -> StateT s e a
 * const increment = state (n => E.right ([n, n + 1]))
 * run (increment) (0)
 * // => right([0, 1])
 */
export function state (f) {
  return f
}

// =============================================================================
// Primitive actions
// =============================================================================

/**
 * Reads the current state and exposes it as the action's result value without
 * modifying it. This is the fundamental "read" primitive for `StateT` —
 * combine it with `chain` to inspect the state mid-computation and branch on
 * its value or extract a field for further processing.
 * @example
 * // get :: StateT s e s
 * run (get) (42)
 * // => right([42, 42])
 * run (chain (n => of (n > 0 ? 'positive' : 'non-positive')) (get)) (-1)
 * // => right(['non-positive', -1])
 */
export const get = (s) => E.right ([s, s])

/**
 * Replaces the current state with the given value and returns `null` as the
 * result. Use `put` to unconditionally overwrite the state — for example,
 * resetting a counter to zero, storing a newly fetched record, or advancing
 * a cursor to a new position in a stateful computation.
 * @example
 * // put :: s -> StateT s e null
 * run (put ({ count: 0, step: 1 })) ({ count: 5, step: 1 })
 * // => right([null, { count: 0, step: 1 }])
 * run (put (99)) (0)
 * // => right([null, 99])
 */
export function put (s) {
  return (_) => E.right ([null, s])
}

/**
 * Updates the current state by applying `f` to it and replacing it with the
 * result, returning `null` as the action's value. More expressive than `put`
 * when the new state depends on the old one — for example, incrementing a
 * counter, appending to a list, or toggling a boolean field.
 * @example
 * // modify :: (s -> s) -> StateT s e null
 * run (modify (s => s + 1)) (41)
 * // => right([null, 42])
 * run (modify (s => ({ ...s, count: s.count + 1 }))) ({ count: 4, errors: 0 })
 * // => right([null, { count: 5, errors: 0 }])
 */
export function modify (f) {
  return (s) => E.right ([null, f (s)])
}

/**
 * Like `get`, but applies a projection function to the state before returning
 * it as the result value, leaving the state unchanged. Use `gets` to read a
 * specific field from a complex state object without first fetching the whole
 * state and manually destructuring it.
 * @example
 * // gets :: (s -> a) -> StateT s e a
 * run (gets (s => s.count)) ({ count: 7, errors: 0 })
 * // => right([7, { count: 7, errors: 0 }])
 * run (gets (s => s.length)) ([1, 2, 3])
 * // => right([3, [1, 2, 3]])
 */
export function gets (f) {
  return (s) => E.right ([f (s), s])
}

// =============================================================================
// Lift
// =============================================================================

/**
 * Promotes a standalone `Either e a` value into the `StateT` context,
 * threading the current state through unchanged. This is the canonical way to
 * incorporate a failing operation that has no state dependency — such as input
 * validation or a parse result — into a stateful pipeline.
 * @example
 * // lift :: Either e a -> StateT s e a
 * run (lift (E.right (42))) (0)
 * // => right([42, 0])
 * run (lift (E.left ('invalid input'))) ({ step: 3 })
 * // => left('invalid input')
 */
export function lift (ea) {
  return (s) => E.map ((a) => [a, s]) (ea)
}

// =============================================================================
// Runner
// =============================================================================

/**
 * Executes a `StateT` action from an initial state and returns the full result
 * as `Either e [value, finalState]`. This is the primary way to "escape" the
 * `StateT` abstraction at the edge of your program — after this call you have
 * a plain `Either` you can pattern-match or pass to further error-handling.
 * @example
 * // run :: StateT s e a -> s -> Either e [a, s]
 * run (of (42)) (0)
 * // => right([42, 0])
 * run (chain (n => put (n * 2)) (get)) (5)
 * // => right([null, 10])
 */
export function run (action) {
  return (s) => action (s)
}

/**
 * Like `run`, but discards the final state and returns only the computed value
 * inside `Either`. Use this when the state is an implementation detail and the
 * caller only cares about the result — for example, evaluating a stateful
 * parser and returning just the parsed value.
 * @example
 * // eval_ :: StateT s e a -> s -> Either e a
 * eval_ (of (42)) (0)
 * // => right(42)
 * eval_ (chain (n => of (n + 1)) (get)) (10)
 * // => right(11)
 */
export function eval_ (action) {
  return (s) => E.map (([a]) => a) (action (s))
}

/**
 * Like `run`, but discards the result value and returns only the final state
 * inside `Either`. Use this when you care about the side-effected state rather
 * than the produced value — for example, running a batch of `put`/`modify`
 * operations and then inspecting the resulting state.
 * @example
 * // exec :: StateT s e a -> s -> Either e s
 * exec (put (99)) (0)
 * // => right(99)
 * exec (modify (s => s + 1)) (41)
 * // => right(42)
 */
export function exec (action) {
  return (s) => E.map (([, s1]) => s1) (action (s))
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Transforms the result value of a `StateT` action with `f`, leaving the state
 * thread untouched. If the action produced `Left`, the error propagates and `f`
 * is never called. Use `map` to post-process a result without re-entering the
 * monadic context.
 * @example
 * // map :: (a -> b) -> StateT s e a -> StateT s e b
 * run (map (n => n * 2) (of (21))) (0)
 * // => right([42, 0])
 * run (map (n => n + 1) (lift (E.left ('err')))) (0)
 * // => left('err')
 */
export function map (f) {
  return (action) => (s) => E.map (([a, s1]) => [f (a), s1]) (action (s))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Injects a pure value into the `StateT` context without performing any state
 * transition or producing an error. This is the Applicative `pure` / Monad
 * `return` for `StateT` and serves as the terminal step in any `chain` pipeline
 * that succeeds with a known value.
 * @example
 * // of :: a -> StateT s e a
 * run (of ('ok')) (42)
 * // => right(['ok', 42])
 * run (of (null)) ({ count: 0 })
 * // => right([null, { count: 0 }])
 */
export function of (a) {
  return (s) => E.right ([a, s])
}

/**
 * Applies a `StateT` action containing a function to a `StateT` action
 * containing a value, threading state through both in sequence. The state is
 * first modified by the function action, then by the value action. Short-
 * circuits at the first `Left`, so subsequent steps are not run.
 * @example
 * // ap :: StateT s e (a -> b) -> StateT s e a -> StateT s e b
 * run (ap (of (x => x + 1)) (of (41))) (0)
 * // => right([42, 0])
 * run (ap (lift (E.left ('err'))) (of (1))) (0)
 * // => left('err')
 */
export function ap (af) {
  return (aa) => (s) =>
    E.chain (([f, s1]) =>
      E.map (([a, s2]) => [f (a), s2]) (aa (s1)),
    ) (af (s))
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Sequences two `StateT` actions where the second action is produced by
 * applying `f` to the result of the first. This is the core monadic bind,
 * allowing each step to inspect the previous result and decide what to do
 * next — including failing with `lift(E.left(...))`. Short-circuits immediately
 * if any step produces `Left`.
 * @example
 * // chain :: (a -> StateT s e b) -> StateT s e a -> StateT s e b
 * run (chain (n => of (n * 2)) (of (21))) (0)
 * // => right([42, 0])
 * run (chain (n => n > 0 ? put (n) : lift (E.left ('non-positive'))) (get)) (-1)
 * // => left('non-positive')
 */
export function chain (f) {
  return (action) => (s) =>
    E.chain (([a, s1]) => f (a) (s1)) (action (s))
}

/**
 * Sequences two `StateT` actions, discarding the result of the first and
 * returning the result of the second. Use this when you only care about the
 * side-effect of the first action (e.g. a `modify` or `put`) and want to chain
 * a subsequent computation cleanly without an ignored bind variable.
 * @example
 * // andThen :: StateT s e b -> StateT s e a -> StateT s e b
 * run (andThen (of (42)) (put (99))) (0)
 * // => right([42, 99])
 * run (andThen (gets (s => s + 1)) (modify (s => s * 2))) (3)
 * // => right([7, 6])
 */
export function andThen (next) {
  return chain ((_) => next)
}

/**
 * Runs a side-effecting `StateT` action `f` on the current result value but
 * keeps the original value (not the result of `f`) in the pipeline. If `f`
 * produces `Left` the whole pipeline short-circuits. This models
 * "tap-with-validation" — assert something about the current value and abort
 * on failure without losing the value on success.
 * @example
 * // chainFirst :: (a -> StateT s e b) -> StateT s e a -> StateT s e a
 * run (chainFirst (x => x > 0 ? of ('ok') : lift (E.left ('non-positive'))) (of (5))) (0)
 * // => right([5, 0])
 * run (chainFirst (x => x > 0 ? of ('ok') : lift (E.left ('non-positive'))) (of (-1))) (0)
 * // => left('non-positive')
 */
export function chainFirst (f) {
  return (action) => (s) =>
    E.chain (([a, s1]) =>
      E.map (([, s2]) => [a, s2]) (f (a) (s1)),
    ) (action (s))
}

// =============================================================================
// Stack-safe recursion
// =============================================================================

/**
 * Provides stack-safe tail recursion for `StateT` by implementing the Fantasy
 * Land `ChainRec` contract. Instead of building up nested `chain` calls (which
 * would blow the stack for large inputs), the iteration runs in a JavaScript
 * `while` loop driven by `next`/`done` signals. Use this for loops over large
 * collections or indefinitely repeating stateful computations.
 * @example
 * // chainRec :: ((a -> Step, b -> Step, a) -> StateT s e Step) -> a -> StateT s e b
 * const sumTo = chainRec ((next, done, n) =>
 *   n <= 0 ? of (done (0)) : andThen (of (next (n - 1))) (modify (s => s + n))
 * ) (5)
 * run (sumTo) (0)
 * // => right([0, 15])
 */
export function chainRec (f) {
  return (seed) => (s) => {
    const next = (value) => ({ done: false, value })
    const done = (value) => ({ done: true,  value })
    let step    = next (seed)
    let current = s
    while (!step.done) {
      const result = f (next, done, step.value) (current)
      if (E.isLeft (result)) return result
      const [s2, st2] = result.right
      step    = s2
      current = st2
    }
    return E.right ([step.value, current])
  }
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Executes an array of `StateT` actions one by one, threading state through
 * all of them and collecting each result value into an array. Short-circuits on
 * the first failure, making it suitable for pipelines where every step must
 * succeed — such as validating and processing a batch of inputs with shared state.
 * @example
 * // sequence :: Array (StateT s e a) -> StateT s e (Array a)
 * run (sequence ([of (1), of (2), of (3)])) (0)
 * // => right([[1, 2, 3], 0])
 * run (sequence ([of (1), lift (E.left ('oops')), of (3)])) (0)
 * // => left('oops')
 */
export function sequence (actions) {
  return (s) => {
    const values = []
    let current  = s
    for (const action of actions) {
      const result = action (current)
      if (E.isLeft (result)) return result
      const [a, s1] = result.right
      values.push (a)
      current = s1
    }
    return E.right ([values, current])
  }
}

/**
 * Maps a function `f` over an array of values, turning each into a `StateT`
 * action, then executes them in sequence while threading state through each
 * step. Equivalent to `sequence(xs.map(f))` but reads more clearly at the call
 * site. The go-to combinator for processing every element of a list with the
 * same potentially-failing stateful operation.
 * @example
 * // traverse :: (a -> StateT s e b) -> Array a -> StateT s e (Array b)
 * run (traverse (x => of (x * 2)) ([1, 2, 3])) (0)
 * // => right([[2, 4, 6], 0])
 * run (traverse (x => x > 0 ? of (x) : lift (E.left ('negative'))) ([1, -2, 3])) (0)
 * // => left('negative')
 */
export function traverse (f) {
  return (xs) => sequence (xs.map (f))
}

/**
 * Combines two independent `StateT` actions by running them in sequence and
 * passing their values to a curried binary function `f`. This is a convenience
 * around `ap(map(f)(fa))(fb)` and avoids a `chain` plus manual tuple
 * unpacking when you simply want to merge two results. Short-circuits if either
 * action fails.
 * @example
 * // lift2 :: (a -> b -> c) -> StateT s e a -> StateT s e b -> StateT s e c
 * run (lift2 (a => b => a + b) (of (10)) (of (32))) (0)
 * // => right([42, 0])
 * run (lift2 (a => b => `${a} ${b}`) (of ('hello')) (of ('world'))) ({})
 * // => right(['hello world', {}])
 */
export function lift2 (f) {
  return (fa) => (fb) => ap (map (f) (fa)) (fb)
}
