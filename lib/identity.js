// identity.js – The Identity functor / monad.
// Identity a = { tag: 'identity', value: a }
//
// The simplest possible wrapper — no effect, no structure, no absence.
// Useful as the base case for monad transformer stacks and as the canonical
// "do nothing" functor when an ADT requires a type constructor argument.

// =============================================================================
// Constructor
// =============================================================================

/**
 * Wraps a value in the Identity constructor.
 * @example
 * // identity :: a -> Identity a
 * identity (42) // => { tag: 'identity', value: 42 }
 */
export function identity (value) {
  return { tag: 'identity', value }
}

// =============================================================================
// Guard
// =============================================================================

/**
 * True when the value is an Identity.
 * @example
 * // isIdentity :: a -> Boolean
 * isIdentity (identity (1)) // => true
 * isIdentity (42)           // => false
 */
export function isIdentity (a) {
  return Boolean (a?.tag === 'identity')
}

// =============================================================================
// Destructor
// =============================================================================

/**
 * Extracts the wrapped value.
 * @example
 * // extract :: Identity a -> a
 * extract (identity (42)) // => 42
 */
export function extract (fa) {
  return fa.value
}

// =============================================================================
// Eq / Ord
// =============================================================================

/**
 * True when both Identity values are equal under the given comparator.
 * @example
 * // equals :: (a -> a -> Boolean) -> Identity a -> Identity a -> Boolean
 * equals (a => b => a === b) (identity (1)) (identity (1)) // => true
 * equals (a => b => a === b) (identity (1)) (identity (2)) // => false
 */
export function equals (eq) {
  return (fa) => (fb) => eq (fa.value) (fb.value)
}

/**
 * Ordering of two Identity values under the given lte comparator.
 * @example
 * // lte :: (a -> a -> Boolean) -> Identity a -> Identity a -> Boolean
 * lte (a => b => a <= b) (identity (1)) (identity (2)) // => true
 * lte (a => b => a <= b) (identity (2)) (identity (1)) // => false
 */
export function lte (lteVal) {
  return (fa) => (fb) => lteVal (fa.value) (fb.value)
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies f to the wrapped value and re-wraps the result.
 * @example
 * // map :: (a -> b) -> Identity a -> Identity b
 * map (x => x + 1) (identity (1)) // => identity(2)
 */
export function map (f) {
  return (fa) => identity (f (fa.value))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Lifts a value into Identity.  Alias for `identity`.
 * @example
 * // of :: a -> Identity a
 * of (42) // => identity(42)
 */
export function of (a) {
  return identity (a)
}

/**
 * Applies the function inside the first Identity to the value in the second.
 * @example
 * // ap :: Identity (a -> b) -> Identity a -> Identity b
 * ap (identity (x => x + 1)) (identity (2)) // => identity(3)
 */
export function ap (ff) {
  return (fa) => identity (ff.value (fa.value))
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Monadic bind — applies f to the wrapped value.
 * @example
 * // chain :: (a -> Identity b) -> Identity a -> Identity b
 * chain (x => identity (x + 1)) (identity (2)) // => identity(3)
 */
export function chain (f) {
  return (fa) => f (fa.value)
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Reduces the single wrapped value with f and init.
 * @example
 * // fold :: (b -> a -> b) -> b -> Identity a -> b
 * fold (acc => x => acc + x) (0) (identity (5)) // => 5
 */
export function fold (f) {
  return (init) => (fa) => f (init) (fa.value)
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Sequences the Identity through an applicative functor.
 * Accepts explicit apOf / apMap to remain functor-agnostic.
 *
 * apOf  :: b -> f b                        (pure / of)
 * apMap :: (a -> b) -> f a -> f b          (map, curried)
 *
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> Identity a -> f (Identity b)
 * const apOf  = Array.of
 * const apMap = f => xs => xs.map (f)
 * traverse (apOf) (apMap) (x => [x, -x]) (identity (1)) // => [identity(1), identity(-1)]
 */
export function traverse (apOf) {
  return (apMap) => (f) => (fa) => apMap (identity) (f (fa.value))
}

// =============================================================================
// Comonad
// =============================================================================

/**
 * Comonad extend — wraps the whole Identity in another Identity via f.
 * @example
 * // extend :: (Identity a -> b) -> Identity a -> Identity b
 * extend (fa => fa.value + 1) (identity (2)) // => identity(3)
 */
export function extend (f) {
  return (fa) => identity (f (fa))
}
