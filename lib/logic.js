// logic.js
// Predicate and control-flow utilities.

import * as M from './maybe.js'
import * as E from './either.js'

/**
 * Returns a new predicate that is the logical NOT of the original — the
 * Boolean complement lifted over a function. Useful for inverting filters and
 * guards without writing explicit `x => !f(x)` wrappers everywhere. Pairs
 * naturally with `filter`, `when`, and `unless` in point-free pipelines.
 * @example
 * // complement :: (a -> Boolean) -> a -> Boolean
 * complement (x => x > 0) (-1)
 * // => true
 * complement (x => x > 0) (5)
 * // => false
 * const isEven = x => x % 2 === 0
 * filter (complement (isEven)) ([1, 2, 3, 4])
 * // => [1, 3]
 */
export function complement (pred) {
  return (x) => !pred (x)
}

/**
 * Encodes if-then-else as a curried function value rather than a statement,
 * making branching logic composable as a first-class pipeline step. The first
 * argument is the false branch and the second is the true branch. Useful with
 * `map` and `condDefault` to eliminate inline ternary clutter.
 * @example
 * // bool :: a -> a -> Boolean -> a
 * bool ('no') ('yes') (true)
 * // => 'yes'
 * bool ('no') ('yes') (false)
 * // => 'no'
 * map (bool ('inactive') ('active')) ([true, false, true])
 * // => ['active', 'inactive', 'active']
 */
export function bool (false_) {
  return (true_) => (b) => (b ? true_ : false_)
}

/**
 * Routes a value through one of two functions depending on a predicate,
 * making branching logic explicit and composable as a pipeline step. Both
 * branches are pure functions, so the conditional introduces no side effects.
 * A classic use-case is absolute value: identity for the positive branch and
 * negation for the negative.
 * @example
 * // ifElse :: (a -> Boolean) -> (a -> b) -> (a -> b) -> a -> b
 * ifElse (x => x >= 0) (x => x) (x => -x) (-7)
 * // => 7
 * ifElse (x => x >= 0) (x => x) (x => -x) (4)
 * // => 4
 * ifElse (s => s.length > 20) (s => s.slice (0, 20) + '…') (s => s) ('Short string')
 * // => 'Short string'
 */
export function ifElse (pred) {
  return (f) => (g) => (x) => (pred (x) ? f (x) : g (x))
}

/**
 * A specialised `ifElse` where the false branch is the identity function,
 * meaning the value passes through unchanged when the predicate does not hold.
 * Ideal for conditional transformations inside pipelines where skipping the
 * step silently is the desired behaviour — for example, clamping, sanitising,
 * or truncating a value only when necessary.
 * @example
 * // when :: (a -> Boolean) -> (a -> a) -> a -> a
 * when (x => x < 0) (() => 0) (-5)
 * // => 0
 * when (x => x < 0) (() => 0) (3)
 * // => 3
 * when (s => s.length > 20) (s => s.slice (0, 20)) ('A very long username!!!')
 * // => 'A very long username'
 */
export function when (pred) {
  return (f) => (x) => (pred (x) ? f (x) : x)
}

/**
 * The dual of `when` — applies f only when the predicate does NOT hold,
 * leaving the value untouched when it does. Reads naturally as "unless the
 * value satisfies the condition, transform it." Use it to enforce
 * postconditions or handle the error case where the "happy path" is identity.
 * @example
 * // unless :: (a -> Boolean) -> (a -> a) -> a -> a
 * unless (x => x > 0) (x => -x) (-3)
 * // => 3
 * unless (x => x > 0) (x => -x) (5)
 * // => 5
 * unless (s => s.length >= 8) (s => s.padEnd (8, '_')) ('hello')
 * // => 'hello___'
 */
export function unless (pred) {
  return (f) => (x) => (pred (x) ? x : f (x))
}

/**
 * Multi-branch dispatch — tests each [predicate, handler] pair in order and
 * returns `just(handler(a))` for the first match, or `nothing()` if none
 * match. Think of it as a composable switch statement that works inside
 * pipelines: the Maybe return type makes the "no match" case explicit and
 * forces callers to handle it rather than silently receiving undefined.
 * @example
 * // cond :: Array [(a -> Boolean), (a -> b)] -> a -> Maybe b
 * cond ([
 *   [x => x < 0,  () => 'negative'],
 *   [x => x === 0, () => 'zero'],
 *   [x => x > 0,  () => 'positive'],
 * ]) (-3)
 * // => just('negative')
 * cond ([
 *   [x => x < 0,  () => 'negative'],
 *   [x => x === 0, () => 'zero'],
 *   [x => x > 0,  () => 'positive'],
 * ]) (0)
 * // => just('zero')
 * cond ([
 *   [x => x < 0, () => 'negative'],
 * ]) (5)
 * // => nothing()
 */
export function cond (cases) {
  return (a) => {
    for (const [pred, fn] of cases) {
      if (pred (a)) return M.just (fn (a))
    }
    return M.nothing ()
  }
}

/**
 * Like `cond` but uses Either instead of Maybe for the no-match case,
 * wrapping the original value in `left` when no predicate matches. This
 * preserves the input for downstream error handling or logging rather than
 * discarding it as `nothing()` would. Prefer `condE` over `cond` when the
 * unmatched value carries useful diagnostic information.
 * @example
 * // condE :: Array [(a -> Boolean), (a -> b)] -> a -> Either a b
 * condE ([
 *   [x => x < 0,  () => 'negative'],
 *   [x => x === 0, () => 'zero'],
 *   [x => x > 0,  () => 'positive'],
 * ]) (42)
 * // => right('positive')
 * condE ([
 *   [x => x < 0, () => 'negative'],
 *   [x => x > 0, () => 'positive'],
 * ]) (0)
 * // => left(0)
 */
export function condE (cases) {
  return (a) => {
    for (const [pred, fn] of cases) {
      if (pred (a)) return E.right (fn (a))
    }
    return E.left (a)
  }
}

/**
 * Like `cond` but guarantees a result by accepting an explicit fallback
 * function for the no-match case, avoiding the need to unwrap Maybe at every
 * call site. Use it when every possible input must produce an output — such
 * as mapping HTTP status codes to messages or enum values to labels.
 * @example
 * // condDefault :: (a -> b) -> Array [(a -> Boolean), (a -> b)] -> a -> b
 * condDefault (() => 'Unknown') ([
 *   [x => x === 200, () => 'OK'],
 *   [x => x === 404, () => 'Not Found'],
 *   [x => x === 500, () => 'Server Error'],
 * ]) (404)
 * // => 'Not Found'
 * condDefault (() => 'Unknown') ([
 *   [x => x === 200, () => 'OK'],
 *   [x => x === 404, () => 'Not Found'],
 * ]) (301)
 * // => 'Unknown'
 */
export function condDefault (onNoMatch) {
  return (cases) => (a) => {
    for (const [pred, fn] of cases) {
      if (pred (a)) return fn (a)
    }
    return onNoMatch (a)
  }
}

/**
 * A pattern-matching variant of `cond` where each arm's "predicate" is a
 * function that simultaneously tests and extracts — returning `just(value)` to
 * match or `nothing()` to skip. This is strictly more expressive than `cond`
 * because the extracted inner value, not the original input, is forwarded to
 * the handler, enabling safe type narrowing and sub-value capture in a single
 * step. Returns `nothing()` when no arm matches.
 * @example
 * // match :: Array [(a -> Maybe b), (b -> c)] -> a -> Maybe c
 * const parsePos = x => x > 0 ? M.just (x)  : M.nothing ()
 * const parseNeg = x => x < 0 ? M.just (-x) : M.nothing ()
 * match ([
 *   [parsePos, x => `positive: ${x}`],
 *   [parseNeg, x => `negative abs: ${x}`],
 * ]) (5)
 * // => just('positive: 5')
 * match ([
 *   [parsePos, x => `positive: ${x}`],
 *   [parseNeg, x => `negative abs: ${x}`],
 * ]) (-3)
 * // => just('negative abs: 3')
 * match ([
 *   [parsePos, x => `positive: ${x}`],
 * ]) (0)
 * // => nothing()
 */
export function match (cases) {
  return (a) => {
    for (const [extract, fn] of cases) {
      const m = extract (a)
      if (M.isJust (m)) return M.just (fn (m.value))
    }
    return M.nothing ()
  }
}

/**
 * Runs every branch whose predicate matches and collects all results into an
 * array — unlike `cond`, which stops at the first match. Use it when a single
 * value can satisfy multiple independent rules simultaneously and all outcomes
 * are needed, such as tagging a number with all applicable labels or firing
 * multiple event handlers.
 * @example
 * // condAll :: Array [(a -> Boolean), (a -> b)] -> a -> Array b
 * condAll ([
 *   [x => x > 0,       () => 'positive'],
 *   [x => x % 2 === 0, () => 'even'],
 *   [x => x > 100,     () => 'large'],
 * ]) (4)
 * // => ['positive', 'even']
 * condAll ([
 *   [x => x > 0,       () => 'positive'],
 *   [x => x % 2 === 0, () => 'even'],
 * ]) (7)
 * // => ['positive']
 * condAll ([
 *   [x => x > 0, () => 'positive'],
 * ]) (-1)
 * // => []
 */
export function condAll (cases) {
  return (a) => {
    const results = []
    for (const [pred, fn] of cases) {
      if (pred (a)) results.push (fn (a))
    }
    return results
  }
}

/**
 * Threads a value through a pipeline of guard steps, short-circuiting with
 * `nothing()` on the first failure. Each step is auto-detected as either a
 * predicate (`a -> Boolean`, fails when false) or an optional transformer
 * (`a -> Maybe b`, passes the inner value forward or short-circuits on
 * `nothing()`). The dual-mode design lets you freely mix filtering and
 * narrowing/mapping steps in one declarative pipeline without manual Maybe
 * wrapping at every stage.
 * @example
 * // guardWith :: Array (a -> Boolean | a -> Maybe b) -> a -> Maybe b
 * guardWith ([
 *   x => x > 0,
 *   x => x < 100,
 * ]) (42)
 * // => just(42)
 * guardWith ([
 *   x => x > 0,
 *   x => x < 100,
 * ]) (150)
 * // => nothing()
 * guardWith ([
 *   x => x > 0,
 *   x => M.just (x * 2),
 *   x => x < 100,
 * ]) (42)
 * // => just(84)
 */
export function guardWith (steps) {
  return (a) => {
    let current = a
    for (const step of steps) {
      const result = step (current)
      if (typeof result === 'boolean') {
        if (!result) return M.nothing ()
      } else {
        if (M.isNothing (result)) return M.nothing ()
        current = result.value
      }
    }
    return M.just (current)
  }
}
