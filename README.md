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

## [`array`](#modules)

| Function | Signature |
|---|---|
| [<code>of</code>](#array-of) | `of :: a -> Array a` |
| [<code>empty</code>](#array-empty) | `empty :: () -> Array a` |
| [<code>range</code>](#array-range) | `range :: Integer -> Integer -> Array Integer` |
| [<code>unfold</code>](#array-unfold) | `unfold :: (b -> Maybe [a, b]) -> b -> Array a` |
| [<code>chainRec</code>](#array-chainrec) | `chainRec :: ((a -> Step, b -> Step, a) -> Array Step) -> a -> Array b` |
| [<code>isOutOfBounds</code>](#array-isoutofbounds) | `isOutOfBounds :: Number -> Array a -> Boolean` |
| [<code>lookup</code>](#array-lookup) | `lookup :: Number -> Array a -> Maybe a` |
| [<code>size</code>](#array-size) | `size :: Array a -> Integer` |
| [<code>array</code>](#array-array) | `array :: b -> (a -> Array a -> b) -> Array a -> b` |
| [<code>head</code>](#array-head) | `head :: Array a -> Maybe a` |
| [<code>last</code>](#array-last) | `last :: Array a -> Maybe a` |
| [<code>tail</code>](#array-tail) | `tail :: Array a -> Maybe (Array a)` |
| [<code>init</code>](#array-init) | `init :: Array a -> Maybe (Array a)` |
| [<code>all</code>](#array-all) | `all :: (a -> Boolean) -> Array a -> Boolean` |
| [<code>any</code>](#array-any) | `any :: (a -> Boolean) -> Array a -> Boolean` |
| [<code>none</code>](#array-none) | `none :: (a -> Boolean) -> Array a -> Boolean` |
| [<code>elem</code>](#array-elem) | `elem :: ((a, a) -> Boolean) -> a -> Array a -> Boolean` |
| [<code>equals</code>](#array-equals) | `equals :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean` |
| [<code>lte</code>](#array-lte) | `lte :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean` |
| [<code>find</code>](#array-find) | `find :: (a -> Boolean) -> Array a -> Maybe a` |
| [<code>findMap</code>](#array-findmap) | `findMap :: (a -> Maybe b) -> Array a -> Maybe b` |
| [<code>joinWith</code>](#array-joinwith) | `joinWith :: String -> Array String -> String` |
| [<code>reduce</code>](#array-reduce) | `reduce :: ((b, a) -> b) -> b -> Array a -> b` |
| [<code>reduceC</code>](#array-reducec) | `reduceC :: (b -> a -> b) -> b -> Array a -> b` |
| [<code>foldMap</code>](#array-foldmap) | `foldMap :: ((b, b) -> b) -> b -> (a -> b) -> Array a -> b` |
| [<code>concat</code>](#array-concat) | `concat :: Array a -> Array a -> Array a` |
| [<code>append</code>](#array-append) | `append :: a -> Array a -> Array a` |
| [<code>prepend</code>](#array-prepend) | `prepend :: a -> Array a -> Array a` |
| [<code>map</code>](#array-map) | `map :: (a -> b) -> Array a -> Array b` |
| [<code>filter</code>](#array-filter) | `` |
| [<code>reject</code>](#array-reject) | `reject :: (a -> Boolean) -> Array a -> Array a` |
| [<code>flatmap</code>](#array-flatmap) | `` |
| [<code>ap</code>](#array-ap) | `ap :: Array (a -> b) -> Array a -> Array b` |
| [<code>reverse</code>](#array-reverse) | `reverse :: Array a -> Array a` |
| [<code>sort</code>](#array-sort) | `sort :: ((a, a) -> Boolean) -> Array a -> Array a` |
| [<code>sortBy</code>](#array-sortby) | `sortBy :: ((b, b) -> Boolean) -> (a -> b) -> Array a -> Array a` |
| [<code>extend</code>](#array-extend) | `extend :: (Array a -> b) -> Array a -> Array b` |
| [<code>take</code>](#array-take) | `take :: Integer -> Array a -> Maybe (Array a)` |
| [<code>drop</code>](#array-drop) | `drop :: Integer -> Array a -> Maybe (Array a)` |
| [<code>takeLast</code>](#array-takelast) | `takeLast :: Integer -> Array a -> Maybe (Array a)` |
| [<code>dropLast</code>](#array-droplast) | `dropLast :: Integer -> Array a -> Maybe (Array a)` |
| [<code>takeWhile</code>](#array-takewhile) | `takeWhile :: (a -> Boolean) -> Array a -> Array a` |
| [<code>dropWhile</code>](#array-dropwhile) | `dropWhile :: (a -> Boolean) -> Array a -> Array a` |
| [<code>intercalate</code>](#array-intercalate) | `intercalate :: Array a -> Array (Array a) -> Array a` |
| [<code>groupBy</code>](#array-groupby) | `groupBy :: (a -> a -> Boolean) -> Array a -> Array (Array a)` |
| [<code>zip</code>](#array-zip) | `zip :: Array a -> Array b -> Array [a, b]` |
| [<code>zipWith</code>](#array-zipwith) | `zipWith :: (a -> b -> c) -> Array a -> Array b -> Array c` |
| [<code>traverse</code>](#array-traverse) | `traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Array a -> f (Array b)` |

<a id="array-of"></a>

### `of` — [↑ `array`](#array)

```
of :: a -> Array a
```

Lifts a value into a singleton array.

```js
of (1) // => [1]
```

---

<a id="array-empty"></a>

### `empty` — [↑ `array`](#array)

```
empty :: () -> Array a
```

Returns a new empty array.

```js
empty () // => []
```

---

<a id="array-range"></a>

### `range` — [↑ `array`](#array)

```
range :: Integer -> Integer -> Array Integer
```

Produces [from, from+1, ..., to-1].

```js
range (1) (4) // => [1, 2, 3]
```

---

<a id="array-unfold"></a>

### `unfold` — [↑ `array`](#array)

```
unfold :: (b -> Maybe [a, b]) -> b -> Array a
```

Generates an array from a seed until the stepper returns Nothing.

```js
unfold (n => n > 3 ? M.nothing () : M.just ([n, n+1])) (1) // => [1, 2, 3]
```

---

<a id="array-chainrec"></a>

### `chainRec` — [↑ `array`](#array)

```
chainRec :: ((a -> Step, b -> Step, a) -> Array Step) -> a -> Array b
```

Stack-safe recursive array expansion. f receives (next, done, value).

```js
chainRec ((n, d, x) => x > 2 ? [d (x)] : [n (x + 1), n (x + 2)]) (0)
```

---

<a id="array-isoutofbounds"></a>

### `isOutOfBounds` — [↑ `array`](#array)

```
isOutOfBounds :: Number -> Array a -> Boolean
```

True when index is negative or >= array length.

```js
isOutOfBounds (3) ([1, 2, 3]) // => true
```

---

<a id="array-lookup"></a>

### `lookup` — [↑ `array`](#array)

```
lookup :: Number -> Array a -> Maybe a
```

Returns Just the element at index, or Nothing if out of bounds.

```js
lookup (0) ([10, 20]) // => just(10)
```

---

<a id="array-size"></a>

### `size` — [↑ `array`](#array)

```
size :: Array a -> Integer
```

Returns the number of elements.

```js
size ([1, 2, 3]) // => 3
```

---

<a id="array-array"></a>

### `array` — [↑ `array`](#array)

```
array :: b -> (a -> Array a -> b) -> Array a -> b
```

Case analysis: returns empty value for [], or nonEmpty(head)(tail).

```js
array (0) (h => _ => h) ([5, 6]) // => 5
```

---

<a id="array-head"></a>

### `head` — [↑ `array`](#array)

```
head :: Array a -> Maybe a
```

Returns Just the first element, or Nothing for empty arrays.

```js
head ([1, 2, 3]) // => just(1)
```

---

<a id="array-last"></a>

### `last` — [↑ `array`](#array)

```
last :: Array a -> Maybe a
```

Returns Just the last element, or Nothing for empty arrays.

```js
last ([1, 2, 3]) // => just(3)
```

---

<a id="array-tail"></a>

### `tail` — [↑ `array`](#array)

```
tail :: Array a -> Maybe (Array a)
```

Returns Just all elements after the first, or Nothing for empty.

```js
tail ([1, 2, 3]) // => just([2,3])
```

---

<a id="array-init"></a>

### `init` — [↑ `array`](#array)

```
init :: Array a -> Maybe (Array a)
```

Returns Just all elements except the last, or Nothing for empty.

```js
init ([1, 2, 3]) // => just([1,2])
```

---

<a id="array-all"></a>

### `all` — [↑ `array`](#array)

```
all :: (a -> Boolean) -> Array a -> Boolean
```

True when every element satisfies the predicate.

```js
all (x => x > 0) ([1, 2, 3]) // => true
```

---

<a id="array-any"></a>

### `any` — [↑ `array`](#array)

```
any :: (a -> Boolean) -> Array a -> Boolean
```

True when at least one element satisfies the predicate.

```js
any (x => x > 2) ([1, 2, 3]) // => true
```

---

<a id="array-none"></a>

### `none` — [↑ `array`](#array)

```
none :: (a -> Boolean) -> Array a -> Boolean
```

True when no element satisfies the predicate.

```js
none (x => x > 5) ([1, 2, 3]) // => true
```

---

<a id="array-elem"></a>

### `elem` — [↑ `array`](#array)

```
elem :: ((a, a) -> Boolean) -> a -> Array a -> Boolean
```

True when x is found in arr using the comparator.

```js
elem ((a, b) => a === b) (2) ([1, 2, 3]) // => true
```

---

<a id="array-equals"></a>

### `equals` — [↑ `array`](#array)

```
equals :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean
```

Element-wise equality using an explicit comparator.

```js
equals ((a, b) => a === b) ([1, 2]) ([1, 2]) // => true
```

---

<a id="array-lte"></a>

### `lte` — [↑ `array`](#array)

```
lte :: ((a, a) -> Boolean) -> Array a -> Array a -> Boolean
```

Lexicographic ordering using an explicit lte comparator.

```js
lte ((a, b) => a <= b) ([1, 2]) ([1, 3]) // => true
```

---

<a id="array-find"></a>

### `find` — [↑ `array`](#array)

```
find :: (a -> Boolean) -> Array a -> Maybe a
```

Returns Just the first element satisfying the predicate, or Nothing.

```js
find (x => x > 2) ([1, 2, 3, 4]) // => just(3)
```

---

<a id="array-findmap"></a>

### `findMap` — [↑ `array`](#array)

```
findMap :: (a -> Maybe b) -> Array a -> Maybe b
```

Returns the first Just result from applying f to each element.

```js
findMap (x => x > 2 ? just (x * 10) : nothing ()) ([1, 2, 3]) // => just(30)
```

---

<a id="array-joinwith"></a>

### `joinWith` — [↑ `array`](#array)

```
joinWith :: String -> Array String -> String
```

Joins the array with a separator.

```js
joinWith (',') (['a', 'b', 'c']) // => 'a,b,c'
```

---

<a id="array-reduce"></a>

### `reduce` — [↑ `array`](#array)

```
reduce :: ((b, a) -> b) -> b -> Array a -> b
```

Left fold with an uncurried binary function.

```js
reduce ((acc, x) => acc + x) (0) ([1, 2, 3]) // => 6
```

---

<a id="array-reducec"></a>

### `reduceC` — [↑ `array`](#array)

```
reduceC :: (b -> a -> b) -> b -> Array a -> b
```

Left fold with a curried binary function.

```js
reduceC (acc => x => acc + x) (0) ([1, 2, 3]) // => 6
```

---

<a id="array-foldmap"></a>

### `foldMap` — [↑ `array`](#array)

```
foldMap :: ((b, b) -> b) -> b -> (a -> b) -> Array a -> b
```

Maps elements to a monoid and concatenates.

```js
foldMap ((a, b) => a + b) (0) (x => x * 2) ([1, 2, 3]) // => 12
```

---

<a id="array-concat"></a>

### `concat` — [↑ `array`](#array)

```
concat :: Array a -> Array a -> Array a
```

Concatenates two arrays.

```js
concat ([1, 2]) ([3, 4]) // => [1,2,3,4]
```

---

<a id="array-append"></a>

### `append` — [↑ `array`](#array)

```
append :: a -> Array a -> Array a
```

Appends an element to the end.

```js
append (4) ([1, 2, 3]) // => [1,2,3,4]
```

---

<a id="array-prepend"></a>

### `prepend` — [↑ `array`](#array)

```
prepend :: a -> Array a -> Array a
```

Prepends an element to the front.

```js
prepend (0) ([1, 2, 3]) // => [0,1,2,3]
```

---

<a id="array-map"></a>

### `map` — [↑ `array`](#array)

```
map :: (a -> b) -> Array a -> Array b
```

Applies f to every element.

```js
map (x => x * 2) ([1, 2, 3]) // => [2,4,6]
```

---

<a id="array-filter"></a>

### `filter` — [↑ `array`](#array)

Keeps elements satisfying the predicate. // filter :: (a -> Boolean) -> Array a -> Array a

---

<a id="array-reject"></a>

### `reject` — [↑ `array`](#array)

```
reject :: (a -> Boolean) -> Array a -> Array a
```

Removes elements satisfying the predicate (complement of filter).

```js
reject (x => x > 1) ([1, 2, 3]) // => [1]
```

---

<a id="array-flatmap"></a>

### `flatmap` — [↑ `array`](#array)

Maps then flattens one level (monadic bind). // flatmap :: (a -> Array b) -> Array a -> Array b

---

<a id="array-ap"></a>

### `ap` — [↑ `array`](#array)

```
ap :: Array (a -> b) -> Array a -> Array b
```

Cartesian application — each function applied to each value.

```js
ap ([x => x + 1, x => x * 2]) ([10, 20]) // => [11,21,20,40]
```

---

<a id="array-reverse"></a>

### `reverse` — [↑ `array`](#array)

```
reverse :: Array a -> Array a
```

Returns a reversed copy.

```js
reverse ([1, 2, 3]) // => [3,2,1]
```

---

<a id="array-sort"></a>

### `sort` — [↑ `array`](#array)

```
sort :: ((a, a) -> Boolean) -> Array a -> Array a
```

Stable sort with an explicit lte comparator.

```js
sort ((a, b) => a <= b) ([3, 1, 2]) // => [1,2,3]
```

---

<a id="array-sortby"></a>

### `sortBy` — [↑ `array`](#array)

```
sortBy :: ((b, b) -> Boolean) -> (a -> b) -> Array a -> Array a
```

Stable sort using a key extractor and an explicit lte for the key type.

```js
sortBy ((a, b) => a <= b) (x => x.n) ([{n: 2}, {n:1}]) // => [{n:1},{n:2}]
```

---

<a id="array-extend"></a>

### `extend` — [↑ `array`](#array)

```
extend :: (Array a -> b) -> Array a -> Array b
```

Cobinds by applying f to each suffix: extend(f)([x,y,z]) = [f([x,y,z]), f([y,z]), f([z])].

```js
extend (head) ([1, 2, 3]) // => [just(1), just(2), just(3)]
```

---

<a id="array-take"></a>

### `take` — [↑ `array`](#array)

```
take :: Integer -> Array a -> Maybe (Array a)
```

Returns Just the first n elements if 0 <= n <= length, else Nothing.

```js
take (2) ([1, 2, 3]) // => just([1,2])
```

---

<a id="array-drop"></a>

### `drop` — [↑ `array`](#array)

```
drop :: Integer -> Array a -> Maybe (Array a)
```

Returns Just the array after dropping the first n elements, else Nothing.

```js
drop (1) ([1, 2, 3]) // => just([2,3])
```

---

<a id="array-takelast"></a>

### `takeLast` — [↑ `array`](#array)

```
takeLast :: Integer -> Array a -> Maybe (Array a)
```

Returns Just the last n elements if 0 <= n <= length, else Nothing.

```js
takeLast (2) ([1, 2, 3]) // => just([2,3])
```

---

<a id="array-droplast"></a>

### `dropLast` — [↑ `array`](#array)

```
dropLast :: Integer -> Array a -> Maybe (Array a)
```

Returns Just the array with the last n elements removed, else Nothing.

```js
dropLast (1) ([1, 2, 3]) // => just([1,2])
```

---

<a id="array-takewhile"></a>

### `takeWhile` — [↑ `array`](#array)

```
takeWhile :: (a -> Boolean) -> Array a -> Array a
```

Takes elements from the front while the predicate holds.

```js
takeWhile (x => x < 3) ([1, 2, 3, 4]) // => [1,2]
```

---

<a id="array-dropwhile"></a>

### `dropWhile` — [↑ `array`](#array)

```
dropWhile :: (a -> Boolean) -> Array a -> Array a
```

Drops elements from the front while the predicate holds.

```js
dropWhile (x => x < 3) ([1, 2, 3, 4]) // => [3,4]
```

---

<a id="array-intercalate"></a>

### `intercalate` — [↑ `array`](#array)

```
intercalate :: Array a -> Array (Array a) -> Array a
```

Inserts sep between sub-arrays and flattens.

```js
intercalate ([0]) ([[1, 2], [3, 4]]) // => [1,2,0,3,4]
```

---

<a id="array-groupby"></a>

### `groupBy` — [↑ `array`](#array)

```
groupBy :: (a -> a -> Boolean) -> Array a -> Array (Array a)
```

Groups adjacent equal elements into sub-arrays.

```js
groupBy (a => b => a === b) ([1, 1, 2, 3, 3]) // => [[1,1],[2],[3,3]]
```

---

<a id="array-zip"></a>

### `zip` — [↑ `array`](#array)

```
zip :: Array a -> Array b -> Array [a, b]
```

Zips two arrays to the length of the shorter.

```js
zip ([1, 2, 3]) (['a', 'b']) // => [[1,'a'],[2,'b']]
```

---

<a id="array-zipwith"></a>

### `zipWith` — [↑ `array`](#array)

```
zipWith :: (a -> b -> c) -> Array a -> Array b -> Array c
```

Zips with a combining function, truncating to the shorter length.

```js
zipWith (a => b => a + b) ([1, 2, 3]) ([10, 20]) // => [11, 22]
```

---

<a id="array-traverse"></a>

### `traverse` — [↑ `array`](#array)

```
traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Array a -> f (Array b)
```

Applicative traversal — passes explicit apOf, apAp, apMap operations.

```js
traverse (Array.of) (ff => fa => ff.flatMap (f => fa.map (f))) (f => fa => fa.map (f)) (x => [x, -x]) ([1, 2])
```

---

## [`boolean`](#modules)

| Function | Signature |
|---|---|
| [<code>isBool</code>](#boolean-isbool) | `isBool :: a -> Boolean` |
| [<code>equals</code>](#boolean-equals) | `equals :: Boolean -> Boolean -> Boolean` |
| [<code>lte</code>](#boolean-lte) | `lte :: Boolean -> Boolean -> Boolean` |
| [<code>lt</code>](#boolean-lt) | `lt :: Boolean -> Boolean -> Boolean` |
| [<code>gte</code>](#boolean-gte) | `gte :: Boolean -> Boolean -> Boolean` |
| [<code>gt</code>](#boolean-gt) | `gt :: Boolean -> Boolean -> Boolean` |
| [<code>min</code>](#boolean-min) | `min :: Boolean -> Boolean -> Boolean` |
| [<code>max</code>](#boolean-max) | `max :: Boolean -> Boolean -> Boolean` |
| [<code>clamp</code>](#boolean-clamp) | `clamp :: Boolean -> Boolean -> Boolean -> Boolean` |

<a id="boolean-isbool"></a>

### `isBool` — [↑ `boolean`](#boolean)

```
isBool :: a -> Boolean
```

Returns true when a is a boolean primitive.

```js
isBool (true) // => true
```

---

<a id="boolean-equals"></a>

### `equals` — [↑ `boolean`](#boolean)

```
equals :: Boolean -> Boolean -> Boolean
```

True only when both are booleans with the same value.

```js
equals (true) (true) // => true
```

---

<a id="boolean-lte"></a>

### `lte` — [↑ `boolean`](#boolean)

```
lte :: Boolean -> Boolean -> Boolean
```

false <= false, false <= true, NOT true <= false.

```js
lte (false) (true) // => true
```

---

<a id="boolean-lt"></a>

### `lt` — [↑ `boolean`](#boolean)

```
lt :: Boolean -> Boolean -> Boolean
```

Strict less-than.

```js
lt (false) (true) // => true
```

---

<a id="boolean-gte"></a>

### `gte` — [↑ `boolean`](#boolean)

```
gte :: Boolean -> Boolean -> Boolean
```

Greater-than-or-equal.

```js
gte (true) (false) // => true
```

---

<a id="boolean-gt"></a>

### `gt` — [↑ `boolean`](#boolean)

```
gt :: Boolean -> Boolean -> Boolean
```

Strict greater-than.

```js
gt (true) (false) // => true
```

---

<a id="boolean-min"></a>

### `min` — [↑ `boolean`](#boolean)

```
min :: Boolean -> Boolean -> Boolean
```

Returns the smaller of the two booleans.

```js
min (true) (false) // => false
```

---

<a id="boolean-max"></a>

### `max` — [↑ `boolean`](#boolean)

```
max :: Boolean -> Boolean -> Boolean
```

Returns the larger of the two booleans.

```js
max (true) (false) // => true
```

---

<a id="boolean-clamp"></a>

### `clamp` — [↑ `boolean`](#boolean)

```
clamp :: Boolean -> Boolean -> Boolean -> Boolean
```

Clamps a value between lo and hi.

```js
clamp (false) (true) (false) // => false
```

---

## [`date`](#modules)

| Function | Signature |
|---|---|
| [<code>equals</code>](#date-equals) | `equals :: Date -> Date -> Boolean` |
| [<code>lte</code>](#date-lte) | `lte :: Date -> Date -> Boolean` |
| [<code>lt</code>](#date-lt) | `lt :: Date -> Date -> Boolean` |
| [<code>gte</code>](#date-gte) | `gte :: Date -> Date -> Boolean` |
| [<code>gt</code>](#date-gt) | `gt :: Date -> Date -> Boolean` |
| [<code>min</code>](#date-min) | `min :: Date -> Date -> Date` |
| [<code>max</code>](#date-max) | `max :: Date -> Date -> Date` |
| [<code>clamp</code>](#date-clamp) | `clamp :: Date -> Date -> Date -> Date` |
| [<code>parseDate</code>](#date-parsedate) | `parseDate :: String -> Maybe Date` |

<a id="date-equals"></a>

### `equals` — [↑ `date`](#date)

```
equals :: Date -> Date -> Boolean
```

True when both dates represent the same instant.

```js
equals (new Date (0)) (new Date (0)) // => true
```

---

<a id="date-lte"></a>

### `lte` — [↑ `date`](#date)

```
lte :: Date -> Date -> Boolean
```

True when a is at or before b.

```js
lte (new Date (0)) (new Date (1)) // => true
```

---

<a id="date-lt"></a>

### `lt` — [↑ `date`](#date)

```
lt :: Date -> Date -> Boolean
```

Strict earlier-than.

```js
lt (new Date (0)) (new Date (1)) // => true
```

---

<a id="date-gte"></a>

### `gte` — [↑ `date`](#date)

```
gte :: Date -> Date -> Boolean
```

True when a is at or after b.

```js
gte (new Date (1)) (new Date (0)) // => true
```

---

<a id="date-gt"></a>

### `gt` — [↑ `date`](#date)

```
gt :: Date -> Date -> Boolean
```

Strict later-than.

```js
gt (new Date (1)) (new Date (0)) // => true
```

---

<a id="date-min"></a>

### `min` — [↑ `date`](#date)

```
min :: Date -> Date -> Date
```

Returns the earlier of the two dates.

```js
min (new Date (0)) (new Date (1)) // => new Date(0)
```

---

<a id="date-max"></a>

### `max` — [↑ `date`](#date)

```
max :: Date -> Date -> Date
```

Returns the later of the two dates.

```js
max (new Date (0)) (new Date (1)) // => new Date(1)
```

---

<a id="date-clamp"></a>

### `clamp` — [↑ `date`](#date)

```
clamp :: Date -> Date -> Date -> Date
```

Clamps a date between lo and hi.

```js
clamp (new Date (0)) (new Date (10)) (new Date (15)) // => new Date(10)
```

---

<a id="date-parsedate"></a>

### `parseDate` — [↑ `date`](#date)

```
parseDate :: String -> Maybe Date
```

Parses a date string — Just(Date) on success, Nothing for invalid input.

```js
parseDate ('2020-01-01') // => just(new Date('2020-01-01'))
```

---

## [`either`](#modules)

| Function | Signature |
|---|---|
| [<code>left</code>](#either-left) | `left :: a -> Either a b` |
| [<code>right</code>](#either-right) | `right :: b -> Either a b` |
| [<code>fromNullable</code>](#either-fromnullable) | `fromNullable :: (() -> a) -> b -> Either a b` |
| [<code>tryCatch</code>](#either-trycatch) | `tryCatch :: ((...a) -> b, (Error, a) -> c) -> ...a -> Either c b` |
| [<code>fromPredicate</code>](#either-frompredicate) | `fromPredicate :: (a -> Boolean, a -> b) -> a -> Either b a` |
| [<code>isLeft</code>](#either-isleft) | `isLeft :: a -> Boolean` |
| [<code>isRight</code>](#either-isright) | `isRight :: a -> Boolean` |
| [<code>either</code>](#either-either) | `either :: (a -> c) -> (b -> c) -> Either a b -> c` |
| [<code>fromLeft</code>](#either-fromleft) | `fromLeft :: a -> Either a b -> a` |
| [<code>fromRight</code>](#either-fromright) | `fromRight :: b -> Either a b -> b` |
| [<code>fromEither</code>](#either-fromeither) | `fromEither :: Either a a -> a` |
| [<code>lefts</code>](#either-lefts) | `lefts :: Array (Either a b) -> Array a` |
| [<code>rights</code>](#either-rights) | `rights :: Array (Either a b) -> Array b` |
| [<code>encase</code>](#either-encase) | `encase :: (a -> b) -> a -> Either Error b` |
| [<code>eitherToMaybe</code>](#either-eithertomaybe) | `eitherToMaybe :: Either a b -> Maybe b` |
| [<code>swap</code>](#either-swap) | `swap :: Either a b -> Either b a` |
| [<code>mapRight</code>](#either-mapright) | `mapRight :: (b -> c) -> Either a b -> Either a c` |
| [<code>mapLeft</code>](#either-mapleft) | `mapLeft :: (a -> c) -> Either a b -> Either c b` |
| [<code>bimap</code>](#either-bimap) | `bimap :: (a -> c) -> (b -> d) -> Either a b -> Either c d` |
| [<code>ap</code>](#either-ap) | `ap :: Either a (b -> c) -> Either a b -> Either a c` |
| [<code>flatmapRight</code>](#either-flatmapright) | `flatmapRight :: (b -> Either a c) -> Either a b -> Either a c` |
| [<code>flatmapLeft</code>](#either-flatmapleft) | `flatmapLeft :: (a -> Either c b) -> Either a b -> Either c b` |
| [<code>flatmapFirst</code>](#either-flatmapfirst) | `flatmapFirst :: (b -> Either a c) -> Either a b -> Either a b` |
| [<code>alt</code>](#either-alt) | `alt :: Either a b -> Either a b -> Either a b` |
| [<code>fold</code>](#either-fold) | `fold :: ((c, b) -> c) -> c -> Either a b -> c` |
| [<code>traverse</code>](#either-traverse) | `traverse :: (b -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Either l a -> f (Either l b)` |

<a id="either-left"></a>

### `left` — [↑ `either`](#either)

```
left :: a -> Either a b
```

Wraps a value in the Left constructor.

```js
left ('err') // => { tag: 'left', left: 'err' }
```

---

<a id="either-right"></a>

### `right` — [↑ `either`](#either)

```
right :: b -> Either a b
```

Wraps a value in the Right constructor.

```js
right (42) // => { tag: 'right', right: 42 }
```

---

<a id="either-fromnullable"></a>

### `fromNullable` — [↑ `either`](#either)

```
fromNullable :: (() -> a) -> b -> Either a b
```

Right when value is non-null/undefined; Left using the thunk otherwise.

```js
fromNullable (() => 'missing') (null) // => left('missing')
```

---

<a id="either-trycatch"></a>

### `tryCatch` — [↑ `either`](#either)

```
tryCatch :: ((...a) -> b, (Error, a) -> c) -> ...a -> Either c b
```

Runs fn; Right on success, Left via onError handler on throw.

```js
tryCatch (JSON.parse, e => e.message) ('bad') // => left('...')
```

---

<a id="either-frompredicate"></a>

### `fromPredicate` — [↑ `either`](#either)

```
fromPredicate :: (a -> Boolean, a -> b) -> a -> Either b a
```

Right when predicate is true; Left via onFalse otherwise.

```js
fromPredicate (x => x > 0, x => 'neg') (3) // => right(3)
```

---

<a id="either-isleft"></a>

### `isLeft` — [↑ `either`](#either)

```
isLeft :: a -> Boolean
```

True when the value is a Left.

```js
isLeft (left (1)) // => true
```

---

<a id="either-isright"></a>

### `isRight` — [↑ `either`](#either)

```
isRight :: a -> Boolean
```

True when the value is a Right.

```js
isRight (right (1)) // => true
```

---

<a id="either-either"></a>

### `either` — [↑ `either`](#either)

```
either :: (a -> c) -> (b -> c) -> Either a b -> c
```

Curried case-fold on Either.

```js
either (l => l) (r => r) (right (42)) // => 42
```

---

<a id="either-fromleft"></a>

### `fromLeft` — [↑ `either`](#either)

```
fromLeft :: a -> Either a b -> a
```

Extracts the Left value, or returns the default for Right.

```js
fromLeft ('def') (right (1)) // => 'def'
```

---

<a id="either-fromright"></a>

### `fromRight` — [↑ `either`](#either)

```
fromRight :: b -> Either a b -> b
```

Extracts the Right value, or returns the default for Left.

```js
fromRight (0) (left ('x')) // => 0
```

---

<a id="either-fromeither"></a>

### `fromEither` — [↑ `either`](#either)

```
fromEither :: Either a a -> a
```

Extracts the value regardless of constructor when both sides share a type.

```js
fromEither (left (42)) // => 42
```

---

<a id="either-lefts"></a>

### `lefts` — [↑ `either`](#either)

```
lefts :: Array (Either a b) -> Array a
```

Filters to Left values and extracts them.

```js
lefts ([left (1), right (2), left (3)]) // => [1, 3]
```

---

<a id="either-rights"></a>

### `rights` — [↑ `either`](#either)

```
rights :: Array (Either a b) -> Array b
```

Filters to Right values and extracts them.

```js
rights ([left (1), right (2), right (3)]) // => [2, 3]
```

---

<a id="either-encase"></a>

### `encase` — [↑ `either`](#either)

```
encase :: (a -> b) -> a -> Either Error b
```

Lifts a throwing function into a total Either-returning one.

```js
encase (JSON.parse) ('{"a":1}') // => right({ a: 1 })
```

---

<a id="either-eithertomaybe"></a>

### `eitherToMaybe` — [↑ `either`](#either)

```
eitherToMaybe :: Either a b -> Maybe b
```

Converts Right to Just and Left to Nothing.

```js
eitherToMaybe (right (1)) // => just(1)
```

---

<a id="either-swap"></a>

### `swap` — [↑ `either`](#either)

```
swap :: Either a b -> Either b a
```

Swaps Left and Right.

```js
swap (left (1)) // => right(1)
```

---

<a id="either-mapright"></a>

### `mapRight` — [↑ `either`](#either)

```
mapRight :: (b -> c) -> Either a b -> Either a c
```

Maps over the Right value, leaving Left untouched.

```js
mapRight (x => x + 1) (right (1)) // => right(2)
```

---

<a id="either-mapleft"></a>

### `mapLeft` — [↑ `either`](#either)

```
mapLeft :: (a -> c) -> Either a b -> Either c b
```

Maps over the Left value, leaving Right untouched.

```js
mapLeft (x => x + '!') (left ('err')) // => left('err!')
```

---

<a id="either-bimap"></a>

### `bimap` — [↑ `either`](#either)

```
bimap :: (a -> c) -> (b -> d) -> Either a b -> Either c d
```

Maps Left with the first function and Right with the second.

```js
bimap (l => l + '!') (r => r + 1) (right (2)) // => right(3)
```

---

<a id="either-ap"></a>

### `ap` — [↑ `either`](#either)

```
ap :: Either a (b -> c) -> Either a b -> Either a c
```

Applies a function in a Right to a value in a Right.

```js
ap (right (x => x + 1)) (right (2)) // => right(3)
```

---

<a id="either-flatmapright"></a>

### `flatmapRight` — [↑ `either`](#either)

```
flatmapRight :: (b -> Either a c) -> Either a b -> Either a c
```

Monadic bind over Right.

```js
flatmapRight (x => right (x + 1)) (right (2)) // => right(3)
```

---

<a id="either-flatmapleft"></a>

### `flatmapLeft` — [↑ `either`](#either)

```
flatmapLeft :: (a -> Either c b) -> Either a b -> Either c b
```

Monadic bind over Left.

```js
flatmapLeft (e => left (e + '!')) (left ('x')) // => left('x!')
```

---

<a id="either-flatmapfirst"></a>

### `flatmapFirst` — [↑ `either`](#either)

```
flatmapFirst :: (b -> Either a c) -> Either a b -> Either a b
```

Runs a Right through fn for its Left side effect; keeps original Right on success.

```js
flatmapFirst (x => left ('stop')) (right (1)) // => left('stop')
```

---

<a id="either-alt"></a>

### `alt` — [↑ `either`](#either)

```
alt :: Either a b -> Either a b -> Either a b
```

Returns the first Right, or the second argument if both are Left.

```js
alt (right (2)) (left ('x')) // => right(2)
```

---

<a id="either-fold"></a>

### `fold` — [↑ `either`](#either)

```
fold :: ((c, b) -> c) -> c -> Either a b -> c
```

Reduces a Right with a binary function and initial value; returns initial for Left.

```js
fold ((acc, x) => acc + x, 0) (right (5)) // => 5
```

---

<a id="either-traverse"></a>

### `traverse` — [↑ `either`](#either)

```
traverse :: (b -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> Either l a -> f (Either l b)
```

Applicative traversal over the Right value.

```js
traverse (Array.of) (f => xs => xs.map (f)) (x => [x, x]) (right (1)) // => [right(1), right(1)]
```

---

## [`fn`](#modules)

| Function | Signature |
|---|---|
| [<code>pipe</code>](#fn-pipe) | `pipe :: Foldable f => f (Any -> Any) -> a -> b` |
| [<code>pipeK</code>](#fn-pipek) | `pipeK :: (Foldable f, Flatmap m) => f (Any -> m Any) -> m a -> m b` |
| [<code>T</code>](#fn-t) | `T :: a -> (a -> b) -> b` |
| [<code>tap</code>](#fn-tap) | `tap :: (a -> *) -> a -> a` |
| [<code>on</code>](#fn-on) | `on :: (b -> b -> c) -> (a -> b) -> a -> a -> c` |
| [<code>id</code>](#fn-id) | `id :: a -> a` |
| [<code>compose</code>](#fn-compose) | `compose :: (b -> c) -> (a -> b) -> a -> c` |
| [<code>flip</code>](#fn-flip) | `flip :: (a -> b -> c) -> b -> a -> c` |
| [<code>map</code>](#fn-map) | `map :: (a -> b) -> (e -> a) -> e -> b` |
| [<code>ap</code>](#fn-ap) | `ap :: (e -> a -> b) -> (e -> a) -> e -> b` |
| [<code>of</code>](#fn-of) | `of :: a -> e -> a` |
| [<code>flatmap</code>](#fn-flatmap) | `flatmap :: (a -> e -> b) -> (e -> a) -> e -> b` |
| [<code>contramap</code>](#fn-contramap) | `contramap :: (b -> a) -> (a -> c) -> b -> c` |
| [<code>promap</code>](#fn-promap) | `promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d` |
| [<code>extend</code>](#fn-extend) | `extend :: (concat -> (e -> a) -> b) -> (e -> a) -> e -> b` |
| [<code>chainRec</code>](#fn-chainrec) | `chainRec :: ((a -> Step, b -> Step, a) -> e -> Step) -> a -> e -> b` |
| [<code>handleThrow</code>](#fn-handlethrow) | `handleThrow :: ((...d) -> a) -> (a, d -> r) -> (Error, d -> r) -> (...d) -> r` |

<a id="fn-pipe"></a>

### `pipe` — [↑ `fn`](#fn)

```
pipe :: Foldable f => f (Any -> Any) -> a -> b
```

Threads a value through a left-to-right sequence of functions.

```js
pipe ([x => x + 1, Math.sqrt]) (99) // => 10
```

---

<a id="fn-pipek"></a>

### `pipeK` — [↑ `fn`](#fn)

```
pipeK :: (Foldable f, Flatmap m) => f (Any -> m Any) -> m a -> m b
```

Left-to-right Kleisli composition over a flatmappable monad.

```js
pipeK ([f, g]) (mx) // flatmap (g) (flatmap (f) (mx))
```

---

<a id="fn-t"></a>

### `T` — [↑ `fn`](#fn)

```
T :: a -> (a -> b) -> b
```

Thrush combinator – applies an argument to a function.

```js
T (42) (x => x + 1) // => 43
```

---

<a id="fn-tap"></a>

### `tap` — [↑ `fn`](#fn)

```
tap :: (a -> *) -> a -> a
```

Runs the given function with the supplied object, then returns the object.

```js
tap (console.log) (42) // => 42 *log: 42
```

---

<a id="fn-on"></a>

### `on` — [↑ `fn`](#fn)

```
on :: (b -> b -> c) -> (a -> b) -> a -> a -> c
```

P combinator – applies a binary function after mapping both args.

```js
on ((a) => (b) => a.concat (b)) (x => x.reverse ()) ([1,2]) ([3,4]) // => [2,1,3,4]
```

---

<a id="fn-id"></a>

### `id` — [↑ `fn`](#fn)

```
id :: a -> a
```

Identity – returns its argument unchanged.

```js
id (42) // => 42
```

---

<a id="fn-compose"></a>

### `compose` — [↑ `fn`](#fn)

```
compose :: (b -> c) -> (a -> b) -> a -> c
```

Right-to-left function composition.

```js
compose (x => x * 2) (x => x + 1) (3) // => 8
```

---

<a id="fn-flip"></a>

### `flip` — [↑ `fn`](#fn)

```
flip :: (a -> b -> c) -> b -> a -> c
```

Flips the order of the first two arguments.

```js
flip (a => b => a - b) (1) (3) // => 2
```

---

<a id="fn-map"></a>

### `map` — [↑ `fn`](#fn)

```
map :: (a -> b) -> (e -> a) -> e -> b
```

Reader functor – post-composes a function.

```js
map (x => x + 1) (x => x * 2) (3) // => 7
```

---

<a id="fn-ap"></a>

### `ap` — [↑ `fn`](#fn)

```
ap :: (e -> a -> b) -> (e -> a) -> e -> b
```

S combinator – ap(ff)(fa)(x) = ff(x)(fa(x)).

```js
ap (e => x => e + x) (e => e * 2) (3) // => 9
```

---

<a id="fn-of"></a>

### `of` — [↑ `fn`](#fn)

```
of :: a -> e -> a
```

Lifts a value into the Reader context (constant function).

```js
of (42) ('ignored') // => 42
```

---

<a id="fn-flatmap"></a>

### `flatmap` — [↑ `fn`](#fn)

```
flatmap :: (a -> e -> b) -> (e -> a) -> e -> b
```

Reader monad bind.

```js
flatmap (a => e => a + e) (e => e * 2) (3) // => 9
```

---

<a id="fn-contramap"></a>

### `contramap` — [↑ `fn`](#fn)

```
contramap :: (b -> a) -> (a -> c) -> b -> c
```

Pre-composes a function (contravariant map).

```js
contramap (x => x + 1) (x => x * 2) (3) // => 8
```

---

<a id="fn-promap"></a>

### `promap` — [↑ `fn`](#fn)

```
promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d
```

promap :: (a -> b) -> (c -> d) -> (b -> c) -> a -> d Maps both the input and output of a function.

```js
promap (x => x + 1) (x => x * 2) (x => x) (3) // => 8
```

---

<a id="fn-extend"></a>

### `extend` — [↑ `fn`](#fn)

```
extend :: (concat -> (e -> a) -> b) -> (e -> a) -> e -> b
```

Comonad extend for the Reader context.

```js
extend (concatFn) (f) (wa) (x)
```

---

<a id="fn-chainrec"></a>

### `chainRec` — [↑ `fn`](#fn)

```
chainRec :: ((a -> Step, b -> Step, a) -> e -> Step) -> a -> e -> b
```

Stack-safe tail-recursive Reader bind.

```js
chainRec ((next, done, n) => _ => n <= 0 ? done (n) : next (n - 1)) (1000) (null)
```

---

<a id="fn-handlethrow"></a>

### `handleThrow` — [↑ `fn`](#fn)

```
handleThrow :: ((...d) -> a) -> (a, d -> r) -> (Error, d -> r) -> (...d) -> r
```

Wraps a function so that thrown errors are caught and routed to onThrow.

```js
handleThrow (JSON.parse) (r => r) (e => null) ('{}')
```

---

## [`logic`](#modules)

| Function | Signature |
|---|---|
| [<code>and</code>](#logic-and) | `and :: Boolean -> Boolean -> Boolean` |
| [<code>or</code>](#logic-or) | `or :: Boolean -> Boolean -> Boolean` |
| [<code>not</code>](#logic-not) | `not :: Boolean -> Boolean` |
| [<code>complement</code>](#logic-complement) | `complement :: (a -> Boolean) -> a -> Boolean` |
| [<code>boolean_</code>](#logic-boolean_) | `boolean_ :: a -> a -> Boolean -> a` |
| [<code>ifElse</code>](#logic-ifelse) | `ifElse :: (a -> Boolean) -> (a -> b) -> (a -> b) -> a -> b` |
| [<code>when</code>](#logic-when) | `when :: (a -> Boolean) -> (a -> a) -> a -> a` |
| [<code>unless</code>](#logic-unless) | `unless :: (a -> Boolean) -> (a -> a) -> a -> a` |
| [<code>cond</code>](#logic-cond) | `cond :: [(a -> Boolean, a -> b)] -> a -> Maybe b` |

<a id="logic-and"></a>

### `and` — [↑ `logic`](#logic)

```
and :: Boolean -> Boolean -> Boolean
```

Logical conjunction.

```js
and (true) (false) // => false
```

---

<a id="logic-or"></a>

### `or` — [↑ `logic`](#logic)

```
or :: Boolean -> Boolean -> Boolean
```

Logical disjunction.

```js
or (false) (true) // => true
```

---

<a id="logic-not"></a>

### `not` — [↑ `logic`](#logic)

```
not :: Boolean -> Boolean
```

Logical negation.

```js
not (true) // => false
```

---

<a id="logic-complement"></a>

### `complement` — [↑ `logic`](#logic)

```
complement :: (a -> Boolean) -> a -> Boolean
```

Returns a predicate that negates the original.

```js
complement (x => x > 0) (-1) // => true
```

---

<a id="logic-boolean_"></a>

### `boolean_` — [↑ `logic`](#logic)

```
boolean_ :: a -> a -> Boolean -> a
```

Case analysis on a boolean — returns onFalse or onTrue.

```js
boolean_ ('no') ('yes') (false) // => 'no'
```

---

<a id="logic-ifelse"></a>

### `ifElse` — [↑ `logic`](#logic)

```
ifElse :: (a -> Boolean) -> (a -> b) -> (a -> b) -> a -> b
```

Applies f if predicate holds, g otherwise.

```js
ifElse (x => x > 0) (x => x) (x => -x) (-3) // => 3
```

---

<a id="logic-when"></a>

### `when` — [↑ `logic`](#logic)

```
when :: (a -> Boolean) -> (a -> a) -> a -> a
```

Applies f only when predicate holds, otherwise returns x unchanged.

```js
when (x => x < 0) (() => 0) (-1) // => 0
```

---

<a id="logic-unless"></a>

### `unless` — [↑ `logic`](#logic)

```
unless :: (a -> Boolean) -> (a -> a) -> a -> a
```

Applies f only when predicate does NOT hold.

```js
unless (x => x > 0) (x => -x) (-3) // => 3
```

---

<a id="logic-cond"></a>

### `cond` — [↑ `logic`](#logic)

```
cond :: [(a -> Boolean, a -> b)] -> a -> Maybe b
```

Tries each [pred, fn] pair in order; returns Just(fn(a)) for the first matching predicate, or Nothing if none match.

```js
cond ([pair (a => a <= 0) ((a) => a + 2), pair (a => a > 0) (Math.abs)]) (-1) // Just 1
```

---

## [`maybe`](#modules)

| Function | Signature |
|---|---|
| [<code>just</code>](#maybe-just) | `just :: a -> Maybe a` |
| [<code>nothing</code>](#maybe-nothing) | `nothing :: () -> Maybe never` |
| [<code>fromNullable</code>](#maybe-fromnullable) | `fromNullable :: a -> Maybe (NonNullable a)` |
| [<code>fromPredicate</code>](#maybe-frompredicate) | `fromPredicate :: (a -> Boolean) -> a -> Maybe a` |
| [<code>tryCatch</code>](#maybe-trycatch) | `tryCatch :: (() -> a) -> Maybe a` |
| [<code>isJust</code>](#maybe-isjust) | `isJust :: unknown -> Boolean` |
| [<code>isNothing</code>](#maybe-isnothing) | `isNothing :: unknown -> Boolean` |
| [<code>isMaybe</code>](#maybe-ismaybe) | `isMaybe :: unknown -> Boolean` |
| [<code>maybe</code>](#maybe-maybe) | `maybe :: b -> (a -> b) -> Maybe a -> b` |
| [<code>maybe_</code>](#maybe-maybe_) | `maybe_ :: (() -> b) -> (a -> b) -> Maybe a -> b` |
| [<code>fromMaybe</code>](#maybe-frommaybe) | `fromMaybe :: a -> Maybe a -> a` |
| [<code>fromMaybe_</code>](#maybe-frommaybe_) | `fromMaybe_ :: (() -> a) -> Maybe a -> a` |
| [<code>justs</code>](#maybe-justs) | `justs :: Array (Maybe a) -> Array a` |
| [<code>toNull</code>](#maybe-tonull) | `toNull :: Maybe a -> a \| null` |
| [<code>toUndefined</code>](#maybe-toundefined) | `toUndefined :: Maybe a -> a \| undefined` |
| [<code>maybeToEither</code>](#maybe-maybetoeither) | `maybeToEither :: a -> Maybe b -> Either a b` |
| [<code>map</code>](#maybe-map) | `map :: (a -> b) -> Maybe a -> Maybe b` |
| [<code>filter</code>](#maybe-filter) | `filter :: (a -> Boolean) -> Maybe a -> Maybe a` |
| [<code>filterMap</code>](#maybe-filtermap) | `filterMap :: (a -> Maybe b) -> Maybe a -> Maybe b` |
| [<code>flatmap</code>](#maybe-flatmap) | `flatmap :: (a -> Maybe b) -> Maybe a -> Maybe b` |
| [<code>mapNullable</code>](#maybe-mapnullable) | `mapNullable :: (a -> b \| null \| undefined) -> Maybe a -> Maybe b` |
| [<code>mapMaybe</code>](#maybe-mapmaybe) | `` |
| [<code>ap</code>](#maybe-ap) | `ap :: Maybe (a -> b) -> Maybe a -> Maybe b` |
| [<code>alt</code>](#maybe-alt) | `alt :: Maybe a -> Maybe a -> Maybe a` |
| [<code>exists</code>](#maybe-exists) | `exists :: (a -> Boolean) -> Maybe a -> Boolean` |
| [<code>fold</code>](#maybe-fold) | `fold :: ((b, a) -> b) -> b -> Maybe a -> b` |

<a id="maybe-just"></a>

### `just` — [↑ `maybe`](#maybe)

```
just :: a -> Maybe a
```

Wraps a value in Just.

```js
just (1) // => { tag: 'just', value: 1 }
```

---

<a id="maybe-nothing"></a>

### `nothing` — [↑ `maybe`](#maybe)

```
nothing :: () -> Maybe never
```

Creates a Nothing value.

```js
nothing () // => { tag: 'nothing' }
```

---

<a id="maybe-fromnullable"></a>

### `fromNullable` — [↑ `maybe`](#maybe)

```
fromNullable :: a -> Maybe (NonNullable a)
```

Converts null/undefined to Nothing, any other value to Just.

```js
fromNullable (1)    // => just(1)
fromNullable (null) // => nothing()
```

---

<a id="maybe-frompredicate"></a>

### `fromPredicate` — [↑ `maybe`](#maybe)

```
fromPredicate :: (a -> Boolean) -> a -> Maybe a
```

Returns Just(a) if predicate holds, Nothing otherwise.

```js
fromPredicate (x => x > 0) (1) // => just(1)
```

---

<a id="maybe-trycatch"></a>

### `tryCatch` — [↑ `maybe`](#maybe)

```
tryCatch :: (() -> a) -> Maybe a
```

Wraps a thunk — Just on success, Nothing on throw.

```js
tryCatch (() => JSON.parse ('1')) // => just(1)
```

---

<a id="maybe-isjust"></a>

### `isJust` — [↑ `maybe`](#maybe)

```
isJust :: unknown -> Boolean
```

Returns true if the value is a Just.

```js
isJust (just (1)) // => true
```

---

<a id="maybe-isnothing"></a>

### `isNothing` — [↑ `maybe`](#maybe)

```
isNothing :: unknown -> Boolean
```

Returns true if the value is Nothing.

```js
isNothing (nothing ()) // => true
```

---

<a id="maybe-ismaybe"></a>

### `isMaybe` — [↑ `maybe`](#maybe)

```
isMaybe :: unknown -> Boolean
```

Returns true if the value is a Just or Nothing.

```js
isMaybe (just (1)) // => true
```

---

<a id="maybe-maybe"></a>

### `maybe` — [↑ `maybe`](#maybe)

```
maybe :: b -> (a -> b) -> Maybe a -> b
```

Case-fold — returns the default for Nothing, applies f for Just.

```js
maybe (0) (x => x + 1) (just (1)) // => 2
```

---

<a id="maybe-maybe_"></a>

### `maybe_` — [↑ `maybe`](#maybe)

```
maybe_ :: (() -> b) -> (a -> b) -> Maybe a -> b
```

Lazy case-fold — default thunk called only for Nothing.

```js
maybe_ (() => 0) (x => x + 1) (nothing ()) // => 0
```

---

<a id="maybe-frommaybe"></a>

### `fromMaybe` — [↑ `maybe`](#maybe)

```
fromMaybe :: a -> Maybe a -> a
```

Extracts the value or returns the strict default.

```js
fromMaybe (0) (just (5)) // => 5
```

---

<a id="maybe-frommaybe_"></a>

### `fromMaybe_` — [↑ `maybe`](#maybe)

```
fromMaybe_ :: (() -> a) -> Maybe a -> a
```

Extracts the value or calls the lazy default thunk.

```js
fromMaybe_ (() => 0) (nothing ()) // => 0
```

---

<a id="maybe-justs"></a>

### `justs` — [↑ `maybe`](#maybe)

```
justs :: Array (Maybe a) -> Array a
```

Discards Nothings and unwraps Justs.

```js
justs([just (1), nothing (), just (2)]) // => [1, 2]
```

---

<a id="maybe-tonull"></a>

### `toNull` — [↑ `maybe`](#maybe)

```
toNull :: Maybe a -> a | null
```

Extracts the value or returns null.

```js
toNull (nothing ()) // => null
```

---

<a id="maybe-toundefined"></a>

### `toUndefined` — [↑ `maybe`](#maybe)

```
toUndefined :: Maybe a -> a | undefined
```

Extracts the value or returns undefined.

```js
toUndefined (nothing ()) // => undefined
```

---

<a id="maybe-maybetoeither"></a>

### `maybeToEither` — [↑ `maybe`](#maybe)

```
maybeToEither :: a -> Maybe b -> Either a b
```

Converts Nothing to Left(def) and Just(v) to Right(v).

```js
maybeToEither ('err') (just (1)) // => { tag: 'right', right: 1 }
```

---

<a id="maybe-map"></a>

### `map` — [↑ `maybe`](#maybe)

```
map :: (a -> b) -> Maybe a -> Maybe b
```

Applies f to the value inside Just, passes Nothing through.

```js
map (x => x + 1) (just (1)) // => just(2)
```

---

<a id="maybe-filter"></a>

### `filter` — [↑ `maybe`](#maybe)

```
filter :: (a -> Boolean) -> Maybe a -> Maybe a
```

Returns Nothing if predicate fails or Maybe is already Nothing.

```js
filter(x => x > 0)(just(1)) // => just(1)
```

---

<a id="maybe-filtermap"></a>

### `filterMap` — [↑ `maybe`](#maybe)

```
filterMap :: (a -> Maybe b) -> Maybe a -> Maybe b
```

Applies f only if the input is Just, forwarding Nothing directly.

```js
filterMap (x => x > 0 ? just (x) : nothing ()) (just (-1)) // => nothing()
```

---

<a id="maybe-flatmap"></a>

### `flatmap` — [↑ `maybe`](#maybe)

```
flatmap :: (a -> Maybe b) -> Maybe a -> Maybe b
```

Monadic bind — applies f to Just's value, passes Nothing through.

```js
flatmap(x => just(x + 1))(just(1)) // => just(2)
```

---

<a id="maybe-mapnullable"></a>

### `mapNullable` — [↑ `maybe`](#maybe)

```
mapNullable :: (a -> b | null | undefined) -> Maybe a -> Maybe b
```

Maps with a nullable-returning function, converting null/undefined to Nothing.

```js
mapNullable (x => x.name) (just ({ name: 'Alice' })) // => just('Alice')
```

---

<a id="maybe-mapmaybe"></a>

### `mapMaybe` — [↑ `maybe`](#maybe)

Maps over an array, discarding Nothings and unwrapping Justs.

```js
mapMaybe :: (a -> Maybe b) -> Array a -> Array b
mapMaybe (x => x > 0 ? just (x) : nothing ()) ([1, -2, 3]) // => [1, 3]
```

---

<a id="maybe-ap"></a>

### `ap` — [↑ `maybe`](#maybe)

```
ap :: Maybe (a -> b) -> Maybe a -> Maybe b
```

Applies a Just-wrapped function to a Just-wrapped value.

```js
ap (just (x => x + 1)) (just (1)) // => just(2)
```

---

<a id="maybe-alt"></a>

### `alt` — [↑ `maybe`](#maybe)

```
alt :: Maybe a -> Maybe a -> Maybe a
```

Returns the first Just, falling back to the second.

```js
alt (just (2)) (nothing ()) // => just(2)
```

---

<a id="maybe-exists"></a>

### `exists` — [↑ `maybe`](#maybe)

```
exists :: (a -> Boolean) -> Maybe a -> Boolean
```

Returns true if Maybe is Just and the predicate holds.

```js
exists (x => x > 0) (just (1)) // => true
```

---

<a id="maybe-fold"></a>

### `fold` — [↑ `maybe`](#maybe)

```
fold :: ((b, a) -> b) -> b -> Maybe a -> b
```

Folds a Maybe — returns initial for Nothing, applies foldr for Just.

```js
fold ((acc, x) => acc + x, 0) (just (5)) // => 5
```

---

## [`nil`](#modules)

| Function | Signature |
|---|---|
| [<code>nil</code>](#nil-nil) | `nil :: a -> Nil a` |
| [<code>init</code>](#nil-init) | `init :: () -> Nil never` |
| [<code>fromPredicate</code>](#nil-frompredicate) | `fromPredicate :: (a -> Boolean) -> Nil a -> Nil a` |
| [<code>fromMaybe</code>](#nil-frommaybe) | `fromMaybe :: Maybe a -> Nil a` |
| [<code>isNil</code>](#nil-isnil) | `isNil :: Nil a -> Boolean` |
| [<code>isNotNil</code>](#nil-isnotnil) | `isNotNil :: Nil a -> Boolean` |

<a id="nil-nil"></a>

### `nil` — [↑ `nil`](#nil)

```
nil :: a -> Nil a
```

Returns the value if non-nil, otherwise null.

```js
nil (undefined) // => null
```

---

<a id="nil-init"></a>

### `init` — [↑ `nil`](#nil)

```
init :: () -> Nil never
```

Returns the empty nil value (null).

```js
init () // => null
```

---

<a id="nil-frompredicate"></a>

### `fromPredicate` — [↑ `nil`](#nil)

```
fromPredicate :: (a -> Boolean) -> Nil a -> Nil a
```

Returns the value if non-nil and predicate holds, otherwise null.

```js
fromPredicate (x => x > 0) (5) // => 5
```

---

<a id="nil-frommaybe"></a>

### `fromMaybe` — [↑ `nil`](#nil)

```
fromMaybe :: Maybe a -> Nil a
```

Converts Nothing to null, Just(a) to a.

```js
fromMaybe (just (1)) // => 1
```

---

<a id="nil-isnil"></a>

### `isNil` — [↑ `nil`](#nil)

```
isNil :: Nil a -> Boolean
```

Returns true for null or undefined.

```js
isNil (null) // => true
```

---

<a id="nil-isnotnil"></a>

### `isNotNil` — [↑ `nil`](#nil)

```
isNotNil :: Nil a -> Boolean
```

Returns true for any value that is not null or undefined.

```js
isNotNil (0) // => true
```

---

## [`number`](#modules)

| Function | Signature |
|---|---|
| [<code>isNum</code>](#number-isnum) | `isNum :: a -> Boolean` |
| [<code>equals</code>](#number-equals) | `equals :: Number -> Number -> Boolean` |
| [<code>lte</code>](#number-lte) | `lte :: Number -> Number -> Boolean` |
| [<code>lt</code>](#number-lt) | `lt :: Number -> Number -> Boolean` |
| [<code>gte</code>](#number-gte) | `gte :: Number -> Number -> Boolean` |
| [<code>gt</code>](#number-gt) | `gt :: Number -> Number -> Boolean` |
| [<code>min</code>](#number-min) | `min :: Number -> Number -> Number` |
| [<code>max</code>](#number-max) | `max :: Number -> Number -> Number` |
| [<code>clamp</code>](#number-clamp) | `clamp :: Number -> Number -> Number -> Number` |
| [<code>negate</code>](#number-negate) | `negate :: Number -> Number` |
| [<code>add</code>](#number-add) | `add :: Number -> Number -> Number` |
| [<code>sub</code>](#number-sub) | `sub :: Number -> Number -> Number` |
| [<code>mult</code>](#number-mult) | `mult :: Number -> Number -> Number` |
| [<code>div</code>](#number-div) | `div :: Number -> Number -> Number` |
| [<code>pow</code>](#number-pow) | `pow :: Number -> Number -> Number` |
| [<code>sum</code>](#number-sum) | `sum :: Array Number -> Number` |
| [<code>product</code>](#number-product) | `product :: Array Number -> Number` |
| [<code>even</code>](#number-even) | `even :: Integer -> Boolean` |
| [<code>odd</code>](#number-odd) | `odd :: Integer -> Boolean` |
| [<code>parseFloat_</code>](#number-parsefloat_) | `parseFloat_ :: String -> Maybe Number` |
| [<code>parseInt_</code>](#number-parseint_) | `parseInt_ :: Integer -> String -> Maybe Integer` |

<a id="number-isnum"></a>

### `isNum` — [↑ `number`](#number)

```
isNum :: a -> Boolean
```

Returns true only for finite or infinite (non-NaN) numbers.

```js
isNum (42) // => true;  isNum (NaN) // => false
```

---

<a id="number-equals"></a>

### `equals` — [↑ `number`](#number)

```
equals :: Number -> Number -> Boolean
```

Structural equality: NaN equals NaN, +0 equals -0.

```js
equals (NaN) (NaN) // => true
```

---

<a id="number-lte"></a>

### `lte` — [↑ `number`](#number)

```
lte :: Number -> Number -> Boolean
```

Total ordering — NaN is treated as the minimum value.

```js
lte (1) (2) // => true
```

---

<a id="number-lt"></a>

### `lt` — [↑ `number`](#number)

```
lt :: Number -> Number -> Boolean
```

Strict less-than.

```js
lt (1) (2) // => true
```

---

<a id="number-gte"></a>

### `gte` — [↑ `number`](#number)

```
gte :: Number -> Number -> Boolean
```

Greater-than-or-equal.

```js
gte (2) (1) // => true
```

---

<a id="number-gt"></a>

### `gt` — [↑ `number`](#number)

```
gt :: Number -> Number -> Boolean
```

Strict greater-than.

```js
gt (2) (1) // => true
```

---

<a id="number-min"></a>

### `min` — [↑ `number`](#number)

```
min :: Number -> Number -> Number
```

Returns the smaller number.

```js
min (1) (2) // => 1
```

---

<a id="number-max"></a>

### `max` — [↑ `number`](#number)

```
max :: Number -> Number -> Number
```

Returns the larger number.

```js
max (1) (2) // => 2
```

---

<a id="number-clamp"></a>

### `clamp` — [↑ `number`](#number)

```
clamp :: Number -> Number -> Number -> Number
```

Clamps x between lo and hi inclusive.

```js
clamp (0) (10) (15) // => 10
```

---

<a id="number-negate"></a>

### `negate` — [↑ `number`](#number)

```
negate :: Number -> Number
```

Negates a number.

```js
negate (3) // => -3
```

---

<a id="number-add"></a>

### `add` — [↑ `number`](#number)

```
add :: Number -> Number -> Number
```

Adds two numbers.

```js
add (1) (2) // => 3
```

---

<a id="number-sub"></a>

### `sub` — [↑ `number`](#number)

```
sub :: Number -> Number -> Number
```

Subtracts — sub(n)(x) = x - n.

```js
sub (1) (3) // => 2
```

---

<a id="number-mult"></a>

### `mult` — [↑ `number`](#number)

```
mult :: Number -> Number -> Number
```

Multiplies two numbers.

```js
mult (2) (3) // => 6
```

---

<a id="number-div"></a>

### `div` — [↑ `number`](#number)

```
div :: Number -> Number -> Number
```

Divides — div(n)(x) = x / n.

```js
div (2) (10) // => 5
```

---

<a id="number-pow"></a>

### `pow` — [↑ `number`](#number)

```
pow :: Number -> Number -> Number
```

Raises base to exponent — pow(exp)(base) = base ** exp.

```js
pow (2) (3) // => 9
```

---

<a id="number-sum"></a>

### `sum` — [↑ `number`](#number)

```
sum :: Array Number -> Number
```

Sums all numbers in the array.

```js
sum ([1, 2, 3]) // => 6
```

---

<a id="number-product"></a>

### `product` — [↑ `number`](#number)

```
product :: Array Number -> Number
```

Multiplies all numbers in the array.

```js
product ([2, 3, 4]) // => 24
```

---

<a id="number-even"></a>

### `even` — [↑ `number`](#number)

```
even :: Integer -> Boolean
```

Returns true for even integers.

```js
even (4) // => true
```

---

<a id="number-odd"></a>

### `odd` — [↑ `number`](#number)

```
odd :: Integer -> Boolean
```

Returns true for odd integers.

```js
odd (3) // => true
```

---

<a id="number-parsefloat_"></a>

### `parseFloat_` — [↑ `number`](#number)

```
parseFloat_ :: String -> Maybe Number
```

Parses a float string strictly — Just on success, Nothing otherwise.

```js
parseFloat_ ('3.14') // => just(3.14)
```

---

<a id="number-parseint_"></a>

### `parseInt_` — [↑ `number`](#number)

```
parseInt_ :: Integer -> String -> Maybe Integer
```

Parses an integer string in radix 2–36 — stricter than built-in parseInt.

```js
parseInt_ (16) ('ff') // => just(255)
```

---

## [`pair`](#modules)

| Function | Signature |
|---|---|
| [<code>pair</code>](#pair-pair) | `pair :: a -> b -> [a, b]` |
| [<code>dup</code>](#pair-dup) | `dup :: a -> [a, a]` |
| [<code>merge</code>](#pair-merge) | `merge :: [(a -> b), a] -> b` |
| [<code>mergeSecond</code>](#pair-mergesecond) | `mergeSecond :: [a, (a -> b)] -> b` |
| [<code>fst</code>](#pair-fst) | `fst :: [a, b] -> a` |
| [<code>snd</code>](#pair-snd) | `snd :: [a, b] -> b` |
| [<code>swap</code>](#pair-swap) | `swap :: [a, b] -> [b, a]` |
| [<code>map</code>](#pair-map) | `map :: (a -> c) -> [a, b] -> [c, b]` |
| [<code>mapSecond</code>](#pair-mapsecond) | `mapSecond :: (b -> d) -> [a, b] -> [a, d]` |
| [<code>bimap</code>](#pair-bimap) | `bimap :: (a -> c) -> (b -> d) -> [a, b] -> [c, d]` |
| [<code>fold</code>](#pair-fold) | `fold :: ((c, a, b) -> c) -> c -> [a, b] -> c` |
| [<code>foldWith</code>](#pair-foldwith) | `foldWith :: (a -> b -> c) -> [a, b] -> c` |
| [<code>cond</code>](#pair-cond) | `cond :: Pair (a => boolean, a => b)[] -> a -> Maybe b` |
| [<code>traverse</code>](#pair-traverse) | `traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> [a, c] -> f [b, c]` |

<a id="pair-pair"></a>

### `pair` — [↑ `pair`](#pair)

```
pair :: a -> b -> [a, b]
```

Constructs a 2-element tuple.

```js
pair (1) (2) // => [1, 2]
```

---

<a id="pair-dup"></a>

### `dup` — [↑ `pair`](#pair)

```
dup :: a -> [a, a]
```

Duplicates a value into a pair.

```js
dup (3) // => [3, 3]
```

---

<a id="pair-merge"></a>

### `merge` — [↑ `pair`](#pair)

```
merge :: [(a -> b), a] -> b
```

Applies the function in the first slot to the value in the second.

```js
merge ([x => x + 1, 5]) // => 6
```

---

<a id="pair-mergesecond"></a>

### `mergeSecond` — [↑ `pair`](#pair)

```
mergeSecond :: [a, (a -> b)] -> b
```

Applies the function in the second slot to the value in the first.

```js
mergeSecond ([5, x => x + 1]) // => 6
```

---

<a id="pair-fst"></a>

### `fst` — [↑ `pair`](#pair)

```
fst :: [a, b] -> a
```

Extracts the first element.

```js
fst ([1, 2]) // => 1
```

---

<a id="pair-snd"></a>

### `snd` — [↑ `pair`](#pair)

```
snd :: [a, b] -> b
```

Extracts the second element.

```js
snd ([1, 2]) // => 2
```

---

<a id="pair-swap"></a>

### `swap` — [↑ `pair`](#pair)

```
swap :: [a, b] -> [b, a]
```

Swaps the two elements.

```js
swap ([1, 2]) // => [2, 1]
```

---

<a id="pair-map"></a>

### `map` — [↑ `pair`](#pair)

```
map :: (a -> c) -> [a, b] -> [c, b]
```

Maps over the first element.

```js
map (x => x + 1) ([1, 2]) // => [2, 2]
```

---

<a id="pair-mapsecond"></a>

### `mapSecond` — [↑ `pair`](#pair)

```
mapSecond :: (b -> d) -> [a, b] -> [a, d]
```

Maps over the second element.

```js
mapSecond (x => x + 1) ([1, 2]) // => [1, 3]
```

---

<a id="pair-bimap"></a>

### `bimap` — [↑ `pair`](#pair)

```
bimap :: (a -> c) -> (b -> d) -> [a, b] -> [c, d]
```

Maps both elements — first arg for first element, second arg for second.

```js
bimap (x => x + 1) (x => x * 2) ([1, 3]) // => [2, 6]
```

---

<a id="pair-fold"></a>

### `fold` — [↑ `pair`](#pair)

```
fold :: ((c, a, b) -> c) -> c -> [a, b] -> c
```

Reduces a pair with a ternary function (initial, first, second).

```js
fold ((acc, a, b) => acc + a + b) (0) ([1, 2]) // => 3
```

---

<a id="pair-foldwith"></a>

### `foldWith` — [↑ `pair`](#pair)

```
foldWith :: (a -> b -> c) -> [a, b] -> c
```

Applies a curried binary function to the pair's elements.

```js
foldWith (a => b => a + b) ([1, 2]) // => 3
```

---

<a id="pair-cond"></a>

### `cond` — [↑ `pair`](#pair)

```
cond :: Pair (a => boolean, a => b)[] -> a -> Maybe b
```

Tries each Pair (pred, fn) in order; returns Just(fn(a)) for the first matching predicate, or Nothing if none match.

```js
cond ([pair (a => a <= 0) ((a) => a + 2), pair (a => a > 0) (Math.abs)]) (-1) // Just 1
```

---

<a id="pair-traverse"></a>

### `traverse` — [↑ `pair`](#pair)

```
traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (a -> f b) -> [a, c] -> f [b, c]
```

Applicative traversal over the first element.

```js
traverse (Array.of) (_ => _) (f => xs => xs.map (f)) (x => [x, -x]) ([1, 2]) // => [[1, 2], [-1, 2]]
```

---

## [`regexp`](#modules)

| Function | Signature |
|---|---|
| [<code>equals</code>](#regexp-equals) | `equals :: RegExp -> RegExp -> Boolean` |
| [<code>regex</code>](#regexp-regex) | `regex :: String -> String -> RegExp` |
| [<code>regexEscape</code>](#regexp-regexescape) | `regexEscape :: String -> String` |
| [<code>test</code>](#regexp-test) | `test :: RegExp -> String -> Boolean` |
| [<code>match</code>](#regexp-match) | `match :: RegExp -> String -> Maybe (Array (Maybe String))` |
| [<code>matchAll</code>](#regexp-matchall) | `matchAll :: RegExp -> String -> Array (Array (Maybe String))` |
| [<code>replace</code>](#regexp-replace) | `replace :: (Array (Maybe String) -> String) -> RegExp -> String -> String` |

<a id="regexp-equals"></a>

### `equals` — [↑ `regexp`](#regexp)

```
equals :: RegExp -> RegExp -> Boolean
```

True when both regexes have the same source and all flags match.

```js
equals (/a/g) (/a/g) // => true
```

---

<a id="regexp-regex"></a>

### `regex` — [↑ `regexp`](#regexp)

```
regex :: String -> String -> RegExp
```

Constructs a RegExp from flags and source.

```js
regex ('g') ('[0-9]+') // => /[0-9]+/g
```

---

<a id="regexp-regexescape"></a>

### `regexEscape` — [↑ `regexp`](#regexp)

```
regexEscape :: String -> String
```

Escapes all regex metacharacters so the result matches the literal string.

```js
regexEscape ('a.b') // => 'a\.b'
```

---

<a id="regexp-test"></a>

### `test` — [↑ `regexp`](#regexp)

```
test :: RegExp -> String -> Boolean
```

Tests whether the pattern matches the string (stateless — resets lastIndex).

```js
test (/^a/) ('abacus') // => true
```

---

<a id="regexp-match"></a>

### `match` — [↑ `regexp`](#regexp)

```
match :: RegExp -> String -> Maybe (Array (Maybe String))
```

Returns Just of capture-group array if pattern matches, Nothing otherwise.

```js
match (/(\w+)/) ('hello') // => just([just('hello')])
```

---

<a id="regexp-matchall"></a>

### `matchAll` — [↑ `regexp`](#regexp)

```
matchAll :: RegExp -> String -> Array (Array (Maybe String))
```

Returns all capture-group arrays (pattern must have the 'g' flag).

```js
matchAll (/(\w+)/g) ('hi there') // => [[just('hi')], [just('there')]]
```

---

<a id="regexp-replace"></a>

### `replace` — [↑ `regexp`](#regexp)

```
replace :: (Array (Maybe String) -> String) -> RegExp -> String -> String
```

Replaces pattern matches using a function over capture groups.

```js
replace (() => 'X') (/a/) ('cat') // => 'cXt'
```

---

## [`string`](#modules)

| Function | Signature |
|---|---|
| [<code>equals</code>](#string-equals) | `equals :: String -> String -> Boolean` |
| [<code>lte</code>](#string-lte) | `lte :: String -> String -> Boolean` |
| [<code>lt</code>](#string-lt) | `lt :: String -> String -> Boolean` |
| [<code>gte</code>](#string-gte) | `gte :: String -> String -> Boolean` |
| [<code>gt</code>](#string-gt) | `gt :: String -> String -> Boolean` |
| [<code>min</code>](#string-min) | `min :: String -> String -> String` |
| [<code>max</code>](#string-max) | `max :: String -> String -> String` |
| [<code>clamp</code>](#string-clamp) | `clamp :: String -> String -> String -> String` |
| [<code>concat</code>](#string-concat) | `concat :: String -> String -> String` |
| [<code>empty</code>](#string-empty) | `` |
| [<code>toUpper</code>](#string-toupper) | `toUpper :: String -> String` |
| [<code>toLower</code>](#string-tolower) | `toLower :: String -> String` |
| [<code>trim</code>](#string-trim) | `trim :: String -> String` |
| [<code>stripPrefix</code>](#string-stripprefix) | `stripPrefix :: String -> String -> Maybe String` |
| [<code>stripSuffix</code>](#string-stripsuffix) | `stripSuffix :: String -> String -> Maybe String` |
| [<code>words</code>](#string-words) | `words :: String -> Array String` |
| [<code>unwords</code>](#string-unwords) | `unwords :: Array String -> String` |
| [<code>lines</code>](#string-lines) | `lines :: String -> Array String` |
| [<code>unlines</code>](#string-unlines) | `unlines :: Array String -> String` |
| [<code>splitOn</code>](#string-spliton) | `splitOn :: String -> String -> Array String` |
| [<code>splitOnRegex</code>](#string-splitonregex) | `splitOnRegex :: RegExp -> String -> Array String` |
| [<code>joinWith</code>](#string-joinwith) | `joinWith :: String -> Array String -> String` |

<a id="string-equals"></a>

### `equals` — [↑ `string`](#string)

```
equals :: String -> String -> Boolean
```

True when both are strings with identical content.

```js
equals ('a') ('a') // => true
```

---

<a id="string-lte"></a>

### `lte` — [↑ `string`](#string)

```
lte :: String -> String -> Boolean
```

Lexicographic less-than-or-equal.

```js
lte ('a') ('b') // => true
```

---

<a id="string-lt"></a>

### `lt` — [↑ `string`](#string)

```
lt :: String -> String -> Boolean
```

Strict lexicographic less-than.

```js
lt ('a') ('b') // => true
```

---

<a id="string-gte"></a>

### `gte` — [↑ `string`](#string)

```
gte :: String -> String -> Boolean
```

Lexicographic greater-than-or-equal.

```js
gte ('b') ('a') // => true
```

---

<a id="string-gt"></a>

### `gt` — [↑ `string`](#string)

```
gt :: String -> String -> Boolean
```

Strict lexicographic greater-than.

```js
gt ('b') ('a') // => true
```

---

<a id="string-min"></a>

### `min` — [↑ `string`](#string)

```
min :: String -> String -> String
```

Returns the lexicographically smaller string.

```js
min ('a') ('b') // => 'a'
```

---

<a id="string-max"></a>

### `max` — [↑ `string`](#string)

```
max :: String -> String -> String
```

Returns the lexicographically larger string.

```js
max ('a') ('b') // => 'b'
```

---

<a id="string-clamp"></a>

### `clamp` — [↑ `string`](#string)

```
clamp :: String -> String -> String -> String
```

Clamps a string between lo and hi lexicographically.

```js
clamp ('b') ('d') ('e') // => 'd'
```

---

<a id="string-concat"></a>

### `concat` — [↑ `string`](#string)

```
concat :: String -> String -> String
```

Concatenates two strings.

```js
concat ('foo') ('bar') // => 'foobar'
```

---

<a id="string-empty"></a>

### `empty` — [↑ `string`](#string)

empty :: String — the empty string.

---

<a id="string-toupper"></a>

### `toUpper` — [↑ `string`](#string)

```
toUpper :: String -> String
```

Converts a string to upper case.

```js
toUpper ('hello') // => 'HELLO'
```

---

<a id="string-tolower"></a>

### `toLower` — [↑ `string`](#string)

```
toLower :: String -> String
```

Converts a string to lower case.

```js
toLower ('HELLO') // => 'hello'
```

---

<a id="string-trim"></a>

### `trim` — [↑ `string`](#string)

```
trim :: String -> String
```

Removes leading and trailing whitespace.

```js
trim ('  hi  ') // => 'hi'
```

---

<a id="string-stripprefix"></a>

### `stripPrefix` — [↑ `string`](#string)

```
stripPrefix :: String -> String -> Maybe String
```

Returns Just the remainder after stripping the prefix, or Nothing.

```js
stripPrefix ('foo') ('foobar') // => just('bar')
```

---

<a id="string-stripsuffix"></a>

### `stripSuffix` — [↑ `string`](#string)

```
stripSuffix :: String -> String -> Maybe String
```

Returns Just the string with the suffix removed, or Nothing.

```js
stripSuffix ('bar') ('foobar') // => just('foo')
```

---

<a id="string-words"></a>

### `words` — [↑ `string`](#string)

```
words :: String -> Array String
```

Splits on whitespace, ignoring leading/trailing empty tokens.

```js
words ('  foo bar  ') // => ['foo', 'bar']
```

---

<a id="string-unwords"></a>

### `unwords` — [↑ `string`](#string)

```
unwords :: Array String -> String
```

Joins an array of strings with a single space.

```js
unwords (['foo', 'bar']) // => 'foo bar'
```

---

<a id="string-lines"></a>

### `lines` — [↑ `string`](#string)

```
lines :: String -> Array String
```

Splits on \n, \r\n, or \r; empty string yields [].

```js
lines ('a\nb') // => ['a', 'b']
```

---

<a id="string-unlines"></a>

### `unlines` — [↑ `string`](#string)

```
unlines :: Array String -> String
```

Joins lines, appending a terminating '\n' to each.

```js
unlines (['a', 'b']) // => 'a\nb\n'
```

---

<a id="string-spliton"></a>

### `splitOn` — [↑ `string`](#string)

```
splitOn :: String -> String -> Array String
```

Splits a string on a separator substring.

```js
splitOn (',') ('a,b,c') // => ['a', 'b', 'c']
```

---

<a id="string-splitonregex"></a>

### `splitOnRegex` — [↑ `string`](#string)

```
splitOnRegex :: RegExp -> String -> Array String
```

Splits on a regex pattern (must have the 'g' flag).

```js
splitOnRegex (/,/g) ('a,b,c') // => ['a', 'b', 'c']
```

---

<a id="string-joinwith"></a>

### `joinWith` — [↑ `string`](#string)

```
joinWith :: String -> Array String -> String
```

Joins an array of strings with the given separator.

```js
joinWith ('-') (['a', 'b', 'c']) // => 'a-b-c'
```

---

## [`strmap`](#modules)

| Function | Signature |
|---|---|
| [<code>equals</code>](#strmap-equals) | `equals :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean` |
| [<code>lte</code>](#strmap-lte) | `lte :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean` |
| [<code>concat</code>](#strmap-concat) | `concat :: StrMap v -> StrMap v -> StrMap v` |
| [<code>empty</code>](#strmap-empty) | `empty :: () -> StrMap v` |
| [<code>filter</code>](#strmap-filter) | `filter :: (v -> Boolean) -> StrMap v -> StrMap v` |
| [<code>reject</code>](#strmap-reject) | `reject :: (v -> Boolean) -> StrMap v -> StrMap v` |
| [<code>map</code>](#strmap-map) | `map :: (a -> b) -> StrMap a -> StrMap b` |
| [<code>ap</code>](#strmap-ap) | `ap :: StrMap (a -> b) -> StrMap a -> StrMap b` |
| [<code>alt</code>](#strmap-alt) | `alt :: StrMap v -> StrMap v -> StrMap v` |
| [<code>zero</code>](#strmap-zero) | `zero :: () -> StrMap v` |
| [<code>reduce</code>](#strmap-reduce) | `reduce :: ((b, v) -> b) -> b -> StrMap v -> b` |
| [<code>size</code>](#strmap-size) | `size :: StrMap v -> Integer` |
| [<code>all</code>](#strmap-all) | `all :: (v -> Boolean) -> StrMap v -> Boolean` |
| [<code>any</code>](#strmap-any) | `any :: (v -> Boolean) -> StrMap v -> Boolean` |
| [<code>none</code>](#strmap-none) | `none :: (v -> Boolean) -> StrMap v -> Boolean` |
| [<code>elem</code>](#strmap-elem) | `elem :: ((v, v) -> Boolean) -> v -> StrMap v -> Boolean` |
| [<code>traverse</code>](#strmap-traverse) | `traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (v -> f b) -> StrMap v -> f (StrMap b)` |
| [<code>value</code>](#strmap-value) | `value :: String -> StrMap a -> Maybe a` |
| [<code>singleton</code>](#strmap-singleton) | `singleton :: String -> a -> StrMap a` |
| [<code>insert</code>](#strmap-insert) | `insert :: String -> a -> StrMap a -> StrMap a` |
| [<code>remove</code>](#strmap-remove) | `remove :: String -> StrMap a -> StrMap a` |
| [<code>keys</code>](#strmap-keys) | `keys :: StrMap a -> Array String` |
| [<code>values</code>](#strmap-values) | `values :: StrMap a -> Array a` |
| [<code>pairs</code>](#strmap-pairs) | `pairs :: StrMap a -> Array [String, a]` |
| [<code>fromPairs</code>](#strmap-frompairs) | `fromPairs :: Array [String, a] -> StrMap a` |
| [<code>reduceC</code>](#strmap-reducec) | `reduceC :: (b -> a -> b) -> b -> StrMap a -> b` |

<a id="strmap-equals"></a>

### `equals` — [↑ `strmap`](#strmap)

```
equals :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean
```

Element-wise equality over sorted keys.

```js
equals ((a, b) => a === b) ({ a: 1 }) ({ a: 1 }) // => true
```

---

<a id="strmap-lte"></a>

### `lte` — [↑ `strmap`](#strmap)

```
lte :: ((v, v) -> Boolean) -> StrMap v -> StrMap v -> Boolean
```

Lexicographic ordering over sorted keys; values compared on key ties.

```js
lte ((a, b) => a <= b) ({ a: 1 }) ({ a: 2 }) // => true
```

---

<a id="strmap-concat"></a>

### `concat` — [↑ `strmap`](#strmap)

```
concat :: StrMap v -> StrMap v -> StrMap v
```

Right-biased merge — keys in b overwrite keys in a.

```js
concat ({ a: 1 }) ({ b: 2 }) // => {a:1,b:2}
```

---

<a id="strmap-empty"></a>

### `empty` — [↑ `strmap`](#strmap)

```
empty :: () -> StrMap v
```

Returns a new empty object.

```js
empty () // => {}
```

---

<a id="strmap-filter"></a>

### `filter` — [↑ `strmap`](#strmap)

```
filter :: (v -> Boolean) -> StrMap v -> StrMap v
```

Keeps only entries whose value satisfies the predicate.

```js
filter (v => v > 1) ({ a: 1, b: 2, c: 3 }) // => {b:2,c:3}
```

---

<a id="strmap-reject"></a>

### `reject` — [↑ `strmap`](#strmap)

```
reject :: (v -> Boolean) -> StrMap v -> StrMap v
```

Removes entries whose value satisfies the predicate.

```js
reject (v => v > 1) ({ a: 1, b: 2 }) // => {a:1}
```

---

<a id="strmap-map"></a>

### `map` — [↑ `strmap`](#strmap)

```
map :: (a -> b) -> StrMap a -> StrMap b
```

Applies f to every value.

```js
map (v => v * 2) ({ a: 1, b: 2 }) // => {a:2,b:4}
```

---

<a id="strmap-ap"></a>

### `ap` — [↑ `strmap`](#strmap)

```
ap :: StrMap (a -> b) -> StrMap a -> StrMap b
```

Applies functions to matching keys; only shared keys appear in the result.

```js
ap ({ a: x => x + 1 }) ({ a: 1, b: 2 }) // => {a:2}
```

---

<a id="strmap-alt"></a>

### `alt` — [↑ `strmap`](#strmap)

```
alt :: StrMap v -> StrMap v -> StrMap v
```

Left-biased merge — keys from a overwrite keys from b.

```js
alt ({ a: 1 }) ({ a: 9, b: 2 }) // => {a:1,b:2}
```

---

<a id="strmap-zero"></a>

### `zero` — [↑ `strmap`](#strmap)

```
zero :: () -> StrMap v
```

Returns an empty StrMap (monoid zero).

```js
zero () // => {}
```

---

<a id="strmap-reduce"></a>

### `reduce` — [↑ `strmap`](#strmap)

```
reduce :: ((b, v) -> b) -> b -> StrMap v -> b
```

Left fold over values in sorted key order.

```js
reduce ((acc, v) => acc + v) (0) ({ b: 2, a: 1 }) // => 3
```

---

<a id="strmap-size"></a>

### `size` — [↑ `strmap`](#strmap)

```
size :: StrMap v -> Integer
```

Returns the number of keys.

```js
size ({ a: 1, b: 2 }) // => 2
```

---

<a id="strmap-all"></a>

### `all` — [↑ `strmap`](#strmap)

```
all :: (v -> Boolean) -> StrMap v -> Boolean
```

True when every value satisfies the predicate.

```js
all (v => v > 0) ({ a: 1, b: 2 }) // => true
```

---

<a id="strmap-any"></a>

### `any` — [↑ `strmap`](#strmap)

```
any :: (v -> Boolean) -> StrMap v -> Boolean
```

True when at least one value satisfies the predicate.

```js
any (v => v > 1) ({ a: 1, b: 2 }) // => true
```

---

<a id="strmap-none"></a>

### `none` — [↑ `strmap`](#strmap)

```
none :: (v -> Boolean) -> StrMap v -> Boolean
```

True when no value satisfies the predicate.

```js
none (v => v > 5) ({ a: 1, b: 2 }) // => true
```

---

<a id="strmap-elem"></a>

### `elem` — [↑ `strmap`](#strmap)

```
elem :: ((v, v) -> Boolean) -> v -> StrMap v -> Boolean
```

True when x is found among the values using the comparator.

```js
elem ((a, b) => a === b) (2) ({ a: 1, b: 2 }) // => true
```

---

<a id="strmap-traverse"></a>

### `traverse` — [↑ `strmap`](#strmap)

```
traverse :: (b -> f b) -> (f (a->b) -> f a -> f b) -> ((a->b) -> f a -> f b) -> (v -> f b) -> StrMap v -> f (StrMap b)
```

Applicative traversal — passes explicit apOf, apAp, apMap operations.

```js
traverse (Array.of) (ff => fa => ff.flatMap (f => fa.map (f))) (f => fa => fa.map (f)) (v => [v, v * 2]) ({ a: 1 })
```

---

<a id="strmap-value"></a>

### `value` — [↑ `strmap`](#strmap)

```
value :: String -> StrMap a -> Maybe a
```

Returns Just(m[k]) if k is an own enumerable property; Nothing otherwise.

```js
value ('a') ({ a: 1 }) // => just(1)
```

---

<a id="strmap-singleton"></a>

### `singleton` — [↑ `strmap`](#strmap)

```
singleton :: String -> a -> StrMap a
```

Creates a single-entry map.

```js
singleton ('a') (1) // => {a:1}
```

---

<a id="strmap-insert"></a>

### `insert` — [↑ `strmap`](#strmap)

```
insert :: String -> a -> StrMap a -> StrMap a
```

Returns a new map with the key set to val.

```js
insert ('b') (2) ({ a: 1 }) // => {a:1,b:2}
```

---

<a id="strmap-remove"></a>

### `remove` — [↑ `strmap`](#strmap)

```
remove :: String -> StrMap a -> StrMap a
```

Returns a new map with the key deleted.

```js
remove ('a') ({ a: 1, b: 2 }) // => {b:2}
```

---

<a id="strmap-keys"></a>

### `keys` — [↑ `strmap`](#strmap)

```
keys :: StrMap a -> Array String
```

Returns all enumerable keys.

```js
keys ({ b: 2, a: 1 }) // => ['b','a']
```

---

<a id="strmap-values"></a>

### `values` — [↑ `strmap`](#strmap)

```
values :: StrMap a -> Array a
```

Returns all enumerable values.

```js
values ({ a: 1, b: 2 }) // => [1,2]
```

---

<a id="strmap-pairs"></a>

### `pairs` — [↑ `strmap`](#strmap)

```
pairs :: StrMap a -> Array [String, a]
```

Returns all [key, value] entries.

```js
pairs ({ a: 1 }) // => [['a',1]]
```

---

<a id="strmap-frompairs"></a>

### `fromPairs` — [↑ `strmap`](#strmap)

```
fromPairs :: Array [String, a] -> StrMap a
```

Builds a map from [key, value] pairs — last write wins on duplicate keys.

```js
fromPairs ([['a', 1], ['b', 2]]) // => {a:1,b:2}
```

---

<a id="strmap-reducec"></a>

### `reduceC` — [↑ `strmap`](#strmap)

```
reduceC :: (b -> a -> b) -> b -> StrMap a -> b
```

Curried-binary left fold; values visited in sorted key order.

```js
reduceC (acc => v => acc + v) (0) ({ b: 2, a: 1 }) // => 3
```

---
