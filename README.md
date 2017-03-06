# MarchingSquaresJS

A JavaScript implementation of the [Marching Squares](http://web.cse.ohio-state.edu/~wenger/publications/isosurface_book_preview.pdf) algorithm
featuring IsoContour and IsoBand computation.

### INSTALL

##### Using Node.js:

```javascript
var MarchingSquaresJS = require('./marchingsquares-isobands.js');
```

##### In the browser:

Download the [minified file](https://raw.githubusercontent.com/RaumZeit/MarchingSquares.js/master/marchingsquares-isobands.min.js), and include it in a script tag. This will expose a global variable named `MarchingSquaresJS`.

```html
<script src="marchingsquares-isobands.min.js"></script>.
```

### Usage

To use the `marchingsquares-isobands.js` routine, the input data must be formatted as a 2-dimensional grid
and passed to the `MarchingSquaresJS.IsoBands` function.

The `lowerBand` parameter denotes the the lowest value that will be encompassed by this iso-band, while
the `bandWidth` parameter denotes what range of values it will cover. The iso-band shown below should contain all values between `lowerBand` and `upperBand`.

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
var band = MarchingSquaresJS.IsoBands(data, lowerBand, bandWidth, options);
```

The return value, `band`, is an array of closed polygons which includes all the point of the grid with values between the limiting isolines:

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

##### Options

The object has the following fields:

`successCallback`: *function* - called at the end of the process with the band array passed as argument; default `null`.

`verbose`: *bool* - logs info messages before each major step of the algorithm; default `false`.

`polygons`: *bool* - if `true` the function returns a list of path coordinates for individual polygons within each grid cell, if `false` returns a list of path coordinates representing the outline of connected polygons. Default `false`.


----

Copyright (c) 2015, 2015 Ronny Lorenz <ronny@tbi.univie.ac.at>
