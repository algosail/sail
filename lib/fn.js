// fn.js
// Function combinators and the Reader monad.

// =============================================================================
// Core combinators
// =============================================================================

/**
 * Identity — returns its argument unchanged.
 * Most useful as a no-op placeholder in higher-order functions: pass `id` as
 * the "do-nothing" branch in `maybe` or `either` when you want to preserve the
 * wrapped value as-is. It is also the identity morphism in function composition,
 * satisfying `compose (id) (f) ≡ f ≡ compose (f) (id)`.
 * @example
 * // id :: a -> a
 * id ('hello')
 * // => 'hello'
 * id (null)
 * // => null
 */
export function id (x) {
  return x
}

/**
 * Returns a constant function that ignores its argument and always returns `a`.
 * Use it to replace any position in a pipeline with a fixed value — for example
 * `map (always (0))` zeroes out every element of a collection without writing
 * an explicit lambda. Equivalent to Haskell's `const` and the K combinator.
 * @example
 * // always :: a -> b -> a
 * always ('default') (undefined)
 * // => 'default'
 * [1, 2, 3].map (always (0))
 * // => [0, 0, 0]
 * always (true) ('anything')
 * // => true
 */
export function always (a) {
  return (_) => a
}

/**
 * Thrush / reverse-application — applies a value to a function rather than
 * a function to a value. This "value-first" orientation makes it natural for
 * threading a piece of data through a list of transforms via `reduce`:
 * `[f, g, h].reduce (thrush, value)` is a lightweight alternative to `pipe`.
 * It is the T combinator in combinatory logic.
 * @example
 * // thrush :: a -> (a -> b) -> b
 * thrush (5) (x => x * x)
 * // => 25
 * [x => x + 1, x => x * 3, x => x - 2].reduce (thrush, 4)
 * // => 13
 * thrush ('hello') (s => s.toUpperCase ())
 * // => 'HELLO'
 */
export function thrush (x) {
  return (f) => f (x)
}

/**
 * Runs a side-effecting function on a value and returns the value unchanged.
 * This lets you insert logging, debugging, or instrumentation anywhere inside a
 * `pipe` chain without interrupting or altering the data flow — the chain sees
 * the exact same value before and after the `tap` step.
 * @example
 * // tap :: (a -> *) -> a -> a
 * tap (x => console.log ('value:', x)) (42)
 * // => 42
 * pipe ([
 *   x => x * 2,
 *   tap (x => console.log ('after double:', x)),
 *   x => x + 1,
 * ]) (5)
 * // => 11
 */
export function tap (f) {
  return (a) => {
    f (a)
    return a
  }
}

/**
 * Flips the order of the first two arguments of a curried binary function.
 * This is invaluable when you want to partially apply the *second* argument
 * of a function: `flip (filter)` lets you fix the predicate first so the
 * resulting function takes the array — ideal for point-free composition.
 * It is the C combinator.
 * @example
 * // flip :: (a -> b -> c) -> b -> a -> c
 * flip (a => b => a - b) (10) (30)
 * // => 20
 * const startsWith = flip (prefix => s => s.startsWith (prefix))
 * startsWith ('http') ('https://example.com')
 * // => true
 */
export function flip (f) {
  return (b) => (a) => f (a) (b)
}

/**
 * S' combinator ("on both") — maps both arguments through the same unary
 * function before passing them to a binary function. The canonical use-case is
 * comparisons that need normalisation before being applied: for example,
 * `on (compare) (s => s.toLowerCase ())` compares two strings by their
 * lowercased forms without mutating the originals.
 * @example
 * // on :: (b -> b -> c) -> (a -> b) -> a -> a -> c
 * on (a => b => a - b) (s => s.length) ('hi') ('hello')
 * // => -3
 * on (a => b => a === b) (s => s.toLowerCase ()) ('Hello') ('hello')
 * // => true
 * on (a => b => a > b) (x => x % 10) (13) (27)
 * // => false
 */
export function on (f) {
  return (g) => (x) => (y) => f (g (x)) (g (y))
}

/**
 * Calls a function at most once; every subsequent call returns the cached
 * result of the very first invocation, regardless of the arguments supplied.
 * Ideal for lazy one-time initialisation: `const getConfig = once (loadConfig)`
 * ensures setup runs exactly once no matter how many callers invoke it.
 * Unlike `memoize`, `once` ignores all arguments after the first call.
 * @example
 * // once :: (a -> b) -> a -> b
 * const greet = once (name => `Hello, ${name}!`)
 * greet ('Alice')
 * // => 'Hello, Alice!'
 * greet ('Bob')
 * // => 'Hello, Alice!'
 * const initDB = once (() => ({ connected: true }))
 * initDB ()
 * // => { connected: true }
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
 * Memoises a unary pure function using a `Map` keyed by argument identity.
 * Repeated calls with the same argument skip recomputation entirely, which can
 * turn exponential recursive algorithms (like naïve Fibonacci) into linear ones.
 * Be aware that cache keys use reference equality, so two structurally identical
 * objects will produce two separate cache entries.
 * @example
 * // memoize :: (a -> b) -> a -> b
 * const fib = memoize (n => n <= 1 ? n : fib (n - 1) + fib (n - 2))
 * fib (10)
 * // => 55
 * const expensiveDouble = memoize (n => n * 2)
 * expensiveDouble (21)
 * // => 42
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
 * Combines two predicates with logical AND, returning a new predicate that is
 * true only when both hold. Chain multiple `allPass` calls to build composite
 * validation rules in a readable, point-free style — for instance checking that
 * a number is both positive and even. Short-circuits on the first failing
 * predicate via `&&`.
 * @example
 * // allPass :: (a -> Boolean) -> (a -> Boolean) -> a -> Boolean
 * const isPositiveEven = allPass (x => x > 0) (x => x % 2 === 0)
 * isPositiveEven (4)
 * // => true
 * isPositiveEven (-2)
 * // => false
 * allPass (s => s.length > 0) (s => s[0] === s[0].toUpperCase ()) ('Hello')
 * // => true
 */
export function allPass (p) {
  return (q) => (x) => p (x) && q (x)
}

/**
 * Combines two predicates with logical OR, returning a new predicate that is
 * true when at least one holds. Use it to express relaxed alternatives — for
 * instance accepting values that are either very small or very large. Short-
 * circuits on the first passing predicate via `||`.
 * @example
 * // anyPass :: (a -> Boolean) -> (a -> Boolean) -> a -> Boolean
 * const isExtremeTemp = anyPass (t => t < -20) (t => t > 40)
 * isExtremeTemp (45)
 * // => true
 * isExtremeTemp (20)
 * // => false
 * anyPass (s => s === 'admin') (s => s === 'superuser') ('admin')
 * // => true
 */
export function anyPass (p) {
  return (q) => (x) => p (x) || q (x)
}

// =============================================================================
// Function composition and piping
// =============================================================================

/**
 * Threads a value left-to-right through an ordered array of functions, where
 * each function's output becomes the next function's input. The left-to-right
 * order matches natural reading direction, making pipelines easier to follow
 * than right-to-left `compose`. Use `pipeWith` when steps may short-circuit
 * inside an ADT such as Maybe or Either.
 * @example
 * // pipe :: Array (Any -> Any) -> a -> b
 * pipe ([s => s.trim (), s => s.toUpperCase (), s => `[${s}]`]) ('  hello  ')
 * // => '[HELLO]'
 * pipe ([x => x * 2, x => x + 10, Math.sqrt]) (27)
 * // => 8
 * pipe ([]) (42)
 * // => 42
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
 * a custom "bind" combinator, lifting `pipe` into any monad or applicative.
 * Pass an ADT's `chain` as the binder to get automatic short-circuiting on
 * failure (Nothing / Left), or pass `map` for a pure lifting pipeline.
 * This is the go-to tool for ADT pipelines that would otherwise require manual
 * unwrapping between steps.
 *
 * @example
 * // pipeWith :: ((a -> f b) -> f a -> f b) -> Array (a -> f b) -> f a -> f b
 *
 * // Maybe pipeline — short-circuits when a step returns Nothing
 * import * as M from './maybe.js'
 * pipeWith (M.chain) ([
 *   x => x > 0   ? M.just (x)     : M.nothing (),
 *   x => x < 100 ? M.just (x * 2) : M.nothing (),
 * ]) (M.just (7))
 * // => just(14)
 *
 * // Either pipeline — carries the error through on Left
 * import * as E from './either.js'
 * pipeWith (E.chain) ([
 *   s => s.length > 0 ? E.right (s.trim ()) : E.left ('empty'),
 *   s => E.right (s.toUpperCase ()),
 * ]) (E.right ('  hello  '))
 * // => right('HELLO')
 */
export function pipeWith (bind) {
  return (fns) => (value) => {
    let v = value
    for (const f of fns) v = bind (f) (v)
    return v
  }
}

/**
 * Right-to-left composition of two unary functions — `f` is applied after `g`.
 * This mirrors the mathematical convention `(f ∘ g)(x) = f(g(x))` and can read
 * naturally when naming transforms as noun phrases. For three or more functions
 * prefer `pipe` with a reversed list to avoid reading the data flow backwards.
 * @example
 * // compose :: (b -> c) -> (a -> b) -> a -> c
 * compose (x => `$${x.toFixed (2)}`) (x => x * 1.1) (100)
 * // => '$110.00'
 * compose (xs => xs.join (', ')) (xs => xs.sort ()) (['banana', 'apple', 'cherry'])
 * // => 'apple, banana, cherry'
 */
export function compose (f) {
  return (g) => (x) => f (g (x))
}

/**
 * Applies a single value to each function in an array and collects the results.
 * Perfect for computing multiple aggregates or projections over the same input
 * in one pass — for instance deriving min, max, and sum of an array all at once
 * without iterating multiple times. The output array mirrors the order of `fns`.
 * @example
 * // juxt :: Array (a -> b) -> a -> Array b
 * juxt ([
 *   xs => Math.min (...xs),
 *   xs => Math.max (...xs),
 *   xs => xs.reduce ((a, b) => a + b, 0),
 * ]) ([3, 1, 4, 1, 5])
 * // => [1, 5, 14]
 * juxt ([s => s.length, s => s.toUpperCase (), s => s.split ('')]) ('hi')
 * // => [2, 'HI', ['h', 'i']]
 */
export function juxt (fns) {
  return (x) => fns.map ((f) => f (x))
}

/**
 * Converge / fork-merge — fans a value out to two independent functions and
 * merges their results with a binary function. This "split-apply-combine"
 * pattern lets you express calculations that share an input in point-free style.
 * The archetypal example is the average: `converge (div) (sum) (length)` passes
 * the array to both branches and divides the results.
 * @example
 * // converge :: (b -> c -> d) -> (a -> b) -> (a -> c) -> a -> d
 * const average = converge (a => b => a / b)
 *                           (xs => xs.reduce ((a, b) => a + b, 0))
 *                           (xs => xs.length)
 * average ([10, 20, 30])
 * // => 20
 * converge (a => b => `${a} (${b} chars)`)
 *           (s => s.toUpperCase ())
 *           (s => s.length)
 *           ('hello')
 * // => 'HELLO (5 chars)'
 */
export function converge (f) {
  return (g) => (h) => (x) => f (g (x)) (h (x))
}

// =============================================================================
// Arity / currying helpers
// =============================================================================

/**
 * Converts a curried binary function into one that accepts a 2-element tuple
 * `[a, b]`. This bridges curried FP-style functions with APIs that naturally
 * produce pairs — `Object.entries` yields `[key, value]` tuples that can be
 * directly processed with `uncurry`, removing the need for destructuring.
 * @example
 * // uncurry :: (a -> b -> c) -> [a, b] -> c
 * Object.entries ({ a: 1, b: 2 }).map (uncurry (k => v => `${k}=${v}`))
 * // => ['a=1', 'b=2']
 * uncurry (a => b => a + b) ([10, 32])
 * // => 42
 */
export function uncurry (f) {
  return ([a, b]) => f (a) (b)
}

/**
 * Converts a function that accepts a 2-element tuple into a curried binary
 * function, letting you partially apply one element of the pair at a time.
 * It is the inverse of `uncurry` and is useful for making pair-based functions
 * compatible with point-free pipelines and partial application.
 * @example
 * // curry :: ([a, b] -> c) -> a -> b -> c
 * curry (([prefix, s]) => prefix + s) ('Mr. ') ('Smith')
 * // => 'Mr. Smith'
 * curry (([a, b]) => Math.pow (a, b)) (2) (10)
 * // => 1024
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
 * Reader Functor — post-composes `f` over a reader, transforming its output
 * while keeping the environment type unchanged. Note: this is NOT array `map`;
 * it operates on functions of the shape `(env -> a)`. Use it for dependency
 * injection: `map (format) (getPort)` returns a new reader that reads the port
 * from the environment and then formats it, all without running any effects.
 * `map (f) (g)` is exactly `compose (f) (g)`.
 * @example
 * // map :: (a -> b) -> (e -> a) -> e -> b
 * const getPort    = env => env.port
 * const portString = map (n => `port: ${n}`) (getPort)
 * portString ({ port: 3000 })
 * // => 'port: 3000'
 * map (x => x * 2) (e => e.value) ({ value: 21 })
 * // => 42
 */
export function map (f) {
  return (fa) => (x) => f (fa (x))
}

/**
 * Reader Applicative — S combinator. Combines two readers that both depend on
 * the same environment: `ff` reads a function from the environment and `fa`
 * reads a value; they are then applied together. Use this when two separate
 * environment-dependent computations must be combined without running the
 * environment twice.
 * @example
 * // ap :: (e -> a -> b) -> (e -> a) -> e -> b
 * const getGreeting = env => name => `${env.salutation}, ${name}!`
 * const getName     = env => env.name
 * ap (getGreeting) (getName) ({ salutation: 'Hello', name: 'Alice' })
 * // => 'Hello, Alice!'
 * ap (e => x => e.base + x) (e => e.offset) ({ base: 100, offset: 42 })
 * // => 142
 */
export function ap (ff) {
  return (fa) => (x) => ff (x) (fa (x))
}

/**
 * Reader Applicative — lifts a constant value into the Reader context,
 * producing a reader that ignores the environment and always returns `a`.
 * Identical in behaviour to `always`. Useful as the starting point in
 * applicative-style reader composition.
 * @example
 * // of :: a -> e -> a
 * of (42) ({ anything: true })
 * // => 42
 * of ('hello') (null)
 * // => 'hello'
 */
export function of (a) {
  return (_) => a
}

/**
 * Reader Monad bind — threads the environment through both a reader and a
 * Kleisli function. `fa` reads a value from the environment; `f` receives that
 * value and returns a new reader, which is then run with the *same* environment.
 * This lets you sequence environment-dependent computations where later steps
 * may depend on earlier results while retaining access to the original context.
 * @example
 * // chain :: (a -> e -> b) -> (e -> a) -> e -> b
 * const getUser = env => env.user
 * const getRole = user => env => env.roles[user] ?? 'guest'
 * chain (getRole) (getUser) ({ user: 'alice', roles: { alice: 'admin' } })
 * // => 'admin'
 * chain (a => e => a + e.suffix) (e => e.prefix) ({ prefix: 'Hello', suffix: ' World' })
 * // => 'Hello World'
 */
export function chain (f) {
  return (fa) => (x) => f (fa (x)) (x)
}

/**
 * Contravariant map — pre-composes a function over a reader's *input*, adapting
 * it to accept a different environment type. While `map` transforms the output,
 * `contramap` transforms the input, letting you reuse a reader built for one
 * environment shape with a differently shaped environment by supplying an
 * adapter function.
 * @example
 * // contramap :: (b -> a) -> (a -> c) -> b -> c
 * const getPort       = ({ port }) => port
 * const portFromJSON  = contramap (s => JSON.parse (s)) (getPort)
 * portFromJSON ('{"port":8080}')
 * // => 8080
 * contramap (s => s.length) (n => n > 3) ('hello')
 * // => true
 */
export function contramap (f) {
  return (fa) => (x) => fa (f (x))
}

/**
 * Profunctor map — applies `f` to the input (contramapping) and `g` to the
 * output (mapping) of a reader in one step. Use it to adapt a function at
 * both ends simultaneously: normalise an incoming value before processing and
 * format the result on the way out, without touching the core logic.
 * @example
 * // promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d
 * const process = promap
 *   (s => s.trim ())
 *   (s => s.toUpperCase ())
 *   (s => s.replace (/ /g, '_'))
 * process ('  hello world  ')
 * // => 'HELLO_WORLD'
 * promap (x => x + 1) (x => x * 2) (x => x) (4)
 * // => 10
 */
export function promap (f) {
  return (g) => (pbc) => (x) => g (pbc (f (x)))
}

/**
 * Reader Comonad extend — widens the environment by accumulating it with
 * a semigroup-like concat function.
 * @example
 * // extend :: (e -> e -> e) -> ((e -> a) -> b) -> (e -> a) -> e -> b
 * extend (x => y => x + y) (f => f (0)) (e => e * 2) (3)
 * // => 6
 */
export function extend (concatEnv) {
  return (f) => (wa) => (x) =>
    f ((y) => wa (concatEnv (x) (y)))
}

/**
 * Left-to-right Kleisli composition over the Reader monad. Each function in
 * `fns` has type `a -> (e -> b)`, and steps are chained so the environment is
 * threaded through automatically. Use this to build multi-step dependency-
 * injected pipelines where each step can read from the shared environment and
 * produce a value consumed by the next step.
 * @example
 * // pipeK :: Array (a -> e -> b) -> (e -> a) -> e -> b
 * const double  = n => _env => n * 2
 * const addBase = n => env  => n + env.base
 * pipeK ([double, addBase]) (env => env.start) ({ start: 5, base: 100 })
 * // => 110
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
 * Wraps a potentially-throwing function so errors are caught and routed to an
 * explicit `onThrow` handler instead of propagating up the call stack. Both
 * `onResult` and `onThrow` receive the original argument list as their second
 * parameter for context-aware handling. This is the functional equivalent of
 * a try/catch block and pairs naturally with Either: use `right` as `onResult`
 * and `left` as `onThrow`.
 * @example
 * // handleThrow :: ((...a) -> b) -> (b -> a -> r) -> (Error -> a -> r) -> ...a -> r
 * const safeParseJSON = handleThrow (JSON.parse) (r => _args => r) (_err => _args => null)
 * safeParseJSON ('{"ok":true}')
 * // => { ok: true }
 * safeParseJSON ('not json')
 * // => null
 * import * as E from './either.js'
 * const safeDiv = handleThrow
 *   (([a, b]) => { if (b === 0) throw new Error ('div by zero'); return a / b })
 *   (r => _args => E.right (r))
 *   (e => _args => E.left (e.message))
 * safeDiv ([10, 2])
 * // => right(5)
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
