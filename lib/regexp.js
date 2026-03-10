// regexp.js – RegExp constructors, comparison, and matching utilities.
// Capture groups are returned as plain strings; unmatched optional groups → ''.

import * as M from './maybe.js'

/**
 * True when both regexes have the same source and all flags match.
 * @example
 * // equals :: RegExp -> RegExp -> Boolean
 * equals (/a/g) (/a/g) // => true
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
 * Constructs a RegExp from flags and source.
 * @example
 * // regex :: String -> String -> RegExp
 * regex ('g') ('[0-9]+') // => /[0-9]+/g
 */
export function regex (flags) {
  return (source) => new RegExp (source, flags)
}

/**
 * Escapes all regex metacharacters so the result matches the literal string.
 * @example
 * // regexEscape :: String -> String
 * regexEscape ('a.b') // => 'a\.b'
 */
export function regexEscape (s) {
  return s.replace (/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

/**
 * Tests whether the pattern matches the string (stateless — resets lastIndex).
 * @example
 * // test :: RegExp -> String -> Boolean
 * test (/^a/) ('abacus') // => true
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
 * Returns Just the array of capture groups if pattern matches, Nothing otherwise.
 * Unmatched optional groups are returned as empty string ''.
 * @example
 * // match :: RegExp -> String -> Maybe (Array String)
 * match (/(\w+)\s(\w+)/) ('hello world') // => just(['hello', 'world'])
 * match (/(\d+)/) ('abc')                // => nothing()
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
 * Returns all capture-group arrays for all matches (pattern must have the 'g' flag).
 * Unmatched optional groups are returned as empty string ''.
 * @example
 * // matchAll :: RegExp -> String -> Array (Array String)
 * matchAll (/(\w+)/g) ('hi there') // => [['hi'], ['there']]
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
 * Replaces pattern matches using a substitution function over capture groups.
 * Unmatched optional groups are passed as ''.
 * @example
 * // replace :: (Array String -> String) -> RegExp -> String -> String
 * replace (([w]) => w.toUpperCase ()) (/(\w+)/) ('hello world') // => 'HELLO world'
 * replace (() => 'X') (/a/) ('cat')                             // => 'cXt'
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
