// regexp.js – RegExp comparison and utility functions.

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
 * Returns Just of capture-group array if pattern matches, Nothing otherwise.
 * @example
 * // match :: RegExp -> String -> Maybe (Array (Maybe String))
 * match (/(\w+)/) ('hello') // => just([just('hello')])
 */
export function match (pattern) {
  return (s) => {
    const m = s.match (pattern)
    if (m == null) return M.nothing ()
    const groups = []
    for (let i = 1; i < m.length; i++) {
      groups.push (m[i] == null ? M.nothing () : M.just (m[i]))
    }
    return M.just (groups)
  }
}

/**
 * Returns all capture-group arrays (pattern must have the 'g' flag).
 * @example
 * // matchAll :: RegExp -> String -> Array (Array (Maybe String))
 * matchAll (/(\w+)/g) ('hi there') // => [[just('hi')], [just('there')]]
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
        groups.push (m[i] == null ? M.nothing () : M.just (m[i]))
      }
      result.push (groups)
    }
  }
}

/**
 * Replaces pattern matches using a function over capture groups.
 * @example
 * // replace :: (Array (Maybe String) -> String) -> RegExp -> String -> String
 * replace (() => 'X') (/a/) ('cat') // => 'cXt'
 */
export function replace (substitute) {
  return (pattern) => (text) =>
    text.replace (pattern, (...args) => {
      const groups = []
      for (let i = 1; ; i++) {
        const arg = args[i]
        if (typeof arg === 'number') break
        groups.push (arg == null ? M.nothing () : M.just (arg))
      }
      return substitute (groups)
    })
}
