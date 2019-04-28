var license = "/*!\n* MarchingSquaresJS\n* version 1.3.3\n* https://github.com/RaumZeit/MarchingSquares.js\n*\n* @license GNU Affero General Public License.\n* Copyright (c) 2015-" + (new Date()).getFullYear()  + " Ronny Lorenz <ronny@tbi.univie.ac.at>\n*/\n\n"

export default [
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
];
