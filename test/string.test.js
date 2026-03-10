import test from 'brittle'
import {
  isString, equals, lte, lt, gte, gt, min, max, clamp,
  concat, empty,
  size, includes, startsWith, endsWith,
  replace, replaceAll, padStart, padEnd, repeat,
  toUpper, toLower, trim,
  stripPrefix, stripSuffix,
  words, unwords, lines, unlines,
  splitOn, splitOnRegex, joinWith,
} from '../lib/string.js'
import { isJust, isNothing } from '../lib/maybe.js'

// =============================================================================
// isString
// =============================================================================

test ('isString returns true for string primitives', (t) => {
  t.ok (isString (''))
  t.ok (isString ('hello'))
  t.ok (isString ('42'))
})

test ('isString returns true for String objects', (t) => {
   
  t.ok (isString (new String ('hi')))
})

test ('isString returns false for non-strings', (t) => {
  t.absent (isString (42))
  t.absent (isString (null))
  t.absent (isString (undefined))
  t.absent (isString (true))
  t.absent (isString ([]))
  t.absent (isString ({}))
})

// =============================================================================
// empty
// =============================================================================

test ('empty is an empty string', (t) => {
  t.is (empty, '')
})

// =============================================================================
// equals
// =============================================================================

test ('equals returns true for identical strings', (t) => {
  t.ok (equals ('hello') ('hello'))
  t.ok (equals ('') (''))
})

test ('equals returns false for different strings', (t) => {
  t.absent (equals ('hello') ('world'))
  t.absent (equals ('a') ('A'))
})

test ('equals returns false when either argument is not a string', (t) => {
  t.absent (equals (42) ('42'))
  t.absent (equals ('42') (42))
  t.absent (equals (null) (null))
})

// =============================================================================
// Ord: lte / lt / gte / gt / min / max / clamp
// =============================================================================

test ('lte returns true for lexicographically <=', (t) => {
  t.ok (lte ('a') ('b'))
  t.ok (lte ('a') ('a'))
  t.absent (lte ('b') ('a'))
})

test ('lt returns true for strict lexicographic <', (t) => {
  t.ok (lt ('a') ('b'))
  t.absent (lt ('a') ('a'))
  t.absent (lt ('b') ('a'))
})

test ('gte returns true for lexicographically >=', (t) => {
  t.ok (gte ('b') ('a'))
  t.ok (gte ('a') ('a'))
  t.absent (gte ('a') ('b'))
})

test ('gt returns true for strict lexicographic >', (t) => {
  t.ok (gt ('b') ('a'))
  t.absent (gt ('a') ('a'))
  t.absent (gt ('a') ('b'))
})

test ('min returns the lexicographically smaller string', (t) => {
  t.is (min ('a') ('b'), 'a')
  t.is (min ('z') ('a'), 'a')
  t.is (min ('x') ('x'), 'x')
})

test ('max returns the lexicographically larger string', (t) => {
  t.is (max ('a') ('b'), 'b')
  t.is (max ('z') ('a'), 'z')
  t.is (max ('x') ('x'), 'x')
})

test ('clamp restricts a string to the given lexicographic range', (t) => {
  t.is (clamp ('b') ('d') ('a'), 'b')
  t.is (clamp ('b') ('d') ('c'), 'c')
  t.is (clamp ('b') ('d') ('e'), 'd')
  t.is (clamp ('b') ('d') ('b'), 'b')
  t.is (clamp ('b') ('d') ('d'), 'd')
})

// =============================================================================
// concat
// =============================================================================

test ('concat concatenates two strings', (t) => {
  t.is (concat ('foo') ('bar'), 'foobar')
  t.is (concat ('') ('hello'), 'hello')
  t.is (concat ('hello') (''), 'hello')
  t.is (concat ('') (''), '')
})

test ('concat returns empty string when either argument is not a string', (t) => {
  t.is (concat (42) ('hi'), '')
  t.is (concat ('hi') (42), '')
})

// =============================================================================
// size
// =============================================================================

test ('size returns the number of characters', (t) => {
  t.is (size ('hello'), 5)
  t.is (size (''), 0)
  t.is (size ('abc'), 3)
})

test ('size returns 0 for non-string input', (t) => {
  t.is (size (null), 0)
  t.is (size (42), 0)
})

// =============================================================================
// includes / startsWith / endsWith
// =============================================================================

test ('includes returns true when substring is present', (t) => {
  t.ok (includes ('ell') ('hello'))
  t.ok (includes ('') ('hello'))
  t.ok (includes ('hello') ('hello'))
})

test ('includes returns false when substring is absent', (t) => {
  t.absent (includes ('xyz') ('hello'))
  t.absent (includes ('Hello') ('hello'))
})

test ('includes returns false for non-string inputs', (t) => {
  t.absent (includes (null) ('hello'))
  t.absent (includes ('hi') (null))
})

test ('startsWith returns true when string starts with prefix', (t) => {
  t.ok (startsWith ('he') ('hello'))
  t.ok (startsWith ('') ('hello'))
  t.ok (startsWith ('hello') ('hello'))
})

test ('startsWith returns false when string does not start with prefix', (t) => {
  t.absent (startsWith ('lo') ('hello'))
  t.absent (startsWith ('HE') ('hello'))
})

test ('endsWith returns true when string ends with suffix', (t) => {
  t.ok (endsWith ('lo') ('hello'))
  t.ok (endsWith ('') ('hello'))
  t.ok (endsWith ('hello') ('hello'))
})

test ('endsWith returns false when string does not end with suffix', (t) => {
  t.absent (endsWith ('he') ('hello'))
  t.absent (endsWith ('LO') ('hello'))
})

// =============================================================================
// replace / replaceAll
// =============================================================================

test ('replace replaces the first occurrence', (t) => {
  t.is (replace ('l') ('r') ('hello'), 'herlo')
  t.is (replace ('a') ('b') ('banana'), 'bbnana')
})

test ('replace returns the original string when search is not found', (t) => {
  t.is (replace ('z') ('x') ('hello'), 'hello')
})

test ('replace returns empty string for non-string input', (t) => {
  t.is (replace ('l') ('r') (null), '')
})

test ('replaceAll replaces all occurrences', (t) => {
  t.is (replaceAll ('l') ('r') ('hello'), 'herro')
  t.is (replaceAll ('a') ('o') ('banana'), 'bonono')
})

test ('replaceAll returns empty string for non-string input', (t) => {
  t.is (replaceAll ('l') ('r') (null), '')
})

// =============================================================================
// padStart / padEnd / repeat
// =============================================================================

test ('padStart pads the start to the given length', (t) => {
  t.is (padStart (5) ('0') ('42'), '00042')
  t.is (padStart (3) ('0') ('42'), '042')
  t.is (padStart (2) ('0') ('42'), '42')
})

test ('padStart returns empty string for non-string input', (t) => {
  t.is (padStart (5) ('0') (null), '')
})

test ('padEnd pads the end to the given length', (t) => {
  t.is (padEnd (5) ('0') ('42'), '42000')
  t.is (padEnd (3) ('0') ('42'), '420')
  t.is (padEnd (2) ('0') ('42'), '42')
})

test ('padEnd returns empty string for non-string input', (t) => {
  t.is (padEnd (5) ('0') (null), '')
})

test ('repeat repeats a string n times', (t) => {
  t.is (repeat (3) ('ab'), 'ababab')
  t.is (repeat (1) ('ab'), 'ab')
  t.is (repeat (0) ('ab'), '')
})

test ('repeat returns empty string for non-string input', (t) => {
  t.is (repeat (3) (null), '')
})

// =============================================================================
// toUpper / toLower / trim
// =============================================================================

test ('toUpper converts string to uppercase', (t) => {
  t.is (toUpper ('hello'), 'HELLO')
  t.is (toUpper ('Hello World'), 'HELLO WORLD')
  t.is (toUpper (''), '')
})

test ('toUpper returns empty string for non-string input', (t) => {
  t.is (toUpper (null), '')
})

test ('toLower converts string to lowercase', (t) => {
  t.is (toLower ('HELLO'), 'hello')
  t.is (toLower ('Hello World'), 'hello world')
  t.is (toLower (''), '')
})

test ('toLower returns empty string for non-string input', (t) => {
  t.is (toLower (null), '')
})

test ('trim removes leading and trailing whitespace', (t) => {
  t.is (trim ('  hi  '), 'hi')
  t.is (trim ('  '), '')
  t.is (trim ('hello'), 'hello')
  t.is (trim (''), '')
})

test ('trim returns empty string for non-string input', (t) => {
  t.is (trim (null), '')
})

// =============================================================================
// stripPrefix / stripSuffix
// =============================================================================

test ('stripPrefix returns Just the remainder when prefix matches', (t) => {
  const m = stripPrefix ('foo') ('foobar')
  t.ok (isJust (m))
  t.is (m.value, 'bar')
})

test ('stripPrefix returns Just empty string when string equals prefix', (t) => {
  const m = stripPrefix ('hello') ('hello')
  t.ok (isJust (m))
  t.is (m.value, '')
})

test ('stripPrefix returns Nothing when prefix does not match', (t) => {
  t.ok (isNothing (stripPrefix ('bar') ('foobar')))
  t.ok (isNothing (stripPrefix ('FOO') ('foobar')))
})

test ('stripPrefix returns Nothing for non-string inputs', (t) => {
  t.ok (isNothing (stripPrefix (null) ('foobar')))
  t.ok (isNothing (stripPrefix ('foo') (null)))
})

test ('stripSuffix returns Just the remainder when suffix matches', (t) => {
  const m = stripSuffix ('bar') ('foobar')
  t.ok (isJust (m))
  t.is (m.value, 'foo')
})

test ('stripSuffix returns Just empty string when string equals suffix', (t) => {
  const m = stripSuffix ('hello') ('hello')
  t.ok (isJust (m))
  t.is (m.value, '')
})

test ('stripSuffix returns Nothing when suffix does not match', (t) => {
  t.ok (isNothing (stripSuffix ('foo') ('foobar')))
  t.ok (isNothing (stripSuffix ('BAR') ('foobar')))
})

// =============================================================================
// words / unwords / lines / unlines
// =============================================================================

test ('words splits on whitespace and trims', (t) => {
  t.alike (words ('foo bar'), ['foo', 'bar'])
  t.alike (words ('  foo bar  '), ['foo', 'bar'])
  t.alike (words ('foo'), ['foo'])
  t.alike (words (''), [])
  t.alike (words ('   '), [])
})

test ('words handles multiple spaces between words', (t) => {
  t.alike (words ('a  b   c'), ['a', 'b', 'c'])
})

test ('unwords joins words with a single space', (t) => {
  t.is (unwords (['foo', 'bar']), 'foo bar')
  t.is (unwords (['hello']), 'hello')
  t.is (unwords ([]), '')
})

test ('lines splits on newlines', (t) => {
  t.alike (lines ('a\nb'), ['a', 'b'])
  t.alike (lines ('a\r\nb'), ['a', 'b'])
  t.alike (lines ('a\rb'), ['a', 'b'])
  t.alike (lines ('hello'), ['hello'])
})

test ('lines returns empty array for empty string', (t) => {
  t.alike (lines (''), [])
})

test ('lines handles trailing newline', (t) => {
  const result = lines ('a\nb\n')
  t.ok (result.length >= 2)
  t.is (result[0], 'a')
  t.is (result[1], 'b')
})

test ('unlines joins with newlines appended to each line', (t) => {
  t.is (unlines (['a', 'b']), 'a\nb\n')
  t.is (unlines (['hello']), 'hello\n')
  t.is (unlines ([]), '')
})

// =============================================================================
// splitOn / splitOnRegex / joinWith
// =============================================================================

test ('splitOn splits on a separator substring', (t) => {
  t.alike (splitOn (',') ('a,b,c'), ['a', 'b', 'c'])
  t.alike (splitOn (', ') ('a, b, c'), ['a', 'b', 'c'])
  t.alike (splitOn (',') ('abc'), ['abc'])
  t.alike (splitOn (',') (''), [''])
})

test ('splitOn returns empty array for non-string input', (t) => {
  t.alike (splitOn (',') (null), [])
  t.alike (splitOn (null) ('a,b'), [])
})

test ('splitOnRegex splits on a regex pattern with the g flag', (t) => {
  t.alike (splitOnRegex (/,/g) ('a,b,c'), ['a', 'b', 'c'])
  t.alike (splitOnRegex (/\s+/g) ('a  b   c'), ['a', 'b', 'c'])
})

test ('splitOnRegex does not mutate the regex lastIndex', (t) => {
  const re = /,/g
  re.lastIndex = 5
  splitOnRegex (re) ('a,b,c')
  t.is (re.lastIndex, 5)
})

test ('joinWith joins array elements with a separator', (t) => {
  t.is (joinWith ('-') (['a', 'b', 'c']), 'a-b-c')
  t.is (joinWith (', ') (['x', 'y']), 'x, y')
  t.is (joinWith ('-') ([]), '')
  t.is (joinWith ('-') (['a']), 'a')
})

test ('joinWith uses empty string for non-string separator', (t) => {
  t.is (joinWith (null) (['a', 'b']), 'ab')
})
