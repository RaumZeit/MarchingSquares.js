# Changelog

Below, you'll find a list of notable changes for each version of MarchingSquares.js.

## Version 1.3.x

### [v1.3.3](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.3.2...v1.3.3) (2019-04-28)

- Add boolean option `noFrame=false` to allow for omitting the enclosing frame in `isoLines` implementation


### [v1.3.2](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.3.1...v1.3.2) (2018-09-02)

- Fix frame detection for iso line/contour tracer
- Add homepage field to package.json


### [v1.3.1](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.3.0...v1.3.1) (2018-07-05)

- Fix isoLine out-of-grid tracing issue
- Rename `quadTree` constructor function to `QuadTree`
- Add more input sanity checks
- Restructure examples/ directory
- Add editable example
- Add iso lines example


### [v1.3.0](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.2.3...v1.3.0) (2018-06-23)

- Refactor all implementations
- Add **Quad-Tree** lookup data structure for faster retrieval of relevant grid cells
- Allow for array input to specify limits
- modularize sources, move them into src/ director, and use **ES2015 modules** scheme
- Use `rollup.js` to bundle final UMD wrapped modules


## Version 1.2.x

### [v1.2.3](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.2.2...v1.2.3) (2018-06-10)

- refactor `isoContours` implementation
- restore default behavior to return closed polygons in `isoContours` and `isoBands`
- Add new option flag `linearRing=true` to enable deactivation of closed polygon output


### [v1.2.2](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.2.1...v1.2.2) (2018-06-06)

- Refactor `isoBands` implementation
- Spellcheck README.md


### [v1.2.1](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.2.0...v1.2.1) (2018-05-27)

- Add npm package link to README.md
- Fix line coordinate issues in `isoContours` implementation


### [v1.2.0](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.1.1...v1.2.0) (2017-03-19)

- Use lower camelcase function names `isoLines()` and `isoBands()` for public API


## Version 1.1.x

### [v1.1.1](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.1.0...v1.1.1) (2017-03-19)

- Add package.json
- Fix UMD wrappers
- Add require.js example


### [v1.1.0](https://github.com/RaumZeit/MarchingSquares.js/compare/v1.0.0...v1.1.0) (2017-03-10)

- Add example 
- Code cleanup
- Wrap module into Universal Module Definition (UMD) for portability


### v1.0.0 (2017-03-01)

- initial version with `IsoBands` and `IsoContours` support
