var turfHelpers = require('@turf/helpers');
var turfFeaturecollection = turfHelpers.featureCollection;
var turfPolygon = turfHelpers.polygon;
var turfMultiPolygon = turfHelpers.multiPolygon;
var turfMultiLineString = turfHelpers.multiLineString;
var MS = require('./marchingsquares-isobands');

// var data = [
//     [18, 13, 10,  9, 10, 13, 18],
//     [13,  8,  5,  4,  5,  8, 13],
//     [10,  5,  2,  1,  2,  5, 10],
//     [ 9,  4,  1, 12,  1,  4,  9],
//     [10,  5,  2,  1,  2,  5, 10],
//     [13,  8,  5,  4,  5,  8, 13],
//     [18, 13, 10,  9, 10, 13, 18],
//     [18, 13, 10,  9, 10, 13, 18]
// ];
// var intervals = [0, 4.5, 9, 13.5, 18];

var data = [
    [6, 6,  6, 0, 6, 0, 0, 0, 0, 0, 0],
    [6, 8,  8, 8, 6, 0, 0, 0, 0, 0, 0],
    [6, 8, 10, 8, 6, 0, 0, 0, 0, 0, 0],
    [6, 8,  8, 8, 6, 0, 0, 0, 0, 0, 0],
    [6, 6,  6, 6, 6, 0, 0, 0, 0, 0, 0],
    [0, 4,  4, 4, 0, 0, 0, 0, 3, 0, 0],
    [0, 4,  4, 4, 0, 5, 5, 5, 5, 5, 0],
    [0, 2,  2, 2, 0, 5, 3, 3, 3, 5, 0],
    [0, 2,  2, 2, 0, 5, 3, 1, 3, 5, 0],
    [0, 0,  0, 0, 0, 5, 3, 3, 3, 5, 0], 
    [0, 0,  0, 0, 0, 5, 5, 5, 5, 5, 0],
    [0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0]
];

// var intervals = [0, 3, 5, 7, 10];
// var intervals = [0, 3];
var intervals = [3, 5];
// var intervals = [5, 7];
// var intervals = [7, 10];


var polygons = [];
for (var i = 0; i < intervals.length -1; i++) {
    var lowerBand = intervals[i];
    var upperBand = intervals[i+1] || Infinity;
    var isoBands = MS.isoBands(
        data,
        lowerBand,
        upperBand - lowerBand
    );
    var poly = turfPolygon(isoBands, {"elevation": upperBand});
    polygons.push(poly);
}

console.log(JSON.stringify(turfFeaturecollection(polygons)));

