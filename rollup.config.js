
export default [
  {
    input: 'src/main.js',
    output: {
      extend: true,
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares.js',
      format: 'umd'
    }
  },
  {
    input: 'src/main_isobands.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-isobands.js',
      format: 'umd',
      extend: true
    }
  },
  {
    input: 'src/main_isolines.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-isolines.js',
      format: 'umd',
      extend: true
    }
  },
  {
    input: 'src/main_isolines.js',
    output: {
      name: 'MarchingSquaresJS',
      file: 'dist/marchingsquares-isocontours.js',
      format: 'umd',
      extend: true
    }
  }
];
