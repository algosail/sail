// string.js
// String comparison, concatenation, and utility functions.

import * as M from './maybe.js'

/**
 * Returns `true` for both string primitives and `String` wrapper objects. Use it as a
 * type guard before string operations to avoid runtime errors when working with
 * mixed-type data, or pass it directly to `filter` to extract strings from a
 * heterogeneous array.
 * @example
 * // isString :: a -> Boolean
 * isString ('hi')
 * // => true
 * isString (42)
 * // => false
 * isString (null)
 * // => false
 */
export function isString (a) {
  return typeof a === 'string' || a instanceof String
}

/**
 * Returns `true` only when both arguments are strings with identical content
 * (case-sensitive, no coercion). Unlike loose equality, this never coerces non-string
 * values, making it safe to use as a strict comparator in lookup tables or
 * deduplication logic.
 * @example
 * // equals :: String -> String -> Boolean
 * equals ('a') ('a')
 * // => true
 * equals ('A') ('a')
 * // => false
 * equals ('hi') (42)
 * // => false
 */
export function equals (a) {
  return (b) => isString (a) && isString (b) && a === b
}

/**
 * Returns `true` when `a` is lexicographically less than or equal to `b`, using
 * JavaScript's built-in Unicode code-point order. This is useful for sorting or
 * ordering strings in pipelines, and serves as the foundation for `lt`, `gte`, and `gt`.
 * @example
 * // lte :: String -> String -> Boolean
 * lte ('a') ('b')
 * // => true
 * lte ('b') ('b')
 * // => true
 * lte ('c') ('b')
 * // => false
 */
export function lte (a) {
  return (b) => isString (a) && isString (b) && a <= b
}

/**
 * Returns `true` when `a` is lexicographically strictly less than `b`. Being curried,
 * it can be partially applied to produce a reusable comparator for use in conditional
 * guards or pipeline-based sorting logic.
 * @example
 * // lt :: String -> String -> Boolean
 * lt ('a') ('b')
 * // => true
 * lt ('b') ('b')
 * // => false
 */
export function lt (a) {
  return (b) => lte (a) (b) && !lte (b) (a)
}

/**
 * Returns `true` when `a` is lexicographically greater than or equal to `b`, derived
 * from `lte` by flipping its arguments. Useful for enforcing lower-bound constraints
 * on string values in validation pipelines.
 * @example
 * // gte :: String -> String -> Boolean
 * gte ('b') ('a')
 * // => true
 * gte ('b') ('b')
 * // => true
 * gte ('a') ('b')
 * // => false
 */
export function gte (a) {
  return (b) => lte (b) (a)
}

/**
 * Returns `true` when `a` is lexicographically strictly greater than `b`. The curried
 * form can be partially applied to produce a reusable "greater than this value"
 * predicate for `filter` or conditional logic.
 * @example
 * // gt :: String -> String -> Boolean
 * gt ('b') ('a')
 * // => true
 * gt ('a') ('b')
 * // => false
 */
export function gt (a) {
  return (b) => lte (b) (a) && !lte (a) (b)
}

/**
 * Returns the lexicographically smaller of two strings. Useful for computing lower
 * bounds or finding the alphabetically first string in a `reduce` pipeline without
 * importing a separate sort utility.
 * @example
 * // min :: String -> String -> String
 * min ('a') ('b')
 * // => 'a'
 * min ('z') ('m')
 * // => 'm'
 */
export function min (a) {
  return (b) => (lte (a) (b) ? a : b)
}

/**
 * Returns the lexicographically larger of two strings. Useful for computing upper
 * bounds or finding the alphabetically last string in a `reduce` pipeline without
 * importing a separate sort utility.
 * @example
 * // max :: String -> String -> String
 * max ('a') ('b')
 * // => 'b'
 * max ('z') ('m')
 * // => 'z'
 */
export function max (a) {
  return (b) => (lte (b) (a) ? a : b)
}

/**
 * Constrains a string to the lexicographic range `[lo, hi]`, returning `lo` if the
 * string is below the range and `hi` if it is above. Useful when you need to enforce
 * alphabetical bounds — for example clamping a user-supplied sort key to a valid range.
 * @example
 * // clamp :: String -> String -> String -> String
 * clamp ('b') ('d') ('e')
 * // => 'd'
 * clamp ('b') ('d') ('a')
 * // => 'b'
 * clamp ('b') ('d') ('c')
 * // => 'c'
 */
export function clamp (lo) {
  return (hi) => (x) => (lte (x) (lo) ? lo : lte (hi) (x) ? hi : x)
}

/**
 * Concatenates two strings, returning `''` if either argument is not a valid string.
 * This safe default avoids runtime exceptions in pipelines that may receive `null` or
 * non-string values. For combining many strings, prefer `joinWith` or `unwords`.
 * @example
 * // concat :: String -> String -> String
 * concat ('foo') ('bar')
 * // => 'foobar'
 * concat ('hello, ') ('world')
 * // => 'hello, world'
 */
export function concat (a) {
  return (b) => (isString (a) && isString (b) ? a + b : '')
}

/** empty :: String — the identity element for concat. */
export const empty = ''

/**
 * Returns the number of UTF-16 code units in the string, equivalent to `.length`.
 * Note that characters outside the Basic Multilingual Plane (e.g. most emoji) count as
 * 2 units — use `chars` if you need a count of Unicode code points. Returns `0` for
 * non-string input instead of throwing.
 * @example
 * // size :: String -> Integer
 * size ('hello')
 * // => 5
 * size ('')
 * // => 0
 */
export function size (s) {
  return isString (s) ? s.length : 0
}

/**
 * Returns `true` when `s` contains `needle` as a substring. The curried form —
 * `includes ('keyword')` — produces a ready-made predicate that can be passed directly
 * to `filter` to select matching strings from an array without wrapping in a lambda.
 * @example
 * // includes :: String -> String -> Boolean
 * includes ('ell') ('hello')
 * // => true
 * includes ('xyz') ('hello')
 * // => false
 */
export function includes (needle) {
  return (s) => isString (s) && isString (needle) && s.includes (needle)
}

/**
 * Returns `true` when `s` begins with the given prefix. The curried form is useful as a
 * predicate in `filter` or as a conditional guard in routing logic — for example,
 * `filter (startsWith ('/api'))` selects all API route paths from an array.
 * @example
 * // startsWith :: String -> String -> Boolean
 * startsWith ('he') ('hello')
 * // => true
 * startsWith ('lo') ('hello')
 * // => false
 */
export function startsWith (prefix) {
  return (s) => isString (s) && isString (prefix) && s.startsWith (prefix)
}

/**
 * Returns `true` when `s` ends with the given suffix. Use the curried form in `filter`
 * to select file names by extension (e.g. `filter (endsWith ('.ts'))`) or to validate
 * that strings conform to a required suffix.
 * @example
 * // endsWith :: String -> String -> Boolean
 * endsWith ('lo') ('hello')
 * // => true
 * endsWith ('he') ('hello')
 * // => false
 */
export function endsWith (suffix) {
  return (s) => isString (s) && isString (suffix) && s.endsWith (suffix)
}

/**
 * Replaces the *first* occurrence of `search` (a string or regex) within `s` with
 * `replacement`. The triple-curried form composes naturally in `pipe`; for example,
 * `replace (/foo/) ('bar')` can be mapped over an array of strings to fix the first
 * occurrence in each. Use `replaceAll` when you need global substitution.
 * @example
 * // replace :: String -> String -> String -> String
 * replace ('l') ('r') ('hello')
 * // => 'herlo'
 * replace (/\d+/) ('NUM') ('item 42 and 7')
 * // => 'item NUM and 7'
 */
export function replace (search) {
  return (replacement) => (s) =>
    isString (s) ? s.replace (search, replacement) : ''
}

/**
 * Replaces *every* occurrence of `search` (a string or global regex) within `s` with
 * `replacement`. Prefer this over `replace` when you need global substitution without
 * manually adding the `g` flag to a regex. The triple-curried form makes it easy to
 * map a single substitution over an array of strings.
 * @example
 * // replaceAll :: String -> String -> String -> String
 * replaceAll ('l') ('r') ('hello')
 * // => 'herro'
 * replaceAll (' ') ('_') ('hello world foo')
 * // => 'hello_world_foo'
 */
export function replaceAll (search) {
  return (replacement) => (s) =>
    isString (s) ? s.replaceAll (search, replacement) : ''
}

/**
 * Pads the beginning of `s` to `len` total characters using `padStr` as fill. This is
 * the canonical way to zero-pad numbers for display (e.g. hours or days in a time
 * string) without mutating the original string. If `s` is already longer than `len`,
 * it is returned unchanged.
 * @example
 * // padStart :: Integer -> String -> String -> String
 * padStart (5) ('0') ('42')
 * // => '00042'
 * padStart (4) (' ') ('hi')
 * // => '  hi'
 */
export function padStart (len) {
  return (padStr) => (s) =>
    isString (s) ? s.padStart (len, padStr) : ''
}

/**
 * Pads the end of `s` to `len` total characters using `padStr` as fill. Useful for
 * fixed-width columns in plain-text tables or for left-aligning text in tabular output.
 * If `s` is already longer than `len`, it is returned unchanged.
 * @example
 * // padEnd :: Integer -> String -> String -> String
 * padEnd (5) ('0') ('42')
 * // => '42000'
 * padEnd (4) (' ') ('hi')
 * // => 'hi  '
 */
export function padEnd (len) {
  return (padStr) => (s) =>
    isString (s) ? s.padEnd (len, padStr) : ''
}

/**
 * Returns `s` repeated `n` times, or an empty string for `n = 0`. This lets you
 * programmatically build separators, padding strings, or repetitive patterns without
 * manual loops. Returns an empty string for invalid inputs (negative `n` or
 * non-string `s`).
 * @example
 * // repeat :: Integer -> String -> String
 * repeat (3) ('ab')
 * // => 'ababab'
 * repeat (0) ('ab')
 * // => ''
 */
export function repeat (n) {
  return (s) => isString (s) && n >= 0 ? s.repeat (n) : ''
}

/**
 * Converts all characters of `s` to upper case using the default locale. This is a
 * lossy operation for some Unicode characters — the result may not round-trip through
 * `toLower`. Use in normalisation pipelines or when preparing strings for
 * case-insensitive display.
 * @example
 * // toUpper :: String -> String
 * toUpper ('hello')
 * // => 'HELLO'
 * toUpper ('Héllo')
 * // => 'HÉLLO'
 */
export function toUpper (s) {
  return isString (s) ? s.toUpperCase () : ''
}

/**
 * Converts all characters of `s` to lower case using the default locale. Use it in
 * normalisation pipelines — for example, compose `toLower` with `equals` to perform a
 * case-insensitive comparison, or apply it before sorting to achieve consistent ordering.
 * @example
 * // toLower :: String -> String
 * toLower ('HELLO')
 * // => 'hello'
 * toLower ('FooBAR')
 * // => 'foobar'
 */
export function toLower (s) {
  return isString (s) ? s.toLowerCase () : ''
}

/**
 * Removes leading and trailing whitespace from `s`, including spaces, tabs, and
 * newlines. It is essential in input-handling pipelines where user-supplied strings
 * must be normalised before validation or storage — compose `trim` early in a `pipe`
 * to ensure downstream functions receive clean input.
 * @example
 * // trim :: String -> String
 * trim ('  hi  ')
 * // => 'hi'
 * trim ('\t hello\n')
 * // => 'hello'
 */
export function trim (s) {
  return isString (s) ? s.trim () : ''
}

/**
 * Returns `Just` the string with the prefix removed if `s` starts with it, otherwise
 * `Nothing`. This is safer than slicing by a fixed offset because it explicitly
 * documents the expected prefix, and the `Maybe` return type forces callers to handle
 * the no-match case using `Maybe`-aware combinators such as `getOrElse` or `chain`.
 * @example
 * // stripPrefix :: String -> String -> Maybe String
 * stripPrefix ('foo') ('foobar')
 * // => just('bar')
 * stripPrefix ('baz') ('foobar')
 * // => nothing()
 */
export function stripPrefix (prefix) {
  return (s) =>
    isString (s) && isString (prefix) && s.startsWith (prefix)
      ? M.just (s.slice (prefix.length))
      : M.nothing ()
}

/**
 * Returns `Just` the string with the suffix removed if `s` ends with it, otherwise
 * `Nothing`. Like `stripPrefix`, the `Maybe` return type makes it composable with
 * `Maybe`-aware utilities — for example, chain it with a parser to safely strip and
 * process a known file extension.
 * @example
 * // stripSuffix :: String -> String -> Maybe String
 * stripSuffix ('bar') ('foobar')
 * // => just('foo')
 * stripSuffix ('.ts') ('index.ts')
 * // => just('index')
 * stripSuffix ('.js') ('index.ts')
 * // => nothing()
 */
export function stripSuffix (suffix) {
  return (s) =>
    isString (s) && isString (suffix) && s.endsWith (suffix)
      ? M.just (s.slice (0, s.length - suffix.length))
      : M.nothing ()
}

/**
 * Splits a string on any run of whitespace, ignoring leading and trailing empty tokens.
 * This mirrors Haskell's `words` and is more robust than `split (' ')` when input
 * contains multiple consecutive spaces or surrounding whitespace.
 * @example
 * // words :: String -> Array String
 * words ('  foo bar  ')
 * // => ['foo', 'bar']
 * words ('one  two\tthree')
 * // => ['one', 'two', 'three']
 */
export function words (s) {
  const ws = isString (s) ? s.split (/\s+/) : []
  const len = ws.length
  return ws.slice (ws[0] === '' ? 1 : 0, ws[len - 1] === '' ? len - 1 : len)
}

/**
 * Joins an array of strings with a single space between each element. It is the
 * inverse of `words` and is useful for reassembling tokenised words into a
 * human-readable string after filtering or transforming individual tokens.
 * @example
 * // unwords :: Array String -> String
 * unwords (['foo', 'bar'])
 * // => 'foo bar'
 * unwords (['hello', 'world', '!'])
 * // => 'hello world !'
 */
export function unwords (xs) {
  return xs.join (' ')
}

/**
 * Splits a string into lines, correctly handling `\n`, `\r\n`, and `\r` as line
 * endings. The empty string yields `[]`, avoiding the spurious empty-token pitfall of
 * a naive `split ('\n')`. Use this for parsing multi-line text input or reading file
 * contents line by line.
 * @example
 * // lines :: String -> Array String
 * lines ('a\nb')
 * // => ['a', 'b']
 * lines ('a\r\nb\rc')
 * // => ['a', 'b', 'c']
 * lines ('')
 * // => []
 */
export function lines (s) {
  const t = isString (s) ? s : ''
  return t === '' ? [] : t.replace (/\r\n?/g, '\n').match (/^(?=[\s\S]).*/gm)
}

/**
 * Joins an array of strings into a single string by appending a newline `'\n'` after
 * each element. This mirrors Haskell's `unlines` — note that the result always ends
 * with a newline, which is the POSIX convention for text files.
 * @example
 * // unlines :: Array String -> String
 * unlines (['a', 'b'])
 * // => 'a\nb\n'
 * unlines (['first', 'second', 'third'])
 * // => 'first\nsecond\nthird\n'
 */
export function unlines (xs) {
  return xs.reduce ((acc, x) => acc + x + '\n', '')
}

/**
 * Splits `s` on every occurrence of the separator string `sep`. Unlike
 * `String.prototype.split`, both arguments are curried, making `splitOn (',')` a
 * reusable CSV-splitter that can be mapped over an array of raw strings in a pipeline
 * without writing a lambda.
 * @example
 * // splitOn :: String -> String -> Array String
 * splitOn (',') ('a,b,c')
 * // => ['a', 'b', 'c']
 * splitOn ('::') ('foo::bar::baz')
 * // => ['foo', 'bar', 'baz']
 */
export function splitOn (sep) {
  return (s) => (isString (s) && isString (sep) ? s.split (sep) : [])
}

/**
 * Splits `s` using a regex pattern that must carry the `g` flag. Unlike the native
 * method, this implementation safely resets `lastIndex` before and after each call so
 * stateful regexes do not corrupt subsequent uses. Use this instead of `splitOn` when
 * your delimiter has variable form and needs to be described by a pattern.
 * @example
 * // splitOnRegex :: RegExp -> String -> Array String
 * splitOnRegex (/,/g) ('a,b,c')
 * // => ['a', 'b', 'c']
 * splitOnRegex (/,\s+/g) ('a, b, c')
 * // => ['a', 'b', 'c']
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
 * Joins an array of strings with the given separator between elements. The curried
 * form — `joinWith (', ')` — is a pipeline-ready aggregator that pairs naturally with
 * `splitOn` to transform and reassemble delimited text, or with `words` and `unwords`
 * for whitespace-separated strings.
 * @example
 * // joinWith :: String -> Array String -> String
 * joinWith ('-') (['a', 'b', 'c'])
 * // => 'a-b-c'
 * joinWith (', ') (['red', 'green', 'blue'])
 * // => 'red, green, blue'
 */
export function joinWith (sep) {
  return (xs) => xs.join (isString (sep) ? sep : '')
}

/**
 * Extracts a substring from index `from` (inclusive) to `to` (exclusive), supporting
 * negative indices that count from the end of the string. This safe wrapper returns an
 * empty string for non-string input rather than throwing, making it suitable for use in
 * pipelines over unvalidated data. The triple-curried form lets you fix the indices
 * once and apply the slice to many strings.
 * @example
 * // slice :: Integer -> Integer -> String -> String
 * slice (1) (3) ('hello')
 * // => 'el'
 * slice (0) (5) ('hello')
 * // => 'hello'
 * slice (-3) (-1) ('hello')
 * // => 'll'
 * slice (2) (2) ('hello')
 * // => ''
 */
export function slice (from) {
  return (to) => (s) => isString (s) ? s.slice (from, to) : ''
}

/**
 * Returns `Just` the character at position `i`, or `Nothing` for out-of-bounds indices.
 * Supports negative indices (−1 is the last character). The `Maybe` return type forces
 * callers to handle the absent case explicitly, rather than silently receiving
 * `undefined` as the native `charAt` does for invalid indices.
 * @example
 * // at :: Integer -> String -> Maybe String
 * at (0) ('hello')
 * // => just('h')
 * at (-1) ('hello')
 * // => just('o')
 * at (9) ('hello')
 * // => nothing()
 */
export function at (i) {
  return (s) => {
    if (!isString (s)) return M.nothing ()
    const idx = i < 0 ? s.length + i : i
    return idx >= 0 && idx < s.length ? M.just (s[idx]) : M.nothing ()
  }
}

/**
 * Splits a string into an array of individual Unicode code points, correctly handling
 * surrogate pairs such as emoji or CJK extension characters. Unlike iterating over
 * `.length` indices, this uses the iterable spread `[...s]` which respects Unicode
 * boundaries. Use this instead of `size` when you need an accurate character count
 * for multibyte strings.
 * @example
 * // chars :: String -> Array String
 * chars ('hello')
 * // => ['h', 'e', 'l', 'l', 'o']
 * chars ('')
 * // => []
 * chars ('hi😀')
 * // => ['h', 'i', '😀']
 */
export function chars (s) {
  return isString (s) ? [...s] : []
}
