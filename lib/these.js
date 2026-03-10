// these.js – The These type (This a | That b | Both a b).
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
 * Constructs a This — holds only the left (a) value.
 * @example
 * // this_ :: a -> These a b
 * this_ ('warn') // => { tag: 'this', this: 'warn' }
 */
export function this_ (a) {
  return { tag: 'this', this: a }
}

/**
 * Constructs a That — holds only the right (b) value.
 * @example
 * // that :: b -> These a b
 * that (42) // => { tag: 'that', that: 42 }
 */
export function that (b) {
  return { tag: 'that', that: b }
}

/**
 * Constructs a Both — holds both values simultaneously.
 * @example
 * // both :: a -> b -> These a b
 * both ('warn') (42) // => { tag: 'both', this: 'warn', that: 42 }
 */
export function both (a) {
  return (b) => ({ tag: 'both', this: a, that: b })
}

// =============================================================================
// Guards
// =============================================================================

/**
 * True when the value is a This.
 * @example
 * // isThis :: a -> Boolean
 * isThis (this_ ('x')) // => true
 * isThis (that (1))    // => false
 */
export function isThis (a) {
  return Boolean (a?.tag === 'this')
}

/**
 * True when the value is a That.
 * @example
 * // isThat :: a -> Boolean
 * isThat (that (1))    // => true
 * isThat (this_ ('x')) // => false
 */
export function isThat (a) {
  return Boolean (a?.tag === 'that')
}

/**
 * True when the value is a Both.
 * @example
 * // isBoth :: a -> Boolean
 * isBoth (both ('w') (1)) // => true
 * isBoth (that (1))       // => false
 */
export function isBoth (a) {
  return Boolean (a?.tag === 'both')
}

/**
 * True when the value is a This, That, or Both.
 * @example
 * // isThese :: a -> Boolean
 * isThese (that (1))    // => true
 * isThese (42)          // => false
 */
export function isThese (a) {
  return isThis (a) || isThat (a) || isBoth (a)
}

/**
 * True when the These contains a left (a) value — This or Both.
 * @example
 * // hasThis :: These a b -> Boolean
 * hasThis (this_ ('w'))    // => true
 * hasThis (both ('w') (1)) // => true
 * hasThis (that (1))       // => false
 */
export function hasThis (t) {
  return isThis (t) || isBoth (t)
}

/**
 * True when the These contains a right (b) value — That or Both.
 * @example
 * // hasThat :: These a b -> Boolean
 * hasThat (that (1))       // => true
 * hasThat (both ('w') (1)) // => true
 * hasThat (this_ ('w'))    // => false
 */
export function hasThat (t) {
  return isThat (t) || isBoth (t)
}

// =============================================================================
// Destructor
// =============================================================================

/**
 * Full case analysis on These.
 * @example
 * // these :: (a -> c) -> (b -> c) -> (a -> b -> c) -> These a b -> c
 * these (a => `warn:${a}`) (b => b * 2) (a => b => b) (that (21))       // => 42
 * these (a => `warn:${a}`) (b => b * 2) (a => b => b) (this_ ('oops'))  // => 'warn:oops'
 * these (a => `warn:${a}`) (b => b * 2) (a => b => b) (both ('w') (21)) // => 21
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
 * Returns Just the left (a) value if present, Nothing otherwise.
 * @example
 * // getThis :: These a b -> Maybe a
 * getThis (this_ ('w'))    // => just('w')
 * getThis (both ('w') (1)) // => just('w')
 * getThis (that (1))       // => nothing()
 */
export function getThis (t) {
  if (isThis (t)) return just (t.this)
  if (isBoth (t)) return just (t.this)
  return nothing ()
}

/**
 * Returns Just the right (b) value if present, Nothing otherwise.
 * @example
 * // getThat :: These a b -> Maybe b
 * getThat (that (1))       // => just(1)
 * getThat (both ('w') (1)) // => just(1)
 * getThat (this_ ('w'))    // => nothing()
 */
export function getThat (t) {
  if (isThat (t)) return just (t.that)
  if (isBoth (t)) return just (t.that)
  return nothing ()
}

/**
 * Extracts the left value, returning the default for That.
 * @example
 * // fromThis :: a -> These a b -> a
 * fromThis ('def') (this_ ('w'))    // => 'w'
 * fromThis ('def') (both ('w') (1)) // => 'w'
 * fromThis ('def') (that (1))       // => 'def'
 */
export function fromThis (def) {
  return (t) => hasThis (t) ? t.this : def
}

/**
 * Extracts the right value, returning the default for This.
 * @example
 * // fromThat :: b -> These a b -> b
 * fromThat (0) (that (1))       // => 1
 * fromThat (0) (both ('w') (1)) // => 1
 * fromThat (0) (this_ ('w'))    // => 0
 */
export function fromThat (def) {
  return (t) => hasThat (t) ? t.that : def
}

// =============================================================================
// Eq
// =============================================================================

/**
 * Structural equality using separate comparators for each side.
 * @example
 * // equals :: (a -> a -> Boolean) -> (b -> b -> Boolean) -> These a b -> These a b -> Boolean
 * equals (a => b => a === b) (a => b => a === b) (that (1)) (that (1))          // => true
 * equals (a => b => a === b) (a => b => a === b) (both ('w') (1)) (both ('w') (1)) // => true
 * equals (a => b => a === b) (a => b => a === b) (this_ ('w')) (that (1))       // => false
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
 * Combines two These values, accumulating both sides with their respective
 * Semigroup concats.  The table (using Haskell notation):
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
 * c (this_ ('a')) (this_ ('b'))     // => this_('ab')
 * c (that (1))    (that (2))        // => that(3)
 * c (this_ ('a')) (that (1))        // => both('a')(1)
 * c (both ('a') (1)) (both ('b') (2)) // => both('ab')(3)
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
 * Applies f to the right (b) value; passes This through unchanged.
 * @example
 * // map :: (b -> c) -> These a b -> These a c
 * map (x => x + 1) (that (1))        // => that(2)
 * map (x => x + 1) (both ('w') (1))  // => both('w')(2)
 * map (x => x + 1) (this_ ('w'))     // => this_('w')
 */
export function map (f) {
  return (t) => {
    if (isThat (t)) return that (f (t.that))
    if (isBoth (t)) return both (t.this) (f (t.that))
    return t
  }
}

/**
 * Applies f to the left (a) value; passes That through unchanged.
 * @example
 * // mapThis :: (a -> c) -> These a b -> These c b
 * mapThis (x => x + '!') (this_ ('w'))    // => this_('w!')
 * mapThis (x => x + '!') (both ('w') (1)) // => both('w!')(1)
 * mapThis (x => x + '!') (that (1))       // => that(1)
 */
export function mapThis (f) {
  return (t) => {
    if (isThis (t)) return this_ (f (t.this))
    if (isBoth (t)) return both (f (t.this)) (t.that)
    return t
  }
}

/**
 * Maps both sides independently.
 * @example
 * // bimap :: (a -> c) -> (b -> d) -> These a b -> These c d
 * bimap (a => a + '!') (b => b * 2) (both ('w') (3)) // => both('w!')(6)
 * bimap (a => a + '!') (b => b * 2) (that (3))       // => that(6)
 * bimap (a => a + '!') (b => b * 2) (this_ ('w'))    // => this_('w!')
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
 * Lifts a value into These as a That.
 * @example
 * // of :: b -> These a b
 * of (42) // => that(42)
 */
export function of (b) {
  return that (b)
}

/**
 * Apply — combines These values, accumulating the left side with concatA.
 * This is analogous to Validation's ap but operates on These.
 *
 * @example
 * // ap :: (a -> a -> a) -> These a (b -> c) -> These a b -> These a c
 * const apStr = ap (a => b => a + b)
 * apStr (that (x => x + 1))        (that (2))         // => that(3)
 * apStr (this_ ('e1'))              (that (2))         // => this_('e1')
 * apStr (that (x => x + 1))        (this_ ('e2'))      // => this_('e2')
 * apStr (this_ ('e1'))              (this_ ('e2'))      // => this_('e1e2')
 * apStr (both ('w') (x => x + 1))  (that (2))         // => both('w')(3)
 * apStr (both ('w1') (x => x + 1)) (both ('w2') (2)) // => both('w1w2')(3)
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
 * Monadic bind — threads the left side through using concatA.
 * @example
 * // chain :: (a -> a -> a) -> (b -> These a c) -> These a b -> These a c
 * const chainStr = chain (a => b => a + b)
 * chainStr (x => that (x + 1))       (that (2))         // => that(3)
 * chainStr (x => both ('w2') (x + 1)) (both ('w1') (2)) // => both('w1w2')(3)
 * chainStr (x => that (x + 1))        (this_ ('e'))      // => this_('e')
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
 * Reduces the right (b) value with f and init; returns init for This.
 * @example
 * // fold :: (b -> a -> b) -> b -> These e a -> b
 * fold (acc => x => acc + x) (0) (that (5))        // => 5
 * fold (acc => x => acc + x) (0) (both ('w') (5))  // => 5
 * fold (acc => x => acc + x) (0) (this_ ('w'))     // => 0
 */
export function fold (f) {
  return (init) => (t) => hasThat (t) ? f (init) (t.that) : init
}

// =============================================================================
// Conversions
// =============================================================================

/**
 * Converts to Maybe — Just for That/Both (the right value), Nothing for This.
 * @example
 * // toMaybe :: These a b -> Maybe b
 * toMaybe (that (1))       // => just(1)
 * toMaybe (both ('w') (1)) // => just(1)
 * toMaybe (this_ ('w'))    // => nothing()
 */
export function toMaybe (t) {
  return hasThat (t) ? just (t.that) : nothing ()
}

/**
 * Converts to Either — Right for That/Both, Left for This.
 * @example
 * // toEither :: These a b -> Either a b
 * toEither (that (1))       // => right(1)
 * toEither (both ('w') (1)) // => right(1)
 * toEither (this_ ('w'))    // => left('w')
 */
export function toEither (t) {
  if (hasThat (t)) return right (t.that)
  return left (t.this)
}

/**
 * Swaps This and That — both sides exchange roles.
 * @example
 * // swap :: These a b -> These b a
 * swap (this_ ('w'))    // => that('w')
 * swap (that (1))       // => this_(1)
 * swap (both ('w') (1)) // => both(1)('w')
 */
export function swap (t) {
  if (isThis (t)) return that (t.this)
  if (isThat (t)) return this_ (t.that)
  return both (t.that) (t.this)
}
