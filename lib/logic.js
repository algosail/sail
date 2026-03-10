// logic.js – Predicate and control-flow utilities.

import * as M from './maybe.js'
import * as E from './either.js'

/**
 * Returns a predicate that negates the original.
 * @example
 * // complement :: (a -> Boolean) -> a -> Boolean
 * complement (x => x > 0) (-1) // => true
 */
export function complement (pred) {
  return (x) => !pred (x)
}

/**
 * Case analysis on a boolean — returns the false branch or the true branch.
 * @example
 * // bool :: a -> a -> Boolean -> a
 * bool ('no') ('yes') (true)  // => 'yes'
 * bool ('no') ('yes') (false) // => 'no'
 */
export function bool (false_) {
  return (true_) => (b) => (b ? true_ : false_)
}

/**
 * Applies f if predicate holds, g otherwise.
 * @example
 * // ifElse :: (a -> Boolean) -> (a -> b) -> (a -> b) -> a -> b
 * ifElse (x => x > 0) (x => x) (x => -x) (-3) // => 3
 */
export function ifElse (pred) {
  return (f) => (g) => (x) => (pred (x) ? f (x) : g (x))
}

/**
 * Applies f only when predicate holds, otherwise returns x unchanged.
 * @example
 * // when :: (a -> Boolean) -> (a -> a) -> a -> a
 * when (x => x < 0) (() => 0) (-1) // => 0
 */
export function when (pred) {
  return (f) => (x) => (pred (x) ? f (x) : x)
}

/**
 * Applies f only when predicate does NOT hold, otherwise returns x unchanged.
 * @example
 * // unless :: (a -> Boolean) -> (a -> a) -> a -> a
 * unless (x => x > 0) (x => -x) (-3) // => 3
 */
export function unless (pred) {
  return (f) => (x) => (pred (x) ? x : f (x))
}

/**
 * Tries each [pred, fn] pair in order; returns Just(fn(a)) for the first
 * matching predicate, or Nothing if none match.
 * @example
 * // cond :: Array [(a -> Boolean), (a -> b)] -> a -> Maybe b
 * cond ([[x => x < 0, x => -x], [x => x > 0, x => x]]) (3) // => just(3)
 * cond ([[x => x < 0, x => -x]]) (3)                        // => nothing()
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
 * Like `cond`, but returns Right(fn(a)) on match and Left(a) when no branch
 * matches — preserving the original value for further error handling rather
 * than discarding it.
 * @example
 * // condE :: Array [(a -> Boolean), (a -> b)] -> a -> Either a b
 * condE ([[x => x < 0, x => -x], [x => x > 0, x => x]]) (3)  // => right(3)
 * condE ([[x => x < 0, x => -x]])                         (3)  // => left(3)
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
 * Like `cond`, but takes an explicit default function instead of returning
 * Maybe — eliminates the need to unwrap Just/Nothing at every call site.
 * @example
 * // condDefault :: (a -> b) -> Array [(a -> Boolean), (a -> b)] -> a -> b
 * condDefault (x => `unhandled: ${x}`) ([
 *   [x => x < 0, () => 'negative'],
 *   [x => x > 0, () => 'positive'],
 * ]) (0)  // => 'unhandled: 0'
 * condDefault (x => `unhandled: ${x}`) ([
 *   [x => x < 0, () => 'negative'],
 *   [x => x > 0, () => 'positive'],
 * ]) (5)  // => 'positive'
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
 * Pattern-matching variant of `cond` — each "predicate" is a function
 * `a -> Maybe b` that simultaneously tests and extracts data.  The first
 * branch returning Just wins; its inner value is passed to the handler.
 * This is strictly more powerful than `cond`: use it when the predicate
 * needs to capture a sub-value (like a regex match or a type-narrowing
 * accessor) that the handler then consumes.
 * @example
 * // match :: Array [(a -> Maybe b), (b -> c)] -> a -> Maybe c
 * match ([
 *   [x => x > 0  ? M.just (x)  : M.nothing (), x => `pos: ${x}`],
 *   [x => x < 0  ? M.just (-x) : M.nothing (), x => `neg abs: ${x}`],
 * ]) (-5)  // => just('neg abs: 5')
 * match ([
 *   [x => x > 0  ? M.just (x)  : M.nothing (), x => `pos: ${x}`],
 * ]) (0)   // => nothing()
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
 * Runs every branch whose predicate matches and collects all results —
 * unlike `cond`, which stops at the first match.  Returns an empty array
 * when no predicate holds.
 * @example
 * // condAll :: Array [(a -> Boolean), (a -> b)] -> a -> Array b
 * condAll ([
 *   [x => x > 0,      () => 'positive'],
 *   [x => x % 2 === 0, () => 'even'],
 *   [x => x > 100,    () => 'large'],
 * ]) (4)   // => ['positive', 'even']
 * condAll ([
 *   [x => x > 0,      () => 'positive'],
 * ]) (-1)  // => []
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
 * Threads a value through a sequence of guard steps, short-circuiting on the
 * first Nothing.  Each step is either:
 *   - a predicate  `a -> Boolean`  — Nothing when it returns false, Just(a) otherwise
 *   - a transformer `a -> Maybe b` — its result is passed straight through
 *
 * The two forms are distinguished automatically: if the step returns a boolean
 * it is treated as a predicate; if it returns a Maybe (has a `.tag`) it is
 * treated as a transformer.
 *
 * @example
 * // guardWith :: Array (a -> Boolean | a -> Maybe b) -> a -> Maybe a
 * guardWith ([
 *   x => x > 0,              // predicate: filter non-positives
 *   x => x < 100,            // predicate: filter >= 100
 * ]) (42)   // => just(42)
 *
 * guardWith ([
 *   x => x > 0,
 *   x => x < 100,
 * ]) (-1)   // => nothing()
 *
 * guardWith ([
 *   x => x > 0,
 *   x => M.just (x * 2),     // transformer: doubles the value
 *   x => x < 100,
 * ]) (42)   // => just(84)
 *
 * guardWith ([
 *   x => x > 0,
 *   x => M.just (x * 2),
 *   x => x < 100,
 * ]) (60)   // => nothing()  (60 * 2 = 120, fails x < 100)
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
