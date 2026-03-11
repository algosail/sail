// identity.js
// The Identity functor / monad.
// Identity a = { tag: 'identity', value: a }
//
// The simplest possible wrapper — no effect, no structure, no absence.
// Useful as the base case for monad transformer stacks and as the canonical
// "do nothing" functor when an ADT requires a type constructor argument.

// =============================================================================
// Constructor
// =============================================================================

/**
 * Wraps a value in the `Identity` constructor — the simplest possible functor, adding no
 * effects or structure. `Identity` is useful as the base case in monad transformer stacks
 * (e.g., `StateT s Identity` becomes plain `State s`) and as a stand-in when an API requires
 * a type constructor but you want no-op behaviour.
 * @example
 * // identity :: a -> Identity a
 * identity (42)
 * // => { tag: 'identity', value: 42 }
 * identity ('hello')
 * // => { tag: 'identity', value: 'hello' }
 */
export function identity (value) {
  return { tag: 'identity', value }
}

// =============================================================================
// Guard
// =============================================================================

/**
 * Returns `true` when the value is an `Identity` — a runtime membership check.
 * Use as a guard before calling `Identity`-specific operations in contexts where the
 * type cannot be statically verified, such as after deserialising data or receiving
 * values from a generic combinator that may return different wrapper types.
 * @example
 * // isIdentity :: a -> Boolean
 * isIdentity (identity (1))
 * // => true
 * isIdentity ({ tag: 'identity', value: 1 })
 * // => true
 * isIdentity (42)
 * // => false
 */
export function isIdentity (a) {
  return Boolean (a?.tag === 'identity')
}

// =============================================================================
// Destructor
// =============================================================================

/**
 * Extracts the wrapped value from an `Identity`, discarding the wrapper.
 * The inverse of the `identity` constructor. Because `Identity` has no effects or
 * additional structure, extraction is always safe and total — no `Maybe` or default
 * value is needed.
 * @example
 * // extract :: Identity a -> a
 * extract (identity (42))
 * // => 42
 * extract (identity ('hello'))
 * // => 'hello'
 */
export function extract (fa) {
  return fa.value
}

// =============================================================================
// Eq / Ord
// =============================================================================

/**
 * Tests equality of two `Identity` values by delegating to the given comparator for the
 * inner values. Because `Identity` has no extra structure, two `Identity` values are equal
 * precisely when their wrapped values are equal. Pass the comparator for the inner type —
 * for example `(a => b => a === b)` for primitives.
 * @example
 * // equals :: (a -> a -> Boolean) -> Identity a -> Identity a -> Boolean
 * equals (a => b => a === b) (identity (1)) (identity (1))
 * // => true
 * equals (a => b => a === b) (identity (1)) (identity (2))
 * // => false
 */
export function equals (eq) {
  return (fa) => (fb) => eq (fa.value) (fb.value)
}

/**
 * Tests whether the first `Identity` is less than or equal to the second, delegating to the
 * given comparator for the wrapped values. As with `equals`, `Identity` adds no ordering of
 * its own — the inner type's ordering is used directly.
 * @example
 * // lte :: (a -> a -> Boolean) -> Identity a -> Identity a -> Boolean
 * lte (a => b => a <= b) (identity (1)) (identity (2))
 * // => true
 * lte (a => b => a <= b) (identity (2)) (identity (1))
 * // => false
 */
export function lte (lteVal) {
  return (fa) => (fb) => lteVal (fa.value) (fb.value)
}

// =============================================================================
// Functor
// =============================================================================

/**
 * Applies `f` to the wrapped value and returns a new `Identity` holding the result.
 * This is the `Functor` instance for `Identity` — trivially `identity(f(fa.value))`.
 * Because `Identity` has no effects to consider, it satisfies the Functor laws trivially,
 * making it a useful test case and base case for functor-generic code.
 * @example
 * // map :: (a -> b) -> Identity a -> Identity b
 * map (x => x * 2) (identity (21))
 * // => identity(42)
 * map (s => s.toUpperCase()) (identity ('hello'))
 * // => identity('HELLO')
 */
export function map (f) {
  return (fa) => identity (f (fa.value))
}

// =============================================================================
// Applicative
// =============================================================================

/**
 * Lifts a value into `Identity` — an alias for the `identity` constructor.
 * This is the `Applicative` `pure` / `of` for `Identity`. In transformer stacks it serves
 * as the trivial "no effect" lift, and in functor-generic code it is the canonical way
 * to inject a plain value into the `Identity` applicative.
 * @example
 * // of :: a -> Identity a
 * of (42)
 * // => identity(42)
 * of ('admin')
 * // => identity('admin')
 */
export function of (a) {
  return identity (a)
}

/**
 * Applies the function wrapped in `ff` to the value wrapped in `fa`.
 * This is the `Apply` instance for `Identity` — trivially `identity(ff.value(fa.value))`.
 * Despite its simplicity, `Identity`'s `ap` satisfies all `Apply` laws and can be used
 * to verify that functor-generic code is wiring `ap` correctly.
 * @example
 * // ap :: Identity (a -> b) -> Identity a -> Identity b
 * ap (identity (x => x * 2)) (identity (21))
 * // => identity(42)
 * ap (identity (s => s.trim())) (identity ('  hello  '))
 * // => identity('hello')
 */
export function ap (ff) {
  return (fa) => identity (ff.value (fa.value))
}

// =============================================================================
// Monad
// =============================================================================

/**
 * Applies `f` to the wrapped value and returns the resulting `Identity` directly.
 * This is the `Monad` bind (`>>=`) for `Identity` — trivially just `f(fa.value)`.
 * `Identity`'s `chain` is used to verify monad-generic code: if `chain` works with
 * `Identity`, it will work with any monad, since `Identity` introduces no additional
 * constraints or effects.
 * @example
 * // chain :: (a -> Identity b) -> Identity a -> Identity b
 * chain (x => identity (x * 2)) (identity (21))
 * // => identity(42)
 * chain (x => identity (x + '!')) (identity ('hello'))
 * // => identity('hello!')
 */
export function chain (f) {
  return (fa) => f (fa.value)
}

// =============================================================================
// Foldable
// =============================================================================

/**
 * Reduces the single wrapped value with `f` and initial accumulator `init`.
 * This is the `Foldable` instance for `Identity` — since there is exactly one element,
 * it simply applies `f(init)(fa.value)`. Use this when writing functor-generic code
 * that needs to work uniformly over both `Identity` and richer containers like `Array`.
 * @example
 * // fold :: (b -> a -> b) -> b -> Identity a -> b
 * fold (acc => x => acc + x) (10) (identity (5))
 * // => 15
 * fold (acc => x => [...acc, x]) ([]) (identity (42))
 * // => [42]
 */
export function fold (f) {
  return (init) => (fa) => f (init) (fa.value)
}

// =============================================================================
// Traversable
// =============================================================================

/**
 * Sequences the `Identity` through an applicative functor — applies `f` to the wrapped value
 * and re-wraps the result in `identity` inside the outer applicative. Since `Identity` holds
 * exactly one value, this always produces exactly one effectful result. Accepts explicit
 * `apOf`/`apMap` to remain functor-agnostic.
 *
 * apOf  :: b -> f b                        (pure / of)
 * apMap :: (a -> b) -> f a -> f b          (map, curried)
 *
 * @example
 * // traverse :: (b -> f b) -> ((a -> b) -> f a -> f b) -> (a -> f b) -> Identity a -> f (Identity b)
 * const apOf  = Array.of
 * const apMap = f => xs => xs.map (f)
 * traverse (apOf) (apMap) (x => [x, -x]) (identity (5))
 * // => [identity(5), identity(-5)]
 */
export function traverse (apOf) {
  return (apMap) => (f) => (fa) => apMap (identity) (f (fa.value))
}

// =============================================================================
// Comonad
// =============================================================================

/**
 * Comonad `extend` — applies `f` to the entire `Identity` and wraps the result in a new `Identity`.
 * This is the trivial `Comonad` instance: `extend(f)(fa)` equals `identity(f(fa))`. Use it when
 * writing comonad-generic code that processes the "context" around a value — with `Identity` the
 * context is just the value itself, so `extend` behaves like `map` applied to the whole wrapper.
 * @example
 * // extend :: (Identity a -> b) -> Identity a -> Identity b
 * extend (fa => fa.value * 2) (identity (21))
 * // => identity(42)
 * extend (fa => extract (fa) + 1) (identity (10))
 * // => identity(11)
 */
export function extend (f) {
  return (fa) => identity (f (fa))
}
