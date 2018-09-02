# Changelog

### v1.3.2
- Fix frame detection for iso line/contour tracer
- Add homepage field to package.json

### v1.3.1
- Fix isoLine out-of-grid tracing issue
- Rename `quadTree` constructor function to `QuadTree`
- Add more input sanity checks
- Restructure examples/ directory
- Add editable example
- Add iso lines example


### v1.3.0
- Refactor all implementations
- Add **Quad-Tree** lookup data structure for faster retrieval of relevant grid cells
- Allow for array input to specify limits
- modularize sources, move them into src/ director, and use **ES2015 modules** scheme
- Use `rollup.js` to bundle final UMD wrapped modules


### v1.2.3
- refactor `IsoContours` implementation
- restore default behavior to return closed polygons in `IsoContours` and `IsoBands`
- Add new option flag `linearRing=true` to enable deactivation of closed polygon output


### v1.2.2
- Refactor `IsoBands` implementation
- Spellcheck README.md


### v1.2.1
- Add npm package link to README.md
- Fix line coordinate issues in `IsoContours` implementation


### v1.2.0
- Use lower camelcase function names for public API


### v1.1.1
- Add package.json
- Fix UMD wrappers
- Add require.js example


### v1.1.0
- Add example 
- Code cleanup
- Wrap module into Universal Module Definition (UMD) for portability


### v1.0.0
- initial version with `IsoBands` and `IsoContours` support
