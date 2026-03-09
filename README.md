# @algosail/sail

Small FP library for vanilla JS projects.

## Modules

- [`array`](#array)
- [`boolean`](#boolean)
- [`date`](#date)
- [`either`](#either)
- [`fn`](#fn)
- [`logic`](#logic)
- [`maybe`](#maybe)
- [`nil`](#nil)
- [`number`](#number)
- [`pair`](#pair)
- [`regexp`](#regexp)
- [`string`](#string)
- [`strmap`](#strmap)

---

## `array`

| Function | Signature |
|---|---|
| [`of`](#array-of) | `of :: a -> Array a` |
| [`empty`](#array-empty) | `empty :: () -> Array a` |
| [`range`](#array-range) | `range :: Integer -> Integer -> Array Integer` |
| [`unfold`](#array-unfold) | `unfold :: (b -> Maybe [a, b]) -> b -> Array a` |
| [`chainRec`](#array-chainrec) | `chainRec :: ((a -> Step, b -> Step, a) -> Array Step) -> a -> Array b` |
| [`isOutOfBounds`](#array-isoutofbounds) | `isOutOfBounds :: Number -> Array a -> Boolean` |
| [`lookup`](#array-lookup) | `lookup :: Number -> Array a -> Maybe a` |
| [`size`](#array-size) | `size :: Array a -> Integer` |
| [`array`](#array-array) | `array :: b -> (a -> Array a -> b) -> Array a -> b` |
| [`head`](#array-head) | `head :: Array a -> Maybe a` |
| [`last`](#array-last) | `last :: Array a -> Maybe a` |
| [`tail`](#array-tail) | `tail :: Array a -> Maybe (Array a)` |
| [`init`](#array-init) | `init :: Array a -> Maybe (Array a)` |
| [`all`](#array-all) | `all :: (a -> Boolean) -> Array a -> Boolean` |
| [`any`](#array-any) | `any :: (a -> Boolean) -> Array a -> Boolean` |
| [`none`](#array-none) | `none :: (a -> Boolean) -> Array a -> Boolean` |
| [`elem`](#array-elem) | `elem :: ((a, a) -> Boolean) -> a -> Array a -> Boolean` |
| [`equals`](#array-equals) | `equals :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean` |
| [`lte`](#array-lte) | `lte :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean` |
| [`find`](#array-find) | `find :: (a -> Boolean) -> Array a -> Maybe a` |
| [`findMap`](#array-findmap) | `findMap :: (a -> Maybe b) -> Array a -> Maybe b` |
| [`joinWith`](#array-joinwith) | `joinWith :: String -> Array String -> String` |
| [`reduce`](#array-reduce) | `reduce :: ((b, a) -> b) -> b -> Array a -> b` |
| [`reduceC`](#array-reducec) | `reduceC :: (b -> a -> b) -> b -> Array a -> b` |
| [`foldMap`](#array-foldmap) | `foldMap :: ((b, b) -> b) -> b -> (a -> b) -> Array a -> b` |
| [`concat`](#array-concat) | `concat :: Array a -> Array a -> Array a` |
| [`append`](#array-append) | `append :: a -> Array a -> Array a` |
| [`prepend`](#array-prepend) | `prepend :: a -> Array a -> Array a` |
| [`map`](#array-map) | `map :: (a -> b) -> Array a -> Array b` |
| [`filter`](#array-filter) | `` |
| [`reject`](#array-reject) | `reject :: (a -> Boolean) -> Array a -> Array a` |
| [`flatmap`](#array-flatmap) | `` |
| [`ap`](#array-ap) | `ap :: Array (a -> b) -> Array a -> Array b` |
| [`reverse`](#array-reverse) | `reverse :: Array a -> Array a` |
| [`sort`](#array-sort) | `sort :: ((a, a) -> Boolean) -> Array a -> Array a` |
| [`sortBy`](#array-sortby) | `sortBy :: ((b, b) -> Boolean) -> (a -> b) -> Array a -> Array a` |
| [`extend`](#array-extend) | `extend :: (Array a -> b) -> Array a -> Array b` |
| [`take`](#array-take) | `take :: Integer -> Array a -> Maybe (Array a)` |
| [`drop`](#array-drop) | `drop :: Integer -> Array a -> Maybe (Array a)` |
| [`takeLast`](#array-takelast) | `takeLast :: Integer -> Array a -> Maybe (Array a)` |
| [`dropLast`](#array-droplast) | `dropLast :: Integer -> Array a -> Maybe (Array a)` |
| [`takeWhile`](#array-takewhile) | `takeWhile :: (a -> Boolean) -> Array a -> Array a` |
| [`dropWhile`](#array-dropwhile) | `dropWhile :: (a -> Boolean) -> Array a -> Array a` |
| [`intercalate`](#array-intercalate) | `intercalate :: Array a -> Array (Array a) -> Array a` |
| [`groupBy`](#array-groupby) | `groupBy :: (a -> a -> Boolean) -> Array a -> Array (Array a)` |
| [`zip`](#array-zip) | `zip :: Array a -> Array b -> Array [a, b]` |
| [`zipWith`](#array-zipwith) | `zipWith :: (a -> b -> c) -> Array a -> Array b -> Array c` |
| [`traverse`](#array-traverse) | `traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Array a -> f (Array b)` |

### `of` {#array-of}

```
of :: a -> Array a
```

Lifts a value into a singleton array.

```js
of (1) // => [1]
```

---

### `empty` {#array-empty}

```
empty :: () -> Array a
```

Returns a new empty array.

```js
empty () // => []
```

---

### `range` {#array-range}

```
range :: Integer -> Integer -> Array Integer
```

Produces [from, from+1, ..., to-1].

```js
range (1) (4) // => [1, 2, 3]
```

---

### `unfold` {#array-unfold}

```
unfold :: (b -> Maybe [a, b]) -> b -> Array a
```

Generates an array from a seed until the stepper returns Nothing.

```js
unfold (n => n > 3 ? M.nothing () : M.just ([n, n+1])) (1) // => [1, 2, 3]
```

---

### `chainRec` {#array-chainrec}

```
chainRec :: ((a -> Step, b -> Step, a) -> Array Step) -> a -> Array b
```

Stack-safe recursive array expansion. f receives (next, done, value).

```js
chainRec ((n, d, x) => x > 2 ? [d (x)] : [n (x + 1), n (x + 2)]) (0)
```

---

### `isOutOfBounds` {#array-isoutofbounds}

```
isOutOfBounds :: Number -> Array a -> Boolean
```

True when index is negative or >= array length.

```js
isOutOfBounds (3) ([1, 2, 3]) // => true
```

---

### `lookup` {#array-lookup}

```
lookup :: Number -> Array a -> Maybe a
```

Returns Just the element at index, or Nothing if out of bounds.

```js
lookup (0) ([10, 20]) // => just(10)
```

---

### `size` {#array-size}

```
size :: Array a -> Integer
```

Returns the number of elements.

```js
size ([1, 2, 3]) // => 3
```

---

### `array` {#array-array}

```
array :: b -> (a -> Array a -> b) -> Array a -> b
```

Case analysis: returns empty value for [], or nonEmpty(head)(tail).

```js
array (0) (h => _ => h) ([5, 6]) // => 5
```

---

### `head` {#array-head}

```
head :: Array a -> Maybe a
```

Returns Just the first element, or Nothing for empty arrays.

```js
head ([1, 2, 3]) // => just(1)
```

---

### `last` {#array-last}

```
last :: Array a -> Maybe a
```

Returns Just the last element, or Nothing for empty arrays.

```js
last ([1, 2, 3]) // => just(3)
```

---

### `tail` {#array-tail}

```
tail :: Array a -> Maybe (Array a)
```

Returns Just all elements after the first, or Nothing for empty.

```js
tail ([1, 2, 3]) // => just([2,3])
```

---

### `init` {#array-init}

```
init :: Array a -> Maybe (Array a)
```

Returns Just all elements except the last, or Nothing for empty.

```js
init ([1, 2, 3]) // => just([1,2])
```

---

### `all` {#array-all}

```
all :: (a -> Boolean) -> Array a -> Boolean
```

True when every element satisfies the predicate.

```js
all (x => x > 0) ([1, 2, 3]) // => true
```

---

### `any` {#array-any}

```
any :: (a -> Boolean) -> Array a -> Boolean
```

True when at least one element satisfies the predicate.

```js
any (x => x > 2) ([1, 2, 3]) // => true
```

---

### `none` {#array-none}

```
none :: (a -> Boolean) -> Array a -> Boolean
```

True when no element satisfies the predicate.

```js
none (x => x > 5) ([1, 2, 3]) // => true
```

---

### `elem` {#array-elem}

```
elem :: ((a, a) -> Boolean) -> a -> Array a -> Boolean
```

True when x is found in arr using the comparator.

```js
elem ((a, b) => a === b) (2) ([1, 2, 3]) // => true
```

---

### `equals` {#array-equals}

```
equals :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean
```

Element-wise equality using an explicit comparator.

```js
equals ((a, b) => a === b) ([1, 2]) ([1, 2]) // => true
```

---

### `lte` {#array-lte}

```
lte :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean
```

Lexicographic ordering using an explicit lte comparator.

```js
lte ((a, b) => a <= b) ([1, 2]) ([1, 3]) // => true
```

---

### `find` {#array-find}

```
find :: (a -> Boolean) -> Array a -> Maybe a
```

Returns Just the first element satisfying the predicate, or Nothing.

```js
find (x => x > 2) ([1, 2, 3, 4]) // => just(3)
```

---

### `findMap` {#array-findmap}

```
findMap :: (a -> Maybe b) -> Array a -> Maybe b
```

Returns the first Just result from applying f to each element.

```js
findMap (x => x > 2 ? just (x * 10) : nothing ()) ([1, 2, 3]) // => just(30)
```

---

### `joinWith` {#array-joinwith}

```
joinWith :: String -> Array String -> String
```

Joins the array with a separator.

```js
joinWith (',') (['a', 'b', 'c']) // => 'a,b,c'
```

---

### `reduce` {#array-reduce}

```
reduce :: ((b, a) -> b) -> b -> Array a -> b
```

Left fold with an uncurried binary function.

```js
reduce ((acc, x) => acc + x) (0) ([1, 2, 3]) // => 6
```

---

### `reduceC` {#array-reducec}

```
reduceC :: (b -> a -> b) -> b -> Array a -> b
```

Left fold with a curried binary function.

```js
reduceC (acc => x => acc + x) (0) ([1, 2, 3]) // => 6
```

---

### `foldMap` {#array-foldmap}

```
foldMap :: ((b, b) -> b) -> b -> (a -> b) -> Array a -> b
```

Maps elements to a monoid and concatenates.

```js
foldMap ((a, b) => a + b) (0) (x => x * 2) ([1, 2, 3]) // => 12
```

---

### `concat` {#array-concat}

```
concat :: Array a -> Array a -> Array a
```

Concatenates two arrays.

```js
concat ([1, 2]) ([3, 4]) // => [1,2,3,4]
```

---

### `append` {#array-append}

```
append :: a -> Array a -> Array a
```

Appends an element to the end.

```js
append (4) ([1, 2, 3]) // => [1,2,3,4]
```

---

### `prepend` {#array-prepend}

```
prepend :: a -> Array a -> Array a
```

Prepends an element to the front.

```js
prepend (0) ([1, 2, 3]) // => [0,1,2,3]
```

---

### `map` {#array-map}

```
map :: (a -> b) -> Array a -> Array b
```

Applies f to every element.

```js
map (x => x * 2) ([1, 2, 3]) // => [2,4,6]
```

---

### `filter` {#array-filter}

Keeps elements satisfying the predicate. // filter :: (a -> Boolean) -> Array a -> Array a

---

### `reject` {#array-reject}

```
reject :: (a -> Boolean) -> Array a -> Array a
```

Removes elements satisfying the predicate (complement of filter).

```js
reject (x => x > 1) ([1, 2, 3]) // => [1]
```

---

### `flatmap` {#array-flatmap}

Maps then flattens one level (monadic bind). // flatmap :: (a -> Array b) -> Array a -> Array b

---

### `ap` {#array-ap}

```
ap :: Array (a -> b) -> Array a -> Array b
```

Cartesian application — each function applied to each value.

```js
ap ([x => x + 1, x => x * 2]) ([10, 20]) // => [11,21,20,40]
```

---

### `reverse` {#array-reverse}

```
reverse :: Array a -> Array a
```

Returns a reversed copy.

```js
reverse ([1, 2, 3]) // => [3,2,1]
```

---

### `sort` {#array-sort}

```
sort :: ((a, a) -> Boolean) -> Array a -> Array a
```

Stable sort with an explicit lte comparator.

```js
sort ((a, b) => a <= b) ([3, 1, 2]) // => [1,2,3]
```

---

### `sortBy` {#array-sortby}

```
sortBy :: ((b, b) -> Boolean) -> (a -> b) -> Array a -> Array a
```

Stable sort using a key extractor and an explicit lte for the key type.

```js
sortBy ((a, b) => a <= b) (x => x.n) ([{n: 2}, {n:1}]) // => [{n:1},{n:2}]
```

---

### `extend` {#array-extend}

```
extend :: (Array a -> b) -> Array a -> Array b
```

Cobinds by applying f to each suffix: extend(f)([x,y,z]) = [f([x,y,z]), f([y,z]), f([z])].

```js
extend (head) ([1, 2, 3]) // => [just(1), just(2), just(3)]
```

---

### `take` {#array-take}

```
take :: Integer -> Array a -> Maybe (Array a)
```

Returns Just the first n elements if 0 <= n <= length, else Nothing.

```js
take (2) ([1, 2, 3]) // => just([1,2])
```

---

### `drop` {#array-drop}

```
drop :: Integer -> Array a -> Maybe (Array a)
```

Returns Just the array after dropping the first n elements, else Nothing.

```js
drop (1) ([1, 2, 3]) // => just([2,3])
```

---

### `takeLast` {#array-takelast}

```
takeLast :: Integer -> Array a -> Maybe (Array a)
```

Returns Just the last n elements if 0 <= n <= length, else Nothing.

```js
takeLast (2) ([1, 2, 3]) // => just([2,3])
```

---

### `dropLast` {#array-droplast}

```
dropLast :: Integer -> Array a -> Maybe (Array a)
```

Returns Just the array with the last n elements removed, else Nothing.

```js
dropLast (1) ([1, 2, 3]) // => just([1,2])
```

---

### `takeWhile` {#array-takewhile}

```
takeWhile :: (a -> Boolean) -> Array a -> Array a
```

Takes elements from the front while the predicate holds.

```js
takeWhile (x => x < 3) ([1, 2, 3, 4]) // => [1,2]
```

---

### `dropWhile` {#array-dropwhile}

```
dropWhile :: (a -> Boolean) -> Array a -> Array a
```

Drops elements from the front while the predicate holds.

```js
dropWhile (x => x < 3) ([1, 2, 3, 4]) // => [3,4]
```

---

### `intercalate` {#array-intercalate}

```
intercalate :: Array a -> Array (Array a) -> Array a
```

Inserts sep between sub-arrays and flattens.

```js
intercalate ([0]) ([[1, 2], [3, 4]]) // => [1,2,0,3,4]
```

---

### `groupBy` {#array-groupby}

```
groupBy :: (a -> a -> Boolean) -> Array a -> Array (Array a)
```

Groups adjacent equal elements into sub-arrays.

```js
groupBy (a => b => a === b) ([1, 1, 2, 3, 3]) // => [[1,1],[2],[3,3]]
```

---

### `zip` {#array-zip}

```
zip :: Array a -> Array b -> Array [a, b]
```

Zips two arrays to the length of the shorter.

```js
zip ([1, 2, 3]) (['a', 'b']) // => [[1,'a'],[2,'b']]
```

---

### `zipWith` {#array-zipwith}

```
zipWith :: (a -> b -> c) -> Array a -> Array b -> Array c
```

Zips with a combining function, truncating to the shorter length.

```js
zipWith (a => b => a + b) ([1, 2, 3]) ([10, 20]) // => [11, 22]
```

---

### `traverse` {#array-traverse}

```
traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Array a -> f (Array b)
```

Applicative traversal — passes explicit apOf, apAp, apMap operations.

```js
traverse (Array.of) (ff => fa => ff.flatMap (f => fa.map (f))) (f => fa => fa.map (f)) (x => [x, -x]) ([1, 2])
```

---

## `boolean`

| Function | Signature |
|---|---|
| [`isBool`](#boolean-isbool) | `isBool :: a -> Boolean` |
| [`equals`](#boolean-equals) | `equals :: Boolean -> Boolean -> Boolean` |
| [`lte`](#boolean-lte) | `lte :: Boolean -> Boolean -> Boolean` |
| [`lt`](#boolean-lt) | `lt :: Boolean -> Boolean -> Boolean` |
| [`gte`](#boolean-gte) | `gte :: Boolean -> Boolean -> Boolean` |
| [`gt`](#boolean-gt) | `gt :: Boolean -> Boolean -> Boolean` |
| [`min`](#boolean-min) | `min :: Boolean -> Boolean -> Boolean` |
| [`max`](#boolean-max) | `max :: Boolean -> Boolean -> Boolean` |
| [`clamp`](#boolean-clamp) | `clamp :: Boolean -> Boolean -> Boolean -> Boolean` |

### `isBool` {#boolean-isbool}

```
isBool :: a -> Boolean
```

Returns true when a is a boolean primitive.

```js
isBool (true) // => true
```

---

### `equals` {#boolean-equals}

```
equals :: Boolean -> Boolean -> Boolean
```

True only when both are booleans with the same value.

```js
equals (true) (true) // => true
```

---

### `lte` {#boolean-lte}

```
lte :: Boolean -> Boolean -> Boolean
```

false <= false, false <= true, NOT true <= false.

```js
lte (false) (true) // => true
```

---

### `lt` {#boolean-lt}

```
lt :: Boolean -> Boolean -> Boolean
```

Strict less-than.

```js
lt (false) (true) // => true
```

---

### `gte` {#boolean-gte}

```
gte :: Boolean -> Boolean -> Boolean
```

Greater-than-or-equal.

```js
gte (true) (false) // => true
```

---

### `gt` {#boolean-gt}

```
gt :: Boolean -> Boolean -> Boolean
```

Strict greater-than.

```js
gt (true) (false) // => true
```

---

### `min` {#boolean-min}

```
min :: Boolean -> Boolean -> Boolean
```

Returns the smaller of the two booleans.

```js
min (true) (false) // => false
```

---

### `max` {#boolean-max}

```
max :: Boolean -> Boolean -> Boolean
```

Returns the larger of the two booleans.

```js
max (true) (false) // => true
```

---

### `clamp` {#boolean-clamp}

```
clamp :: Boolean -> Boolean -> Boolean -> Boolean
```

Clamps a value between lo and hi.

```js
clamp (false) (true) (false) // => false
```

---

## `date`

| Function | Signature |
|---|---|
| [`equals`](#date-equals) | `equals :: Date -> Date -> Boolean` |
| [`lte`](#date-lte) | `lte :: Date -> Date -> Boolean` |
| [`lt`](#date-lt) | `lt :: Date -> Date -> Boolean` |
| [`gte`](#date-gte) | `gte :: Date -> Date -> Boolean` |
| [`gt`](#date-gt) | `gt :: Date -> Date -> Boolean` |
| [`min`](#date-min) | `min :: Date -> Date -> Date` |
| [`max`](#date-max) | `max :: Date -> Date -> Date` |
| [`clamp`](#date-clamp) | `clamp :: Date -> Date -> Date -> Date` |
| [`parseDate`](#date-parsedate) | `parseDate :: String -> Maybe Date` |

### `equals` {#date-equals}

```
equals :: Date -> Date -> Boolean
```

True when both dates represent the same instant.

```js
equals (new Date (0)) (new Date (0)) // => true
```

---

### `lte` {#date-lte}

```
lte :: Date -> Date -> Boolean
```

True when a is at or before b.

```js
lte (new Date (0)) (new Date (1)) // => true
```

---

### `lt` {#date-lt}

```
lt :: Date -> Date -> Boolean
```

Strict earlier-than.

```js
lt (new Date (0)) (new Date (1)) // => true
```

---

### `gte` {#date-gte}

```
gte :: Date -> Date -> Boolean
```

True when a is at or after b.

```js
gte (new Date (1)) (new Date (0)) // => true
```

---

### `gt` {#date-gt}

```
gt :: Date -> Date -> Boolean
```

Strict later-than.

```js
gt (new Date (1)) (new Date (0)) // => true
```

---

### `min` {#date-min}

```
min :: Date -> Date -> Date
```

Returns the earlier of the two dates.

```js
min (new Date (0)) (new Date (1)) // => new Date(0)
```

---

### `max` {#date-max}

```
max :: Date -> Date -> Date
```

Returns the later of the two dates.

```js
max (new Date (0)) (new Date (1)) // => new Date(1)
```

---

### `clamp` {#date-clamp}

```
clamp :: Date -> Date -> Date -> Date
```

Clamps a date between lo and hi.

```js
clamp (new Date (0)) (new Date (10)) (new Date (15)) // => new Date(10)
```

---

### `parseDate` {#date-parsedate}

```
parseDate :: String -> Maybe Date
```

Parses a date string — Just(Date) on success, Nothing for invalid input.

```js
parseDate ('2020-01-01') // => just(new Date('2020-01-01'))
```

---

## `either`

| Function | Signature |
|---|---|
| [`left`](#either-left) | `left :: a -> Either a b` |
| [`right`](#either-right) | `right :: b -> Either a b` |
| [`fromNullable`](#either-fromnullable) | `fromNullable :: (() -> a) -> b -> Either a b` |
| [`tryCatch`](#either-trycatch) | `tryCatch :: ((...a) -> b, (Error, a) -> c) -> ...a -> Either c b` |
| [`fromPredicate`](#either-frompredicate) | `fromPredicate :: (a -> Boolean, a -> b) -> a -> Either b a` |
| [`isLeft`](#either-isleft) | `isLeft :: a -> Boolean` |
| [`isRight`](#either-isright) | `isRight :: a -> Boolean` |
| [`either`](#either-either) | `either :: (a -> c) -> (b -> c) -> Either a b -> c` |
| [`fromLeft`](#either-fromleft) | `fromLeft :: a -> Either a b -> a` |
| [`fromRight`](#either-fromright) | `fromRight :: b -> Either a b -> b` |
| [`fromEither`](#either-fromeither) | `fromEither :: Either a a -> a` |
| [`lefts`](#either-lefts) | `lefts :: Array (Either a b) -> Array a` |
| [`rights`](#either-rights) | `rights :: Array (Either a b) -> Array b` |
| [`encase`](#either-encase) | `encase :: (a -> b) -> a -> Either Error b` |
| [`eitherToMaybe`](#either-eithertomaybe) | `eitherToMaybe :: Either a b -> Maybe b` |
| [`swap`](#either-swap) | `swap :: Either a b -> Either b a` |
| [`mapRight`](#either-mapright) | `mapRight :: (b -> c) -> Either a b -> Either a c` |
| [`mapLeft`](#either-mapleft) | `mapLeft :: (a -> c) -> Either a b -> Either c b` |
| [`bimap`](#either-bimap) | `bimap :: (a -> c) -> (b -> d) -> Either a b -> Either c d` |
| [`ap`](#either-ap) | `ap :: Either a (b -> c) -> Either a b -> Either a c` |
| [`flatmapRight`](#either-flatmapright) | `flatmapRight :: (b -> Either a c) -> Either a b -> Either a c` |
| [`flatmapLeft`](#either-flatmapleft) | `flatmapLeft :: (a -> Either c b) -> Either a b -> Either c b` |
| [`flatmapFirst`](#either-flatmapfirst) | `flatmapFirst :: (b -> Either a c) -> Either a b -> Either a b` |
| [`alt`](#either-alt) | `alt :: Either a b -> Either a b -> Either a b` |
| [`fold`](#either-fold) | `fold :: ((c, b) -> c) -> c -> Either a b -> c` |
| [`traverse`](#either-traverse) | `traverse :: (b -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Either l a -> f (Either l b)` |

### `left` {#either-left}

```
left :: a -> Either a b
```

Wraps a value in the Left constructor.

```js
left ('err') // => { tag: 'left', left: 'err' }
```

---

### `right` {#either-right}

```
right :: b -> Either a b
```

Wraps a value in the Right constructor.

```js
right (42) // => { tag: 'right', right: 42 }
```

---

### `fromNullable` {#either-fromnullable}

```
fromNullable :: (() -> a) -> b -> Either a b
```

Right when value is non-null/undefined; Left using the thunk otherwise.

```js
fromNullable (() => 'missing') (null) // => left('missing')
```

---

### `tryCatch` {#either-trycatch}

```
tryCatch :: ((...a) -> b, (Error, a) -> c) -> ...a -> Either c b
```

Runs fn; Right on success, Left via onError handler on throw.

```js
tryCatch (JSON.parse, e => e.message) ('bad') // => left('...')
```

---

### `fromPredicate` {#either-frompredicate}

```
fromPredicate :: (a -> Boolean, a -> b) -> a -> Either b a
```

Right when predicate is true; Left via onFalse otherwise.

```js
fromPredicate (x => x > 0, x => 'neg') (3) // => right(3)
```

---

### `isLeft` {#either-isleft}

```
isLeft :: a -> Boolean
```

True when the value is a Left.

```js
isLeft (left (1)) // => true
```

---

### `isRight` {#either-isright}

```
isRight :: a -> Boolean
```

True when the value is a Right.

```js
isRight (right (1)) // => true
```

---

### `either` {#either-either}

```
either :: (a -> c) -> (b -> c) -> Either a b -> c
```

Curried case-fold on Either.

```js
either (l => l) (r => r) (right (42)) // => 42
```

---

### `fromLeft` {#either-fromleft}

```
fromLeft :: a -> Either a b -> a
```

Extracts the Left value, or returns the default for Right.

```js
fromLeft ('def') (right (1)) // => 'def'
```

---

### `fromRight` {#either-fromright}

```
fromRight :: b -> Either a b -> b
```

Extracts the Right value, or returns the default for Left.

```js
fromRight (0) (left ('x')) // => 0
```

---

### `fromEither` {#either-fromeither}

```
fromEither :: Either a a -> a
```

Extracts the value regardless of constructor when both sides share a type.

```js
fromEither (left (42)) // => 42
```

---

### `lefts` {#either-lefts}

```
lefts :: Array (Either a b) -> Array a
```

Filters to Left values and extracts them.

```js
lefts ([left (1), right (2), left (3)]) // => [1, 3]
```

---

### `rights` {#either-rights}

```
rights :: Array (Either a b) -> Array b
```

Filters to Right values and extracts them.

```js
rights ([left (1), right (2), right (3)]) // => [2, 3]
```

---

### `encase` {#either-encase}

```
encase :: (a -> b) -> a -> Either Error b
```

Lifts a throwing function into a total Either-returning one.

```js
encase (JSON.parse) ('{"a":1}') // => right({ a: 1 })
```

---

### `eitherToMaybe` {#either-eithertomaybe}

```
eitherToMaybe :: Either a b -> Maybe b
```

Converts Right to Just and Left to Nothing.

```js
eitherToMaybe (right (1)) // => just(1)
```

---

### `swap` {#either-swap}

```
swap :: Either a b -> Either b a
```

Swaps Left and Right.

```js
swap (left (1)) // => right(1)
```

---

### `mapRight` {#either-mapright}

```
mapRight :: (b -> c) -> Either a b -> Either a c
```

Maps over the Right value, leaving Left untouched.

```js
mapRight (x => x + 1) (right (1)) // => right(2)
```

---

### `mapLeft` {#either-mapleft}

```
mapLeft :: (a -> c) -> Either a b -> Either c b
```

Maps over the Left value, leaving Right untouched.

```js
mapLeft (x => x + '!') (left ('err')) // => left('err!')
```

---

### `bimap` {#either-bimap}

```
bimap :: (a -> c) -> (b -> d) -> Either a b -> Either c d
```

Maps Left with the first function and Right with the second.

```js
bimap (l => l + '!') (r => r + 1) (right (2)) // => right(3)
```

---

### `ap` {#either-ap}

```
ap :: Either a (b -> c) -> Either a b -> Either a c
```

Applies a function in a Right to a value in a Right.

```js
ap (right (x => x + 1)) (right (2)) // => right(3)
```

---

### `flatmapRight` {#either-flatmapright}

```
flatmapRight :: (b -> Either a c) -> Either a b -> Either a c
```

Monadic bind over Right.

```js
flatmapRight (x => right (x + 1)) (right (2)) // => right(3)
```

---

### `flatmapLeft` {#either-flatmapleft}

```
flatmapLeft :: (a -> Either c b) -> Either a b -> Either c b
```

Monadic bind over Left.

```js
flatmapLeft (e => left (e + '!')) (left ('x')) // => left('x!')
```

---

### `flatmapFirst` {#either-flatmapfirst}

```
flatmapFirst :: (b -> Either a c) -> Either a b -> Either a b
```

Runs a Right through fn for its Left side effect; keeps original Right on success.

```js
flatmapFirst (x => left ('stop')) (right (1)) // => left('stop')
```

---

### `alt` {#either-alt}

```
alt :: Either a b -> Either a b -> Either a b
```

Returns the first Right, or the second argument if both are Left.

```js
alt (right (2)) (left ('x')) // => right(2)
```

---

### `fold` {#either-fold}

```
fold :: ((c, b) -> c) -> c -> Either a b -> c
```

Reduces a Right with a binary function and initial value; returns initial for Left.

```js
fold ((acc, x) => acc + x, 0) (right (5)) // => 5
```

---

### `traverse` {#either-traverse}

```
traverse :: (b -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Either l a -> f (Either l b)
```

Applicative traversal over the Right value.

```js
traverse (Array.of) (f => xs => xs.map (f)) (x => [x, x]) (right (1)) // => [right(1), right(1)]
```

---

## `fn`

| Function | Signature |
|---|---|
| [`pipe`](#fn-pipe) | `pipe :: Foldable f => f (Any -> Any) -> a -> b` |
| [`pipeK`](#fn-pipek) | `pipeK :: (Foldable f, Flatmap m) => f (Any -> m Any) -> m a -> m b` |
| [`T`](#fn-t) | `T :: a -> (a -> b) -> b` |
| [`on`](#fn-on) | `on :: (b -> b -> c) -> (a -> b) -> a -> a -> c` |
| [`id`](#fn-id) | `id :: a -> a` |
| [`compose`](#fn-compose) | `compose :: (b -> c) -> (a -> b) -> a -> c` |
| [`flip`](#fn-flip) | `flip :: (a -> b -> c) -> b -> a -> c` |
| [`map`](#fn-map) | `map :: (a -> b) -> (e -> a) -> e -> b` |
| [`ap`](#fn-ap) | `ap :: (e -> a -> b) -> (e -> a) -> e -> b` |
| [`of`](#fn-of) | `of :: a -> e -> a` |
| [`flatmap`](#fn-flatmap) | `flatmap :: (a -> e -> b) -> (e -> a) -> e -> b` |
| [`contramap`](#fn-contramap) | `contramap :: (b -> a) -> (a -> c) -> b -> c` |
| [`promap`](#fn-promap) | `promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d` |
| [`extend`](#fn-extend) | `extend :: (concat -> (e -> a) -> b) -> (e -> a) -> e -> b` |
| [`chainRec`](#fn-chainrec) | `chainRec :: ((a -> Step, b -> Step, a) -> e -> Step) -> a -> e -> b` |
| [`handleThrow`](#fn-handlethrow) | `handleThrow :: ((...d) -> a) -> (a, d -> r) -> (Error, d -> r) -> (...d) -> r` |

### `pipe` {#fn-pipe}

```
pipe :: Foldable f => f (Any -> Any) -> a -> b
```

Threads a value through a left-to-right sequence of functions.

```js
pipe ([x => x + 1, Math.sqrt]) (99) // => 10
```

---

### `pipeK` {#fn-pipek}

```
pipeK :: (Foldable f, Flatmap m) => f (Any -> m Any) -> m a -> m b
```

Left-to-right Kleisli composition over a flatmappable monad.

```js
pipeK ([f, g]) (mx) // flatmap (g) (flatmap (f) (mx))
```

---

### `T` {#fn-t}

```
T :: a -> (a -> b) -> b
```

Thrush combinator – applies an argument to a function.

```js
T (42) (x => x + 1) // => 43
```

---

### `on` {#fn-on}

```
on :: (b -> b -> c) -> (a -> b) -> a -> a -> c
```

P combinator – applies a binary function after mapping both args.

```js
on ((a) => (b) => a.concat (b)) (x => x.reverse ()) ([1,2]) ([3,4]) // => [2,1,3,4]
```

---

### `id` {#fn-id}

```
id :: a -> a
```

Identity – returns its argument unchanged.

```js
id (42) // => 42
```

---

### `compose` {#fn-compose}

```
compose :: (b -> c) -> (a -> b) -> a -> c
```

Right-to-left function composition.

```js
compose (x => x * 2) (x => x + 1) (3) // => 8
```

---

### `flip` {#fn-flip}

```
flip :: (a -> b -> c) -> b -> a -> c
```

Flips the order of the first two arguments.

```js
flip (a => b => a - b) (1) (3) // => 2
```

---

### `map` {#fn-map}

```
map :: (a -> b) -> (e -> a) -> e -> b
```

Reader functor – post-composes a function.

```js
map (x => x + 1) (x => x * 2) (3) // => 7
```

---

### `ap` {#fn-ap}

```
ap :: (e -> a -> b) -> (e -> a) -> e -> b
```

S combinator – ap(ff)(fa)(x) = ff(x)(fa(x)).

```js
ap (e => x => e + x) (e => e * 2) (3) // => 9
```

---

### `of` {#fn-of}

```
of :: a -> e -> a
```

Lifts a value into the Reader context (constant function).

```js
of (42) ('ignored') // => 42
```

---

### `flatmap` {#fn-flatmap}

```
flatmap :: (a -> e -> b) -> (e -> a) -> e -> b
```

Reader monad bind.

```js
flatmap (a => e => a + e) (e => e * 2) (3) // => 9
```

---

### `contramap` {#fn-contramap}

```
contramap :: (b -> a) -> (a -> c) -> b -> c
```

Pre-composes a function (contravariant map).

```js
contramap (x => x + 1) (x => x * 2) (3) // => 8
```

---

### `promap` {#fn-promap}

```
promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d
```

promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d Maps both the input and output of a function.

```js
promap (x => x + 1) (x => x * 2) (x => x) (3) // => 8
```

---

### `extend` {#fn-extend}

```
extend :: (concat -> (e -> a) -> b) -> (e -> a) -> e -> b
```

Comonad extend for the Reader context.

```js
extend (concatFn) (f) (wa) (x)
```

---

### `chainRec` {#fn-chainrec}

```
chainRec :: ((a -> Step, b -> Step, a) -> e -> Step) -> a -> e -> b
```

Stack-safe tail-recursive Reader bind.

```js
chainRec ((next, done, n) => _ => n <= 0 ? done (n) : next (n - 1)) (1000) (null)
```

---

### `handleThrow` {#fn-handlethrow}

```
handleThrow :: ((...d) -> a) -> (a, d -> r) -> (Error, d -> r) -> (...d) -> r
```

Wraps a function so that thrown errors are caught and routed to onThrow.

```js
handleThrow (JSON.parse) (r => r) (e => null) ('{}')
```

---

## `logic`

| Function | Signature |
|---|---|
| [`and`](#logic-and) | `and :: Boolean -> Boolean -> Boolean` |
| [`or`](#logic-or) | `or :: Boolean -> Boolean -> Boolean` |
| [`not`](#logic-not) | `not :: Boolean -> Boolean` |
| [`complement`](#logic-complement) | `complement :: (a -> Boolean) -> a -> Boolean` |
| [`boolean_`](#logic-boolean_) | `boolean_ :: a -> a -> Boolean -> a` |
| [`ifElse`](#logic-ifelse) | `ifElse :: (a -> Boolean) -> (a -> b) -> (a -> b) -> a -> b` |
| [`when`](#logic-when) | `when :: (a -> Boolean) -> (a -> a) -> a -> a` |
| [`unless`](#logic-unless) | `unless :: (a -> Boolean) -> (a -> a) -> a -> a` |

### `and` {#logic-and}

```
and :: Boolean -> Boolean -> Boolean
```

Logical conjunction.

```js
and (true) (false) // => false
```

---

### `or` {#logic-or}

```
or :: Boolean -> Boolean -> Boolean
```

Logical disjunction.

```js
or (false) (true) // => true
```

---

### `not` {#logic-not}

```
not :: Boolean -> Boolean
```

Logical negation.

```js
not (true) // => false
```

---

### `complement` {#logic-complement}

```
complement :: (a -> Boolean) -> a -> Boolean
```

Returns a predicate that negates the original.

```js
complement (x => x > 0) (-1) // => true
```

---

### `boolean_` {#logic-boolean_}

```
boolean_ :: a -> a -> Boolean -> a
```

Case analysis on a boolean — returns onFalse or onTrue.

```js
boolean_ ('no') ('yes') (false) // => 'no'
```

---

### `ifElse` {#logic-ifelse}

```
ifElse :: (a -> Boolean) -> (a -> b) -> (a -> b) -> a -> b
```

Applies f if predicate holds, g otherwise.

```js
ifElse (x => x > 0) (x => x) (x => -x) (-3) // => 3
```

---

### `when` {#logic-when}

```
when :: (a -> Boolean) -> (a -> a) -> a -> a
```

Applies f only when predicate holds, otherwise returns x unchanged.

```js
when (x => x < 0) (() => 0) (-1) // => 0
```

---

### `unless` {#logic-unless}

```
unless :: (a -> Boolean) -> (a -> a) -> a -> a
```

Applies f only when predicate does NOT hold.

```js
unless (x => x > 0) (x => -x) (-3) // => 3
```

---

## `maybe`

| Function | Signature |
|---|---|
| [`just`](#maybe-just) | `just :: a -> Maybe a` |
| [`nothing`](#maybe-nothing) | `nothing :: () -> Maybe never` |
| [`fromNullable`](#maybe-fromnullable) | `fromNullable :: a -> Maybe (NonNullable a)` |
| [`fromPredicate`](#maybe-frompredicate) | `fromPredicate :: (a -> Boolean) -> a -> Maybe a` |
| [`tryCatch`](#maybe-trycatch) | `tryCatch :: (() -> a) -> Maybe a` |
| [`isJust`](#maybe-isjust) | `isJust :: unknown -> Boolean` |
| [`isNothing`](#maybe-isnothing) | `isNothing :: unknown -> Boolean` |
| [`isMaybe`](#maybe-ismaybe) | `isMaybe :: unknown -> Boolean` |
| [`maybe`](#maybe-maybe) | `maybe :: b -> (a -> b) -> Maybe a -> b` |
| [`maybe_`](#maybe-maybe_) | `maybe_ :: (() -> b) -> (a -> b) -> Maybe a -> b` |
| [`fromMaybe`](#maybe-frommaybe) | `fromMaybe :: a -> Maybe a -> a` |
| [`fromMaybe_`](#maybe-frommaybe_) | `fromMaybe_ :: (() -> a) -> Maybe a -> a` |
| [`justs`](#maybe-justs) | `justs :: Array (Maybe a) -> Array a` |
| [`toNull`](#maybe-tonull) | `toNull :: Maybe a -> a \| null` |
| [`toUndefined`](#maybe-toundefined) | `toUndefined :: Maybe a -> a \| undefined` |
| [`maybeToEither`](#maybe-maybetoeither) | `maybeToEither :: a -> Maybe b -> Either a b` |
| [`map`](#maybe-map) | `map :: (a -> b) -> Maybe a -> Maybe b` |
| [`filter`](#maybe-filter) | `filter :: (a -> Boolean) -> Maybe a -> Maybe a` |
| [`filterMap`](#maybe-filtermap) | `filterMap :: (a -> Maybe b) -> Maybe a -> Maybe b` |
| [`flatmap`](#maybe-flatmap) | `flatmap :: (a -> Maybe b) -> Maybe a -> Maybe b` |
| [`mapNullable`](#maybe-mapnullable) | `mapNullable :: (a -> b \| null \| undefined) -> Maybe a -> Maybe b` |
| [`mapMaybe`](#maybe-mapmaybe) | `` |
| [`ap`](#maybe-ap) | `ap :: Maybe (a -> b) -> Maybe a -> Maybe b` |
| [`alt`](#maybe-alt) | `alt :: Maybe a -> Maybe a -> Maybe a` |
| [`exists`](#maybe-exists) | `exists :: (a -> Boolean) -> Maybe a -> Boolean` |
| [`fold`](#maybe-fold) | `fold :: ((b, a) -> b) -> b -> Maybe a -> b` |

### `just` {#maybe-just}

```
just :: a -> Maybe a
```

Wraps a value in Just.

```js
just (1) // => { tag: 'just', value: 1 }
```

---

### `nothing` {#maybe-nothing}

```
nothing :: () -> Maybe never
```

Creates a Nothing value.

```js
nothing () // => { tag: 'nothing' }
```

---

### `fromNullable` {#maybe-fromnullable}

```
fromNullable :: a -> Maybe (NonNullable a)
```

Converts null/undefined to Nothing, any other value to Just.

```js
fromNullable (1)    // => just(1)
fromNullable (null) // => nothing()
```

---

### `fromPredicate` {#maybe-frompredicate}

```
fromPredicate :: (a -> Boolean) -> a -> Maybe a
```

Returns Just(a) if predicate holds, Nothing otherwise.

```js
fromPredicate (x => x > 0) (1) // => just(1)
```

---

### `tryCatch` {#maybe-trycatch}

```
tryCatch :: (() -> a) -> Maybe a
```

Wraps a thunk — Just on success, Nothing on throw.

```js
tryCatch (() => JSON.parse ('1')) // => just(1)
```

---

### `isJust` {#maybe-isjust}

```
isJust :: unknown -> Boolean
```

Returns true if the value is a Just.

```js
isJust (just (1)) // => true
```

---

### `isNothing` {#maybe-isnothing}

```
isNothing :: unknown -> Boolean
```

Returns true if the value is Nothing.

```js
isNothing (nothing ()) // => true
```

---

### `isMaybe` {#maybe-ismaybe}

```
isMaybe :: unknown -> Boolean
```

Returns true if the value is a Just or Nothing.

```js
isMaybe (just (1)) // => true
```

---

### `maybe` {#maybe-maybe}

```
maybe :: b -> (a -> b) -> Maybe a -> b
```

Case-fold — returns the default for Nothing, applies f for Just.

```js
maybe (0) (x => x + 1) (just (1)) // => 2
```

---

### `maybe_` {#maybe-maybe_}

```
maybe_ :: (() -> b) -> (a -> b) -> Maybe a -> b
```

Lazy case-fold — default thunk called only for Nothing.

```js
maybe_ (() => 0) (x => x + 1) (nothing ()) // => 0
```

---

### `fromMaybe` {#maybe-frommaybe}

```
fromMaybe :: a -> Maybe a -> a
```

Extracts the value or returns the strict default.

```js
fromMaybe (0) (just (5)) // => 5
```

---

### `fromMaybe_` {#maybe-frommaybe_}

```
fromMaybe_ :: (() -> a) -> Maybe a -> a
```

Extracts the value or calls the lazy default thunk.

```js
fromMaybe_ (() => 0) (nothing ()) // => 0
```

---

### `justs` {#maybe-justs}

```
justs :: Array (Maybe a) -> Array a
```

Discards Nothings and unwraps Justs.

```js
justs([just (1), nothing (), just (2)]) // => [1, 2]
```

---

### `toNull` {#maybe-tonull}

```
toNull :: Maybe a -> a | null
```

Extracts the value or returns null.

```js
toNull (nothing ()) // => null
```

---

### `toUndefined` {#maybe-toundefined}

```
toUndefined :: Maybe a -> a | undefined
```

Extracts the value or returns undefined.

```js
toUndefined (nothing ()) // => undefined
```

---

### `maybeToEither` {#maybe-maybetoeither}

```
maybeToEither :: a -> Maybe b -> Either a b
```

Converts Nothing to Left(def) and Just(v) to Right(v).

```js
maybeToEither ('err') (just (1)) // => { tag: 'right', right: 1 }
```

---

### `map` {#maybe-map}

```
map :: (a -> b) -> Maybe a -> Maybe b
```

Applies f to the value inside Just, passes Nothing through.

```js
map (x => x + 1) (just (1)) // => just(2)
```

---

### `filter` {#maybe-filter}

```
filter :: (a -> Boolean) -> Maybe a -> Maybe a
```

Returns Nothing if predicate fails or Maybe is already Nothing.

```js
filter(x => x > 0)(just(1)) // => just(1)
```

---

### `filterMap` {#maybe-filtermap}

```
filterMap :: (a -> Maybe b) -> Maybe a -> Maybe b
```

Applies f only if the input is Just, forwarding Nothing directly.

```js
filterMap (x => x > 0 ? just (x) : nothing ()) (just (-1)) // => nothing()
```

---

### `flatmap` {#maybe-flatmap}

```
flatmap :: (a -> Maybe b) -> Maybe a -> Maybe b
```

Monadic bind — applies f to Just's value, passes Nothing through.

```js
flatmap(x => just(x + 1))(just(1)) // => just(2)
```

---

### `mapNullable` {#maybe-mapnullable}

```
mapNullable :: (a -> b | null | undefined) -> Maybe a -> Maybe b
```

Maps with a nullable-returning function, converting null/undefined to Nothing.

```js
mapNullable (x => x.name) (just ({ name: 'Alice' })) // => just('Alice')
```

---

### `mapMaybe` {#maybe-mapmaybe}

Maps over an array, discarding Nothings and unwrapping Justs.

```js
mapMaybe :: (a -> Maybe b) -> Array a -> Array b
mapMaybe (x => x > 0 ? just (x) : nothing ()) ([1, -2, 3]) // => [1, 3]
```

---

### `ap` {#maybe-ap}

```
ap :: Maybe (a -> b) -> Maybe a -> Maybe b
```

Applies a Just-wrapped function to a Just-wrapped value.

```js
ap (just (x => x + 1)) (just (1)) // => just(2)
```

---

### `alt` {#maybe-alt}

```
alt :: Maybe a -> Maybe a -> Maybe a
```

Returns the first Just, falling back to the second.

```js
alt (just (2)) (nothing ()) // => just(2)
```

---

### `exists` {#maybe-exists}

```
exists :: (a -> Boolean) -> Maybe a -> Boolean
```

Returns true if Maybe is Just and the predicate holds.

```js
exists (x => x > 0) (just (1)) // => true
```

---

### `fold` {#maybe-fold}

```
fold :: ((b, a) -> b) -> b -> Maybe a -> b
```

Folds a Maybe — returns initial for Nothing, applies foldr for Just.

```js
fold ((acc, x) => acc + x, 0) (just (5)) // => 5
```

---

## `nil`

| Function | Signature |
|---|---|
| [`nil`](#nil-nil) | `nil :: a -> Nil a` |
| [`init`](#nil-init) | `init :: () -> Nil never` |
| [`fromPredicate`](#nil-frompredicate) | `fromPredicate :: (a -> Boolean) -> Nil a -> Nil a` |
| [`fromMaybe`](#nil-frommaybe) | `fromMaybe :: Maybe a -> Nil a` |
| [`isNil`](#nil-isnil) | `isNil :: Nil a -> Boolean` |
| [`isNotNil`](#nil-isnotnil) | `isNotNil :: Nil a -> Boolean` |

### `nil` {#nil-nil}

```
nil :: a -> Nil a
```

Returns the value if non-nil, otherwise null.

```js
nil (undefined) // => null
```

---

### `init` {#nil-init}

```
init :: () -> Nil never
```

Returns the empty nil value (null).

```js
init () // => null
```

---

### `fromPredicate` {#nil-frompredicate}

```
fromPredicate :: (a -> Boolean) -> Nil a -> Nil a
```

Returns the value if non-nil and predicate holds, otherwise null.

```js
fromPredicate (x => x > 0) (5) // => 5
```

---

### `fromMaybe` {#nil-frommaybe}

```
fromMaybe :: Maybe a -> Nil a
```

Converts Nothing to null, Just(a) to a.

```js
fromMaybe (just (1)) // => 1
```

---

### `isNil` {#nil-isnil}

```
isNil :: Nil a -> Boolean
```

Returns true for null or undefined.

```js
isNil (null) // => true
```

---

### `isNotNil` {#nil-isnotnil}

```
isNotNil :: Nil a -> Boolean
```

Returns true for any value that is not null or undefined.

```js
isNotNil (0) // => true
```

---

## `number`

| Function | Signature |
|---|---|
| [`isNum`](#number-isnum) | `isNum :: a -> Boolean` |
| [`equals`](#number-equals) | `equals :: Number -> Number -> Boolean` |
| [`lte`](#number-lte) | `lte :: Number -> Number -> Boolean` |
| [`lt`](#number-lt) | `lt :: Number -> Number -> Boolean` |
| [`gte`](#number-gte) | `gte :: Number -> Number -> Boolean` |
| [`gt`](#number-gt) | `gt :: Number -> Number -> Boolean` |
| [`min`](#number-min) | `min :: Number -> Number -> Number` |
| [`max`](#number-max) | `max :: Number -> Number -> Number` |
| [`clamp`](#number-clamp) | `clamp :: Number -> Number -> Number -> Number` |
| [`negate`](#number-negate) | `negate :: Number -> Number` |
| [`add`](#number-add) | `add :: Number -> Number -> Number` |
| [`sub`](#number-sub) | `sub :: Number -> Number -> Number` |
| [`mult`](#number-mult) | `mult :: Number -> Number -> Number` |
| [`div`](#number-div) | `div :: Number -> Number -> Number` |
| [`pow`](#number-pow) | `pow :: Number -> Number -> Number` |
| [`sum`](#number-sum) | `sum :: Array Number -> Number` |
| [`product`](#number-product) | `product :: Array Number -> Number` |
| [`even`](#number-even) | `even :: Integer -> Boolean` |
| [`odd`](#number-odd) | `odd :: Integer -> Boolean` |
| [`parseFloat_`](#number-parsefloat_) | `parseFloat_ :: String -> Maybe Number` |
| [`parseInt_`](#number-parseint_) | `parseInt_ :: Integer -> String -> Maybe Integer` |

### `isNum` {#number-isnum}

```
isNum :: a -> Boolean
```

Returns true only for finite or infinite (non-NaN) numbers.

```js
isNum (42) // => true;  isNum (NaN) // => false
```

---

### `equals` {#number-equals}

```
equals :: Number -> Number -> Boolean
```

Structural equality: NaN equals NaN, +0 equals -0.

```js
equals (NaN) (NaN) // => true
```

---

### `lte` {#number-lte}

```
lte :: Number -> Number -> Boolean
```

Total ordering — NaN is treated as the minimum value.

```js
lte (1) (2) // => true
```

---

### `lt` {#number-lt}

```
lt :: Number -> Number -> Boolean
```

Strict less-than.

```js
lt (1) (2) // => true
```

---

### `gte` {#number-gte}

```
gte :: Number -> Number -> Boolean
```

Greater-than-or-equal.

```js
gte (2) (1) // => true
```

---

### `gt` {#number-gt}

```
gt :: Number -> Number -> Boolean
```

Strict greater-than.

```js
gt (2) (1) // => true
```

---

### `min` {#number-min}

```
min :: Number -> Number -> Number
```

Returns the smaller number.

```js
min (1) (2) // => 1
```

---

### `max` {#number-max}

```
max :: Number -> Number -> Number
```

Returns the larger number.

```js
max (1) (2) // => 2
```

---

### `clamp` {#number-clamp}

```
clamp :: Number -> Number -> Number -> Number
```

Clamps x between lo and hi inclusive.

```js
clamp (0) (10) (15) // => 10
```

---

### `negate` {#number-negate}

```
negate :: Number -> Number
```

Negates a number.

```js
negate (3) // => -3
```

---

### `add` {#number-add}

```
add :: Number -> Number -> Number
```

Adds two numbers.

```js
add (1) (2) // => 3
```

---

### `sub` {#number-sub}

```
sub :: Number -> Number -> Number
```

Subtracts — sub(n)(x) = x - n.

```js
sub (1) (3) // => 2
```

---

### `mult` {#number-mult}

```
mult :: Number -> Number -> Number
```

Multiplies two numbers.

```js
mult (2) (3) // => 6
```

---

### `div` {#number-div}

```
div :: Number -> Number -> Number
```

Divides — div(n)(x) = x / n.

```js
div (2) (10) // => 5
```

---

### `pow` {#number-pow}

```
pow :: Number -> Number -> Number
```

Raises base to exponent — pow(exp)(base) = base ** exp.

```js
pow (2) (3) // => 9
```

---

### `sum` {#number-sum}

```
sum :: Array Number -> Number
```

Sums all numbers in the array.

```js
sum ([1, 2, 3]) // => 6
```

---

### `product` {#number-product}

```
product :: Array Number -> Number
```

Multiplies all numbers in the array.

```js
product ([2, 3, 4]) // => 24
```

---

### `even` {#number-even}

```
even :: Integer -> Boolean
```

Returns true for even integers.

```js
even (4) // => true
```

---

### `odd` {#number-odd}

```
odd :: Integer -> Boolean
```

Returns true for odd integers.

```js
odd (3) // => true
```

---

### `parseFloat_` {#number-parsefloat_}

```
parseFloat_ :: String -> Maybe Number
```

Parses a float string strictly — Just on success, Nothing otherwise.

```js
parseFloat_ ('3.14') // => just(3.14)
```

---

### `parseInt_` {#number-parseint_}

```
parseInt_ :: Integer -> String -> Maybe Integer
```

Parses an integer string in radix 2–36 — stricter than built-in parseInt.

```js
parseInt_ (16) ('ff') // => just(255)
```

---

## `pair`

| Function | Signature |
|---|---|
| [`pair`](#pair-pair) | `pair :: a -> b -> [a, b]` |
| [`dup`](#pair-dup) | `dup :: a -> [a, a]` |
| [`merge`](#pair-merge) | `merge :: [(a -> b), a] -> b` |
| [`mergeSecond`](#pair-mergesecond) | `mergeSecond :: [a, (a -> b)] -> b` |
| [`fst`](#pair-fst) | `fst :: [a, b] -> a` |
| [`snd`](#pair-snd) | `snd :: [a, b] -> b` |
| [`swap`](#pair-swap) | `swap :: [a, b] -> [b, a]` |
| [`map`](#pair-map) | `map :: (a -> c) -> [a, b] -> [c, b]` |
| [`mapSecond`](#pair-mapsecond) | `mapSecond :: (b -> d) -> [a, b] -> [a, d]` |
| [`bimap`](#pair-bimap) | `bimap :: (a -> c) -> (b -> d) -> [a, b] -> [c, d]` |
| [`fold`](#pair-fold) | `fold :: ((c, a, b) -> c) -> c -> [a, b] -> c` |
| [`foldWith`](#pair-foldwith) | `foldWith :: (a -> b -> c) -> [a, b] -> c` |
| [`traverse`](#pair-traverse) | `traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> [a, c] -> f [b, c]` |

### `pair` {#pair-pair}

```
pair :: a -> b -> [a, b]
```

Constructs a 2-element tuple.

```js
pair (1) (2) // => [1, 2]
```

---

### `dup` {#pair-dup}

```
dup :: a -> [a, a]
```

Duplicates a value into a pair.

```js
dup (3) // => [3, 3]
```

---

### `merge` {#pair-merge}

```
merge :: [(a -> b), a] -> b
```

Applies the function in the first slot to the value in the second.

```js
merge ([x => x + 1, 5]) // => 6
```

---

### `mergeSecond` {#pair-mergesecond}

```
mergeSecond :: [a, (a -> b)] -> b
```

Applies the function in the second slot to the value in the first.

```js
mergeSecond ([5, x => x + 1]) // => 6
```

---

### `fst` {#pair-fst}

```
fst :: [a, b] -> a
```

Extracts the first element.

```js
fst ([1, 2]) // => 1
```

---

### `snd` {#pair-snd}

```
snd :: [a, b] -> b
```

Extracts the second element.

```js
snd ([1, 2]) // => 2
```

---

### `swap` {#pair-swap}

```
swap :: [a, b] -> [b, a]
```

Swaps the two elements.

```js
swap ([1, 2]) // => [2, 1]
```

---

### `map` {#pair-map}

```
map :: (a -> c) -> [a, b] -> [c, b]
```

Maps over the first element.

```js
map (x => x + 1) ([1, 2]) // => [2, 2]
```

---

### `mapSecond` {#pair-mapsecond}

```
mapSecond :: (b -> d) -> [a, b] -> [a, d]
```

Maps over the second element.

```js
mapSecond (x => x + 1) ([1, 2]) // => [1, 3]
```

---

### `bimap` {#pair-bimap}

```
bimap :: (a -> c) -> (b -> d) -> [a, b] -> [c, d]
```

Maps both elements — first arg for first element, second arg for second.

```js
bimap (x => x + 1) (x => x * 2) ([1, 3]) // => [2, 6]
```

---

### `fold` {#pair-fold}

```
fold :: ((c, a, b) -> c) -> c -> [a, b] -> c
```

Reduces a pair with a ternary function (initial, first, second).

```js
fold ((acc, a, b) => acc + a + b) (0) ([1, 2]) // => 3
```

---

### `foldWith` {#pair-foldwith}

```
foldWith :: (a -> b -> c) -> [a, b] -> c
```

Applies a curried binary function to the pair's elements.

```js
foldWith (a => b => a + b) ([1, 2]) // => 3
```

---

### `traverse` {#pair-traverse}

```
traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> [a, c] -> f [b, c]
```

Applicative traversal over the first element.

```js
traverse (Array.of) (_ => _) (f => xs => xs.map (f)) (x => [x, -x]) ([1, 2]) // => [[1, 2], [-1, 2]]
```

---

## `regexp`

| Function | Signature |
|---|---|
| [`equals`](#regexp-equals) | `equals :: RegExp -> RegExp -> Boolean` |
| [`regex`](#regexp-regex) | `regex :: String -> String -> RegExp` |
| [`regexEscape`](#regexp-regexescape) | `regexEscape :: String -> String` |
| [`test`](#regexp-test) | `test :: RegExp -> String -> Boolean` |
| [`match`](#regexp-match) | `match :: RegExp -> String -> Maybe (Array (Maybe String))` |
| [`matchAll`](#regexp-matchall) | `matchAll :: RegExp -> String -> Array (Array (Maybe String))` |
| [`replace`](#regexp-replace) | `replace :: (Array (Maybe String) -> String) -> RegExp -> String -> String` |

### `equals` {#regexp-equals}

```
equals :: RegExp -> RegExp -> Boolean
```

True when both regexes have the same source and all flags match.

```js
equals (/a/g) (/a/g) // => true
```

---

### `regex` {#regexp-regex}

```
regex :: String -> String -> RegExp
```

Constructs a RegExp from flags and source.

```js
regex ('g') ('[0-9]+') // => /[0-9]+/g
```

---

### `regexEscape` {#regexp-regexescape}

```
regexEscape :: String -> String
```

Escapes all regex metacharacters so the result matches the literal string.

```js
regexEscape ('a.b') // => 'a\.b'
```

---

### `test` {#regexp-test}

```
test :: RegExp -> String -> Boolean
```

Tests whether the pattern matches the string (stateless — resets lastIndex).

```js
test (/^a/) ('abacus') // => true
```

---

### `match` {#regexp-match}

```
match :: RegExp -> String -> Maybe (Array (Maybe String))
```

Returns Just of capture-group array if pattern matches, Nothing otherwise.

```js
match (/(\w+)/) ('hello') // => just([just('hello')])
```

---

### `matchAll` {#regexp-matchall}

```
matchAll :: RegExp -> String -> Array (Array (Maybe String))
```

Returns all capture-group arrays (pattern must have the 'g' flag).

```js
matchAll (/(\w+)/g) ('hi there') // => [[just('hi')], [just('there')]]
```

---

### `replace` {#regexp-replace}

```
replace :: (Array (Maybe String) -> String) -> RegExp -> String -> String
```

Replaces pattern matches using a function over capture groups.

```js
replace (() => 'X') (/a/) ('cat') // => 'cXt'
```

---

## `string`

| Function | Signature |
|---|---|
| [`equals`](#string-equals) | `equals :: String -> String -> Boolean` |
| [`lte`](#string-lte) | `lte :: String -> String -> Boolean` |
| [`lt`](#string-lt) | `lt :: String -> String -> Boolean` |
| [`gte`](#string-gte) | `gte :: String -> String -> Boolean` |
| [`gt`](#string-gt) | `gt :: String -> String -> Boolean` |
| [`min`](#string-min) | `min :: String -> String -> String` |
| [`max`](#string-max) | `max :: String -> String -> String` |
| [`clamp`](#string-clamp) | `clamp :: String -> String -> String -> String` |
| [`concat`](#string-concat) | `concat :: String -> String -> String` |
| [`empty`](#string-empty) | `` |
| [`toUpper`](#string-toupper) | `toUpper :: String -> String` |
| [`toLower`](#string-tolower) | `toLower :: String -> String` |
| [`trim`](#string-trim) | `trim :: String -> String` |
| [`stripPrefix`](#string-stripprefix) | `stripPrefix :: String -> String -> Maybe String` |
| [`stripSuffix`](#string-stripsuffix) | `stripSuffix :: String -> String -> Maybe String` |
| [`words`](#string-words) | `words :: String -> Array String` |
| [`unwords`](#string-unwords) | `unwords :: Array String -> String` |
| [`lines`](#string-lines) | `lines :: String -> Array String` |
| [`unlines`](#string-unlines) | `unlines :: Array String -> String` |
| [`splitOn`](#string-spliton) | `splitOn :: String -> String -> Array String` |
| [`splitOnRegex`](#string-splitonregex) | `splitOnRegex :: RegExp -> String -> Array String` |
| [`joinWith`](#string-joinwith) | `joinWith :: String -> Array String -> String` |

### `equals` {#string-equals}

```
equals :: String -> String -> Boolean
```

True when both are strings with identical content.

```js
equals ('a') ('a') // => true
```

---

### `lte` {#string-lte}

```
lte :: String -> String -> Boolean
```

Lexicographic less-than-or-equal.

```js
lte ('a') ('b') // => true
```

---

### `lt` {#string-lt}

```
lt :: String -> String -> Boolean
```

Strict lexicographic less-than.

```js
lt ('a') ('b') // => true
```

---

### `gte` {#string-gte}

```
gte :: String -> String -> Boolean
```

Lexicographic greater-than-or-equal.

```js
gte ('b') ('a') // => true
```

---

### `gt` {#string-gt}

```
gt :: String -> String -> Boolean
```

Strict lexicographic greater-than.

```js
gt ('b') ('a') // => true
```

---

### `min` {#string-min}

```
min :: String -> String -> String
```

Returns the lexicographically smaller string.

```js
min ('a') ('b') // => 'a'
```

---

### `max` {#string-max}

```
max :: String -> String -> String
```

Returns the lexicographically larger string.

```js
max ('a') ('b') // => 'b'
```

---

### `clamp` {#string-clamp}

```
clamp :: String -> String -> String -> String
```

Clamps a string between lo and hi lexicographically.

```js
clamp ('b') ('d') ('e') // => 'd'
```

---

### `concat` {#string-concat}

```
concat :: String -> String -> String
```

Concatenates two strings.

```js
concat ('foo') ('bar') // => 'foobar'
```

---

### `empty` {#string-empty}

empty :: String — the empty string.

---

### `toUpper` {#string-toupper}

```
toUpper :: String -> String
```

Converts a string to upper case.

```js
toUpper ('hello') // => 'HELLO'
```

---

### `toLower` {#string-tolower}

```
toLower :: String -> String
```

Converts a string to lower case.

```js
toLower ('HELLO') // => 'hello'
```

---

### `trim` {#string-trim}

```
trim :: String -> String
```

Removes leading and trailing whitespace.

```js
trim ('  hi  ') // => 'hi'
```

---

### `stripPrefix` {#string-stripprefix}

```
stripPrefix :: String -> String -> Maybe String
```

Returns Just the remainder after stripping the prefix, or Nothing.

```js
stripPrefix ('foo') ('foobar') // => just('bar')
```

---

### `stripSuffix` {#string-stripsuffix}

```
stripSuffix :: String -> String -> Maybe String
```

Returns Just the string with the suffix removed, or Nothing.

```js
stripSuffix ('bar') ('foobar') // => just('foo')
```

---

### `words` {#string-words}

```
words :: String -> Array String
```

Splits on whitespace, ignoring leading/trailing empty tokens.

```js
words ('  foo bar  ') // => ['foo', 'bar']
```

---

### `unwords` {#string-unwords}

```
unwords :: Array String -> String
```

Joins an array of strings with a single space.

```js
unwords (['foo', 'bar']) // => 'foo bar'
```

---

### `lines` {#string-lines}

```
lines :: String -> Array String
```

Splits on \n, \r\n, or \r; empty string yields [].

```js
lines ('a\nb') // => ['a', 'b']
```

---

### `unlines` {#string-unlines}

```
unlines :: Array String -> String
```

Joins lines, appending a terminating '\n' to each.

```js
unlines (['a', 'b']) // => 'a\nb\n'
```

---

### `splitOn` {#string-spliton}

```
splitOn :: String -> String -> Array String
```

Splits a string on a separator substring.

```js
splitOn (',') ('a,b,c') // => ['a', 'b', 'c']
```

---

### `splitOnRegex` {#string-splitonregex}

```
splitOnRegex :: RegExp -> String -> Array String
```

Splits on a regex pattern (must have the 'g' flag).

```js
splitOnRegex (/,/g) ('a,b,c') // => ['a', 'b', 'c']
```

---

### `joinWith` {#string-joinwith}

```
joinWith :: String -> Array String -> String
```

Joins an array of strings with the given separator.

```js
joinWith ('-') (['a', 'b', 'c']) // => 'a-b-c'
```

---

## `strmap`

| Function | Signature |
|---|---|
| [`equals`](#strmap-equals) | `equals :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean` |
| [`lte`](#strmap-lte) | `lte :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean` |
| [`concat`](#strmap-concat) | `concat :: StrMap v -> StrMap v -> StrMap v` |
| [`empty`](#strmap-empty) | `empty :: () -> StrMap v` |
| [`filter`](#strmap-filter) | `filter :: (v -> Boolean) -> StrMap v -> StrMap v` |
| [`reject`](#strmap-reject) | `reject :: (v -> Boolean) -> StrMap v -> StrMap v` |
| [`map`](#strmap-map) | `map :: (a -> b) -> StrMap a -> StrMap b` |
| [`ap`](#strmap-ap) | `ap :: StrMap (a -> b) -> StrMap a -> StrMap b` |
| [`alt`](#strmap-alt) | `alt :: StrMap v -> StrMap v -> StrMap v` |
| [`zero`](#strmap-zero) | `zero :: () -> StrMap v` |
| [`reduce`](#strmap-reduce) | `reduce :: ((b, v) -> b) -> b -> StrMap v -> b` |
| [`size`](#strmap-size) | `size :: StrMap v -> Integer` |
| [`all`](#strmap-all) | `all :: (v -> Boolean) -> StrMap v -> Boolean` |
| [`any`](#strmap-any) | `any :: (v -> Boolean) -> StrMap v -> Boolean` |
| [`none`](#strmap-none) | `none :: (v -> Boolean) -> StrMap v -> Boolean` |
| [`elem`](#strmap-elem) | `elem :: ((v, v) -> Boolean) -> v -> StrMap v -> Boolean` |
| [`traverse`](#strmap-traverse) | `traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (v -> f b) -> StrMap v -> f (StrMap b)` |
| [`value`](#strmap-value) | `value :: String -> StrMap a -> Maybe a` |
| [`singleton`](#strmap-singleton) | `singleton :: String -> a -> StrMap a` |
| [`insert`](#strmap-insert) | `insert :: String -> a -> StrMap a -> StrMap a` |
| [`remove`](#strmap-remove) | `remove :: String -> StrMap a -> StrMap a` |
| [`keys`](#strmap-keys) | `keys :: StrMap a -> Array String` |
| [`values`](#strmap-values) | `values :: StrMap a -> Array a` |
| [`pairs`](#strmap-pairs) | `pairs :: StrMap a -> Array [String, a]` |
| [`fromPairs`](#strmap-frompairs) | `fromPairs :: Array [String, a] -> StrMap a` |
| [`reduceC`](#strmap-reducec) | `reduceC :: (b -> a -> b) -> b -> StrMap a -> b` |

### `equals` {#strmap-equals}

```
equals :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean
```

Element-wise equality over sorted keys.

```js
equals ((a, b) => a === b) ({ a: 1 }) ({ a: 1 }) // => true
```

---

### `lte` {#strmap-lte}

```
lte :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean
```

Lexicographic ordering over sorted keys; values compared on key ties.

```js
lte ((a, b) => a <= b) ({ a: 1 }) ({ a: 2 }) // => true
```

---

### `concat` {#strmap-concat}

```
concat :: StrMap v -> StrMap v -> StrMap v
```

Right-biased merge — keys in b overwrite keys in a.

```js
concat ({ a: 1 }) ({ b: 2 }) // => {a:1,b:2}
```

---

### `empty` {#strmap-empty}

```
empty :: () -> StrMap v
```

Returns a new empty object.

```js
empty () // => {}
```

---

### `filter` {#strmap-filter}

```
filter :: (v -> Boolean) -> StrMap v -> StrMap v
```

Keeps only entries whose value satisfies the predicate.

```js
filter (v => v > 1) ({ a: 1, b: 2, c: 3 }) // => {b:2,c:3}
```

---

### `reject` {#strmap-reject}

```
reject :: (v -> Boolean) -> StrMap v -> StrMap v
```

Removes entries whose value satisfies the predicate.

```js
reject (v => v > 1) ({ a: 1, b: 2 }) // => {a:1}
```

---

### `map` {#strmap-map}

```
map :: (a -> b) -> StrMap a -> StrMap b
```

Applies f to every value.

```js
map (v => v * 2) ({ a: 1, b: 2 }) // => {a:2,b:4}
```

---

### `ap` {#strmap-ap}

```
ap :: StrMap (a -> b) -> StrMap a -> StrMap b
```

Applies functions to matching keys; only shared keys appear in the result.

```js
ap ({ a: x => x + 1 }) ({ a: 1, b: 2 }) // => {a:2}
```

---

### `alt` {#strmap-alt}

```
alt :: StrMap v -> StrMap v -> StrMap v
```

Left-biased merge — keys from a overwrite keys from b.

```js
alt ({ a: 1 }) ({ a: 9, b: 2 }) // => {a:1,b:2}
```

---

### `zero` {#strmap-zero}

```
zero :: () -> StrMap v
```

Returns an empty StrMap (monoid zero).

```js
zero () // => {}
```

---

### `reduce` {#strmap-reduce}

```
reduce :: ((b, v) -> b) -> b -> StrMap v -> b
```

Left fold over values in sorted key order.

```js
reduce ((acc, v) => acc + v) (0) ({ b: 2, a: 1 }) // => 3
```

---

### `size` {#strmap-size}

```
size :: StrMap v -> Integer
```

Returns the number of keys.

```js
size ({ a: 1, b: 2 }) // => 2
```

---

### `all` {#strmap-all}

```
all :: (v -> Boolean) -> StrMap v -> Boolean
```

True when every value satisfies the predicate.

```js
all (v => v > 0) ({ a: 1, b: 2 }) // => true
```

---

### `any` {#strmap-any}

```
any :: (v -> Boolean) -> StrMap v -> Boolean
```

True when at least one value satisfies the predicate.

```js
any (v => v > 1) ({ a: 1, b: 2 }) // => true
```

---

### `none` {#strmap-none}

```
none :: (v -> Boolean) -> StrMap v -> Boolean
```

True when no value satisfies the predicate.

```js
none (v => v > 5) ({ a: 1, b: 2 }) // => true
```

---

### `elem` {#strmap-elem}

```
elem :: ((v, v) -> Boolean) -> v -> StrMap v -> Boolean
```

True when x is found among the values using the comparator.

```js
elem ((a, b) => a === b) (2) ({ a: 1, b: 2 }) // => true
```

---

### `traverse` {#strmap-traverse}

```
traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (v -> f b) -> StrMap v -> f (StrMap b)
```

Applicative traversal — passes explicit apOf, apAp, apMap operations.

```js
traverse (Array.of) (ff => fa => ff.flatMap (f => fa.map (f))) (f => fa => fa.map (f)) (v => [v, v * 2]) ({ a: 1 })
```

---

### `value` {#strmap-value}

```
value :: String -> StrMap a -> Maybe a
```

Returns Just(m[k]) if k is an own enumerable property; Nothing otherwise.

```js
value ('a') ({ a: 1 }) // => just(1)
```

---

### `singleton` {#strmap-singleton}

```
singleton :: String -> a -> StrMap a
```

Creates a single-entry map.

```js
singleton ('a') (1) // => {a:1}
```

---

### `insert` {#strmap-insert}

```
insert :: String -> a -> StrMap a -> StrMap a
```

Returns a new map with the key set to val.

```js
insert ('b') (2) ({ a: 1 }) // => {a:1,b:2}
```

---

### `remove` {#strmap-remove}

```
remove :: String -> StrMap a -> StrMap a
```

Returns a new map with the key deleted.

```js
remove ('a') ({ a: 1, b: 2 }) // => {b:2}
```

---

### `keys` {#strmap-keys}

```
keys :: StrMap a -> Array String
```

Returns all enumerable keys.

```js
keys ({ b: 2, a: 1 }) // => ['b','a']
```

---

### `values` {#strmap-values}

```
values :: StrMap a -> Array a
```

Returns all enumerable values.

```js
values ({ a: 1, b: 2 }) // => [1,2]
```

---

### `pairs` {#strmap-pairs}

```
pairs :: StrMap a -> Array [String, a]
```

Returns all [key, value] entries.

```js
pairs ({ a: 1 }) // => [['a',1]]
```

---

### `fromPairs` {#strmap-frompairs}

```
fromPairs :: Array [String, a] -> StrMap a
```

Builds a map from [key, value] pairs — last write wins on duplicate keys.

```js
fromPairs ([['a', 1], ['b', 2]]) // => {a:1,b:2}
```

---

### `reduceC` {#strmap-reducec}

```
reduceC :: (b -> a -> b) -> b -> StrMap a -> b
```

Curried-binary left fold; values visited in sorted key order.

```js
reduceC (acc => v => acc + v) (0) ({ b: 2, a: 1 }) // => 3
```

---
