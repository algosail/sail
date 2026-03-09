// fn.js – Function combinators and the Reader monad.

/**
 * Threads a value through a left-to-right sequence of functions.
 * @example
 * // pipe :: Foldable f => f (Any -> Any) -> a -> b
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
 * Left-to-right Kleisli composition over a flatmappable monad.
 * @example
 * // pipeK :: (Foldable f, Flatmap m) => f (Any -> m Any) -> m a -> m b
 * pipeK ([f, g]) (mx) // flatmap (g) (flatmap (f) (mx))
 */
export function pipeK (fns) {
  return (mx) => {
    let v = mx
    for (const f of fns) v = flatmap (f) (v)
    return v
  }
}

/**
 * Thrush combinator – applies an argument to a function.
 * @example 
 * // T :: a -> (a -> b) -> b
 * T (42) (x => x + 1) // => 43
 */
export function T (x) {
  return (f) => f (x)
}

/**
 * P combinator – applies a binary function after mapping both args.
 * @example 
 * // on :: (b -> b -> c) -> (a -> b) -> a -> a -> c
 * on ((a) => (b) => a.concat (b)) (x => x.reverse ()) ([1,2]) ([3,4]) // => [2,1,3,4]
 */
export function on (f) {
  return (g) => (x) => (y) => f (g (x)) (g (y))
}

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
 * Right-to-left function composition.
 * @example 
 * // compose :: (b -> c) -> (a -> b) -> a -> c
 * compose (x => x * 2) (x => x + 1) (3) // => 8
 */
export function compose (f) {
  return (g) => (x) => f (g (x))
}

/**
 * Flips the order of the first two arguments.
 * @example 
 * // flip :: (a -> b -> c) -> b -> a -> c
 * flip (a => b => a - b) (1) (3) // => 2
 */
export function flip (f) {
  return (b) => (a) => f (a) (b)
}

/**
 * Reader functor – post-composes a function.
 * @example 
 * // map :: (a -> b) -> (e -> a) -> e -> b
 * map (x => x + 1) (x => x * 2) (3) // => 7
 */
export function map (f) {
  return (fa) => (x) => f (fa (x))
}

/**
 * S combinator – ap(ff)(fa)(x) = ff(x)(fa(x)).
 * @example 
 * // ap :: (e -> a -> b) -> (e -> a) -> e -> b
 * ap (e => x => e + x) (e => e * 2) (3) // => 9
 */
export function ap (ff) {
  return (fa) => (x) => ff (x) (fa (x))
}

/**
 * Lifts a value into the Reader context (constant function).
 * @example 
 * // of :: a -> e -> a
 * of (42) ('ignored') // => 42
 */
export function of (a) {
  return (_) => a
}

/**
 * Reader monad bind.
 * @example 
 * // flatmap :: (a -> e -> b) -> (e -> a) -> e -> b
 * flatmap (a => e => a + e) (e => e * 2) (3) // => 9
 */
export function flatmap (f) {
  return (fa) => (x) => f (fa (x)) (x)
}

/**
 * Pre-composes a function (contravariant map).
 * @example 
 * // contramap :: (b -> a) -> (a -> c) -> b -> c
 * contramap (x => x + 1) (x => x * 2) (3) // => 8
 */
export function contramap (f) {
  return (fa) => (x) => fa (f (x))
}

/**
 * promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d
 * Maps both the input and output of a function.
 * @example 
 * // promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d
 * promap (x => x + 1) (x => x * 2) (x => x) (3) // => 8
 */
export function promap (f) {
  return (g) => (pbc) => (x) => g (pbc (f (x)))
}

/**
 * Comonad extend for the Reader context.
 * @example 
 * // extend :: (concat -> (e -> a) -> b) -> (e -> a) -> e -> b
 * extend (concatFn) (f) (wa) (x)
 */
export function extend (concatFn) {
  return (f) => (wa) => (x) =>
    f ((y) => wa (concatFn (x, y)))
}

/**
 * Stack-safe tail-recursive Reader bind.
 * @example 
 * // chainRec :: ((a -> Step, b -> Step, a) -> e -> Step) -> a -> e -> b
 * chainRec ((next, done, n) => _ => n <= 0 ? done (n) : next (n - 1)) (1000) (null)
 */
export function chainRec (f) {
  return (init) => {
    const next = (value) => ({ done: false, value })
    const done = (value) => ({ done: true, value })
    return (a) => {
      let step = next (init)
      while (!step.done) step = f (next, done, step.value) (a)
      return step.value
    }
  }
}

/**
 * Wraps a function so that thrown errors are caught and routed to onThrow.
 * @example 
 * // handleThrow :: ((...d) -> a) -> (a, d -> r) -> (Error, d -> r) -> (...d) -> r
 * handleThrow (JSON.parse) (r => r) (e => null) ('{}')
 */
export function handleThrow (ua, onResult, onThrow) {
  return (...d) => {
    try {
      return onResult (ua (...d), d)
    } catch (err) {
      return onThrow (err, d)
    }
  }
}
