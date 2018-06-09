/*!
* @license GNU Affero General Public License.
* Copyright (c) 2015, 2015 Ronny Lorenz <ronny@tbi.univie.ac.at>
* v. 1.2.2
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
    verbose:          false
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

    var ret = ContourGrid2Paths(computeContourGrid(data, threshold));

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

  /* assume that x1 == 1 &&  x0 == 0 */
  function interpolateX(y, y0, y1){
    return (y - y0) / (y1 - y0);
  }

  /* compute the isocontour 4-bit grid */
  function computeContourGrid(data, threshold){
    var rows = data.length - 1;
    var cols = data[0].length - 1;
    var ContourGrid = { rows: rows, cols: cols, cells: [] };

    for(var j = 0; j < rows; ++j){
      ContourGrid.cells[j] = [];
      for(var i = 0; i < cols; ++i){
        /* compose the 4-bit corner representation */
        var cval = 0;

        var tl = data[j+1][i];
        var tr = data[j+1][i+1];
        var br = data[j][i+1];
        var bl = data[j][i];

        if(isNaN(tl) || isNaN(tr) || isNaN(br) || isNaN(bl)){
          continue;
        }
        cval |= ((tl >= threshold) ? 8 : 0);
        cval |= ((tr >= threshold) ? 4 : 0);
        cval |= ((br >= threshold) ? 2 : 0);
        cval |= ((bl >= threshold) ? 1 : 0);

        /* resolve ambiguity for cval == 5 || 10 via averaging */
        var flipped = false;
        if(cval === 5 || cval === 10){
          var average = (tl + tr + br + bl) / 4;
          if(cval === 5 && (average < threshold)){
            cval = 10;
            flipped = true;
          } else if(cval === 10 && (average < threshold)){
            cval = 5;
            flipped = true;
          }
        }

        /* add cell to ContourGrid if it contains edges */
        if(cval != 0 && cval != 15){
          var top, bottom, left, right;
          top = bottom = left = right = 0.5;
          /* interpolate edges of cell */
          if(cval === 1){
            left    = 1 - interpolateX(threshold, tl, bl);
            bottom  = 1 - interpolateX(threshold, br, bl);
          } else if(cval === 2){
            bottom  = interpolateX(threshold, bl, br);
            right   = 1 - interpolateX(threshold, tr, br);
          } else if(cval === 3){
            left    = 1 - interpolateX(threshold, tl, bl);
            right   = 1 - interpolateX(threshold, tr, br);
          } else if(cval === 4){
            top     = interpolateX(threshold, tl, tr);
            right   = interpolateX(threshold, br, tr);
          } else if(cval === 5){
            if (flipped) {
              top     = 1- interpolateX(threshold, tl, tr);
              right   = 1 - interpolateX(threshold, tr, br);
              bottom  = interpolateX(threshold, bl, br);
              left    = interpolateX(threshold, bl, tl);
            } else {
              top     = interpolateX(threshold, tl, tr);
              right   = interpolateX(threshold, br, tr);
              bottom  = 1 - interpolateX(threshold, br, bl);
              left    = 1 - interpolateX(threshold, tl, bl);
            }
          } else if(cval === 6){
            bottom  = interpolateX(threshold, bl, br);
            top     = interpolateX(threshold, tl, tr);
          } else if(cval === 7){
            left    = 1 - interpolateX(threshold, tl, bl);
            top     = interpolateX(threshold, tl, tr);
          } else if(cval === 8){
            left    = interpolateX(threshold, bl, tl);
            top     = 1 - interpolateX(threshold, tr, tl);
          } else if(cval === 9){
            bottom  = 1 - interpolateX(threshold, br, bl);
            top     = 1 - interpolateX(threshold, tr, tl);
          } else if(cval === 10){
            if (flipped) {
              top     = interpolateX(threshold, tl, tr);
              right   = interpolateX(threshold, br, tr);
              bottom  = 1 - interpolateX(threshold, br, bl);
              left    = 1 - interpolateX(threshold, tl, bl);
            } else {
              top     = 1 - interpolateX(threshold, tr, tl);
              right   = 1 - interpolateX(threshold, tr, br);
              bottom  = interpolateX(threshold, bl, br);
              left    = interpolateX(threshold, bl, tl);
            }
          } else if(cval === 11){
            top     = 1 - interpolateX(threshold, tr, tl);
            right   = 1 - interpolateX(threshold, tr, br);
          } else if(cval === 12){
            left    = interpolateX(threshold, bl, tl);
            right   = interpolateX(threshold, br, tr);
          } else if(cval === 13){
            bottom  = 1 - interpolateX(threshold, br, bl);
            right   = interpolateX(threshold, br, tr);
          } else if(cval === 14){
            left    = interpolateX(threshold, bl, tl);
            bottom  = interpolateX(threshold, bl, br);
          } else {
            console.log("MarchingSquaresJS-isoContours: Illegal cval detected: " + cval);
          }
          ContourGrid.cells[j][i] = {
                                      cval:     cval,
                                      flipped:  flipped,
                                      top:      top,
                                      right:    right,
                                      bottom:   bottom,
                                      left:     left
                                    };
        }

      }
    }

    return ContourGrid;
  }

  function isSaddle(cell){
    return cell.cval === 5 || cell.cval === 10;
  }

  function isTrivial(cell){
    return cell.cval === 0 || cell.cval === 15;
  }

  function clearCell(cell){
    if((!isTrivial(cell)) && (cell.cval !== 5) && (cell.cval !== 10)){
      cell.cval = 15;
    }
  }

  function getXY(cell, edge){
    if(edge === "top"){
      return [cell.top, 1.0];
    } else if(edge === "bottom"){
      return [cell.bottom, 0.0];
    } else if(edge === "right"){
      return [1.0, cell.right];
    } else if(edge === "left"){
      return [0.0, cell.left];
    }
  }

  function ContourGrid2Paths(grid){
    var paths = [];
    var path_idx = 0;
    var rows = grid.rows;
    var cols = grid.cols;
    var epsilon = 1e-7;

    grid.cells.forEach(function(g, j){
      g.forEach(function(gg, i){
        if((typeof gg !== 'undefined') && (!isSaddle(gg)) && (!isTrivial(gg))){
          var p = tracePath(grid.cells, j, i);
          paths[path_idx++] = p.path;
        }
      });
    });

    return paths;
  }

  /*
    construct consecutive line segments from starting cell by
    walking arround the enclosed area clock-wise
   */
  function tracePath(grid, j, i){
    var maxj = grid.length;
    var p = [];
    var dxContour = [ 0,  /* 0  a.k.a. 0000 */
                      -1, /* 1  a.k.a. 0001 */
                      0,  /* 2  a.k.a. 0010 */
                      -1, /* 3  a.k.a. 0011 */
                      1,  /* 4  a.k.a. 0100 */
                      0,  /* 5  a.k.a. 0101 */
                      0,  /* 6  a.k.a. 0110 */
                      -1, /* 7  a.k.a. 0111 */
                      0,  /* 8  a.k.a. 1000 */
                      0,  /* 9  a.k.a. 1001 */
                      0,  /* 10 a.k.a. 1010 */
                      0,  /* 11 a.k.a. 1011 */
                      1,  /* 12 a.k.a. 1100 */
                      1,  /* 13 a.k.a. 1101 */
                      0,  /* 14 a.k.a. 1110 */
                      0   /* 15 a.k.a. 1111 */
    ];
    var dyContour = [ 0,  /* 0  a.k.a. 0000 */
                      0,  /* 1  a.k.a. 0001 */
                      -1, /* 2  a.k.a. 0010 */
                      0,  /* 3  a.k.a. 0011 */
                      0,  /* 4  a.k.a. 0100 */
                      0,  /* 5  a.k.a. 0101 */
                      -1, /* 6  a.k.a. 0110 */
                      0,  /* 7  a.k.a. 0111 */
                      1,  /* 8  a.k.a. 1000 */
                      1,  /* 9  a.k.a. 1001 */
                      0,  /* 10 a.k.a. 1010 */
                      1,  /* 11 a.k.a. 1011 */
                      0,  /* 12 a.k.a. 1100 */
                      0,  /* 13 a.k.a. 1101 */
                      -1, /* 14 a.k.a. 1110 */
                      0   /* 15 a.k.a. 1111 */
    ];
    var dx, dy;
    var startEdge = [ "none",   /* 0  a.k.a. 0000 */
                      "bottom", /* 1  a.k.a. 0001 */
                      "right",  /* 2  a.k.a. 0010 */
                      "right",  /* 3  a.k.a. 0011 */
                      "top",    /* 4  a.k.a. 0100 */
                      "none",   /* 5  a.k.a. 0101 */
                      "top",    /* 6  a.k.a. 0110 */
                      "top",    /* 7  a.k.a. 0111 */
                      "left",   /* 8  a.k.a. 1000 */
                      "bottom", /* 9  a.k.a. 1001 */
                      "none",   /* 10 a.k.a. 1010 */
                      "right",  /* 11 a.k.a. 1011 */
                      "left",   /* 12 a.k.a. 1100 */
                      "bottom", /* 13 a.k.a. 1101 */
                      "left",   /* 14 a.k.a. 1110 */
                      "none"    /* 15 a.k.a. 1111 */
    ];
    var nextEdge  = [ "none",   /* 0  a.k.a. 0000 */
                      "left",   /* 1  a.k.a. 0001 */
                      "bottom", /* 2  a.k.a. 0010 */
                      "left",   /* 3  a.k.a. 0011 */
                      "right",  /* 4  a.k.a. 0100 */
                      "none",   /* 5  a.k.a. 0101 */
                      "bottom", /* 6  a.k.a. 0110 */
                      "left",   /* 7  a.k.a. 0111 */
                      "top",    /* 8  a.k.a. 1000 */
                      "top",    /* 9  a.k.a. 1001 */
                      "none",   /* 10 a.k.a. 1010 */
                      "top",    /* 11 a.k.a. 1011 */
                      "right",  /* 12 a.k.a. 1100 */
                      "right",  /* 13 a.k.a. 1101 */
                      "bottom", /* 14 a.k.a. 1110 */
                      "none"    /* 15 a.k.a. 1111 */
    ];
    var edge;

    var startCell   = grid[j][i];
    var currentCell = grid[j][i];

    var cval = currentCell.cval;
    var edge = startEdge[cval];

    var pt = getXY(currentCell, edge);

    /* push initial segment */
    p.push([i + pt[0], j + pt[1]]);
    edge = nextEdge[cval];
    pt = getXY(currentCell, edge);
    p.push([i + pt[0], j + pt[1]]);
    clearCell(currentCell);

    /* now walk arround the enclosed area in clockwise-direction */
    var k = i + dxContour[cval];
    var l = j + dyContour[cval];
    var last_dx   = dxContour[cval];
    var last_dy   = dyContour[cval];

    while((k >= 0) && (l >= 0) && (l < maxj) && ((k != i) || (l != j))){
      currentCell = grid[l][k];
      if(typeof currentCell === 'undefined'){ /* path ends here */
        //console.log(k + " " + l + " is undefined, stopping path!");
        break;
      }
      cval = currentCell.cval;
      if((cval === 0) || (cval === 15)){
        return { path: p, info: "mergeable" };
      }

      if((cval === 5) || (cval === 10)){
        /* select upper or lower band, depending on previous cells cval */
        if(cval === 5){
          if(currentCell.flipped){ /* this is actually a flipped case 10 */
            if(last_dx === 1){
              edge  = "top";
              dx    = 0;
              dy    = 1;
            } else {
              edge  = "bottom";
              dx    = 0;
              dy    = -1;
            }
          } else { /* real case 5 */
            if(last_dy === -1){
              edge  = "left";
              dx    = -1;
              dy    = 0;
            } else {
              edge  = "right";
              dx    = 1;
              dy    = 0;
            }
          }
        } else if(cval === 10){
          if(currentCell.flipped){ /* this is actually a flipped case 5 */
            if(last_dy === -1){
              edge  = "right";
              dx    = 1;
              dy    = 0;
            } else {
              edge  = "left";
              dx    = -1;
              dy    = 0;
            }
          } else {  /* real case 10 */
            if(last_dx === -1){
              edge  = "top";
              dx    = 0;
              dy    = 1;
            } else {
              edge  = "bottom";
              dx    = 0;
              dy    = -1;
            }
          }
        }
      } else {
        edge  = nextEdge[cval];
        dx    = dxContour[cval];
        dy    = dyContour[cval];
      }

      pt = getXY(currentCell, edge);
      p.push([k + pt[0], l + pt[1]]);
      clearCell(currentCell);
      k += dx;
      l += dy;
      last_dx   = dx;
      last_dy   = dy;
    }

    return { path: p, info: "closed" };
  }

  return isoContours;

}));
