// string.js – String comparison, concatenation, and utility functions.

import * as M from './maybe.js'

const isString = (a) => typeof a === 'string' || a instanceof String

/**
 * True when both are strings with identical content.
 * @example
 * // equals :: String -> String -> Boolean
 * equals ('a') ('a') // => true
 */
export function equals (a) {
  return (b) => isString (a) && isString (b) && a === b
}

/**
 * Lexicographic less-than-or-equal.
 * @example
 * // lte :: String -> String -> Boolean
 * lte ('a') ('b') // => true
 */
export function lte (a) {
  return (b) => isString (a) && isString (b) && a <= b
}

/**
 * Strict lexicographic less-than.
 * @example
 * // lt :: String -> String -> Boolean
 * lt ('a') ('b') // => true
 */
export function lt (a) {
  return (b) => lte (a) (b) && !lte (b) (a)
}

/**
 * Lexicographic greater-than-or-equal.
 * @example
 * // gte :: String -> String -> Boolean
 * gte ('b') ('a') // => true
 */
export function gte (a) {
  return (b) => lte (b) (a)
}

/**
 * Strict lexicographic greater-than.
 * @example
 * // gt :: String -> String -> Boolean
 * gt ('b') ('a') // => true
 */
export function gt (a) {
  return (b) => lte (b) (a) && !lte (a) (b)
}

/**
 * Returns the lexicographically smaller string.
 * @example
 * // min :: String -> String -> String
 * min ('a') ('b') // => 'a'
 */
export function min (a) {
  return (b) => (lte (a) (b) ? a : b)
}

/**
 * Returns the lexicographically larger string.
 * @example
 * // max :: String -> String -> String
 * max ('a') ('b') // => 'b'
 */
export function max (a) {
  return (b) => (lte (b) (a) ? a : b)
}

/**
 * Clamps a string between lo and hi lexicographically.
 * @example
 * // clamp :: String -> String -> String -> String
 * clamp ('b') ('d') ('e') // => 'd'
 */
export function clamp (lo) {
  return (hi) => (x) => (lte (x) (lo) ? lo : lte (hi) (x) ? hi : x)
}

/**
 * Concatenates two strings.
 * @example
 * // concat :: String -> String -> String
 * concat ('foo') ('bar') // => 'foobar'
 */
export function concat (a) {
  return (b) => (isString (a) && isString (b) ? a + b : '')
}

/** empty :: String — the empty string. */
export const empty = ''

/**
 * Converts a string to upper case.
 * @example
 * // toUpper :: String -> String
 * toUpper ('hello') // => 'HELLO'
 */
export function toUpper (s) {
  return isString (s) ? s.toUpperCase () : ''
}

/**
 * Converts a string to lower case.
 * @example
 * // toLower :: String -> String
 * toLower ('HELLO') // => 'hello'
 */
export function toLower (s) {
  return isString (s) ? s.toLowerCase () : ''
}

/**
 * Removes leading and trailing whitespace.
 * @example
 * // trim :: String -> String
 * trim ('  hi  ') // => 'hi'
 */
export function trim (s) {
  return isString (s) ? s.trim () : ''
}

/**
 * Returns Just the remainder after stripping the prefix, or Nothing.
 * @example
 * // stripPrefix :: String -> String -> Maybe String
 * stripPrefix ('foo') ('foobar') // => just('bar')
 */
export function stripPrefix (prefix) {
  return (s) =>
    isString (s) && isString (prefix) && s.startsWith (prefix)
      ? M.just (s.slice (prefix.length))
      : M.nothing ()
}

/**
 * Returns Just the string with the suffix removed, or Nothing.
 * @example
 * // stripSuffix :: String -> String -> Maybe String
 * stripSuffix ('bar') ('foobar') // => just('foo')
 */
export function stripSuffix (suffix) {
  return (s) =>
    isString (s) && isString (suffix) && s.endsWith (suffix)
      ? M.just (s.slice (0, s.length - suffix.length))
      : M.nothing ()
}

/**
 * Splits on whitespace, ignoring leading/trailing empty tokens.
 * @example
 * // words :: String -> Array String
 * words ('  foo bar  ') // => ['foo', 'bar']
 */
export function words (s) {
  const ws = isString (s) ? s.split (/\s+/) : []
  const len = ws.length
  return ws.slice (ws[0] === '' ? 1 : 0, ws[len - 1] === '' ? len - 1 : len)
}

/**
 * Joins an array of strings with a single space.
 * @example
 * // unwords :: Array String -> String
 * unwords (['foo', 'bar']) // => 'foo bar'
 */
export function unwords (xs) {
  return xs.join (' ')
}

/**
 * Splits on \n, \r\n, or \r; empty string yields [].
 * @example
 * // lines :: String -> Array String
 * lines ('a\nb') // => ['a', 'b']
 */
export function lines (s) {
  const t = isString (s) ? s : ''
  return t === '' ? [] : t.replace (/\r\n?/g, '\n').match (/^(?=[\s\S]).*/gm)
}

/**
 * Joins lines, appending a terminating '\n' to each.
 * @example
 * // unlines :: Array String -> String
 * unlines (['a', 'b']) // => 'a\nb\n'
 */
export function unlines (xs) {
  return xs.reduce ((acc, x) => acc + x + '\n', '')
}

/**
 * Splits a string on a separator substring.
 * @example
 * // splitOn :: String -> String -> Array String
 * splitOn (',') ('a,b,c') // => ['a', 'b', 'c']
 */
export function splitOn (sep) {
  return (s) => (isString (s) && isString (sep) ? s.split (sep) : [])
}

/**
 * Splits on a regex pattern (must have the 'g' flag).
 * @example
 * // splitOnRegex :: RegExp -> String -> Array String
 * splitOnRegex (/,/g) ('a,b,c') // => ['a', 'b', 'c']
 */
export function splitOnRegex (pattern) {
  return (s) => {
    const li = pattern.lastIndex
    const result = []
    let idx = 0
    while (true) {
      const m = pattern.exec (s)
      if (m == null) {
        result.push (s.slice (idx))
        break
      }
      if (pattern.lastIndex === idx && m[0] === '') {
        if (pattern.lastIndex === s.length) break
        pattern.lastIndex += 1
        continue
      }
      result.push (s.slice (idx, m.index))
      idx = m.index + m[0].length
    }
    pattern.lastIndex = li
    return result
  }
}

/**
 * Joins an array of strings with the given separator.
 * @example
 * // joinWith :: String -> Array String -> String
 * joinWith ('-') (['a', 'b', 'c']) // => 'a-b-c'
 */
export function joinWith (sep) {
  return (xs) => xs.join (isString (sep) ? sep : '')
}
