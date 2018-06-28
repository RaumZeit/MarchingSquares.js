window.onload = function () {

    var editor = CodeMirror(document.getElementById('editor'), {
        value: '[\n' +
        '    [1, 1, 1, 1, 1, 1, 1],\n' +
        '    [1, 5, 5, 5, 5, 5, 1],\n' +
        '    [1, 5, 15, 15, 15, 5, 1],\n' +
        '    [1, 5, 10, 10, 10, 5, 1],\n' +
        '    [1, 5, 5, 5, 5, 5, 1],\n' +
        '    [1, 1, 1, 1, 1, 1, 1]\n' +
        ']',
        mode: "javascript",
        styleActiveLine: true,
        matchBrackets: true,
        lineNumbers: true,
    });

    var output = CodeMirror(document.getElementById('output'), {
        styleActiveLine: true,
        matchBrackets: true,
        readOnly: true,
    });

    var intervalsInput = document.getElementById('intervals');

    var getIntervals = function () {
        var content = intervalsInput.value;
        var intervals;
        try {
            intervals = JSON.parse('[' + content + ']');
        } catch (e) {
            intervals = [];
        }
        return intervals;
    };

    var boundaries = function (data) {
        return {
            xs: d3.range(0, data[0].length),
            ys: d3.range(0, data.length)
        };
    };

    var changeIntervals = function (e) {
        try {
            var intervals = JSON.parse('[' + e.target.value + ']');
        } catch (e) {
            output.doc.setValue('Invalid intervals.');
            return;
        }

        try {
            var data = JSON.parse(editor.doc.getValue());
        } catch (e) {
            output.doc.setValue('Invalid intervals.');
            return;
        }
        run(data, intervals);
    };

    var processData = function (editor) {
        var intervals = getIntervals();

        try {
            var data = JSON.parse(editor.doc.getValue());
        } catch (e) {
            output.doc.setValue(e.message);
            return;
        }
        run(data, intervals);
    };

    var run = function (data, intervals) {
        if (!data) return;

        var bandWidths = intervals.reduce(function (bw, upperBand, i, intervals) {
            if (i > 0) {
                var lowerBand = intervals[i - 1];
                bw.push(upperBand - lowerBand);
            }
            return bw;
        }, []);

        try {
            var bands = MarchingSquaresJS
                .isoBands(data, intervals.slice(0, -1), bandWidths,);
        } catch (e) {
            output.doc.setValue(e.message);
            return;
        }

        output.doc.setValue(JSON.stringify(bands, undefined, 2));

        var isoBandObjects = bands.map(function (band, i) {
            return {
                "coords": band,
                "level": i,
                "val": intervals[i]
            };
        });

        document.getElementById('isobands').innerText = '';
        drawLines('#isobands', isoBandObjects, intervals, boundaries(data));
    };

    editor.on('change', processData);
    intervalsInput.addEventListener('keyup', changeIntervals);

    processData(editor);
};