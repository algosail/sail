// regexp.js
// RegExp constructors, comparison, and matching utilities.
// Capture groups are returned as plain strings; unmatched optional groups → ''.

import * as M from './maybe.js'

/**
 * Returns `true` when both regexes have identical source and all flags match (global,
 * ignoreCase, multiline, dotAll, sticky, unicode). This structural comparison is
 * needed because JavaScript's `===` always returns `false` for two distinct regex
 * objects, even if they are functionally identical.
 * @example
 * // equals :: RegExp -> RegExp -> Boolean
 * equals (/a/g) (/a/g)
 * // => true
 * equals (/a/g) (/a/i)
 * // => false
 */
export function equals (a) {
  return (b) =>
    a.source === b.source &&
    a.global === b.global &&
    a.ignoreCase === b.ignoreCase &&
    a.multiline === b.multiline &&
    a.dotAll === b.dotAll &&
    a.sticky === b.sticky &&
    a.unicode === b.unicode
}

/**
 * Constructs a `RegExp` from a flags string and a source pattern string. The curried
 * form lets you fix the flags once and derive multiple regexes from different sources —
 * for example, `regex ('gi')` applied to several patterns for case-insensitive global
 * matching.
 * @example
 * // regex :: String -> String -> RegExp
 * regex ('g') ('[0-9]+')
 * // => /[0-9]+/g
 * regex ('i') ('hello')
 * // => /hello/i
 */
export function regex (flags) {
  return (source) => new RegExp (source, flags)
}

/**
 * Escapes all regex metacharacters in a string so it can be safely embedded in a
 * `RegExp` pattern as a literal. Without escaping, characters like `.`, `*`, or `(`
 * would be interpreted as regex syntax, leading to incorrect or unsafe patterns.
 * @example
 * // regexEscape :: String -> String
 * regexEscape ('a.b')
 * // => 'a\\.b'
 * regexEscape ('(1+1)')
 * // => '\\(1\\+1\\)'
 */
export function regexEscape (s) {
  return s.replace (/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

/**
 * Returns `true` when the pattern matches anywhere in `s`, safely resetting
 * `lastIndex` before and after the call. This makes it safe to use with stateful
 * sticky or global regexes, and the curried form — `test (/pattern/)` — is a
 * ready-made predicate for `filter`.
 * @example
 * // test :: RegExp -> String -> Boolean
 * test (/^a/) ('abacus')
 * // => true
 * test (/^a/) ('banana')
 * // => false
 */
export function test (pattern) {
  return (s) => {
    const li = pattern.lastIndex
    const result = pattern.test (s)
    pattern.lastIndex = li
    return result
  }
}

/**
 * Returns `Just` an array of capture groups if the pattern matches `s`, or `Nothing`
 * if there is no match. Unmatched optional groups are normalised to `''` instead of
 * `undefined`, making downstream processing simpler. The `Maybe` return type forces
 * callers to handle the no-match case explicitly.
 * @example
 * // match :: RegExp -> String -> Maybe (Array String)
 * match (/(\w+)\s(\w+)/) ('hello world')
 * // => just(['hello', 'world'])
 * match (/(\d+)/) ('abc')
 * // => nothing()
 */
export function match (pattern) {
  return (s) => {
    const m = s.match (pattern)
    if (m == null) return M.nothing ()
    const groups = []
    for (let i = 1; i < m.length; i++) {
      groups.push (m[i] == null ? '' : m[i])
    }
    return M.just (groups)
  }
}

/**
 * Returns an array of capture-group arrays for every match of a global (`g`) pattern
 * against `s`. Unmatched optional groups are normalised to `''`, and `lastIndex` is
 * restored after the call. Use this to extract all occurrences of a structured pattern
 * from a string in one step.
 * @example
 * // matchAll :: RegExp -> String -> Array (Array String)
 * matchAll (/(\w+)/g) ('hi there')
 * // => [['hi'], ['there']]
 * matchAll (/(\d+)/g) ('a1 b2 c3')
 * // => [['1'], ['2'], ['3']]
 */
export function matchAll (pattern) {
  return (s) => {
    const li = pattern.lastIndex
    const result = []
    while (true) {
      const m = pattern.exec (s)
      if (m == null) {
        pattern.lastIndex = li
        return result
      }
      const groups = []
      for (let i = 1; i < m.length; i++) {
        groups.push (m[i] == null ? '' : m[i])
      }
      result.push (groups)
    }
  }
}

/**
 * Replaces pattern matches using a substitution function that receives the array of
 * capture groups for each match. Unlike the native `String.prototype.replace`, the
 * function receives only capture groups (not the full match or offsets), making it
 * easier to write focused, declarative transformations.
 * @example
 * // replace :: (Array String -> String) -> RegExp -> String -> String
 * replace (([w]) => w.toUpperCase ()) (/(\w+)/) ('hello world')
 * // => 'HELLO world'
 * replace (() => 'X') (/a/) ('cat')
 * // => 'cXt'
 */
export function replace (substitute) {
  return (pattern) => (text) =>
    text.replace (pattern, (...args) => {
      const groups = []
      for (let i = 1; ; i++) {
        const arg = args[i]
        if (typeof arg === 'number') break
        groups.push (arg == null ? '' : arg)
      }
      return substitute (groups)
    })
}
