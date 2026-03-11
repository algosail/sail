// these.js
// The These type (This a | That b | Both a b).
//
// These fills the gap between Maybe (one thing or nothing) and Either (one
// thing or another).  These can hold *both* values simultaneously, making it
// the right tool for:
//   - Partial successes with warnings  (Both warnings result)
//   - Non-destructive merging of two structures
//   - Annotated computations
//
// These a b = This a | That b | Both a b
//
// Semigroup / Monoid laws hold when both a and b are Semigroups.
// The Functor / Apply instances operate on the b side (like Either).
// The a side must be a Semigroup for ap / chain to accumulate it.

import { just, nothing } from './maybe.js'
import { left, right }   from './either.js'

// =============================================================================
// Constructors
// =============================================================================

/**
 * Constructs a `This` — the left-only variant of `These a b`, holding only the `a` value.
 * The trailing underscore avoids collision with JavaScript's reserved `this` keyword.
 * Use this constructor when you have a warning or legacy value but no corresponding right
 * value yet — for example, during a data migration where only the old-format record exists.
 * @example
 * // this_ :: a -> These a b
 * this_ ('legacy-only')
 * // => { tag: 'this', this: 'legacy-only' }
 * this_ (['missing email'])
 * // => { tag: 'this', this: ['missing email'] }
 */
export function this_ (a) {
  return { tag: 'this', this: a }
}

/**
 * Constructs a `That` — the right-only variant of `These a b`, holding only the `b` value.
 * This mirrors `Right` in `Either` and represents a clean result with no annotation.
 * Unlike `Either`, switching to `Both` later does not require changing the constructor —
 * you can accumulate a left value via `concat` without discarding the right.
 * @example
 * // that :: b -> These a b
 * that (42)
 * // => { tag: 'that', that: 42 }
 * that ({ id: 7, name: 'Alice' })
 * // => { tag: 'that', that: { id: 7, name: 'Alice' } }
 */
export function that (b) {
  return { tag: 'that', that: b }
}

/**
 * Constructs a `Both` — the case unique to `These`, holding a left `a` and a right `b` simultaneously.
 * This is what separates `These` from `Either`: a computation can succeed while still carrying
 * a warning, annotation, or legacy value alongside the result. Use `Both` when a result is valid
 * but comes with a note attached — for example, a migrated record that retains the original
 * version for audit purposes.
 * @example
 * // both :: a -> b -> These a b
 * both ('deprecated-field-present') ({ id: 7, name: 'Alice' })
 * // => { tag: 'both', this: 'deprecated-field-present', that: { id: 7, name: 'Alice' } }
 * both (['low confidence']) (0.74)
 * // => { tag: 'both', this: ['low confidence'], that: 0.74 }
 */
export function both (a) {
  return (b) => ({ tag: 'both', this: a, that: b })
}

// =============================================================================
// Guards
// =============================================================================

/**
 * Returns `true` when the `These` value is a `This` — carrying only a left `a`, with no right value.
 * Use as a guard before extracting `a`, or to skip downstream processing when no result is present.
 * Complements `isThat` and `isBoth` for exhaustive case analysis without the full `these` eliminator.
 * @example
 * // isThis :: These a b -> Boolean
 * isThis (this_ ('warn'))
 * // => true
 * isThis (both ('warn') (1))
 * // => false
 * isThis (that (1))
 * // => false
 */
export function isThis (a) {
  return Boolean (a?.tag === 'this')
}

/**
 * Returns `true` when the `These` value is a `That` — carrying only a right `b`, with no annotation.
 * Use this guard to confirm a clean, annotation-free result before passing it to code that
 * expects no left-side value, or to count "pure success" cases in a batch.
 * @example
 * // isThat :: These a b -> Boolean
 * isThat (that (42))
 * // => true
 * isThat (both ('warn') (42))
 * // => false
 * isThat (this_ ('warn'))
 * // => false
 */
export function isThat (a) {
  return Boolean (a?.tag === 'that')
}

/**
 * Returns `true` when the `These` value is a `Both` — carrying a left `a` and a right `b` at once.
 * This is the case that makes `These` more expressive than `Either`: a successful result that
 * also carries an annotation. Use this guard to identify values that need special handling
 * for their warning or metadata component.
 * @example
 * // isBoth :: These a b -> Boolean
 * isBoth (both ('warn') (42))
 * // => true
 * isBoth (that (42))
 * // => false
 * isBoth (this_ ('warn'))
 * // => false
 */
export function isBoth (a) {
  return Boolean (a?.tag === 'both')
}

/**
 * Returns `true` when the value is any variant of `These` — `This`, `That`, or `Both`.
 * Use as a runtime membership check before calling `These`-specific operations in contexts
 * where the type cannot be statically verified, such as API boundary validation or
 * deserialisation of external data.
 * @example
 * // isThese :: a -> Boolean
 * isThese (that (1))
 * // => true
 * isThese (this_ ('w'))
 * // => true
 * isThese (42)
 * // => false
 */
export function isThese (a) {
  return isThis (a) || isThat (a) || isBoth (a)
}

/**
 * Returns `true` when the `These` carries a left `a` value — either `This` or `Both`.
 * Use this when you need to know whether a warning or annotation is present without caring
 * whether a right result also exists. This lets you log or inspect the annotation separately
 * from the main pipeline.
 * @example
 * // hasThis :: These a b -> Boolean
 * hasThis (this_ ('warn'))
 * // => true
 * hasThis (both ('warn') (1))
 * // => true
 * hasThis (that (1))
 * // => false
 */
export function hasThis (t) {
  return isThis (t) || isBoth (t)
}

/**
 * Returns `true` when the `These` carries a right `b` value — either `That` or `Both`.
 * Use this to check whether a usable result is present before extracting it, analogous to
 * `isJust` for `Maybe`. Pipelines that only care about results can guard with `hasThat`
 * and fall through gracefully when only an annotation is present.
 * @example
 * // hasThat :: These a b -> Boolean
 * hasThat (that (1))
 * // => true
 * hasThat (both ('warn') (1))
 * // => true
 * hasThat (this_ ('warn'))
 * // => false
 */
export function hasThat (t) {
  return isThat (t) || isBoth (t)
}

// =============================================================================
// Destructor
// =============================================================================

/**
 * The canonical eliminator for `These` — performs full case analysis, dispatching to one
 * of three handlers based on which constructor is present. All three cases must be handled,
 * so no variant is silently ignored. Use it to fold a `These` into any output type, such as
 * converting it to a plain object for an API response or a human-readable log entry.
 * @example
 * // these :: (a -> c) -> (b -> c) -> (a -> b -> c) -> These a b -> c
 * these (a => `warn:${a}`) (b => b * 2) (a => b => `${a}|${b}`) (this_ ('oops'))
 * // => 'warn:oops'
 * these (a => `warn:${a}`) (b => b * 2) (a => b => `${a}|${b}`) (that (21))
 * // => 42
 * these (a => `warn:${a}`) (b => b * 2) (a => b => `${a}|${b}`) (both ('w') (21))
 * // => 'w|21'
 */
export function these (onThis) {
  return (onThat) => (onBoth) => (t) => {
    if (isThis (t)) return onThis (t.this)
    if (isThat (t)) return onThat (t.that)
    return onBoth (t.this) (t.that)
  }
}

// =============================================================================
// Accessors
// =============================================================================

/**
 * Extracts the left `a` value wrapped in `Just` when present (`This` or `Both`),
 * and returns `Nothing` for `That`. This lifts the partial extraction into `Maybe`,
 * letting downstream code stay in a safe `Maybe` pipeline without explicit branching
 * on the `These` constructors.
 * @example
 * // getThis :: These a b -> Maybe a
 * getThis (this_ ('warn'))
 * // => just('warn')
 * getThis (both ('warn') (1))
 * // => just('warn')
 * getThis (that (1))
 * // => nothing()
 */
export function getThis (t) {
  if (isThis (t)) return just (t.this)
  if (isBoth (t)) return just (t.this)
  return nothing ()
}

/**
 * Extracts the right `b` value wrapped in `Just` when present (`That` or `Both`),
 * and returns `Nothing` for `This`. Use this to pluck the computation result out of
 * a `These` and continue in a `Maybe` pipeline — any left annotation is discarded
 * in the process.
 * @example
 * // getThat :: These a b -> Maybe b
 * getThat (that (42))
 * // => just(42)
 * getThat (both ('warn') (42))
 * // => just(42)
 * getThat (this_ ('warn'))
 * // => nothing()
 */
export function getThat (t) {
  if (isThat (t)) return just (t.that)
  if (isBoth (t)) return just (t.that)
  return nothing ()
}

/**
 * Extracts the left `a` value, falling back to `def` when none is present (pure `That`).
 * A safe alternative to direct property access when a sensible default is available,
 * removing the need for explicit `isThis` / `isBoth` branching in the calling code.
 * @example
 * // fromThis :: a -> These a b -> a
 * fromThis ('none') (this_ ('warn'))
 * // => 'warn'
 * fromThis ('none') (both ('warn') (1))
 * // => 'warn'
 * fromThis ('none') (that (1))
 * // => 'none'
 */
export function fromThis (def) {
  return (t) => hasThis (t) ? t.this : def
}

/**
 * Extracts the right `b` value, falling back to `def` when none is present (pure `This`).
 * Use this when downstream code requires an unwrapped value and a sensible default exists,
 * avoiding the need for a full `these` case analysis.
 * @example
 * // fromThat :: b -> These a b -> b
 * fromThat (0) (that (99))
 * // => 99
 * fromThat (0) (both ('warn') (99))
 * // => 99
 * fromThat (0) (this_ ('warn'))
 * // => 0
 */
export function fromThat (def) {
  return (t) => hasThat (t) ? t.that : def
}

// =============================================================================
// Eq
// =============================================================================

/**
 * Tests structural equality between two `These` values, using `eqA` for the left side
 * and `eqB` for the right. Two `These` values are equal only when they share the same
 * constructor tag and their respective payloads satisfy the given comparators.
 * A `This` and a `That` are never equal, even if they carry equivalent inner values.
 * @example
 * // equals :: (a -> a -> Boolean) -> (b -> b -> Boolean) -> These a b -> These a b -> Boolean
 * equals (a => b => a === b) (a => b => a === b) (that (1)) (that (1))
 * // => true
 * equals (a => b => a === b) (a => b => a === b) (both ('w') (1)) (both ('w') (1))
 * // => true
 * equals (a => b => a === b) (a => b => a === b) (this_ ('w')) (that (1))
 * // => false
 */
export function equals (eqA) {
  return (eqB) => (ta) => (tb) => {
    if (isThis (ta) && isThis (tb)) return eqA (ta.this) (tb.this)
    if (isThat (ta) && isThat (tb)) return eqB (ta.that) (tb.that)
    if (isBoth (ta) && isBoth (tb)) return eqA (ta.this) (tb.this) && eqB (ta.that) (tb.that)
    return false
  }
}

// =============================================================================
// Semigroup / Monoid
// =============================================================================

/**
 * Combines two `These` values as a `Semigroup`, accumulating each side independently
 * using `concatA` for the left and `concatB` for the right. When both operands carry
 * the same side, those values are merged; when only one operand carries a side, that value
 * is kept unchanged. Warnings accumulate, results accumulate — neither is silently discarded.
 *
 *   This  a  <> This  b  = This  (a <> b)
 *   This  a  <> That  y  = Both  a y
 *   This  a  <> Both  b y = Both (a <> b) y
 *   That  x  <> This  b  = Both  b x
 *   That  x  <> That  y  = That  (x <> y)
 *   That  x  <> Both  b y = Both  b (x <> y)
 *   Both a x <> This  b  = Both  (a <> b) x
 *   Both a x <> That  y  = Both  a (x <> y)
 *   Both a x <> Both b y = Both  (a <> b) (x <> y)
 *
 * @example
 * // concat :: (a -> a -> a) -> (b -> b -> b) -> These a b -> These a b -> These a b
 * const c = concat (a => b => a + b) (a => b => a + b)
 * c (this_ ('a')) (this_ ('b'))
 * // => this_('ab')
 * c (that (1)) (that (2))
 * // => that(3)
 * c (both ('a') (1)) (both ('b') (2))
 * // => both('ab')(3)
 */
export function concat (concatA) {
  return (concatB) => (ta) => (tb) => {
    // This + *
    if (isThis (ta) && isThis (tb)) return this_ (concatA (ta.this) (tb.this))
    if (isThis (ta) && isThat (tb)) return both (ta.this) (tb.that)
    if (isThis (ta) && isBoth (tb)) return both (concatA (ta.this) (tb.this)) (tb.that)
    // That + *
    if (isThat (ta) && isThis (tb)) return both (tb.this) (ta.that)
    if (isThat (ta) && isThat (tb)) return that (concatB (ta.that) (tb.that))
    if (isThat (ta) && isBoth (tb)) return both (tb.this) (concatB (ta.that) (tb.that))
    // Both + *
    if (isBoth (ta) && isThis (tb)) return both (concatA (ta.this) (tb.this)) (ta.that)
    if (isBoth (ta) && isThat (tb)) return both (ta.this) (concatB (ta.that) (tb.that))
    return both (concatA (ta.this) (tb.this)) (concatB (ta.that) (tb.that))
  }
}

// =============================================================================
// Functor  (maps over the b / right side)
// =============================================================================

/**
 * Applies `f` to the right `b` value, preserving the left `a` untouched.
 * `This` passes through unchanged because there is nothing to map on the right side.
 * This makes `These` a right-biased `Functor`, consistent with `Either` — you can chain
 * `map` calls across a pipeline without special-casing the annotation-only variant.
 * @example
 * // map :: (b -> c) -> These a b -> These a c
 * map (x => x * 2) (that (21))
 * // => that(42)
 * map (x => x * 2) (both ('warn') (21))
 * // => both('warn')(42)
 * map (x => x * 2) (this_ ('warn'))
 * // => this_('warn')
 */
export function map (f) {
  return (t) => {
    if (isThat (t)) return that (f (t.that))
    if (isBoth (t)) return both (t.this) (f (t.that))
    return t
  }
}

/**
 * Applies `f` to the left `a` value, leaving the right `b` side untouched.
 * `That` passes through unchanged because there is no `a` present to transform.
 * Use this to normalise warnings, remap error codes, or transform metadata independently
 * of the computation result.
 * @example
 * // mapThis :: (a -> c) -> These a b -> These c b
 * mapThis (s => s.toUpperCase()) (this_ ('warn'))
 * // => this_('WARN')
 * mapThis (s => s.toUpperCase()) (both ('warn') (42))
 * // => both('WARN')(42)
 * mapThis (s => s.toUpperCase()) (that (42))
 * // => that(42)
 */
export function mapThis (f) {
  return (t) => {
    if (isThis (t)) return this_ (f (t.this))
    if (isBoth (t)) return both (f (t.this)) (t.that)
    return t
  }
}

/**
 * Applies `f` to both the left `a` and the right `b`, transforming whichever sides are present.
 * This is the `Bifunctor` interface for `These`, letting you remap both the annotation and the
 * result in a single pass rather than composing separate `mapThis` and `map` calls.
 * @example
 * // bimap :: (a -> c) -> (b -> d) -> These a b -> These c d
 * bimap (s => s.toUpperCase()) (n => n * 2) (both ('warn') (21))
 * // => both('WARN')(42)
 * bimap (s => s.toUpperCase()) (n => n * 2) (that (21))
 * // => that(42)
 * bimap (s => s.toUpperCase()) (n => n * 2) (this_ ('warn'))
 * // => this_('WARN')
 */
export function bimap (f) {
  return (g) => (t) => {
    if (isThis (t)) return this_ (f (t.this))
    if (isThat (t)) return that (g (t.that))
    return both (f (t.this)) (g (t.that))
  }
}

// =============================================================================
// Applicative  (a must be a Semigroup)
// =============================================================================

/**
 * Lifts a plain value into `These` as a `That`, establishing the `Applicative` identity.
 * The right slot is the "computation result" slot in `These`, so `of` wraps purely there
 * with no annotation — analogous to `Right` in `Either` or `Just` in `Maybe`.
 * @example
 * // of :: b -> These a b
 * of (42)
 * // => that(42)
 * of ('hello')
 * // => that('hello')
 */
export function of (b) {
  return that (b)
}

/**
 * Applies the function inside `tf` to the value inside `ta`, accumulating any left `a` values
 * with `concatA` instead of discarding them. When both sides carry a left value those values
 * are merged — giving `These` its annotation-accumulation semantics similar to `Validation`,
 * but extended to carry successful results alongside the annotations.
 * @example
 * // ap :: (a -> a -> a) -> These a (b -> c) -> These a b -> These a c
 * const apStr = ap (a => b => a + b)
 * apStr (that (x => x + 1)) (that (10))
 * // => that(11)
 * apStr (both ('w1') (x => x + 1)) (both ('w2') (10))
 * // => both('w1w2')(11)
 * apStr (this_ ('e1')) (this_ ('e2'))
 * // => this_('e1e2')
 */
export function ap (concatA) {
  return (tf) => (ta) => {
    if (isThis (tf) && isThis (ta)) return this_ (concatA (tf.this) (ta.this))
    if (isThis (tf))                return tf
    if (isThat (tf) && isThis (ta)) return ta
    if (isThat (tf) && isThat (ta)) return that (tf.that (ta.that))
    if (isThat (tf) && isBoth (ta)) return both (ta.this) (tf.that (ta.that))
    if (isBoth (tf) && isThis (ta)) return this_ (concatA (tf.this) (ta.this))
    if (isBoth (tf) && isThat (ta)) return both (tf.this) (tf.that (ta.that))
    // Both + Both
    return both (concatA (tf.this) (ta.this)) (tf.that (ta.that))
  }
}

// =============================================================================
// Monad  (a must be a Semigroup)
// =============================================================================

/**
 * Monadic bind — applies `f` to the right `b` value, threading any left `a` through with `concatA`.
 * When the input is a `Both`, the accumulated left value is prepended to whatever left value `f`
 * produces, so annotations accumulate as the chain progresses. `This` short-circuits without
 * calling `f`, letting you escape early when there is no result to process.
 * @example
 * // chain :: (a -> a -> a) -> (b -> These a c) -> These a b -> These a c
 * const chainStr = chain (a => b => a + b)
 * chainStr (x => that (x + 1)) (that (2))
 * // => that(3)
 * chainStr (x => both ('w2') (x + 1)) (both ('w1') (2))
 * // => both('w1w2')(3)
 * chainStr (x => that (x + 1)) (this_ ('e'))
 * // => this_('e')
 */
export function chain (concatA) {
  return (f) => (t) => {
    if (isThis (t)) return t
    if (isThat (t)) return f (t.that)
    // Both: apply f to the right side, then prepend the accumulated left side
    const result = f (t.that)
    if (isThis (result)) return this_ (concatA (t.this) (result.this))
    if (isThat (result)) return both (t.this) (result.that)
    return both (concatA (t.this) (result.this)) (result.that)
  }
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Reduces the right `b` value into an accumulator using `f` and initial value `init`.
 * When the `These` is a pure `This` — carrying only a left annotation — there is no `b`
 * to fold, so `init` is returned unchanged. This mirrors `Foldable` for `Either`: only
 * the right side contributes to the reduction.
 * @example
 * // fold :: (b -> a -> b) -> b -> These e a -> b
 * fold (acc => x => acc + x) (0) (that (5))
 * // => 5
 * fold (acc => x => acc + x) (0) (both ('warn') (5))
 * // => 5
 * fold (acc => x => acc + x) (0) (this_ ('warn'))
 * // => 0
 */
export function fold (f) {
  return (init) => (t) => hasThat (t) ? f (init) (t.that) : init
}

// =============================================================================
// Conversions
// =============================================================================

/**
 * Converts a `These` to `Maybe` by extracting the right `b` value, discarding any annotation.
 * `That` and `Both` become `Just` (the annotation in `Both` is dropped); `This` becomes `Nothing`.
 * This lets you drop into the `Maybe` world when only the presence of a result matters, not the
 * accompanying metadata.
 * @example
 * // toMaybe :: These a b -> Maybe b
 * toMaybe (that (42))
 * // => just(42)
 * toMaybe (both ('warn') (42))
 * // => just(42)
 * toMaybe (this_ ('warn'))
 * // => nothing()
 */
export function toMaybe (t) {
  return hasThat (t) ? just (t.that) : nothing ()
}

/**
 * Converts a `These` to `Either` — `That` and `Both` become `Right` (carrying `b`),
 * and `This` becomes `Left` (carrying `a`). This conversion is lossy for `Both`: the left
 * annotation is discarded, so use `getThis` separately if you need to preserve it.
 * Useful when interfacing with code that expects the simpler `Either` type.
 * @example
 * // toEither :: These a b -> Either a b
 * toEither (that (42))
 * // => right(42)
 * toEither (both ('warn') (42))
 * // => right(42)
 * toEither (this_ ('warn'))
 * // => left('warn')
 */
export function toEither (t) {
  if (hasThat (t)) return right (t.that)
  return left (t.this)
}

/**
 * Exchanges the left and right positions: `This a` becomes `That a`, `That b` becomes `This b`,
 * and `Both a b` becomes `Both b a`. Useful when an API returns `These` with roles reversed
 * from what your pipeline expects, or when you want to apply right-biased operations
 * (`map`, `chain`) to what was originally the left side.
 * @example
 * // swap :: These a b -> These b a
 * swap (this_ ('warn'))
 * // => that('warn')
 * swap (that (42))
 * // => this_(42)
 * swap (both ('warn') (42))
 * // => both(42)('warn')
 */
export function swap (t) {
  if (isThis (t)) return that (t.this)
  if (isThat (t)) return this_ (t.that)
  return both (t.that) (t.this)
}
