// state-either.js – StateT s (Either e) a
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
 * Wraps a state-transition function into the StateT monad.
 * The function must have type  s -> Either e [a, s].
 * @example
 * // state :: (s -> Either e [a, s]) -> StateT s e a
 * state (s => E.right ([s + 1, s + 1]))
 */
export function state (f) {
  return f
}

// =============================================================================
// Primitive actions
// =============================================================================

/**
 * Returns the current state as the value, leaving it unchanged.
 * @example
 * // get :: StateT s e s
 * run (get) (42) // => right([42, 42])
 */
export const get = (s) => E.right ([s, s])

/**
 * Replaces the state with a new value, returning unit (null).
 * @example
 * // put :: s -> StateT s e null
 * run (put (99)) (0) // => right([null, 99])
 */
export function put (s) {
  return (_) => E.right ([null, s])
}

/**
 * Applies a function to the state, replacing it with the result.
 * Returns unit (null).
 * @example
 * // modify :: (s -> s) -> StateT s e null
 * run (modify (s => s + 1)) (0) // => right([null, 1])
 */
export function modify (f) {
  return (s) => E.right ([null, f (s)])
}

/**
 * Projects a value from the current state without changing it.
 * @example
 * // gets :: (s -> a) -> StateT s e a
 * run (gets (s => s * 2)) (21) // => right([42, 21])
 */
export function gets (f) {
  return (s) => E.right ([f (s), s])
}

// =============================================================================
// Lift
// =============================================================================

/**
 * Lifts an Either value into StateT — the state passes through unchanged.
 * Use this to inject a pre-computed Either result into a StateT pipeline.
 * @example
 * // lift :: Either e a -> StateT s e a
 * run (lift (E.right (42))) (0)       // => right([42, 0])
 * run (lift (E.left ('oops'))) (0)    // => left('oops')
 */
export function lift (ea) {
  return (s) => E.map ((a) => [a, s]) (ea)
}

// =============================================================================
// Runner
// =============================================================================

/**
 * Runs a StateT action with an initial state, returning Either e [value, finalState].
 * @example
 * // run :: StateT s e a -> s -> Either e [a, s]
 * run (of (42)) (0) // => right([42, 0])
 */
export function run (action) {
  return (s) => action (s)
}

/**
 * Runs a StateT action and returns only the final value inside Either.
 * @example
 * // eval_ :: StateT s e a -> s -> Either e a
 * eval_ (of (42)) (0) // => right(42)
 */
export function eval_ (action) {
  return (s) => E.map (([a]) => a) (action (s))
}

/**
 * Runs a StateT action and returns only the final state inside Either.
 * @example
 * // exec :: StateT s e a -> s -> Either e s
 * exec (put (99)) (0) // => right(99)
 */
export function exec (action) {
  return (s) => E.map (([, s1]) => s1) (action (s))
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies f to the value produced by a StateT action, leaving the state
 * transition unchanged.  Short-circuits on Left.
 * @example
 * // map :: (a -> b) -> StateT s e a -> StateT s e b
 * run (map (x => x * 2) (of (21))) (0) // => right([42, 0])
 */
export function map (f) {
  return (action) => (s) => E.map (([a, s1]) => [f (a), s1]) (action (s))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Lifts a pure value into StateT — the state passes through unchanged.
 * @example
 * // of :: a -> StateT s e a
 * run (of (42)) (99) // => right([42, 99])
 */
export function of (a) {
  return (s) => E.right ([a, s])
}

/**
 * Sequential application — runs the function action, then the value action,
 * threading the state through both.  Short-circuits on the first Left.
 * @example
 * // ap :: StateT s e (a -> b) -> StateT s e a -> StateT s e b
 * run (ap (of (x => x + 1)) (of (41))) (0) // => right([42, 0])
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
 * Sequences two StateT actions — the second can depend on the value of the
 * first.  Short-circuits on the first Left.
 * @example
 * // chain :: (a -> StateT s e b) -> StateT s e a -> StateT s e b
 * const action = chain (n => put (n)) (gets (s => s + 1))
 * run (action) (0) // => right([null, 1])
 */
export function chain (f) {
  return (action) => (s) =>
    E.chain (([a, s1]) => f (a) (s1)) (action (s))
}

/**
 * Sequences two StateT actions, discarding the value of the first.
 * Haskell: (>>)
 * @example
 * // andThen :: StateT s e b -> StateT s e a -> StateT s e b
 * run (andThen (of (42)) (put (99))) (0) // => right([42, 99])
 */
export function andThen (next) {
  return chain ((_) => next)
}

/**
 * Runs f on the Right value for a potential short-circuit Left;
 * returns the original action's result unchanged if f succeeds.
 * Mirrors Either's chainFirst — useful for validation side-checks.
 * @example
 * // chainFirst :: (a -> StateT s e b) -> StateT s e a -> StateT s e a
 * run (chainFirst (x => lift (E.left ('stop'))) (of (1))) (0) // => left('stop')
 * run (chainFirst (x => of ('ok')) (of (1))) (0)              // => right([1, 0])
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
 * Stack-safe tail-recursive StateT bind (Fantasy Land ChainRec).
 * @example
 * // chainRec :: ((a -> Step, b -> Step, a) -> StateT s e Step) -> a -> StateT s e b
 * const count = chainRec ((next, done, n) =>
 *   n <= 0 ? of (done (0)) : andThen (of (next (n - 1))) (modify (s => s + 1))
 * ) (5)
 * run (count) (0) // => right([0, 5])
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
 * Runs a list of StateT actions in sequence, collecting all values.
 * Short-circuits on the first Left.
 * @example
 * // sequence :: Array (StateT s e a) -> StateT s e (Array a)
 * run (sequence ([of (1), of (2), of (3)])) (0) // => right([[1, 2, 3], 0])
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
 * Maps f over an array, running each resulting StateT action in sequence and
 * collecting the values.  Short-circuits on the first Left.
 * Equivalent to sequence (xs.map (f)).
 * @example
 * // traverse :: (a -> StateT s e b) -> Array a -> StateT s e (Array b)
 * run (traverse (x => of (x * 2)) ([1, 2, 3])) (0) // => right([[2, 4, 6], 0])
 */
export function traverse (f) {
  return (xs) => sequence (xs.map (f))
}

/**
 * Runs two StateT actions and combines their values with a curried binary
 * function.  Short-circuits on the first Left.
 * @example
 * // lift2 :: (a -> b -> c) -> StateT s e a -> StateT s e b -> StateT s e c
 * run (lift2 (a => b => a + b) (of (1)) (of (2))) (0) // => right([3, 0])
 */
export function lift2 (f) {
  return (fa) => (fb) => ap (map (f) (fa)) (fb)
}
