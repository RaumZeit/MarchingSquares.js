import { uglify } from 'rollup-plugin-uglify';
import eslint from 'rollup-plugin-eslint';

var license = "/*!\n* MarchingSquaresJS\n* version 1.3.3\n* https://github.com/RaumZeit/MarchingSquares.js\n*\n* @license GNU Affero General Public License.\n* Copyright (c) 2015-" + (new Date()).getFullYear()  + " Ronny Lorenz <ronny@tbi.univie.ac.at>\n*/\n\n"

var uglify_options = {
  output: {
    comments: function(node, comment) {
        var text = comment.value;
        var type = comment.type;
        if (type == "comment2") {
            // multiline comment
            return /@preserve|@license|@cc_on/i.test(text);
        }
    }
  }
};

export default [
  {
    input: 'src/main.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-esm.js',
      format: 'es',
      banner: license
    },
    plugins: [ eslint() ]
  },
  {
    input: 'src/main.js',
    output: {
      extend: true,
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares.js',
      format: 'umd',
      banner: license
    }
  },
  {
    input: 'src/main.js',
    output: {
      extend: true,
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares.min.js',
      format: 'umd',
      banner: license
    },
    plugins: [
      uglify(uglify_options)
    ]
  },
  {
    input: 'src/isobands.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-isobands.js',
      format: 'umd',
      extend: true,
      banner: license
    }
  },
  {
    input: 'src/isobands.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-isobands.min.js',
      format: 'umd',
      extend: true,
      banner: license
    },
    plugins: [
      uglify(uglify_options)
    ]
  },
  {
    input: 'src/isolines.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-isolines.js',
      format: 'umd',
      extend: true,
      banner: license
    }
  },
  {
    input: 'src/isolines.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-isolines.min.js',
      format: 'umd',
      extend: true,
      banner: license
    },
    plugins: [
      uglify(uglify_options)
    ]
  },
  {
    input: 'src/isolines.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-isocontours.js',
      format: 'umd',
      extend: true,
      banner: license
    }
  },
  {
    input: 'src/isolines.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-isocontours.min.js',
      format: 'umd',
      extend: true,
      banner: license
    },
    plugins: [
      uglify(uglify_options)
    ]
  }
];
