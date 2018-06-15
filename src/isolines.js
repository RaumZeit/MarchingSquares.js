/*!
* @license GNU Affero General Public License.
* Copyright (c) 2015-2018 Ronny Lorenz <ronny@tbi.univie.ac.at>
* v. 1.2.3
* https://github.com/RaumZeit/MarchingSquares.js
*/

import { optIsoLines } from './options.js';
import { extractPolygons, traceLinePaths } from './polygons.js';


/*
  Compute the iso lines for a scalar 2D field given
  a certain threshold by applying the Marching Squares
  Algorithm. The function returns a list of path coordinates
*/

function isoLines(data, threshold, options){
  var settings = {};

  /* process options */
  options = options ? options : {};

  var optionKeys = Object.keys(optIsoLines);

  for(var i = 0; i < optionKeys.length; i++){
    var key = optionKeys[i];
    var val = options[key];
    val = ((typeof val !== 'undefined') && (val !== null)) ? val : optIsoLines[key];

    settings[key] = val;
  }

  if(settings.verbose)
    console.log("MarchingSquaresJS-isoContours: computing isocontour for " + threshold);

  /* restore compatibility */
  settings.polygons_full  = !settings.polygons;

  var grid = {
    rows:       data.length - 1,
    cols:       data[0].length - 1,
    cells:      [],
    threshold:  threshold
  };

  settings.threshold = threshold;

  for (var j = 0; j < grid.rows; ++j) {
    grid.cells[j] = [];
    for (var i = 0; i < grid.cols; ++i)
      grid.cells[j][i] = prepareCell(data, i, j, settings);
  }

  var ret;

  if(settings.polygons){
    if (settings.verbose)
      console.log("MarchingSquaresJS-isoContours: returning single polygons for each grid cell");

    ret = extractPolygons(grid, settings);
  } else {
    if (settings.verbose)
      console.log("MarchingSquaresJS-isoContours: returning iso lines (polygon paths) for entire data grid");

    ret = traceLinePaths(grid, settings);
  }

  if(typeof settings.successCallback === 'function')
    settings.successCallback(ret);

  return ret;
}

/*
  Thats all for the public interface, below follows the actual
  implementation
*/

/*
################################
Isocontour implementation below
################################
*/

function prepareCell(grid, x, y, settings) {
  var cval      = 0;
  var x3        = grid[y + 1][x];
  var x2        = grid[y + 1][x + 1];
  var x1        = grid[y][x + 1];
  var x0        = grid[y][x];
  var threshold = settings.threshold;

  /*
      Note that missing data within the grid will result
      in horribly failing to trace full polygon paths
  */
  if(isNaN(x0) || isNaN(x1) || isNaN(x2) || isNaN(x3)){
    return;
  }

  /*
      Here we detect the type of the cell

      x3 ---- x2
       |      |
       |      |
      x0 ---- x1

      with edge points

        x0 = (x,y),
        x1 = (x + 1, y),
        x2 = (x + 1, y + 1), and
        x3 = (x, y + 1)

      and compute the polygon intersections with the edges
      of the cell. Each edge value may be (i) smaller, or (ii)
      greater or equal to the iso line threshold. We encode
      this property using 1 bit of information, where

      0 ... below,
      1 ... above or equal

      Then we store the cells value as vector

      cval = (x0, x1, x2, x3)

      where x0 is the least significant bit (0th),
      x1 the 2nd bit, and so on. This essentially
      enables us to work with a single integer number
  */

  cval |= ((x3 >= threshold) ? 8 : 0);
  cval |= ((x2 >= threshold) ? 4 : 0);
  cval |= ((x1 >= threshold) ? 2 : 0);
  cval |= ((x0 >= threshold) ? 1 : 0);

  /* make sure cval is a number */
  cval = +cval;

  var cell = {
    cval:         cval,
    polygons:     [],
    edges:        {},
    x0:           x0,
    x1:           x1,
    x2:           x2,
    x3:           x3
  };

  /*
      Compute interpolated intersections of the polygon(s)
      with the cell borders and (i) add edges for polygon
      trace-back, or (ii) a list of small closed polygons
  */
  switch (cval) {
    case 0:
      if (settings.polygons)
        cell.polygons.push([ [0, 0], [0, 1], [1, 1], [1, 0] ]);

      break;

    case 15:
      /* cell is outside (above) threshold, no polygons */
      break;

    case 14: /* 1110 */
      var left    = settings.interpolate(x0, x3, threshold);
      var bottom  = settings.interpolate(x0, x1, threshold);

      if (settings.polygons_full) {
        cell.edges.left = {
            path: [ [0, left], [bottom, 0] ],
            move: {
              x:      0,
              y:      -1,
              enter:  'top'
            }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [0, 0], [0, left], [bottom, 0] ]);

      break;

    case 13: /* 1101 */
      var bottom  = settings.interpolate(x0, x1, threshold);
      var right   = settings.interpolate(x1, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.bottom = {
          path: [ [bottom, 0], [1, right] ],
          move: {
            x:      1,
            y:      0,
            enter:  'left'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [bottom, 0], [1, right], [1, 0] ]);

      break;

    case 11: /* 1011 */
      var right = settings.interpolate(x1, x2, threshold);
      var top   = settings.interpolate(x3, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.right = {
          path: [ [1, right], [top, 1] ],
          move: {
            x:      0,
            y:      1,
            enter:  'bottom'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [1, right], [top, 1], [1, 1] ]);

      break;

    case 7: /* 0111 */
      var left  = settings.interpolate(x0, x3, threshold);
      var top   = settings.interpolate(x3, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.top = {
          path: [ [top, 1], [0, left] ],
          move: {
            x:      -1,
            y:      0,
            enter:  'right'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [top, 1], [0, left], [0, 1] ]);

      break;

    case 1: /* 0001 */
      var left    = settings.interpolate(x0, x3, threshold);
      var bottom  = settings.interpolate(x0, x1, threshold);

      if (settings.polygons_full) {
        cell.edges.bottom = {
            path: [ [bottom, 0], [0, left] ],
            move: {
              x:      -1,
              y:      0,
              enter:  'right'
            }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [bottom, 0], [0, left], [0, 1], [1, 1], [1, 0] ]);

      break;

    case 2: /* 0010 */
      var bottom  = settings.interpolate(x0, x1, threshold);
      var right   = settings.interpolate(x1, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.right = {
          path: [ [1, right], [bottom, 0] ],
          move: {
            x:      0,
            y:      -1,
            enter:  'top'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [0, 0], [0, 1], [1, 1], [1, right], [bottom, 0] ]);

      break;

    case 4: /* 0100 */
      var right = settings.interpolate(x1, x2, threshold);
      var top   = settings.interpolate(x3, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.top = {
          path: [ [top, 1], [1, right] ],
          move: {
            x:      1,
            y:      0,
            enter:  'left'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [0, 0], [0, 1], [top, 1], [1, right], [1, 0] ]);

      break;

    case 8: /* 1000 */
      var left  = settings.interpolate(x0, x3, threshold);
      var top   = settings.interpolate(x3, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.left = {
          path: [ [0, left], [top, 1] ],
          move: {
            x:      0,
            y:      1,
            enter:  'bottom'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [0, 0], [0, left], [top, 1], [1, 1], [1, 0] ]);

      break;

    case 12: /* 1100 */
      var left  = settings.interpolate(x0, x3, threshold);
      var right = settings.interpolate(x1, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.left = {
          path: [ [0, left], [1, right] ],
          move: {
            x:      1,
            y:      0,
            enter:  'left'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [0, 0], [0, left], [1, right], [1, 0] ]);

      break;

    case 9: /* 1001 */
      var bottom  = settings.interpolate(x0, x1, threshold);
      var top     = settings.interpolate(x3, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.bottom = {
          path: [ [bottom, 0], [top, 1] ],
          move: {
            x:      0,
            y:      1,
            enter:  'bottom'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [bottom, 0], [top, 1], [1, 1], [1, 0] ]);

      break;

    case 3: /* 0011 */
      var left  = settings.interpolate(x0, x3, threshold);
      var right = settings.interpolate(x1, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.right = {
          path: [ [1, right], [0, left] ],
          move: {
            x:      -1,
            y:      0,
            enter:  'right'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [0, left], [0, 1], [1, 1], [1, right] ]);

      break;

    case 6: /* 0110 */
      var bottom  = settings.interpolate(x0, x1, threshold);
      var top     = settings.interpolate(x3, x2, threshold);

      if (settings.polygons_full) {
        cell.edges.top = {
          path: [ [top, 1], [bottom, 0] ],
          move: {
            x:      0,
            y:      -1,
            enter:  'top'
          }
        };
      }

      if (settings.polygons)
        cell.polygons.push([ [0, 0], [0, 1], [top, 1], [bottom, 0] ]);

      break;

    case 10: /* 1010 */
      var left    = settings.interpolate(x0, x3, threshold);
      var right   = settings.interpolate(x1, x2, threshold);
      var bottom  = settings.interpolate(x0, x1, threshold);
      var top     = settings.interpolate(x3, x2, threshold);
      var average = (x0 + x1 + x2 + x3) / 4;

      if (settings.polygons_full) {
        if (average < threshold) {
          cell.edges.left = {
            path: [ [0, left], [top, 1] ],
            move: {
              x:      0,
              y:      1,
              enter:  'bottom'
            }
          };
          cell.edges.right = {
            path: [ [1, right], [bottom, 0] ],
            move: {
              x:      0,
              y:      -1,
              enter:  'top'
            }
          }
        } else {
          cell.edges.right = {
            path: [ [1, right], [top, 1] ],
            move: {
              x:      0,
              y:      1,
              enter:  'bottom'
            }
          };
          cell.edges.left = {
            path: [ [0, left], [bottom, 0] ],
            move: {
              x:      0,
              y:      -1,
              enter:  'top'
            }
          };
        }
      }

      if (settings.polygons) {
        if (average < threshold) {
          cell.polygons.push([ [0, 0], [0, left], [top, 1], [1, 1], [1, right], [bottom, 0] ]);
        } else {
          cell.polygons.push([ [0, 0], [0, left], [bottom, 0] ]);
          cell.polygons.push([ [top, 1], [1, 1], [1, right] ]);
        }
      }

      break;

    case 5: /* 0101 */
      var left    = settings.interpolate(x0, x3, threshold);
      var right   = settings.interpolate(x1, x2, threshold);
      var bottom  = settings.interpolate(x0, x1, threshold);
      var top     = settings.interpolate(x3, x2, threshold);
      var average = (x0 + x1 + x2 + x3) / 4;

      if (settings.polygons_full) {
        if (average < threshold) {
          cell.edges.bottom = {
            path: [ [bottom, 0], [0, left] ],
            move: {
              x:      -1,
              y:      0,
              enter:  'right'
            }
          };
          cell.edges.top = {
            path: [ [top, 1], [1, right] ],
            move: {
              x:      1,
              y:      0,
              enter:  'left'
            }
          };
        } else {
          cell.edges.top = {
            path: [ [top, 1], [0, left] ],
            move: {
              x:      -1,
              y:      0,
              enter:  'right'
            }
          };
          cell.edges.bottom = {
            path: [ [bottom, 0], [1, right] ],
            move: {
              x:      1,
              y:      0,
              enter:  'left'
            }
          };
        }
      }

      if (settings.polygons) {
        if (average < threshold) {
          cell.polygons.push([ [0, left], [0, 1], [top, 1], [1, right], [1, 0], [bottom, 0] ]);
        } else {
          cell.polygons.push([ [0, left], [0, 1], [top, 1] ]);
          cell.polygons.push([ [bottom, 0], [1, right], [1, 0] ]);
        }
      }

      break;
  }

  return cell;
}


export default isoLines;
