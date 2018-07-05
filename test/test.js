var fs = require('fs');
var path = require('path');
var test = require('tape');
var load = require('load-json-file');
var isoBands = require('../dist/marchingsquares.js').isoBands;
var isoLines = require('../dist/marchingsquares.js').isoLines;
var QuadTree = require('../dist/marchingsquares.js').QuadTree;

var directories = {
    in: path.join(__dirname, 'data', 'in') + path.sep,
    out: path.join(__dirname, 'data', 'out') + path.sep
};

var isoBandsTestCases = fs.readdirSync(directories.in)
        .filter(function (filename) {
        return filename.includes('isoBands');
    })
        .map(function (filename) {
        return {
            name: path.parse(filename).name,
            data: load.sync(directories.in + filename)
        };
    });

test('isoBands output', function (t) {
    isoBandsTestCases.forEach(function (inputFile) {
        var name = inputFile.name;
        var data = inputFile.data.matrix;
        var outputfile = directories.out + name + '.json';
        var lowerBand = inputFile.data.lowerBand;
        var upperBand = inputFile.data.upperBand;

        var bands = isoBands(data, lowerBand, upperBand - lowerBand);
        // console.log(JSON.stringify(bands));
        t.deepEqual(bands, load.sync(outputfile), name);
    });

    t.end();
});


var isoLinesTestCases = fs.readdirSync(directories.in)
        .filter(function (filename) {
        return filename.includes('isoLines');
    })
        .map(function (filename) {
        return {
            name: path.parse(filename).name,
            data: load.sync(directories.in + filename)
        };
    });

test('isoLines output', function (t) {
    isoLinesTestCases.forEach(function (inputFile) {
        var name = inputFile.name;
        var data = inputFile.data.matrix;
        var outputfile = directories.out + name + '.json';
        var thresholds = inputFile.data.thresholds;

        var lines = isoLines(data, thresholds);
        // console.log(JSON.stringify(lines));
        t.deepEqual(lines, load.sync(outputfile), name);
    });

    t.end();
});


test('isoBands input validation', function (t) {
    var dataArr = [[1], [2], [3]];

    t.throws(function(){isoBands(null, 0, 5)}, /data is required/, 'missing data');
    t.throws(function(){isoBands('string', 0, 5)} , /array of arrays/, 'invalid data');
    t.throws(function(){isoBands([1], 0, 5)}, /array of arrays/, 'invalid data again');
    t.throws(function(){isoBands(dataArr, null, 5)}, /lowerBound is required/, 'missing lowerBound');
    t.throws(function(){isoBands(dataArr, 0, null)}, /bandWidth is required/, 'missing bandWidth');
    t.throws(function(){isoBands(dataArr, [0, 1], null)}, /bandWidth is required/, 'missing bandWidth');
    t.throws(function(){isoBands(dataArr, [0, 'foo'], [1, 2])}, /is not a number/, 'invalid lowerBound entry');
    t.throws(function(){isoBands(dataArr, 'number', 3)}, /lowerBound must be a number/, 'invalid lowerBound');
    t.throws(function(){isoBands(dataArr, 23, 'string')}, /bandWidth must be a number/, 'invalid bandWidth');
    t.throws(function(){isoBands(dataArr, 0, [1, 5])}, /bandWidth must be a number/, 'invalid lowerBound-bandWidth combination');
    t.throws(function(){isoBands(dataArr, [0, 5], [3, 1, 5])}, /unequal lengths/, 'invalid lowerBound-bandWidth combination');
    t.throws(function(){isoBands(dataArr, 23, 3, 'string')}, /options must be an object/, 'invalid options');

    t.end();
});

test('isoLines input validation', function (t) {
    var dataArr = [[1], [2], [3]];

    t.throws(function(){isoLines(null, 0)}, /data is required/, 'missing data');
    t.throws(function(){isoLines('string', 0)}, /array of arrays/, 'invalid data');
    t.throws(function(){isoLines([1], 0)}, /array of arrays/, 'invalid data again');
    t.throws(function(){isoLines(dataArr, null)}, /threshold is required/, 'missing threshold');
    t.throws(function(){isoLines(dataArr, 'number')}, /threshold must be a number/, 'invalid threshold');
    t.throws(function(){isoLines(dataArr, [0, 'foo'])}, /is not a number/, 'invalid threshold entry');
    t.throws(function(){isoLines(dataArr, 23, 'string')}, /options must be an object/, 'invalid options');

    t.end();
});


test('successCallback check', function (t) {
    var data = [[1, 1], [1, 5]];
    var called = false;
    var options = {
        successCallback: function () {
            called = true;
        }
    };

    isoLines(data, 1, options);
    t.true(called);
    called = false;
    isoBands(data, 1, 2, options);
    t.true(called);

    t.end();
});


test('QuadTree', function (t) {
    var data = [
        [1, 1, 1, 0],
        [1, 5, 5, 1],
        [0, 5, 7, 1]
    ];
    var prepData = new QuadTree(data);

    t.equal('QuadTree', prepData.constructor.name);
    t.equal('TreeNode', prepData.root.constructor.name);

    t.throws(function(){new QuadTree(null)}, /data is required/, 'missing data');
    t.throws(function(){new QuadTree([ ])}, /array of arrays/, '1D array');
    t.throws(function(){new QuadTree([ [ ] ])}, /two rows/, 'Empty 2D array');
    t.throws(function(){new QuadTree([ [0] ])}, /two rows/, 'Single row');
    t.throws(function(){new QuadTree([ [0], [0] ])}, /two columns/, 'Single column');
    t.throws(function(){new QuadTree([ [0, 1], [0] ])}, /unequal row lengths/, 'Unequal row lengths');

    /* There are only only two cells with threshold 0 */
    t.deepEqual([{x: 2, y: 0},{x: 0, y: 1}], prepData.root.cellsBelowThreshold(0, false));
    /* There are only two cells with threshold 7 */
    t.deepEqual([{x: 1, y: 1},{x: 2, y: 1}], prepData.root.cellsBelowThreshold(7, false));
    /* there is no cell with threshold -2 */
    t.deepEqual([], prepData.root.cellsBelowThreshold(-2, false));
    /* there is no cell with threshold -2 */
    t.deepEqual([], prepData.root.cellsBelowThreshold(10, false));
    /* only two cells with band [7:8] */
    t.deepEqual([{x: 1, y: 1},{x: 2, y: 1}], prepData.root.cellsInBand(7, 8, false));

    t.end();
});
