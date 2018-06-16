# MarchingSquaresJS

A JavaScript implementation of the [Marching Squares](https://en.wikipedia.org/wiki/Marching_squares) algorithm
featuring IsoLines and IsoBand computation.

The implementation computes *iso lines* (*iso contours*) or *iso bands* for gridded scalar
fields and returns an array of (closed) paths that enclose the respective threshold(s).


### Availability

The source code of this module is available through [github](https://github.com/RaumZeit/MarchingSquares.js).
This module is also available as an [npm package](https://www.npmjs.com/package/marchingsquares).

### INSTALL

This module is developed as `ECMAScript 6 module` and uses [rollup.js](https://rollupjs.org) to bundle the final
javascript libraries. To provide maximum compatibility, the library is wrapped in a
[Universal Module Definition (UMD)](https://github.com/umdjs/umd) API. This makes it easy to run the implementations
on the server, the client, or elsewhere.

##### Build from repository:

To (re-)build the distribution libraries simply run:

```shell
rollup -c
```

or

```
npm run-script build
```

Pre-compiled (minified) versions of the library are available in the [dist/](dist/) subdirectory.


##### Using Node:

```javascript
var MarchingSquaresJS = require('./marchingsquares.js');
```

The above code creates an object `MarchingSquaresJS` with two function attributes:

```javascript
MarchingSquaresJS = {
    isoLines : function(data, threshold, options){},
    isoBands : function(data, lowerBound, bandwidth, options){}
};
```

It is possible to require only one of the implementations, `isoLines` or `isoBands`,
by requiring the corresponding implementation directly, e.g.:

```javascript
var MarchingSquaresJS = require('./marchingsquares-isobands.js');
```

This creates the same object as before but without bound `isoLines` function.

##### Using AMD (e.g RequireJS):

The MarchingSquaresJS module should work perfectly fine through the Asynchronous Module
Definition (AMD) API. This enables easy integration with module loaders such as
[RequireJS](https://github.com/requirejs/requirejs)

Similar to the usage in Node, you can either `require` all the impementations
```javascript
var MarchingSquaresJS = require('./marchingsquares');
```
or just a single one
```javascript
var MarchingSquaresJS = require('./marchingsquares-isobands');
```

to retrieve an object with `isoLines` and/or `isoBands` function attributes:


```javascript
MarchingSquaresJS = {
    isoLines : function(data, threshold, options){},
    isoBands : function(data, lowerBound, bandwidth, options){}
};
```

See also the [Require example](example/index_require.html) for using MarchingSquaresJS with AMD

##### Using as browser global:

Download the [minified Iso Bands](https://raw.githubusercontent.com/RaumZeit/MarchingSquares.js/master/dist/marchingsquares-isobands.min.js)
and/or the [minified Iso Lines](https://raw.githubusercontent.com/RaumZeit/MarchingSquares.js/master/dist/marchingsquares-isolines.min.js)
implementation, and include them in a script tag.

```html
<script src="marchingsquares-isolines.min.js"></script>
<script src="marchingsquares-isobands.min.js"></script>
```

This will expose a global variable named `MarchingSquaresJS` with two function
attributes:

```javascript
MarchingSquaresJS = {
    isoLines : function(data, threshold, options){},
    isoBands : function(data, lowerBound, bandwidth, options){}
};
```

Again, it is possible to omit one of the script tags to load only one of the implementations, or download
the full [minified MarchingSquaresJS](https://raw.githubusercontent.com/RaumZeit/MarchingSquares.js/master/dist/marchingsquares.min.js)
library that provides both functions in a single file.

### Usage

For both implementations, `isoLines` and `isoBands`, the input data must be formatted as a
regular 2-dimensional grid. All grid values must be defined.

#### Computing Iso Lines

##### Prototype:

```javascript
function isoLines(data, threshold, options)
```

##### Parameters:

`data`: 2-dimensional input data (scalar field). This parameter is `mandatory`.

`threshold`: The constant numerical value that defines the curve function for the *iso line(s)*. This parameter is `mandatory`

`options`: An object with attributes allowing for changes in the behavior of this function (See below). This parameter is `optional`.

##### Returns:

An array of paths representing the *iso lines* for the given `threshold` and input `data`. The paths themselves are
arrays of coordinates where each coordinate, again, is an array with two entries `[ x, y ]` denoting the `x` and `y`
position, respectively.

Note, that the paths resemble *linear Rings* by default, i.e. they are closed and have identical first and last
coordinates. (see the `options` parameter to change the output)

#### Computing Iso Bands

##### Prototype

```javascript
isoBands(data, lowerBound, bandWidth, options)
```

##### Parameters:

`data`: 2-dimensional input data (scalar field). This parameter is `mandatory`.

`lowerBound`: The constant numerical value that defines the lower bound of the *iso band*. This parameter is `mandatory`.

`bandWidth`:  The width of the *iso band* with lower bound `lowerBound`, i.e. the range of values.

`options`: An object with attributes allowing for changes in the behavior of this function (See below). This parameter is `optional`.

##### Returns:

An array of paths representing the *iso lines* that enclose the *iso band* of size `bandWidth`. The paths themselves are
arrays of coordinates where each coordinate, again, is an array with two entries `[ x, y ]` denoting the `x` and `y`
position, respectively.


#### The Options Object

The `options` object may have the following fields:

`options.successCallback`: *function* - called at the end of the process with the band array passed as argument; default `null`.

`options.verbose`: *bool* - logs info messages before each major step of the algorithm; default `false`.

`options.polygons`: *bool* - if `true` the function returns a list of path coordinates for individual polygons within each grid cell, if `false` returns a list of path coordinates representing the outline of connected polygons. Default `false`.

`options.linearRing`: *bool* - if `true`, the polygon paths are returned as linear rings, i.e. the first and last coordinate are identical indicating a closed path. Note, that for the `IsoLines` implementation a value of `false` reduces the output to *iso lines* that are not necessarily closed paths. Default `true`.


#### Example

The *iso band* shown below should contain all values between `lowerBound` and `upperBound`.
 
```javascript
var lowerBound = 2;
var upperBound = 3;
var data = [
    [18, 13, 10,  9, 10, 13, 18],
    [13,  8,  5,  4,  5,  8, 13],
    [10,  5,  2,  1,  2,  5, 10],
    [ 9,  4,  1, 12,  1,  4,  9],
    [10,  5,  2,  1,  2,  5, 10],
    [13,  8,  5,  4,  5,  8, 13],
    [18, 13, 10,  9, 10, 13, 18],
    [18, 13, 10,  9, 10, 13, 18]
];

var bandWidth = upperBound - lowerBound;
var band = MarchingSquaresJS.isoBands(data, lowerBound, bandWidth);
```

The return value, `band`, is an array of closed polygons which includes all the points of the grid with values between the limiting *iso lines*:

```text
[Array[21], Array[5]]
  0: Array[21]
  1: Array[5]
    0: Array[2]
      0: 2.3181818181818183
      1: 3
      length: 2
      __proto__: Array[0]
    1: Array[2]
      0: 3
      1: 2.3181818181818183
      length: 2
      __proto__: Array[0]
    2: Array[2]
    3: Array[2]
    4: Array[2]
    length: 5
    __proto__: Array[0]
  length: 2
  __proto__: Array[0]
```

You can find more examples in the [examples/](examples/) directory.

### Misc

#### Deprecation Warnings

The `isoContour` function was renamed to `isoLines` with version `1.3.0` but still remains for backward compatibility reasons!
Note, that by default both functions return closed polygons, i.e. `options.linearRing = true`. If simple paths are
required, e.g. when *iso lines* continue outside the grid, `options.linearRing = false` must be passed to the `isoLines`
or `isoContour` function.


----

Copyright (c) 2015-2018 Ronny Lorenz <ronny@tbi.univie.ac.at>
