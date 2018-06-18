

function extractPolygons(grid, settings) {
  var areas = [];
  var rows = grid.rows;
  var cols = grid.cols;
  var polygons = [];

  for (var j = 0; j < rows; j++) {
    for (var i = 0; i < cols; i++) {
      if (typeof grid.cells[j][i] !== 'undefined') {
        polygons  = polygons.concat(
                      cell2Polygons(
                        grid.cells[j][i],
                        i,
                        j,
                        settings
                      )
        );
      }
    }
  }

  return polygons;
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


function requireFrame(data, lowerBound, upperBound) {
  var frameRequired = true;
  var cols          = data[0].length;
  var rows          = data.length;

  for (var j = 0; j < rows; j++) {
    if ((data[j][0] < lowerBound) ||
        (data[j][0] > upperBound) ||
        (data[j][cols - 1] < lowerBound) ||
        (data[j][cols - 1] > upperBound)) {
      frameRequired = false;
      break;
    }
  }

  if ((frameRequired) &&
      ((data[rows - 1][0] < lowerBound) ||
      (data[rows - 1][0] > upperBound) ||
      (data[rows - 1][cols - 1] < lowerBound) ||
      (data[rows - 1][cols - 1] > upperBound))) {
    frameRequired = false;
  }

  if (frameRequired)
    for (var i = 0; i < cols - 1; i++) {
      if ((data[0][i] < lowerBound) ||
          (data[0][i] > upperBound) ||
          (data[rows - 1][i] < lowerBound) ||
          (data[rows - 1][i] > upperBound)) {
        frameRequired = false;
        break;
      }
    }


  return frameRequired;
}

function traceBandPaths(data, cellGrid, settings) {
  var polygons = [];
  var rows = data.length - 1;
  var cols = data[0].length - 1;

  /*
      directions for out-of-grid moves are:
      0 ... "down",
      1 ... "left",
      2 ... "up",
      3 ... "right"
  */
  var valid_entries = [ ["rt", "rb"], /* down */
                        ["br", "bl"], /* left */
                        ["lb", "lt"], /* up */
                        ["tl", "tr"]  /* right */
                      ];
  var add_x         = [ 0, -1, 0, 1 ];
  var add_y         = [ -1, 0, 1, 0 ];
  var available_starts = [ 'bl', 'lb', 'lt', 'tl', 'tr', 'rt', 'rb', 'br' ];
  var entry_dir     =  { bl: 1, br: 1,
                         lb: 2, lt: 2,
                         tl: 3, tr: 3,
                         rt: 0, rb: 0
                       };

  if (requireFrame(data, settings.minV, settings.maxV)) {
    if (settings.linearRing)
      polygons.push([ [0, 0], [0, rows], [cols, rows], [cols, 0], [0, 0] ]);
    else
      polygons.push([ [0, 0], [0, rows], [cols, rows], [cols, 0] ]);
  }

  /* finally, start tracing back first polygon(s) */
  var keys = Object.keys(cellList);
  var nextedge,
      path,
      ee,
      enter,
      x,
      y,
      finalized,
      origin,
      key,
      cc,
      dir,
      count,
      point;

  cellGrid.forEach(function(a, i) {
    a.forEach(function(cell, j) {

    //if ((cell.cval === 0) || (cell.cval === 85) || (cell.cval === 170))
    //  continue;

    nextedge = null;

    /* trace paths for all available edges that go through this cell */
    for (var e = 0; e < 8; e++) {
      nextedge = available_starts[e];

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
        if ((typeof cellGrid[x] === 'undefined') || (typeof cellGrid[x][y] === 'undefined')) {
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
            var found_entry = false;

            if (count > 4) {
              console.log("Direction change counter overflow! This should never happen!");
              break;
            }

            cc = cellGrid[x][y];

            /* check for re-entry */
            for (var s = 0; s < valid_entries[dir].length; s++) {
              var ve = valid_entries[dir][s];
              if (typeof cc.edges[ve] === 'object') {
                /* found re-entry */
                ee = cc.edges[ve];
                path.push(entry_coordinate(x, y, dir, ee.path));
                enter = ve;
                found_entry = true;
                break;
              }
            }

            if (found_entry) {
              break;
            } else {
              path.push(skip_coordinate(x, y, dir));

              x += add_x[dir];
              y += add_y[dir];

              /* change direction if we'e moved out of grid again */
              if ((typeof cellGrid[x] === 'undefined') || (typeof cellGrid[x][y] === 'undefined')) {
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


function traceLinePaths(grid, settings) {
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
        for (var e = 0; e < 4; e++) {
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
              var cc = grid.cells[y][x];

              if (typeof cc.edges[enter] !== 'object')
                break;

              var ee = cc.edges[enter];

              /* remove edge from cell */
              delete cc.edges[enter];

              /* add last point of edge to path arra, since we extend a polygon */
              var point = ee.path[1];
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


export { extractPolygons, cell2Polygons, traceBandPaths, traceLinePaths };
