![GitHub tag](https://img.shields.io/github/tag/RaumZeit/MarchingSquares.js.svg)
[![Build Status](https://travis-ci.org/RaumZeit/MarchingSquares.js.svg?branch=master)](https://travis-ci.org/RaumZeit/MarchingSquares.js)
[![npm](https://img.shields.io/npm/dw/marchingsquares.svg)](https://www.npmjs.com/package/marchingsquares)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

# MarchingSquaresJS

A JavaScript implementation of the [Marching Squares](https://en.wikipedia.org/wiki/Marching_squares) algorithm
featuring IsoLines and IsoBand computation.

The implementation computes *iso lines* (*iso contours*) or *iso bands* for gridded scalar
fields and returns an array of (closed) paths that enclose the respective threshold(s).

## Table of contents
1. [Availability](#availability)
2. [Installation](#installation)
3. [Usage](#usage)
4. [API Description](#api-description)
5. [Examples](#examples)
6. [License](#license)

----

## Availability

The source code of this module is available through [github](https://github.com/RaumZeit/MarchingSquares.js).
This module is also available as an [npm package](https://www.npmjs.com/package/marchingsquares).

----

## Installation

This module is developed as `ECMAScript 6 module` and uses [rollup.js](https://rollupjs.org) to bundle the final
javascript libraries. To provide maximum compatibility, the library is wrapped in a
[Universal Module Definition (UMD)](https://github.com/umdjs/umd) API. This makes it easy to run the implementations
on the server, the client, or elsewhere.

#### Quick Start

```shell
npm install marchingsquares
```

#### Build from Repository:

To (re-)build the distribution bundles run `rollup -c` or
```shell
npm run-script build
```

#### Download Precompiled Files

Pre-compiled (minified) versions are available at the
[MarchingSquares.js release page](https://github.com/RaumZeit/MarchingSquares.js/releases).

----

## Usage

In most cases, you may want to load the entire library to expose all implemented
algorithms at once. Alternatively, you may include only one of the `isoLines` or
`isoBands` algorithms. In this case, however, you have to sacrifice the possibility
to pass pre-processed data to effectively circumvent redundant *Quad-Tree* construction.

The library exposes the following two function attributes (see also [API description](#api-description))

```javascript
MarchingSquaresJS = {
    isoLines : function(data, threshold, options){},
    isoBands : function(data, lowerBound, bandwidth, options){}
};
```

and can easily be integrated into your project (see below)

#### Loading with Node:

```javascript
var MarchingSquaresJS = require('./marchingsquares.js');
```

#### Loading with AMD (e.g. RequireJS)

The MarchingSquaresJS module should work perfectly fine through the Asynchronous Module
Definition (AMD) API. This enables easy integration with module loaders such as
[RequireJS](https://github.com/requirejs/requirejs)

```javascript
var MarchingSquaresJS = require('./marchingsquares-isobands.js');
```

#### Loading with Web Browser

MarchingSquaresJS should work out-of-the-box with modern web browsers. You
simply load the library using the `<script>` tag, e.g.:


```html
<script src="marchingsquares.min.js"></script>
```

#### Loading a Single Implementation

It is possible to require only one of the implementations, `isoLines` or `isoBands`,
by requiring the corresponding implementation directly, e.g.:

```javascript
var MarchingSquaresJS = require('./marchingsquares-isobands.js');
```

or 

```html
<script src="marchingsquares-isobands.min.js"></script>
```

This creates the same object as before but without the `isoLines` function.

----

## API Description

### Computing Iso Lines

```javascript
function isoLines(data, threshold, options)
```

Compute *iso lines* and *iso contours* for a 2-dimensional scalar field and a (list of) thresholds.

| Parameter   | Description                                                                                                                                   |
| ----------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`      | 2-dimensional input data (scalar field). This parameter is **mandatory**.                                                                     |
| `threshold` | A constant numerical value (or array of numerical values) defining the curve function for the *iso line(s)*. This parameter is **mandatory**  |
| `options`   | An object with attributes allowing for changes in the behavior of this function (See below). This parameter is **optional**                   |

#### Returns:

1. If `threshold` is a *single scalar*, an array of paths representing the *iso lines* for the given
`threshold` and input `data`.
2. If `threshold` is an *array of scalars*, an additional array layer wraps the individual arrays of
paths for each threshold value.

A single path is an arrays of coordinates where each coordinate, again, is an array with two entries
`[ x, y ]` denoting the `x` and `y` position, respectively.

Note, that the paths resemble *linear Rings* by default, i.e. they are closed and have identical first
and last coordinates. (see the `options` parameter to change the output)


### Computing Iso Bands

```javascript
isoBands(data, lowerBound, bandWidth, options)
```

Compute *iso bands* for a 2-dimensional scalar field, a (list of) lowerBound(s), and a (list of) bandWidth(s).

| Parameter     | Description                                                                                                                                                     |
| ------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | 2-dimensional input data (scalar field). This parameter is **mandatory**.                                                                                       |
| `lowerBound`  | A constant numerical value (or array of numerical values) that define(s) the lower bound of the *iso band*. This parameter is **mandatory**.                    |
| `bandWidth`   | A constant numerical value (or array of numerical values) that defines the width(s) the *iso band*, i.e. the range of values. This parameter is **mandatory**.  |
| `options`     | An object with attributes allowing for changes in the behavior of this function (See below). This parameter is **optional**.                                    |

#### Returns:

1. If `lowerBound` is a *single scalar*, an array of paths representing the *iso lines* which enclose the
*iso band* of size `bandWidth`.
2. If `lowerBound` is an *array of scalars*, an additional array layer wraps the individual arrays of paths
for each `threshold`-`bandWidth` pair. Note, that if `bandWidth` is a *scalar* it will be applied to all
entries in the `lowerBound` array.
 
A single path is an arrays of coordinates where each coordinate, again, is an array with two entries `[ x, y ]`
denoting the `x` and `y` position, respectively.

Note, that the paths resemble *linear Rings* by default, i.e. they are closed and have identical first and last
coordinates. (see the `options` parameter to change the output)


### The Options Object

The `options` object may have the following fields:

| Property                  | Type        | Description                                                                                                                                                                                                                                                                     | Default value |
| ------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `options.successCallback` | *function*  | A function called at the end of the process with the band array passed as argument                                                                                                                                                                                              | `null`        |
| `options.verbose`         | *bool*      | Create `console.log()` info messages before each major step of the algorithm                                                                                                                                                                                                    | `false`       |
| `options.polygons`        | *bool*      | If `true` the function returns a list of path coordinates for individual polygons within each grid cell, if `false` returns a list of path coordinates representing the outline of connected polygons.                                                                          | `false`       |
| `options.linearRing`      | *bool*      | If `true`, the polygon paths are returned as linear rings, i.e. the first and last coordinate are identical indicating a closed path. Note, that for the `IsoLines` implementation a value of `false` reduces the output to *iso lines* that are not necessarily closed paths.  | `true`        |


### Deprecation Warnings

The `isoContour` function was renamed to `isoLines` with version `1.3.0` but still remains for backward compatibility reasons!

----

## Examples

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

You can find more examples in the [example/](example/) directory.

----

## License

MarchingSquaresJS is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

MarchingSquaresJS grants additional permissions under GNU Affero General
Public License version 3 section 7. See [LICENSE.md](LICENSE.md) for details.

----

Copyright (c) 2015-2018 Ronny Lorenz <ronny@tbi.univie.ac.at>
