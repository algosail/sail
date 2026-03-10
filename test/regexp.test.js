import test from 'brittle'
import {
  equals, regex, regexEscape, test as reTest, match, matchAll, replace,
} from '../lib/regexp.js'
import { isJust, isNothing } from '../lib/maybe.js'

// =============================================================================
// equals
// =============================================================================

test ('equals returns true for regexes with identical source and flags', (t) => {
  t.ok (equals (/a/g) (/a/g))
  t.ok (equals (/[0-9]+/i) (/[0-9]+/i))
  t.ok (equals (/^hello$/) (/^hello$/))
  t.ok (equals (/x/gimsuy) (/x/gimsuy))
})

test ('equals returns false for regexes with different source', (t) => {
  t.absent (equals (/a/) (/b/))
  t.absent (equals (/[0-9]/) (/[a-z]/))
  t.absent (equals (/^foo/) (/^bar/))
})

test ('equals returns false for regexes with different flags', (t) => {
  t.absent (equals (/a/g) (/a/))
  t.absent (equals (/a/i) (/a/g))
  t.absent (equals (/a/) (/a/i))
  // /a/gi and /a/ig have the same flags in JS — both are global+ignoreCase
  t.ok (equals (/a/gi) (/a/ig))
})

test ('equals returns false when global flag differs', (t) => {
  t.absent (equals (/a/g) (/a/))
  t.ok (equals (/a/g) (/a/g))
})

test ('equals returns false when ignoreCase flag differs', (t) => {
  t.absent (equals (/a/i) (/a/))
  t.ok (equals (/a/i) (/a/i))
})

test ('equals returns false when multiline flag differs', (t) => {
  t.absent (equals (/a/m) (/a/))
  t.ok (equals (/a/m) (/a/m))
})

// =============================================================================
// regex
// =============================================================================

test ('regex constructs a RegExp from flags and source', (t) => {
  const r = regex ('g') ('[0-9]+')
  t.ok (r instanceof RegExp)
  t.is (r.source, '[0-9]+')
  t.ok (r.global)
})

test ('regex with empty flags', (t) => {
  const r = regex ('') ('hello')
  t.ok (r instanceof RegExp)
  t.is (r.source, 'hello')
  t.absent (r.global)
  t.absent (r.ignoreCase)
})

test ('regex with multiple flags', (t) => {
  const r = regex ('gi') ('abc')
  t.ok (r.global)
  t.ok (r.ignoreCase)
})

test ('regex with ignoreCase flag makes pattern case-insensitive', (t) => {
  const r = regex ('i') ('hello')
  t.ok (r.test ('HELLO'))
  t.ok (r.test ('Hello'))
})

test ('regex constructs a pattern that can be used for matching', (t) => {
  const r = regex ('g') ('\\d+')
  const matches = '123 abc 456'.match (r)
  t.alike (matches, ['123', '456'])
})

// =============================================================================
// regexEscape
// =============================================================================

test ('regexEscape escapes all regex metacharacters', (t) => {
  const escaped = regexEscape ('a.b')
  t.ok (new RegExp (escaped).test ('a.b'))
  t.absent (new RegExp (escaped).test ('axb'))
})

test ('regexEscape handles common metacharacters', (t) => {
  const special = '.+*?^${}[]|()\\'
  const escaped = regexEscape (special)
  t.ok (typeof escaped === 'string')
  // The escaped version should match the literal string
  t.ok (new RegExp (escaped).test (special))
})

test ('regexEscape on a plain string returns the same string', (t) => {
  t.is (regexEscape ('hello'), 'hello')
  t.is (regexEscape ('abc123'), 'abc123')
})

test ('regexEscape handles brackets', (t) => {
  const escaped = regexEscape ('[1-9]')
  t.ok (new RegExp (escaped).test ('[1-9]'))
  t.absent (new RegExp (escaped).test ('5'))
})

test ('regexEscape handles the caret and dollar', (t) => {
  const escaped = regexEscape ('^start$')
  t.ok (new RegExp (escaped).test ('^start$'))
  t.absent (new RegExp ('^' + escaped + '$').test ('start'))
})

test ('regexEscape makes arbitrary strings safe for use in regex', (t) => {
  const user = 'price: $5.00 (each)'
  const escaped = regexEscape (user)
  t.ok (new RegExp (escaped).test (user))
})

// =============================================================================
// test (reTest)
// =============================================================================

test ('reTest returns true when pattern matches the string', (t) => {
  t.ok (reTest (/^a/) ('abacus'))
  t.ok (reTest (/\d+/) ('abc123'))
  t.ok (reTest (/hello/i) ('Hello World'))
})

test ('reTest returns false when pattern does not match', (t) => {
  t.absent (reTest (/^b/) ('abacus'))
  t.absent (reTest (/\d+/) ('abcdef'))
  t.absent (reTest (/xyz/) ('hello world'))
})

test ('reTest is stateless — does not change lastIndex of a global regex', (t) => {
  const re = /\d+/g
  re.lastIndex = 3
  reTest (re) ('abc123def456')
  t.is (re.lastIndex, 3)
})

test ('reTest does not mutate lastIndex even after a match with a global regex', (t) => {
  const re = /a/g
  const original = re.lastIndex
  reTest (re) ('banana')
  t.is (re.lastIndex, original)
})

test ('reTest works with non-global regex multiple times consistently', (t) => {
  const re = /cat/
  t.ok (reTest (re) ('concatenate'))
  t.ok (reTest (re) ('concatenate'))
  t.ok (reTest (re) ('concatenate'))
})

// =============================================================================
// match
// =============================================================================

test ('match returns Just of capture groups when pattern matches', (t) => {
  const m = match (/(\w+)\s(\w+)/) ('hello world')
  t.ok (isJust (m))
  t.alike (m.value, ['hello', 'world'])
})

test ('match returns Nothing when pattern does not match', (t) => {
  t.ok (isNothing (match (/(\d+)/) ('abc')))
  t.ok (isNothing (match (/^xyz/) ('hello')))
})

test ('match excludes the full match — only capture groups are returned', (t) => {
  const m = match (/(\w+)/) ('hello world')
  t.ok (isJust (m))
  t.alike (m.value, ['hello'])
})

test ('match returns empty array of groups when there are no capture groups', (t) => {
  const m = match (/\w+/) ('hello')
  t.ok (isJust (m))
  t.alike (m.value, [])
})

test ('match returns empty string for unmatched optional capture groups', (t) => {
  // Use a pattern where the optional group clearly cannot match
  // (?:[a-z]+)? — optional lowercase letters, then digits
  const m = match (/([a-z]+)?(\d+)/) ('123')
  t.ok (isJust (m))
  t.is (m.value[0], '')   // optional [a-z]+ did not match (string starts with digit)
  t.is (m.value[1], '123')
})

test ('match with multiple capture groups', (t) => {
  const m = match (/(\d{4})-(\d{2})-(\d{2})/) ('2020-06-15')
  t.ok (isJust (m))
  t.alike (m.value, ['2020', '06', '15'])
})

test ('match with a case-insensitive flag', (t) => {
  const m = match (/([a-z]+)/i) ('HELLO')
  t.ok (isJust (m))
  t.alike (m.value, ['HELLO'])
})

// =============================================================================
// matchAll
// =============================================================================

test ('matchAll returns all capture group arrays for all matches', (t) => {
  const result = matchAll (/(\w+)/g) ('hi there')
  t.alike (result, [['hi'], ['there']])
})

test ('matchAll returns an empty array when there are no matches', (t) => {
  t.alike (matchAll (/\d+/g) ('abc'), [])
})

test ('matchAll returns all occurrences with multiple capture groups', (t) => {
  const result = matchAll (/(\w+)=(\w+)/g) ('a=1 b=2 c=3')
  t.alike (result, [['a', '1'], ['b', '2'], ['c', '3']])
})

test ('matchAll returns empty string for unmatched optional groups', (t) => {
  const result = matchAll (/(\d+)([a-z])?/g) ('1a 2 3b')
  t.alike (result, [['1', 'a'], ['2', ''], ['3', 'b']])
})

test ('matchAll does not mutate the regex lastIndex after completion', (t) => {
  const re = /\w+/g
  re.lastIndex = 2
  matchAll (re) ('hello world')
  t.is (re.lastIndex, 2)
})

test ('matchAll can be called multiple times on the same regex', (t) => {
  const re = /(\d+)/g
  const r1 = matchAll (re) ('1 2 3')
  const r2 = matchAll (re) ('4 5 6')
  t.alike (r1, [['1'], ['2'], ['3']])
  t.alike (r2, [['4'], ['5'], ['6']])
})

test ('matchAll returns empty arrays of groups when there are no capture groups', (t) => {
  const result = matchAll (/\w+/g) ('hi there')
  t.alike (result, [[], []])
})

// =============================================================================
// replace
// =============================================================================

test ('replace substitutes the first match using a function over capture groups', (t) => {
  const result = replace (([w]) => w.toUpperCase ()) (/(\w+)/) ('hello world')
  t.is (result, 'HELLO world')
})

test ('replace with global flag replaces all matches', (t) => {
  const result = replace (([w]) => w.toUpperCase ()) (/(\w+)/g) ('hello world')
  t.is (result, 'HELLO WORLD')
})

test ('replace passes empty string for unmatched optional groups', (t) => {
  let received = null
  replace ((groups) => { received = groups; return 'x' }) (/(\d+)([a-z])?/) ('123')
  t.alike (received, ['123', ''])
})

test ('replace with no capture groups passes an empty array to the function', (t) => {
  let received = null
  replace ((groups) => { received = groups; return 'X' }) (/a/) ('cat')
  t.alike (received, [])
  t.is ('cat'.replace (/a/, () => 'X'), 'cXt')
})

test ('replace returns original string when pattern does not match', (t) => {
  const result = replace ((_groups) => 'X') (/\d+/) ('hello')
  t.is (result, 'hello')
})

test ('replace with multiple capture groups passes all to the function', (t) => {
  const result = replace (([year, month, day]) => `${day}/${month}/${year}`) (
    /(\d{4})-(\d{2})-(\d{2})/,
  ) ('Date: 2020-06-15')
  t.is (result, 'Date: 15/06/2020')
})

test ('replace can use global regex to transform all matches', (t) => {
  const result = replace (([n]) => String (Number (n) * 2)) (/(\d+)/g) ('1 2 3 4')
  t.is (result, '2 4 6 8')
})

test ('replace can insert a fixed string by ignoring groups', (t) => {
  const result = replace (() => 'X') (/a/) ('cat')
  t.is (result, 'cXt')
})
