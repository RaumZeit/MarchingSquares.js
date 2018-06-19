var fs = require('fs');
var path = require('path');
var test = require('tape');
var load = require('load-json-file');
var isoBands = require('../dist/marchingsquares.js').isoBands;
var isoContours = require('../dist/marchingsquares.js').isoContours;

var directories = {
    in: path.join(__dirname, 'data', 'in') + path.sep,
    out: path.join(__dirname, 'data', 'out') + path.sep
};

var testCases = fs.readdirSync(directories.in).map(function (filename) {
    return {
        filename: filename,
        name: path.parse(filename).name,
        data: load.sync(directories.in + filename)
    };
});


test('isoBands output', function (t) {
    testCases.forEach(function (inputFile) {
        var name = inputFile.name;
        var data = inputFile.data.matrix;
        var outputfile = directories.out + name + '.json';
        var lowerBand = inputFile.data.lowerBand;
        var upperBand = inputFile.data.upperBand;

        var bands = isoBands(data, lowerBand, upperBand - lowerBand);
        // console.log(bands)
        t.deepEqual(bands, load.sync(outputfile), name);
    });

    t.end();
});


test('isoBands input validation', function (t) {
    var dataArr = [[1], [2], [3]];

    t.throws(function(){isoBands(null, 0, 5)}, /data is required/, 'missing data');
    t.throws(function(){isoBands('string', 0, 5)} , /array of arrays/, 'invalid data');
    t.throws(function(){isoBands([1], 0, 5)}, /array of arrays/, 'invalid data again');
    t.throws(function(){isoBands(dataArr, null, 5)}, /lowerBound is required/, 'missing lowerBand');
    t.throws(function(){isoBands(dataArr, 0, null)}, /bandWidth is required/, 'missing lowerBand');
    t.throws(function(){isoBands(dataArr, 'number', 3)}, /lowerBound must be a number/, 'invalid lowerBand');
    t.throws(function(){isoBands(dataArr, 23, 'string')}, /bandWidth must be a number/, 'invalid bandWidth');
    t.throws(function(){isoBands(dataArr, 23, 3, 'string')}, /options must be an object/, 'invalid options');

    t.end();
});

test('isoContours input validation', function (t) {
    var dataArr = [[1], [2], [3]];

    t.throws(function(){isoContours(null, 0)}, /data is required/, 'missing data');
    t.throws(function(){isoContours('string', 0)}, /array of arrays/, 'invalid data');
    t.throws(function(){isoContours([1], 0)}, /array of arrays/, 'invalid data again');
    t.throws(function(){isoContours(dataArr, null)}, /threshold is required/, 'missing threshold');
    t.throws(function(){isoContours(dataArr, 'number')}, /threshold must be a number/, 'invalid threshold');
    t.throws(function(){isoContours(dataArr, 23, 'string')}, /options must be an object/, 'invalid options');

    t.end();
});
