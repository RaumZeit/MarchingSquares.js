/*!
* @license GNU Affero General Public License.
* Copyright (c) 2015-2018 Ronny Lorenz <ronny@tbi.univie.ac.at>
* v. 1.2.3
* https://github.com/RaumZeit/MarchingSquares.js
*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function() { return { isoContours : factory() }; })
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = { isoContours : factory() };
    } else {
        // Browser globals (root is window)
        root.MarchingSquaresJS = {
                                    isoContours : factory(),
                                    isoBands : (root.MarchingSquaresJS) ? root.MarchingSquaresJS.isoBands : null
                                 };
    }
}(this, function () {

  /*
    Compute the isocontour(s) of a scalar 2D field given
    a certain threshold by applying the Marching Squares
    Algorithm. The function returns a list of path coordinates
  */
  var defaultSettings = {
    successCallback:  null,
    verbose:          false,
    polygons:         false,
    polygons_full:    true,
    linearRing:       true,
    interpolate:    function(a, b, threshold) {
      if (a < b)
        return (threshold - a) / (b - a);
      else
        return (a - threshold) / (a - b);
    },
  };

  var settings = {};

  function isoContours(data, threshold, options){
    /* validation */
    if (!data) throw new Error('data is required');
    if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('data should be an array of arrays');
    if (threshold === undefined || threshold === null) throw new Error('threshold is required');
    if (isNaN(+threshold)) throw new Error('threshold must be a number');
    if (!!options && options.constructor !== 'object') throw new Error('options must be an object');

    /* process options */
    options = options ? options : {};

    var optionKeys = Object.keys(defaultSettings);

    for(var i = 0; i < optionKeys.length; i++){
      var key = optionKeys[i];
      var val = options[key];
      val = ((typeof val !== 'undefined') && (val !== null)) ? val : defaultSettings[key];

      settings[key] = val;
    }

    if(settings.verbose)
      console.log("MarchingSquaresJS-isoContours: computing isocontour for " + threshold);

    /* restore compatibility */
    settings.polygons_full  = !settings.polygons;

    var grid = computeContourGrid(data, threshold, settings);

    var ret;
    if(settings.polygons){
      if (settings.verbose)
        console.log("MarchingSquaresJS-isoContours: returning single polygons for each grid cell");
      ret = GetPolygons(grid, settings);
    } else {
      if (settings.verbose)
        console.log("MarchingSquaresJS-isoContours: returning iso lines (polygon paths) for entire data grid");
      ret = TracePaths(grid, settings);
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


  /* compute the isocontour 4-bit grid */
  function computeContourGrid(data, threshold, settings) {
    var rows = data.length - 1;
    var cols = data[0].length - 1;
    var ContourGrid = { rows: rows, cols: cols, cells: [], threshold: threshold };

    settings.threshold = threshold;

    for (var j = 0; j < rows; ++j) {
      ContourGrid.cells[j] = [];
      for (var i = 0; i < cols; ++i)
        ContourGrid.cells[j][i] = prepareCell(data, i, j, settings);
    }

    return ContourGrid;
  }

  function entry_coordinate(x, y, mode, path) {
    var k = x;
    var l = y;

    if (mode === 0) { /* down */
      k += 1;
      l += path[0][1];
    } else if (mode === 1) { /* left */
      k += path[0][0];
    } else if (mode === 2) { /* up */
      l += path[0][1];
    } else if (mode === 3) { /* right */
      k += path[0][0];
      l += 1;
    }

    return [ k, l ];
  }

  function skip_coordinate(x, y, mode) {
    var k = x;
    var l = y;

    if (mode === 0) { /* down */
      k++;
    } else if (mode === 1) { /* left */
      /* do nothing */
    } else if (mode === 2) { /* up */
      l++;
    } else if (mode === 3) { /* right */
      k++;
      l++;
    }

    return [ k, l ];
  }

  function TracePaths(grid, settings) {
    var areas = [];
    var rows = grid.rows;
    var cols = grid.cols;
    var polygons = [];

    /*
        directions for out-of-grid moves are:
        0 ... "down",
        1 ... "left",
        2 ... "up",
        3 ... "right"
    */
    var valid_entries = [ "right",  /* down */
                          "bottom", /* left */
                          "left",   /* up */
                          "top"     /* right */
                        ];
    var add_x         = [ 0, -1, 0, 1 ];
    var add_y         = [ -1, 0, 1, 0 ];
    var entry_dir     =  { bottom: 1,
                           left: 2,
                           top: 3,
                           right: 0
                         };

    /* first, detect whether we need any outer frame */
    var require_frame = true;

    for (var j = 0; j < rows; j++) {
      if ((grid.cells[j][0].x0 >= grid.threshold) ||
          (grid.cells[j][cols - 1].x1 >= grid.threshold)) {
        require_frame = false;
        break;
      }
    }

    if ((require_frame) &&
        ((grid.cells[rows - 1][0].x3 >=  grid.threshold) ||
        (grid.cells[rows - 1][cols - 1].x2 >= grid.threshold))) {
      require_frame = false;
    }

    if (require_frame)
      for (var i = 0; i < cols - 1; i++) {
        if ((grid.cells[0][i].x1 >= grid.threshold) ||
            (grid.cells[rows - 1][i].x2 > grid.threshold)) {
          require_frame = false;
          break;
        }
      }

    if (require_frame) {
      if (settings.linearRing)
        polygons.push([ [0, 0], [0, rows], [cols, rows], [cols, 0], [0, 0] ]);
      else
        polygons.push([ [0, 0], [0, rows], [cols, rows], [cols, 0] ]);
    }

    /* finally, start tracing back first polygon(s) */
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        if (typeof grid.cells[j][i] !== 'undefined') {
          var cell = grid.cells[j][i];
          if (cell.cval === 15)
            continue;

          var nextedge = null;

          /* trace paths for all available edges that go through this cell */
          for (e = 0; e < 4; e++) {
            nextedge = valid_entries[e];

            if (typeof cell.edges[nextedge] === 'object') {
              /* start a new, full path */
              var path              = [];
              var ee                = cell.edges[nextedge];
              var enter             = nextedge;
              var x                 = i;
              var y                 = j;
              var finalized         = false;
              var origin            = [ i + ee.path[0][0], j + ee.path[0][1] ];

              /* add start coordinate */
              path.push(origin);

              /* start traceback */
              while (!finalized) {
                cc = grid.cells[y][x];

                if (typeof cc.edges[enter] !== 'object')
                  break;

                ee = cc.edges[enter];

                /* remove edge from cell */
                delete cc.edges[enter];

                /* add last point of edge to path arra, since we extend a polygon */
                point = ee.path[1];
                point[0] += x;
                point[1] += y;
                path.push(point);

                enter = ee.move.enter;
                x     = x + ee.move.x;
                y     = y + ee.move.y;

                /* handle out-of-grid moves */
                if ((typeof grid.cells[y] === 'undefined') ||
                    (typeof grid.cells[y][x] === 'undefined')) {

                  if (!settings.linearRing)
                    break;

                  var dir   = 0;
                  var count = 0;

                  if (x === cols) {
                    x--;
                    dir = 0;  /* move downwards */
                  } else if (x < 0) {
                    x++;
                    dir = 2;  /* move upwards */
                  } else if (y === rows) {
                    y--;
                    dir = 3;  /* move right */
                  } else if (y < 0) {
                    y++;
                    dir = 1;  /* move left */
                  }

                  if ((x === i) && (y === j) && (dir === entry_dir[nextedge])) {
                    finalized = true;
                    enter     = nextedge;
                    break;
                  }

                  while (1) {
                    var found_entry = false;

                    if (count > 4) {
                      console.log("Direction change counter overflow! This should never happen!");
                      break;
                    }

                    cc = grid.cells[y][x];

                    /* check for re-entry */
                    var ve = valid_entries[dir];
                    if (typeof cc.edges[ve] === 'object') {
                      /* found re-entry */
                      ee = cc.edges[ve];
                      path.push(entry_coordinate(x, y, dir, ee.path));
                      enter = ve;
                      found_entry = true;
                      break;
                    }

                    if (found_entry) {
                      break;
                    } else {
                      path.push(skip_coordinate(x, y, dir));

                      x += add_x[dir];
                      y += add_y[dir];

                      /* change direction if we'e moved out of grid again */
                      if ((typeof grid.cells[y] === 'undefined') || (typeof grid.cells[y][x] === 'undefined')) {
                        x -= add_x[dir];
                        y -= add_y[dir];

                        dir = (dir + 1) % 4;
                        count++;
                      }

                      if ((x === i) && (y === j) && (dir === entry_dir[nextedge])) {
                        /* we are back where we started off, so finalize the polygon */
                        finalized = true;
                        enter     = nextedge;
                        break;
                      }
                    }
                  }
                }
              }

              if ((settings.linearRing) &&
                  ((path[path.length - 1][0] !== origin[0]) ||
                  (path[path.length - 1][1] !== origin[1])))
                path.push(origin);

              polygons.push(path);
            }
          }
        }
      }
    }

    return polygons;
  }

  function GetPolygons(grid, settings) {
    var areas = [];
    var rows = grid.rows;
    var cols = grid.cols;
    var polygons = [];

    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        if (typeof grid.cells[j][i] !== 'undefined') {
          var cell = grid.cells[j][i];
          if (cell.cval === 15)
            continue;

          cell.polygons.forEach(function(p) {
            p.forEach(function(pp) {
              pp[0] += i;
              pp[1] += j;
            });

            if (settings.linearRing)
              p.push(p[0]);

            polygons.push(p);
          });
        }
      }
    }

    return polygons;
  }


  return isoContours;

}));
