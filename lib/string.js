// string.js – String comparison, concatenation, and utility functions.

import * as M from './maybe.js'

/**
 * True when a is a string primitive or String object.
 * @example
 * // isString :: a -> Boolean
 * isString ('hi') // => true
 * isString (42)   // => false
 */
export function isString (a) {
  return typeof a === 'string' || a instanceof String
}

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

/** empty :: String — the identity element for concat. */
export const empty = ''

/**
 * Returns the number of UTF-16 code units in the string.
 * @example
 * // size :: String -> Integer
 * size ('hello') // => 5
 * size ('')      // => 0
 */
export function size (s) {
  return isString (s) ? s.length : 0
}

/**
 * True when s contains the substring needle.
 * @example
 * // includes :: String -> String -> Boolean
 * includes ('ell') ('hello') // => true
 * includes ('xyz') ('hello') // => false
 */
export function includes (needle) {
  return (s) => isString (s) && isString (needle) && s.includes (needle)
}

/**
 * True when s starts with the given prefix.
 * @example
 * // startsWith :: String -> String -> Boolean
 * startsWith ('he') ('hello') // => true
 * startsWith ('lo') ('hello') // => false
 */
export function startsWith (prefix) {
  return (s) => isString (s) && isString (prefix) && s.startsWith (prefix)
}

/**
 * True when s ends with the given suffix.
 * @example
 * // endsWith :: String -> String -> Boolean
 * endsWith ('lo') ('hello') // => true
 * endsWith ('he') ('hello') // => false
 */
export function endsWith (suffix) {
  return (s) => isString (s) && isString (suffix) && s.endsWith (suffix)
}

/**
 * Replaces the first occurrence of search with replacement.
 * @example
 * // replace :: String -> String -> String -> String
 * replace ('l') ('r') ('hello') // => 'herlo'
 */
export function replace (search) {
  return (replacement) => (s) =>
    isString (s) ? s.replace (search, replacement) : ''
}

/**
 * Replaces all occurrences of search with replacement.
 * @example
 * // replaceAll :: String -> String -> String -> String
 * replaceAll ('l') ('r') ('hello') // => 'herro'
 */
export function replaceAll (search) {
  return (replacement) => (s) =>
    isString (s) ? s.replaceAll (search, replacement) : ''
}

/**
 * Pads the start of a string to the given length with padStr.
 * @example
 * // padStart :: Integer -> String -> String -> String
 * padStart (5) ('0') ('42') // => '00042'
 */
export function padStart (len) {
  return (padStr) => (s) =>
    isString (s) ? s.padStart (len, padStr) : ''
}

/**
 * Pads the end of a string to the given length with padStr.
 * @example
 * // padEnd :: Integer -> String -> String -> String
 * padEnd (5) ('0') ('42') // => '42000'
 */
export function padEnd (len) {
  return (padStr) => (s) =>
    isString (s) ? s.padEnd (len, padStr) : ''
}

/**
 * Repeats a string n times.
 * @example
 * // repeat :: Integer -> String -> String
 * repeat (3) ('ab') // => 'ababab'
 * repeat (0) ('ab') // => ''
 */
export function repeat (n) {
  return (s) => isString (s) && n >= 0 ? s.repeat (n) : ''
}

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

/**
 * Extracts a substring from index `from` (inclusive) to `to` (exclusive).
 * Negative indices count from the end of the string.
 * @example
 * // slice :: Integer -> Integer -> String -> String
 * slice (1) (3) ('hello') // => 'el'
 * slice (0) (5) ('hello') // => 'hello'
 * slice (-3) (-1) ('hello') // => 'll'
 * slice (2) (2) ('hello') // => ''
 */
export function slice (from) {
  return (to) => (s) => isString (s) ? s.slice (from, to) : ''
}

/**
 * Returns Just the character at the given index, or Nothing for out-of-bounds.
 * Supports negative indices (−1 = last character).
 * @example
 * // at :: Integer -> String -> Maybe String
 * at (0) ('hello')  // => just('h')
 * at (-1) ('hello') // => just('o')
 * at (9) ('hello')  // => nothing()
 */
export function at (i) {
  return (s) => {
    if (!isString (s)) return M.nothing ()
    const idx = i < 0 ? s.length + i : i
    return idx >= 0 && idx < s.length ? M.just (s[idx]) : M.nothing ()
  }
}

/**
 * Splits a string into an array of individual characters (Unicode code points).
 * Correctly handles surrogate pairs (emoji, etc.).
 * @example
 * // chars :: String -> Array String
 * chars ('hello') // => ['h', 'e', 'l', 'l', 'o']
 * chars ('')      // => []
 * chars ('hi😀')  // => ['h', 'i', '😀']
 */
export function chars (s) {
  return isString (s) ? [...s] : []
}
