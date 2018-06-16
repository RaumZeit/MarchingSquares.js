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
    isoBands : function(data, lowerBand, bandwidth, options){}
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
    isoBands : function(data, lowerBand, bandwidth, options){}
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
    isoBands : function(data, lowerBand, bandwidth, options){}
};
```

Again, it is possible to omit one of the script tags to load only one of the implementations, or download
the full [minified MarchingSquaresJS](https://raw.githubusercontent.com/RaumZeit/MarchingSquares.js/master/dist/marchingsquares.min.js)
library that provides both functions in a single file.

### Usage

For both implementations, `isoLines` and `isoBands`, the input data must be formatted as a
regular 2-dimensional grid. All grid values must be defined.

#### Iso Lines parameters
The `data` parameter denotes the gridded input data.
The `threshold` parameter denotes the threshold of value that will be encompassed by the *iso line*.
The optional parameter `options` may be used to change the behavior of this function (See below)

#### Iso Bands parameters
The `data` parameter denotes the gridded input data.
The `lowerBand` parameter denotes the lowest value that will be encompassed by this *iso band*, while
the `bandWidth` parameter denotes what range of values it will cover. The *iso band* shown below should contain all values between `lowerBand` and `upperBand`.
The optional parameter `options` may be used to chane the behavior of this function (See below)

```javascript
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

var bandWidth = upperBand - lowerBand;
var band = MarchingSquaresJS.isoBands(data, lowerBand, bandWidth, options);
```

The return value, `band`, is an array of closed polygons which includes all the point of the grid with values between the limiting *iso lines*:

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

### Options

The `option` object may have the following fields:

`options.successCallback`: *function* - called at the end of the process with the band array passed as argument; default `null`.

`options.verbose`: *bool* - logs info messages before each major step of the algorithm; default `false`.

`options.polygons`: *bool* - if `true` the function returns a list of path coordinates for individual polygons within each grid cell, if `false` returns a list of path coordinates representing the outline of connected polygons. Default `false`.

`options.linearRing`: *bool* - if `true`, the polygon paths are returned as linear rings, i.e. the first and last coordinate are identical indicating a closed path. Note, that for the `IsoLines` implementation a value of `false` reduces the output to *iso lines* that are not necessarily closed paths. Default `true`.


### Misc

#### Deprecation Warnings

_The `isoContour` function was renamed to `isoLines` with `1.3.0` but still remains for backward compatibility reasons!_

Note, that by default both functions return closed polygons, i.e. `options.linearRing = true`. If simple paths are
required, e.g. when *iso lines* continue outside the grid, `options.linearRing = false` must be passed to the `isoLines`
or `isoContour` functions.


----

Copyright (c) 2015-2018 Ronny Lorenz <ronny@tbi.univie.ac.at>
