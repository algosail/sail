/**
 * Logical conjunction.
 * @example 
 * // and :: Boolean -> Boolean -> Boolean
 * and (true) (false) // => false
 */
export function and (x) {
  return (y) => x && y
}

/**
 * Logical disjunction.
 * @example 
 * // or :: Boolean -> Boolean -> Boolean
 * or (false) (true) // => true
 */
export function or (x) {
  return (y) => x || y
}

/**
 * Logical negation.
 * @example 
 * // not :: Boolean -> Boolean
 * not (true) // => false
 */
export function not (x) {
  return !x
}

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
 * Case analysis on a boolean — returns onFalse or onTrue.
 * @example 
 * // boolean_ :: a -> a -> Boolean -> a
 * boolean_ ('no') ('yes') (false) // => 'no'
 */
export function boolean_ (false_) {
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
 * Applies f only when predicate does NOT hold.
 * @example 
 * // unless :: (a -> Boolean) -> (a -> a) -> a -> a
 * unless (x => x > 0) (x => -x) (-3) // => 3
 */
export function unless (pred) {
  return (f) => (x) => (pred (x) ? x : f (x))
}
