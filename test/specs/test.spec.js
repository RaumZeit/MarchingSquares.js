// https://jasmine.github.io/api/2.6/global

var fs = require('fs');
var path = require('path');
var load = require('load-json-file');
var write = require('write-json-file');
// var truncate = require('@turf/truncate');
// var point = require('@turf/helpers').point;
// var circle = require('@turf/circle');
// var matrixToGrid = require('./');
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


// var x = isoBands('string', 1, 5);
// var e = load.sync(directories.out + testCases[0].name + '.json');

describe('MarchingSquares.isoBands', function () {

    testCases.forEach(function (inputFile) {

        var name = inputFile.name;
        var data = inputFile.data;
        var outputfile = directories.out + name + '.json';
        var lowerBand = data.lowerBand;
        var upperBand = data.upperband;

        describe('Calculate isoband', function () {

            it('should return an array of array of coordinates', function () {
                var data = [
                    [1, 1, 1, 0],
                    [1, 5, 5, 1],
                    [0, 1, 1, 1]
                ];
                var bands = isoBands(data, lowerBand, upperBand - lowerBand);
                // if (process.env.REGEN) {
                //     write.sync(outputfile, bands);
                // }
                expect(bands).toEqual(load.sync(outputfile));

            });

        });
    });


    describe('input validation', function () {
        var dataArr = [[1], [2], [3]];
        it('should throw an exception if any required argument is invalid', function () {
            expect(function(){ isoBands(null, 0, 5) }).toThrowError('data is required');
            expect(function(){ isoBands('string', 0, 5) }).toThrowError('data is not array');
            expect(function(){ isoBands(dataArr, null, 5) }).toThrowError('lowerBand is required');
            expect(function(){ isoBands(dataArr, 0, null) }).toThrowError('bandWidth is required');
        });
    });

});
