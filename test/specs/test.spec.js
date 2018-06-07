var fs = require('fs');
var path = require('path');
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


describe('IsoBands -', function () {

    testCases.forEach(function (inputFile) {
        var name = inputFile.name;
        var data = inputFile.data.matrix;
        var outputfile = directories.out + name + '.json';
        var lowerBand = inputFile.data.lowerBand;
        var upperBand = inputFile.data.upperBand;

        describe(name, function () {
            it('', function () {
                var bands = isoBands(data, lowerBand, upperBand - lowerBand);
                // console.log(bands)
                expect(bands).toEqual(load.sync(outputfile));
            });
        });
    });


    describe('IsoBands input validation', function () {
        var dataArr = [[1], [2], [3]];
        it('should throw an exception if any required argument is invalid', function () {
            expect(function(){ isoBands(null, 0, 5) }).toThrowError('data is required');
            expect(function(){ isoBands('string', 0, 5) }).toThrowError('data should be an array of arrays');
            expect(function(){ isoBands([1], 0, 5) }).toThrowError('data should be an array of arrays');
            expect(function(){ isoBands(dataArr, null, 5) }).toThrowError('lowerBand is required');
            expect(function(){ isoBands(dataArr, 0, null) }).toThrowError('bandWidth is required');
        });
    });

});
