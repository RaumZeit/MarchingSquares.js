/*!
* MarchingSquaresJS
* version 1.2.3
* https://github.com/RaumZeit/MarchingSquares.js
*
* @license GNU Affero General Public License.
* Copyright (c) 2015-2018 Ronny Lorenz <ronny@tbi.univie.ac.at>
*/


(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.MarchingSquaresJS = global.MarchingSquaresJS || {})));
}(this, (function (exports) { 'use strict';

  /*
   *  Compute the distance of a value 'v' from 'a' through linear interpolation
   *  between the values of 'a' and 'b'
   *
   *  Note, that we assume that 'a' and 'b' have unit distance (i.e. 1)
   */
  function linear(a, b, v) {
    if (a < b)
      return (v - a) / (b - a);

    return (a - v) / (a - b);
  }

  function options() {
    /* Settings common to all implemented algorithms */
    this.successCallback  = null;
    this.verbose          = false;
    this.polygons         = false;
    this.polygons_full    = false;
    this.linearRing       = true;
    this.quadTree         = false;
  }


  /* Compose settings specific to IsoLines algorithm */
  function isoLineOptions(userSettings) {
    var i,
      key,
      val,
      lineOptions,
      optionKeys;

    lineOptions   = new options();
    userSettings  = userSettings ? userSettings : {};
    optionKeys    = Object.keys(lineOptions);

    for(i = 0; i < optionKeys.length; i++) {
      key = optionKeys[i];
      val = userSettings[key];
      if ((typeof val !== 'undefined') && (val !== null))
        lineOptions[key] = val;
    }

    /* restore compatibility */
    lineOptions.polygons_full  = !lineOptions.polygons;

    /* add interpolation functions (not yet user customizable) */
    lineOptions.interpolate   = linear;

    return lineOptions;
  }

  function cell2Polygons(cell, x, y, settings) {
    var polygons = [];

    cell.polygons.forEach(function(p) {
      p.forEach(function(pp) {
        pp[0] += x;
        pp[1] += y;
      });

      if (settings.linearRing)
        p.push(p[0]);

      polygons.push(p);
    });

    return polygons;
  }

  function entry_coordinate(x, y, mode, path) {
    if (mode === 0) { /* down */
      x += 1;
      y += path[0][1];
    } else if (mode === 1) { /* left */
      x += path[0][0];
    } else if (mode === 2) { /* up */
      y += path[0][1];
    } else if (mode === 3) { /* right */
      x += path[0][0];
      y += 1;
    }

    return [ x, y ];
  }


  function skip_coordinate(x, y, mode) {
    if (mode === 0) { /* down */
      x++;
    } else if (mode === 1) ; else if (mode === 2) { /* up */
      y++;
    } else if (mode === 3) { /* right */
      x++;
      y++;
    }

    return [ x, y ];
  }


  function requireLineFrame(data, threshold) {
    var frameRequired,
      cols,
      rows,
      i,
      j;

    frameRequired = true;
    cols          = data[0].length;
    rows          = data.length;

    for (j = 0; j < rows; j++) {
      if ((data[j][0] >= threshold) ||
          (data[j][cols - 1] >= threshold)) {
        frameRequired = false;
        break;
      }
    }

    if ((frameRequired) &&
        ((data[rows - 1][0] >= threshold) ||
        (data[rows - 1][cols - 1] >= threshold))) {
      frameRequired = false;
    }

    if (frameRequired)
      for (i = 0; i < cols - 1; i++) {
        if ((data[0][i] >= threshold) ||
            (data[rows - 1][i] > threshold)) {
          frameRequired = false;
          break;
        }
      }

    return frameRequired;
  }


  function traceLinePaths(data, cellGrid, settings) {
    var nextedge,
      e,
      ee,
      cc,
      path,
      enter,
      x,
      y,
      finalized,
      origin,
      point,
      dir,
      count,
      found_entry,
      ve;

    var polygons = [];
    var rows = data.length - 1;
    var cols = data[0].length - 1;

    /*
     * directions for out-of-grid moves are:
     * 0 ... "down",
     * 1 ... "left",
     * 2 ... "up",
     * 3 ... "right"
     */
    var valid_entries = [ 'right',  /* down */
      'bottom', /* left */
      'left',   /* up */
      'top'     /* right */
    ];
    var add_x         = [ 0, -1, 0, 1 ];
    var add_y         = [ -1, 0, 1, 0 ];
    var entry_dir     =  {
      bottom: 1,
      left: 2,
      top: 3,
      right: 0
    };

    /* first, detect whether we need any outer frame */
    if (requireLineFrame(data, settings.minV, settings.maxV)) {
      if (settings.linearRing)
        polygons.push([ [0, 0], [0, rows], [cols, rows], [cols, 0], [0, 0] ]);
      else
        polygons.push([ [0, 0], [0, rows], [cols, rows], [cols, 0] ]);
    }

    /* finally, start tracing back first polygon(s) */

    cellGrid.forEach(function(a, i) {
      a.forEach(function(cell, j) {
        nextedge = null;

        /* trace paths for all available edges that go through this cell */
        for (e = 0; e < 4; e++) {
          nextedge = valid_entries[e];

          if (typeof cell.edges[nextedge] !== 'object')
            continue;

          /* start a new, full path */
          path              = [];
          ee                = cell.edges[nextedge];
          enter             = nextedge;
          x                 = i;
          y                 = j;
          finalized         = false;
          origin            = [ i + ee.path[0][0], j + ee.path[0][1] ];

          /* add start coordinate */
          path.push(origin);

          /* start traceback */
          while (!finalized) {
            cc = cellGrid[x][y];

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
            if ((typeof cellGrid[x] === 'undefined') ||
                (typeof cellGrid[x][y] === 'undefined')) {

              if (!settings.linearRing)
                break;

              dir   = 0;
              count = 0;

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
                found_entry = false;

                if (count > 4)
                  throw new Error('Direction change counter overflow! This should never happen!');

                cc = cellGrid[x][y];

                /* check for re-entry */
                ve = valid_entries[dir];
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
                  if ((typeof cellGrid[x] === 'undefined') ||
                    (typeof cellGrid[x][y] === 'undefined')) {
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
        } /* end forall entry sites */
      }); /* end foreach i */
    }); /* end foreach j */

    return polygons;
  }

  /* quadTree node constructor */
  function treeNode(data, x, y, dx, dy) {
    var dx_tmp = dx,
      dy_tmp = dy,
      msb_x  = 0,
      msb_y  = 0;

    /* left-bottom corner of current quadrant */
    this.x = x;
    this.y = y;

    /* minimum value in subtree under this node */
    this.lowerBound = null;
    /* maximum value in subtree under this node */
    this.upperBound = null;

    /*
     *  child nodes are layed out in the following way:
     *
     *  (x, y + 1) ---- (x + 1, y + 1)
     *  |             |              |
     *  |      D      |      C       |
     *  |             |              |
     *  |----------------------------|
     *  |             |              |
     *  |      A      |      B       |
     *  |             |              |
     *  (x, y) ------------ (x + 1, y)
     */
    this.childA = null;
    this.childB = null;
    this.childC = null;
    this.childD = null;

    if ((dx === 1) && (dy === 1)) {
      /* do not further subdivision */
      this.lowerBound = Math.min(
        data[y][x],
        data[y][x + 1],
        data[y + 1][x + 1],
        data[y + 1][x]
      );
      this.upperBound = Math.max(
        data[y][x],
        data[y][x + 1],
        data[y + 1][x + 1],
        data[y + 1][x]
      );
    } else {
      /* get most significant bit from dx */
      if (dx > 1) {
        while (dx_tmp !== 0) {
          dx_tmp = dx_tmp >> 1;
          msb_x++;
        }

        if (dx === (1 << (msb_x - 1)))
          msb_x--;

        dx_tmp = 1 << (msb_x - 1);
      }

      /* get most significant bit from dx */
      if (dy > 1) {
        while (dy_tmp !== 0) {
          dy_tmp = dy_tmp >> 1;
          msb_y++;
        }

        if (dy === (1 << (msb_y - 1)))
          msb_y--;

        dy_tmp = 1 << (msb_y - 1);
      }

      this.childA = new treeNode(data, x, y, dx_tmp, dy_tmp);
      this.lowerBound = this.childA.lowerBound;
      this.upperBound = this.childA.upperBound;

      if (dx - dx_tmp > 0) {
        this.childB = new treeNode(data, x + dx_tmp, y, dx - dx_tmp, dy_tmp);
        this.lowerBound = Math.min(this.lowerBound, this.childB.lowerBound);
        this.upperBound = Math.max(this.upperBound, this.childB.upperBound);

        if (dy - dy_tmp > 0) {
          this.childC = new treeNode(data, x + dx_tmp, y + dy_tmp, dx - dx_tmp, dy - dy_tmp);
          this.lowerBound = Math.min(this.lowerBound, this.childC.lowerBound);
          this.upperBound = Math.max(this.upperBound, this.childC.upperBound);
        }
      }

      if (dy - dy_tmp > 0) {
        this.childD = new treeNode(data, x, y + dy_tmp, dx_tmp, dy - dy_tmp);
        this.lowerBound = Math.min(this.lowerBound, this.childD.lowerBound);
        this.upperBound = Math.max(this.upperBound, this.childD.upperBound);
      }
    }
  }


  /**
   *  Retrieve a list of cells within a particular range of values by
   *  recursivly traversing the quad tree to it's leaves.
   *
   *  @param  subsumed  If 'true' include all cells that are completely
   *                    subsumed within the specified range. Otherwise,
   *                    return only cells where at least one corner is
   *                    outside the specified range.
   *
   *  @return   An array of objects 'o' where each object has exactly two
   *            properties: 'o.x' and 'o.y' denoting the left-bottom corner
   *            of the corresponding cell.
   */
  treeNode.prototype.cellsInBand = function(lowerBound, upperBound, subsumed) {
    var cells = [];

    subsumed = (typeof subsumed === 'undefined') ? true : subsumed;

    if ((this.lowerBound > upperBound) || (this.upperBound < lowerBound))
      return cells;

    if (!(this.childA || this.childB || this.childC || this.childD)) {
      if ((subsumed) ||
          (this.lowerBound <= lowerBound) ||
          (this.upperBound >= upperBound)) {
        cells.push({
          x: this.x,
          y: this.y
        });
      }
    } else {
      if (this.childA)
        cells = cells.concat(this.childA.cellsInBand(lowerBound, upperBound, subsumed));

      if (this.childB)
        cells = cells.concat(this.childB.cellsInBand(lowerBound, upperBound, subsumed));

      if (this.childC)
        cells = cells.concat(this.childC.cellsInBand(lowerBound, upperBound, subsumed));

      if (this.childD)
        cells = cells.concat(this.childD.cellsInBand(lowerBound, upperBound, subsumed));
    }

    return cells;
  };


  treeNode.prototype.cellsBelowThreshold = function(threshold, subsumed) {
    var cells = [];

    subsumed = (typeof subsumed === 'undefined') ? true : subsumed;

    if (this.lowerBound > threshold)
      return cells;

    if (!(this.childA || this.childB || this.childC || this.childD)) {
      if ((subsumed) ||
          (this.upperBound >= threshold)) {
        cells.push({
          x: this.x,
          y: this.y
        });
      }
    } else {
      if (this.childA)
        cells = cells.concat(this.childA.cellsBelowThreshold(threshold, subsumed));

      if (this.childB)
        cells = cells.concat(this.childB.cellsBelowThreshold(threshold, subsumed));

      if (this.childC)
        cells = cells.concat(this.childC.cellsBelowThreshold(threshold, subsumed));

      if (this.childD)
        cells = cells.concat(this.childD.cellsBelowThreshold(threshold, subsumed));
    }

    return cells;
  };


  /*
   * Given a scalar field `data` construct a quadTree
   * to efficiently lookup those parts of the scalar
   * field where values are within a particular
   * range of [lowerbound, upperbound] limits.
   */
  function quadTree(data) {
    /* do some input checking */
    if (!data)
      throw new Error('data is required');
    if (!Array.isArray(data) ||
        !Array.isArray(data[0]))
      throw new Error('data must be scalar field, i.e. array of arrays');

    /* create pre-processing object */
    this.data = data;
    /* root node, i.e. entry to the data */
    this.root = new treeNode(data, 0, 0, data[0].length - 1, data.length - 1);
  }

  /*
   * Compute the iso lines for a scalar 2D field given
   * a certain threshold by applying the Marching Squares
   * Algorithm. The function returns a list of path coordinates
   */

  function isoLines(input, threshold, options) {
    var settings,
      i,
      j,
      multiLine = false,
      tree      = null,
      root      = null,
      data      = null,
      cellGrid  = null,
      linePolygons  = null,
      ret           = [];

    /* validation */
    if (!input) throw new Error('data is required');
    if (threshold === undefined || threshold === null) throw new Error('threshold is required');
    if ((!!options) && (typeof options !== 'object')) throw new Error('options must be an object');

    /* process options */
    settings = isoLineOptions(options);

    /* check for input data */
    if (input instanceof quadTree) {
      tree = input;
      root = input.root;
      data = input.data;
    } else if (Array.isArray(input) && Array.isArray(input[0])) {
      data = input;
    } else {
      throw new Error('input is neither array of arrays nor object retrieved from \'quadTree()\'');
    }

    /* check and prepare input threshold(s) */
    if (Array.isArray(threshold)) {
      multiLine = true;

      /* check if all minV are numbers */
      for (i = 0; i < threshold.length; i++)
        if (isNaN(+threshold[i]))
          throw new Error('threshold[' + i + '] is not a number');
    } else {
      if (isNaN(+threshold))
        throw new Error('threshold must be a number or array of numbers');

      threshold = [ threshold ];
    }

    /* create quadTree root node if not already present */
    if ((settings.quadTree) && (!root)) {
      tree = new quadTree(data);
      root = tree.root;
      data = tree.data;
    }

    if (settings.verbose) {
      if(settings.polygons)
        console.log('MarchingSquaresJS-isoLines: returning single lines (polygons) for each grid cell');
      else
        console.log('MarchingSquaresJS-isoLines: returning line paths (polygons) for entire data grid');

      if (multiLine)
        console.log('MarchingSquaresJS-isoLines: multiple lines requested, returning array of line paths instead of lines for a single threshold');
    }

    /* Done with all input validation, now let's start computing stuff */

    /* loop over all threhsold values */
    threshold.forEach(function(t, i) {
      linePolygons = [];

      /* store bounds for current computation in settings object */
      settings.threshold = t;

      if(settings.verbose)
        console.log('MarchingSquaresJS-isoLines: computing iso lines for threshold ' + t);

      if (settings.polygons) {
        /* compose list of polygons for each single cell */
        if (settings.quadTree) {
          /* go through list of cells retrieved from quadTree */
          root
            .cellsBelowThreshold(settings.threshold, true)
            .forEach(function(c) {
              linePolygons  = linePolygons.concat(
                cell2Polygons(
                  prepareCell(data,
                    c.x,
                    c.y,
                    settings),
                  c.x,
                  c.y,
                  settings
                ));
            });
        } else {
          /* go through entire array of input data */
          for (j = 0; j < data.length - 1; ++j) {
            for (i = 0; i < data[0].length - 1; ++i)
              linePolygons  = linePolygons.concat(
                cell2Polygons(
                  prepareCell(data,
                    i,
                    j,
                    settings),
                  i,
                  j,
                  settings
                ));
          }
        }
      } else {
        /* sparse grid of input data cells */
        cellGrid = [];

        /* compose list of polygons for entire input grid */
        if (settings.quadTree) {
          /* collect the cells */
          root
            .cellsBelowThreshold(settings.threshold, settings.linearRing ? true : false)
            .forEach(function(c) {
              if (typeof cellGrid[c.x] === 'undefined')
                cellGrid[c.x] = [];
              cellGrid[c.x][c.y] = prepareCell(data,
                c.x,
                c.y,
                settings);
            });
        } else {
          /* prepare cells */
          for (i = 0; i < data[0].length - 1; ++i) {
            cellGrid[i] = [];
            for (j = 0; j < data.length - 1; ++j) {
              cellGrid[i][j]  = prepareCell(data,
                i,
                j,
                settings);
            }
          }
        }

        linePolygons = traceLinePaths(data, cellGrid, settings);
      }

      /* finally, add polygons to output array */
      if (multiLine)
        ret.push(linePolygons);
      else
        ret = linePolygons;
    });

    if(typeof settings.successCallback === 'function')
      settings.successCallback(ret);

    return ret;
  }

  /*
   * Thats all for the public interface, below follows the actual
   * implementation
   */

  /*
   * ################################
   * Isocontour implementation below
   * ################################
   */

  function prepareCell(grid, x, y, settings) {
    var left,
      right,
      top,
      bottom,
      average,
      cell;

    var cval      = 0;
    var x3        = grid[y + 1][x];
    var x2        = grid[y + 1][x + 1];
    var x1        = grid[y][x + 1];
    var x0        = grid[y][x];
    var threshold = settings.threshold;

    /*
     * Note that missing data within the grid will result
     * in horribly failing to trace full polygon paths
     */
    if(isNaN(x0) || isNaN(x1) || isNaN(x2) || isNaN(x3)) {
      return;
    }

    /*
     * Here we detect the type of the cell
     *
     * x3 ---- x2
     * |      |
     * |      |
     * x0 ---- x1
     *
     * with edge points
     *
     * x0 = (x,y),
     * x1 = (x + 1, y),
     * x2 = (x + 1, y + 1), and
     * x3 = (x, y + 1)
     *
     * and compute the polygon intersections with the edges
     * of the cell. Each edge value may be (i) smaller, or (ii)
     * greater or equal to the iso line threshold. We encode
     * this property using 1 bit of information, where
     *
     * 0 ... below,
     * 1 ... above or equal
     *
     * Then we store the cells value as vector
     *
     * cval = (x0, x1, x2, x3)
     *
     * where x0 is the least significant bit (0th),
     * x1 the 2nd bit, and so on. This essentially
     * enables us to work with a single integer number
     */

    cval |= ((x3 >= threshold) ? 8 : 0);
    cval |= ((x2 >= threshold) ? 4 : 0);
    cval |= ((x1 >= threshold) ? 2 : 0);
    cval |= ((x0 >= threshold) ? 1 : 0);

    /* make sure cval is a number */
    cval = +cval;

    /* compose the cell object */
    cell = {
      cval:         cval,
      polygons:     [],
      edges:        {},
      x0:           x0,
      x1:           x1,
      x2:           x2,
      x3:           x3
    };

    /*
     * Compute interpolated intersections of the polygon(s)
     * with the cell borders and (i) add edges for polygon
     * trace-back, or (ii) a list of small closed polygons
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
      left    = settings.interpolate(x0, x3, threshold);
      bottom  = settings.interpolate(x0, x1, threshold);

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
      bottom  = settings.interpolate(x0, x1, threshold);
      right   = settings.interpolate(x1, x2, threshold);

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
      right = settings.interpolate(x1, x2, threshold);
      top   = settings.interpolate(x3, x2, threshold);

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
      left  = settings.interpolate(x0, x3, threshold);
      top   = settings.interpolate(x3, x2, threshold);

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
      left    = settings.interpolate(x0, x3, threshold);
      bottom  = settings.interpolate(x0, x1, threshold);

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
      bottom  = settings.interpolate(x0, x1, threshold);
      right   = settings.interpolate(x1, x2, threshold);

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
      right = settings.interpolate(x1, x2, threshold);
      top   = settings.interpolate(x3, x2, threshold);

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
      left  = settings.interpolate(x0, x3, threshold);
      top   = settings.interpolate(x3, x2, threshold);

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
      left  = settings.interpolate(x0, x3, threshold);
      right = settings.interpolate(x1, x2, threshold);

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
      bottom  = settings.interpolate(x0, x1, threshold);
      top     = settings.interpolate(x3, x2, threshold);

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
      left  = settings.interpolate(x0, x3, threshold);
      right = settings.interpolate(x1, x2, threshold);

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
      bottom  = settings.interpolate(x0, x1, threshold);
      top     = settings.interpolate(x3, x2, threshold);

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
      left    = settings.interpolate(x0, x3, threshold);
      right   = settings.interpolate(x1, x2, threshold);
      bottom  = settings.interpolate(x0, x1, threshold);
      top     = settings.interpolate(x3, x2, threshold);
      average = (x0 + x1 + x2 + x3) / 4;

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
          };
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
      left    = settings.interpolate(x0, x3, threshold);
      right   = settings.interpolate(x1, x2, threshold);
      bottom  = settings.interpolate(x0, x1, threshold);
      top     = settings.interpolate(x3, x2, threshold);
      average = (x0 + x1 + x2 + x3) / 4;

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

  exports.isoLines = isoLines;
  exports.isoContours = isoLines;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
