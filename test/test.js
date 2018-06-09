var fs = require('fs');
var path = require('path');
var test = require('tape');
var load = require('load-json-file');
var isoBands = require('../../marchingsquares.js').isoBands;

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


test('IsoBands -', function (t) {
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


test('IsoBands input validation', function (t) {
    var dataArr = [[1], [2], [3]];

    t.throws(function(){isoBands(null, 0, 5)}, /data is required/);
    t.throws(function(){isoBands('string', 0, 5)},/data should be an array of arrays/);
    t.throws(function(){isoBands([1], 0, 5)},/data should be an array of arrays/);
    t.throws(function(){isoBands(dataArr, null, 5)},/lowerBand is required/);
    t.throws(function(){isoBands(dataArr, 0, null)},/bandWidth is required/);

    t.end();
});
