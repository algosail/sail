// state.js – The State monad.
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
 * Returns the current state as the value, leaving it unchanged.
 * Haskell: `get`
 * @example
 * // get :: State s s
 * run (get) (42) // => [42, 42]
 */
export const get = (s) => [s, s]

/**
 * Replaces the state with a new value, returning unit (null).
 * Haskell: `put`
 * @example
 * // put :: s -> State s null
 * run (put (99)) (0) // => [null, 99]
 */
export function put (s) {
  return (_) => [null, s]
}

/**
 * Applies a function to the state, replacing it with the result.
 * Returns unit (null).
 * Haskell: `modify`
 * @example
 * // modify :: (s -> s) -> State s null
 * run (modify (s => s + 1)) (0) // => [null, 1]
 */
export function modify (f) {
  return (s) => [null, f (s)]
}

/**
 * Projects a value from the current state without changing it.
 * Haskell: `gets`
 * @example
 * // gets :: (s -> a) -> State s a
 * run (gets (s => s * 2)) (21) // => [42, 21]
 */
export function gets (f) {
  return (s) => [f (s), s]
}

// =============================================================================
// Runner
// =============================================================================

/**
 * Runs a State action with an initial state, returning [value, finalState].
 * @example
 * // run :: State s a -> s -> [a, s]
 * run (of (42)) (0) // => [42, 0]
 */
export function run (action) {
  return (s) => action (s)
}

/**
 * Runs a State action and returns only the final value.
 * @example
 * // eval :: State s a -> s -> a
 * eval (of (42)) (0) // => 42
 */
export function eval_ (action) {
  return (s) => action (s) [0]
}

/**
 * Runs a State action and returns only the final state.
 * @example
 * // exec :: State s a -> s -> s
 * exec (put (99)) (0) // => 99
 */
export function exec (action) {
  return (s) => action (s) [1]
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies f to the value produced by a State action, leaving the state
 * transition unchanged.
 * @example
 * // map :: (a -> b) -> State s a -> State s b
 * run (map (x => x * 2) (of (21))) (0) // => [42, 0]
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
 * Lifts a pure value into State — the state passes through unchanged.
 * @example
 * // of :: a -> State s a
 * run (of (42)) (99) // => [42, 99]
 */
export function of (a) {
  return (s) => [a, s]
}

/**
 * Sequential application — runs the function action, then the value action,
 * threading the state through both.
 * @example
 * // ap :: State s (a -> b) -> State s a -> State s b
 * run (ap (of (x => x + 1)) (of (41))) (0) // => [42, 0]
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
 * Sequences two State actions — the second action can depend on the value
 * produced by the first.  The state threads through both.
 * @example
 * // chain :: (a -> State s b) -> State s a -> State s b
 * const action = chain (n => put (n)) (gets (s => s + 1))
 * run (action) (0) // => [null, 1]
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
 * run (andThen (of (42)) (put (99))) (0) // => [42, 99]
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
 * run (action) (0) // => [0, 5]
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
 * run (sequence ([of (1), of (2), of (3)])) (0) // => [[1, 2, 3], 0]
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
 * run (traverse (x => of (x * 2)) ([1, 2, 3])) (0) // => [[2, 4, 6], 0]
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
 * run (lift2 (a => b => a + b) (of (1)) (of (2))) (0) // => [3, 0]
 */
export function lift2 (f) {
  return (fa) => (fb) => ap (map (f) (fa)) (fb)
}
