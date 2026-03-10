// fn.js – Function combinators and the Reader monad.

// =============================================================================
// Core combinators
// =============================================================================

/**
 * Identity – returns its argument unchanged.
 * @example
 * // id :: a -> a
 * id (42) // => 42
 */
export function id (x) {
  return x
}

/**
 * Returns a function that always returns the same value, ignoring its argument.
 * @example
 * // always :: a -> b -> a
 * always (42) ('ignored') // => 42
 */
export function always (a) {
  return (_) => a
}

/**
 * Thrush / reverse-application — applies an argument to a function.
 * Useful for point-free pipelines where the value leads.
 * @example
 * // thrush :: a -> (a -> b) -> b
 * thrush (42) (x => x + 1) // => 43
 */
export function thrush (x) {
  return (f) => f (x)
}

/**
 * Runs a side-effect with the value and returns the value unchanged.
 * @example
 * // tap :: (a -> *) -> a -> a
 * tap (console.log) (42) // logs 42, returns 42
 */
export function tap (f) {
  return (a) => {
    f (a)
    return a
  }
}

/**
 * Flips the order of the first two arguments of a curried binary function.
 * @example
 * // flip :: (a -> b -> c) -> b -> a -> c
 * flip (a => b => a - b) (1) (3) // => 2
 */
export function flip (f) {
  return (b) => (a) => f (a) (b)
}

/**
 * P combinator — applies a curried binary function after mapping both
 * arguments through the same unary function.
 * @example
 * // on :: (b -> b -> c) -> (a -> b) -> a -> a -> c
 * on (a => b => a + b) (x => x * 2) (3) (4) // => 14
 */
export function on (f) {
  return (g) => (x) => (y) => f (g (x)) (g (y))
}

/**
 * Calls a function at most once; all subsequent calls return the first result.
 * @example
 * // once :: (a -> b) -> a -> b
 * const f = once (x => x + 1)
 * f (1) // => 2
 * f (99) // => 2  (cached)
 */
export function once (f) {
  let called = false
  let result
  return (...args) => {
    if (!called) { called = true; result = f (...args) }
    return result
  }
}

/**
 * Memoises a unary function using a Map keyed by the argument.
 * @example
 * // memoize :: (a -> b) -> a -> b
 * const fib = memoize (n => n <= 1 ? n : fib (n - 1) + fib (n - 2))
 * fib (10) // => 55
 */
export function memoize (f) {
  const cache = new Map ()
  return (x) => {
    if (cache.has (x)) return cache.get (x)
    const v = f (x)
    cache.set (x, v)
    return v
  }
}

// =============================================================================
// Predicate combinators
// =============================================================================

/**
 * Returns a predicate that is true only when both predicates hold (&&).
 * Equivalent to Haskell's (&&) lifted over predicates.
 * @example
 * // allPass :: (a -> Boolean) -> (a -> Boolean) -> a -> Boolean
 * allPass (x => x > 0) (x => x < 10) (5) // => true
 * allPass (x => x > 0) (x => x < 10) (0) // => false
 */
export function allPass (p) {
  return (q) => (x) => p (x) && q (x)
}

/**
 * Returns a predicate that is true when at least one predicate holds (||).
 * Equivalent to Haskell's (||) lifted over predicates.
 * @example
 * // anyPass :: (a -> Boolean) -> (a -> Boolean) -> a -> Boolean
 * anyPass (x => x < 0) (x => x > 10) (15) // => true
 * anyPass (x => x < 0) (x => x > 10) (5)  // => false
 */
export function anyPass (p) {
  return (q) => (x) => p (x) || q (x)
}

// =============================================================================
// Function composition and piping
// =============================================================================

/**
 * Threads a value left-to-right through an array of functions.
 * @example
 * // pipe :: Array (Any -> Any) -> a -> b
 * pipe ([x => x + 1, Math.sqrt]) (99) // => 10
 */
export function pipe (fns) {
  return (x) => {
    let v = x
    for (const f of fns) v = f (v)
    return v
  }
}

/**
 * Threads a value through a sequence of steps where each step is applied via
 * a custom "bind" combinator.  The canonical use-case is ADT pipelines:
 * pass the ADT's `chain` (or `map`) as the binder so each step can
 * short-circuit or transform the wrapped value without manual unwrapping.
 *
 * pipeWith (chain) (just (1)) ([x => just (x + 1), x => just (x * 2)])
 * is equivalent to:
 * chain (x => just (x * 2)) (chain (x => just (x + 1)) (just (1)))
 *
 * @example
 * // pipeWith :: (f (a->b) -> f a -> f b) -> f a -> Array (a -> f b) -> f b
 *
 * // Maybe pipeline — short-circuits on Nothing
 * import * as M from './maybe.js'
 * pipeWith (M.chain) (M.just (4)) ([
 *   x => x > 0  ? M.just (x)      : M.nothing (),
 *   x => x < 10 ? M.just (x * 2)  : M.nothing (),
 * ])
 * // => just(8)
 *
 * // map-only pipeline (no short-circuiting)
 * pipeWith (M.map) (M.just (3)) ([x => x + 1, x => x * 2])
 * // => just(8)
 */
export function pipeWith (bind) {
  return (value) => (fns) => {
    let v = value
    for (const f of fns) v = bind (f) (v)
    return v
  }
}

/**
 * Right-to-left composition of two functions.
 * For longer chains, prefer `pipe`.
 * @example
 * // compose :: (b -> c) -> (a -> b) -> a -> c
 * compose (x => x * 2) (x => x + 1) (3) // => 8
 */
export function compose (f) {
  return (g) => (x) => f (g (x))
}

/**
 * Applies a single value to each function in the array and collects results.
 * @example
 * // juxt :: Array (a -> b) -> a -> Array b
 * juxt ([x => x + 1, x => x * 2]) (3) // => [4, 6]
 */
export function juxt (fns) {
  return (x) => fns.map ((f) => f (x))
}

/**
 * Converge / fork — maps a value through two functions and combines the
 * results with a binary function.  Useful for point-free "split-merge" style.
 * @example
 * // converge :: (b -> c -> d) -> (a -> b) -> (a -> c) -> a -> d
 * converge (x => y => x + y) (x => x * 2) (x => x + 1) (3) // => 10
 */
export function converge (f) {
  return (g) => (h) => (x) => f (g (x)) (h (x))
}

// =============================================================================
// Arity / currying helpers
// =============================================================================

/**
 * Converts a curried binary function to one that accepts a 2-element array.
 * @example
 * // uncurry :: (a -> b -> c) -> [a, b] -> c
 * uncurry (a => b => a + b) ([1, 2]) // => 3
 */
export function uncurry (f) {
  return ([a, b]) => f (a) (b)
}

/**
 * Converts a function that accepts a 2-element array to a curried binary function.
 * @example
 * // curry :: ([a, b] -> c) -> a -> b -> c
 * curry (([a, b]) => a + b) (1) (2) // => 3
 */
export function curry (f) {
  return (a) => (b) => f ([a, b])
}

// =============================================================================
// Reader monad  (environment / dependency-injection)
//
// All names are prefixed with "reader" in JSDoc types to make it clear these
// operate on the type  (e -> a)  even though the exported names are short and
// match the Fantasy Land algebra names.
// =============================================================================

/**
 * Reader Functor — post-composes f over a reader.
 * `map (f) (g)` ≡ `compose (f) (g)`
 * @example
 * // map :: (a -> b) -> (e -> a) -> e -> b
 * map (x => x + 1) (x => x * 2) (3) // => 7
 */
export function map (f) {
  return (fa) => (x) => f (fa (x))
}

/**
 * Reader Applicative — S combinator.
 * `ap (ff) (fa) (x)` = `ff (x) (fa (x))`
 * @example
 * // ap :: (e -> a -> b) -> (e -> a) -> e -> b
 * ap (e => x => e + x) (e => e * 2) (3) // => 9
 */
export function ap (ff) {
  return (fa) => (x) => ff (x) (fa (x))
}

/**
 * Reader Applicative — lifts a constant value into the Reader context.
 * Identical to `always`.
 * @example
 * // of :: a -> e -> a
 * of (42) ('ignored') // => 42
 */
export function of (a) {
  return (_) => a
}

/**
 * Reader Monad bind — threads the environment through both readers.
 * @example
 * // chain :: (a -> e -> b) -> (e -> a) -> e -> b
 * chain (a => e => a + e) (e => e * 2) (3) // => 9
 */
export function chain (f) {
  return (fa) => (x) => f (fa (x)) (x)
}

/**
 * Contravariant map — pre-composes a function over a reader's input.
 * @example
 * // contramap :: (b -> a) -> (a -> c) -> b -> c
 * contramap (x => x + 1) (x => x * 2) (3) // => 8
 */
export function contramap (f) {
  return (fa) => (x) => fa (f (x))
}

/**
 * Profunctor map — contramaps the input and maps the output.
 * @example
 * // promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d
 * promap (x => x + 1) (x => x * 2) (x => x) (3) // => 8
 */
export function promap (f) {
  return (g) => (pbc) => (x) => g (pbc (f (x)))
}

/**
 * Reader Comonad extend — widens the environment by accumulating it with
 * a semigroup-like concat function.
 * @example
 * // extend :: (e -> e -> e) -> ((e -> a) -> b) -> (e -> a) -> e -> b
 * extend (x => y => x + y) (f => f (0)) (e => e * 2) (3) // => 6
 */
export function extend (concatEnv) {
  return (f) => (wa) => (x) =>
    f ((y) => wa (concatEnv (x) (y)))
}

/**
 * Left-to-right Kleisli composition over the Reader monad.
 * Each function in `fns` must have type  `a -> e -> b`.
 * @example
 * // pipeK :: Array (a -> e -> b) -> (e -> a) -> e -> b
 * pipeK ([f, g]) (mx) // chain (g) (chain (f) (mx))
 */
export function pipeK (fns) {
  return (mx) => {
    let v = mx
    for (const f of fns) v = chain (f) (v)
    return v
  }
}

/**
 * Stack-safe tail-recursive Reader bind (Fantasy Land ChainRec).
 * @example
 * // chainRec :: ((a -> Step, b -> Step, a) -> e -> Step) -> a -> e -> b
 * chainRec ((next, done, n) => _ => n <= 0 ? done (n) : next (n - 1)) (1000) (null)
 */
export function chainRec (f) {
  return (seed) => {
    const next  = (value) => ({ done: false, value })
    const done  = (value) => ({ done: true,  value })
    return (e) => {
      let step = next (seed)
      while (!step.done) step = f (next, done, step.value) (e)
      return step.value
    }
  }
}

// =============================================================================
// Error handling
// =============================================================================

/**
 * Wraps a function so that thrown errors are caught and routed to `onThrow`.
 * Both callbacks receive the same argument list `d` as the original function.
 * @example
 * // handleThrow :: ((...a) -> b) -> (b -> a -> r) -> (Error -> a -> r) -> ...a -> r
 * handleThrow (JSON.parse) (r => r) (_ => null) ('{}')  // => {}
 * handleThrow (JSON.parse) (r => r) (_ => null) ('bad') // => null
 */
export function handleThrow (f) {
  return (onResult) => (onThrow) => (...args) => {
    try {
      return onResult (f (...args)) (args)
    } catch (err) {
      return onThrow (err) (args)
    }
  }
}
