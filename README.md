# MarchingSquaresJS

A JavaScript implementation of the Marching Squares algorithm
featuring IsoContour and IsoBand computation.

### Usage ###

To use the marchingsquares-isobands.js routine, the input data must be formatted as a 2-dimensional grid
and passed to the `MarchingSquaresJS.IsoBands` function.

The `lowerBand` parameter denotes the the lowest value that will be encompassed by this iso-band, while
the `bandWidth` parameter denotes what range of values it will cover. The iso-band shown below should contain all values between `lowerBand` and `upperBand`.

```
var data = [[18, 13, 10, 9, 10, 13, 18],
    [13, 8, 5, 4, 5, 8, 13],
    [10, 5, 2, 1, 2, 5, 10],
    [9, 4, 1, 12, 1, 4, 9],
    [10, 5, 2, 1, 2, 5, 10],
    [13, 8, 5, 4, 5, 8, 13],
    [18, 13, 10, 9, 10, 13, 18],
    [18, 13, 10, 9, 10, 13, 18]]

var bandWidth = upperBand - lowerBand;
var band = MarchingSquaresJS.IsoBands(data, lowerBand, bandWidth);
```

The return value, `band`, is an array of closed polygons which encircle the area defined by this contour:

```
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

Copyright (c) 2015, 2015 Ronny Lorenz <ronny@tbi.univie.ac.at>
