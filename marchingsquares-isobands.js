/*!
* @license GNU Affero General Public License.
* Copyright (c) 2015, 2015 Ronny Lorenz <ronny@tbi.univie.ac.at>
* v. 1.2.1
* https://github.com/RaumZeit/MarchingSquares.js
*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function() { return { isoBands : factory() }; })
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = { isoBands : factory() };
    } else {
        // Browser globals (root is window)
        root.MarchingSquaresJS = {
                                    isoBands : factory(),
                                    isoContours : (root.MarchingSquaresJS) ? root.MarchingSquaresJS.isoContours : null
                                 };
    }
}(this, function () {

  var defaultSettings = {
    successCallback:  null,
    verbose:          false,
    polygons:         false
  };
    
  var settings = {};
    
    /*
      Compute isobands(s) of a scalar 2D field given a certain
      threshold and a bandwidth by applying the Marching Squares
      Algorithm. The function returns a list of path coordinates
      either for individual polygons within each grid cell, or the
      outline of connected polygons.
    */
  function isoBands(data, minV, bandwidth, options){
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
      console.log("MarchingSquaresJS-isoBands: computing isobands for [" + minV + ":" + (minV + bandwidth) + "]");

    var grid = computeBandGrid(data, minV, bandwidth);

    var ret;
    if(settings.polygons){
      if (settings.verbose)
        console.log("MarchingSquaresJS-isoBands: returning single polygons for each grid cell");
      ret = GetPolygons(grid);
    } else {
      if (settings.verbose)
        console.log("MarchingSquaresJS-isoBands: returning polygon paths for entire data grid");
      ret = TracePaths(grid);
    }

    if(typeof settings.successCallback === 'function')
      settings.successCallback(ret);

    return ret;
  }

  /*
    Thats all for the public interface, below follows the actual
    implementation
  */

  /* Some private variables */
  var Node0 = 64,
      Node1 = 16,
      Node2 = 4,
      Node3 = 1;

  /*  For isoBands, each square is defined by the three states
      of its corner points. However, since computers use power-2
      values, we use 2bits per trit, i.e.:

      00 ... below minV
      01 ... between minV and maxV
      10 ... above maxV

      Hence we map the 4-trit configurations as follows:

      0000 => 0
      0001 => 1
      0002 => 2
      0010 => 4
      0011 => 5
      0012 => 6
      0020 => 8
      0021 => 9
      0022 => 10
      0100 => 16
      0101 => 17
      0102 => 18
      0110 => 20
      0111 => 21
      0112 => 22
      0120 => 24
      0121 => 25
      0122 => 26
      0200 => 32
      0201 => 33
      0202 => 34
      0210 => 36
      0211 => 37
      0212 => 38
      0220 => 40
      0221 => 41
      0222 => 42
      1000 => 64
      1001 => 65
      1002 => 66
      1010 => 68
      1011 => 69
      1012 => 70
      1020 => 72
      1021 => 73
      1022 => 74
      1100 => 80
      1101 => 81
      1102 => 82
      1110 => 84
      1111 => 85
      1112 => 86
      1120 => 88
      1121 => 89
      1122 => 90
      1200 => 96
      1201 => 97
      1202 => 98
      1210 => 100
      1211 => 101
      1212 => 102
      1220 => 104
      1221 => 105
      1222 => 106
      2000 => 128
      2001 => 129
      2002 => 130
      2010 => 132
      2011 => 133
      2012 => 134
      2020 => 136
      2021 => 137
      2022 => 138
      2100 => 144
      2101 => 145
      2102 => 146
      2110 => 148
      2111 => 149
      2112 => 150
      2120 => 152
      2121 => 153
      2122 => 154
      2200 => 160
      2201 => 161
      2202 => 162
      2210 => 164
      2211 => 165
      2212 => 166
      2220 => 168
      2221 => 169
      2222 => 170
  */

  /*
  ####################################
  Some small helper functions
  ####################################
  */

  function computeCenterAverage(bl, br, tr, tl, minV, maxV) {
    var average = (tl + tr + br + bl) / 4;

    if (average > maxV)
      return 2; /* above isoband limits */

    if (average < minV)
      return 0; /* below isoband limits */

    return 1; /* within isoband limits */
  }

  /*
      lookup table to generate polygon paths or edges required to
      trace the full polygon(s)
  */
  var shapeCoordinates = {
    square:       function(cell, x0, x1, x2, x3, opt) {
                    if (opt.polygons)
                      cell.polygons.push([ [0,0], [0, 1], [1, 1], [1, 0] ]);
                  },

    triangle_bl:  function(cell, x0, x1, x2, x3, opt) {
                    var bottomleft = opt.interpolate(x0, x1, opt);
                    var leftbottom = opt.interpolate(x0, x3, opt);

                    if (opt.polygons_full) {
                      cell.edges.lb = function() {
                        return {
                          path: [ [0, leftbottom], [bottomleft, 0] ],
                          move: {
                            x:      0,
                            y:      -1,
                            enter:  'tl'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [0, leftbottom], [bottomleft, 0], [0, 0] ]);
                  },

    triangle_br:  function(cell, x0, x1, x2, x3, opt) {
                    var bottomright = opt.interpolate(x0, x1, opt);
                    var rightbottom = opt.interpolate(x1, x2, opt);

                    if (opt.polygons_full) {
                      cell.edges.br = function() {
                        return {
                          path: [ [bottomright, 0], [1, rightbottom] ],
                          move: {
                            x:      1,
                            y:      0,
                            enter:  'lb'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [bottomright, 0], [1, rightbottom], [1, 0] ]);
                  },

    triangle_tr:  function(cell, x0, x1, x2, x3, opt) {
                    var righttop = opt.interpolate(x1, x2, opt);
                    var topright = opt.interpolate(x3, x2, opt);

                    if (opt.polygons_full) {
                      cell.edges.rt = function() {
                        return {
                          path: [ [1, righttop], [topright, 1] ],
                          move: {
                            x:      0,
                            y:      1,
                            enter:  'br'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [1, righttop], [topright, 1], [1, 1] ]);
                  },

    triangle_tl:  function(cell, x0, x1, x2, x3, opt) {
                    var topleft = opt.interpolate(x3, x2, opt);
                    var lefttop = opt.interpolate(x0, x3, opt);

                    if (opt.polygons_full) {
                      cell.edges.tl = function() {
                        return {
                          path: [ [topleft, 1], [0, lefttop] ],
                          move: {
                            x:      -1,
                            y:      0,
                            enter:  'rt'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [0, lefttop], [0, 1], [topleft, 1] ]);
                  },

    tetragon_t:   function(cell, x0, x1, x2, x3, opt) {
                    var righttop  = opt.interpolate(x1, x2, opt);
                    var lefttop   = opt.interpolate(x0, x3, opt);

                    if (opt.polygons_full) {
                      cell.edges.rt = function() {
                        return {
                          path: [ [1, righttop], [0, lefttop] ],
                          move: {
                            x:      -1,
                            y:      0,
                            enter:  'rt'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [0, lefttop], [0, 1], [1, 1], [1, righttop] ]);
                  },

    tetragon_r:   function(cell, x0, x1, x2, x3, opt) {
                    var bottomright = opt.interpolate(x0, x1, opt);
                    var topright    = opt.interpolate(x3, x2, opt);
                    if (opt.polygons_full) {
                      cell.edges.br = function() {
                        return {
                          path: [ [bottomright, 0], [topright, 1] ],
                          move: {
                            x:      0,
                            y:      1,
                            enter:  'br'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [bottomright, 0], [topright, 1], [1, 1], [1, 0] ]);
                  },

    tetragon_b:   function(cell, x0, x1, x2, x3, opt) {
                    var leftbottom  = opt.interpolate(x0, x3, opt);
                    var rightbottom = opt.interpolate(x1, x2, opt);

                    if (opt.polygons_full) {
                      cell.edges.lb = function() {
                        return {
                          path: [ [0, leftbottom], [1, rightbottom] ],
                          move: {
                            x:      1,
                            y:      0,
                            enter:  'lb'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [0, 0], [0, leftbottom], [1, rightbottom], [1, 0] ]);
                  },

    tetragon_l:   function(cell, x0, x1, x2, x3, opt) {
                    var topleft     = opt.interpolate(x3, x2, opt);
                    var bottomleft  = opt.interpolate(x0, x1, opt);

                    if (opt.polygons_full) {
                      cell.edges.tl = function() {
                        return {
                          path: [ [topleft, 1], [bottomleft, 0] ],
                          move: {
                            x:      0,
                            y:      -1,
                            enter:  'tl'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [0, 0], [0, 1], [topleft, 1], [bottomleft, 0] ]);
                  },

    tetragon_bl:  function(cell, x0, x1, x2, x3, opt) {
                    var bottomleft  = opt.interpolate_a(x0, x1, opt);
                    var bottomright = opt.interpolate_b(x0, x1, opt);
                    var leftbottom  = opt.interpolate_a(x0, x3, opt);
                    var lefttop     = opt.interpolate_b(x0, x3, opt);

                    if (opt.polygons_full) {
                      cell.edges.bl = function() {
                        return {
                          path: [ [bottomleft, 0], [0, leftbottom] ],
                          move: {
                            x:      -1,
                            y:      0,
                            enter:  'rb'
                          }
                        };
                      };
                      cell.edges.lt = function() {
                        return {
                          path: [ [0, lefttop], [bottomright, 0] ],
                          move: {
                            x:      0,
                            y:      -1,
                            enter:  'tr'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [bottomleft, 0], [0, leftbottom], [0, lefttop], [bottomright, 0] ]);
                  },

    tetragon_br:  function(cell, x0, x1, x2, x3, opt) {
                    var bottomleft  = opt.interpolate_a(x0, x1, opt);
                    var bottomright = opt.interpolate_b(x0, x1, opt);
                    var rightbottom = opt.interpolate_a(x1, x2, opt);
                    var righttop    = opt.interpolate_b(x1, x2, opt);

                    if (opt.polygons_full) {
                      cell.edges.bl = function() {
                        return {
                          path: [ [bottomleft, 0], [1, righttop] ],
                          move: {
                            x: 1,
                            y: 0,
                            enter: 'lt'
                          }
                        };
                      };
                      cell.edges.rb = function() {
                        return {
                          path: [ [1, rightbottom], [bottomright, 0] ],
                          move: {
                            x: 0,
                            y: -1,
                            enter: 'tr'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [bottomleft, 0], [1, righttop], [1, rightbottom], [bottomright, 0] ]);
                  },

    tetragon_tr:  function(cell, x0, x1, x2, x3, opt) {
                    var topleft     = opt.interpolate_a(x3, x2, opt);
                    var topright    = opt.interpolate_b(x3, x2, opt);
                    var righttop    = opt.interpolate_b(x1, x2, opt);
                    var rightbottom = opt.interpolate_a(x1, x2, opt);

                    if (opt.polygons_full) {
                      cell.edges.rb = function() {
                        return {
                          path: [ [1, rightbottom], [topleft, 1] ],
                          move: {
                            x: 0,
                            y: 1,
                            enter: 'bl'
                          }
                        };
                      };
                      cell.edges.tr = function() {
                        return {
                          path: [ [topright, 1], [1, righttop] ],
                          move: {
                            x: 1,
                            y: 0,
                            enter: 'lt'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [1, rightbottom], [topleft, 1], [topright, 1], [1, righttop] ]);
                  },

    tetragon_tl:  function(cell, x0, x1, x2, x3, opt) {
                    var topleft     = opt.interpolate_a(x3, x2, opt);
                    var topright    = opt.interpolate_b(x3, x2, opt);
                    var lefttop     = opt.interpolate_b(x0, x3, opt);
                    var leftbottom  = opt.interpolate_a(x0, x3, opt);

                    if (opt.polygons_full) {
                      cell.edges.tr = function() {
                        return {
                          path: [ [topright, 1], [0, leftbottom] ],
                          move: {
                            x:      -1,
                            y:      0,
                            enter:  'rb'
                          }
                        };
                      };
                      cell.edges.lt = function() {
                        return {
                          path: [ [0, lefttop], [topleft, 1] ],
                          move: {
                            x:      0,
                            y:      1,
                            enter:  'bl'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [topright, 1], [0, leftbottom], [0, lefttop], [topleft, 1] ]);
                  },

    tetragon_lr:  function(cell, x0, x1, x2, x3, opt) {
                    var leftbottom  = opt.interpolate_a(x0, x3, opt);
                    var lefttop     = opt.interpolate_b(x0, x3, opt);
                    var righttop    = opt.interpolate_b(x1, x2, opt);
                    var rightbottom = opt.interpolate_a(x1, x2, opt);

                    if (opt.polygons_full) {
                      cell.edges.lt = function() {
                        return {
                          path: [ [0, lefttop], [1, righttop] ],
                          move: {
                            x:      1,
                            y:      0,
                            enter:  'lt'
                          }
                        };
                      };
                      cell.edges.rb = function() {
                        return {
                          path: [ [1, rightbottom], [0, leftbottom] ],
                          move: {
                            x:      -1,
                            y:      0,
                            enter:  'rb'
                          }
                        };
                      }
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [0, leftbottom], [0, lefttop], [1, righttop], [1, rightbottom] ]);
                  },

    tetragon_tb:  function(cell, x0, x1, x2, x3, opt) {
                    var topleft     = opt.interpolate_a(x3, x2, opt);
                    var topright    = opt.interpolate_b(x3, x2, opt);
                    var bottomright = opt.interpolate_b(x0, x1, opt);
                    var bottomleft  = opt.interpolate_a(x0, x1, opt);

                    if (opt.polygons_full) {
                      cell.edges.tr = function() {
                        return {
                          path: [ [topright, 1], [bottomright, 0] ],
                          move: {
                            x:      0,
                            y:      -1,
                            enter:  'tr'
                          }
                        };
                      };
                      cell.edges.bl = function() {
                        return {
                          path: [ [bottomleft, 0], [topleft, 1] ],
                          move: {
                            x:      0,
                            y:      1,
                            enter:  'bl'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [bottomleft, 0], [topleft, 1], [topright, 1], [bottomright, 0] ]);
                  },

    pentagon_tr:  function(cell, x0, x1, x2, x3, opt) {
                    var topleft     = opt.interpolate(x3, x2, opt);
                    var rightbottom = opt.interpolate(x1, x2, opt);

                    if (opt.polygons_full) {
                      cell.edges.tl = function() {
                        return {
                          path: [[topleft, 1], [1, rightbottom]],
                          move: {
                            x:      1,
                            y:      0,
                            enter:  'lb'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [0, 0], [0, 1], [topleft, 1], [1, rightbottom], [1, 0] ]);
                  },

    pentagon_tl:  function(cell, x0, x1, x2, x3, opt) {
                    var leftbottom  = opt.interpolate(x0, x3, opt);
                    var topright    = opt.interpolate(x3, x2, opt);

                    if (opt.polygons_full) {
                      cell.edges.lb = function() {
                        return {
                          path: [ [0, leftbottom], [topright, 1] ],
                          move: {
                            x:      0,
                            y:      1,
                            enter:  'br'
                          }
                        };
                      }
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [0, 0], [0, leftbottom], [topright, 1], [1, 1], [1, 0] ]);
                  },

    pentagon_br:  function(cell, x0, x1, x2, x3, opt) {
                    var bottomleft  = opt.interpolate(x0, x1, opt);
                    var righttop    = opt.interpolate(x1, x2, opt);

                    if (opt.polygons_full) {
                      cell.edges.rt = function() {
                        return {
                          path: [ [1, righttop], [bottomleft, 0] ],
                          move: {
                            x:      0,
                            y:      -1,
                            enter:  'tl'
                          }
                        };
                      };
                    }
                    if (opt.polygons)
                      cell.polygons.push([ [0, 0], [0, 1], [1, 1], [1, righttop], [bottomleft, 0] ]);
                  },

    pentagon_bl:  function(cell, x0, x1, x2, x3, opt) {
                    var lefttop     = opt.interpolate(x0, x3, opt);
                    var bottomright = opt.interpolate(x0, x1, opt);

                    if (opt.polygons_full) {
                      cell.edges.br = function() {
                        return {
                          path: [ [bottomright, 0], [0, lefttop] ],
                          move: {
                            x:      -1,
                            y:      0,
                            enter:  'rt'
                          }
                        };
                      };
                    }

                    if (opt.polygons)
                      cell.polygons.push([ [0, lefttop], [0, 1], [1, 1], [1, 0], [bottomright, 0] ]);
                  },

    pentagon_tr_rl: function(cell, x0, x1, x2, x3, opt) {
                      var lefttop     = opt.interpolate(x0, x3, opt);
                      var topleft     = opt.interpolate(x3, x2, opt);
                      var righttop    = opt.interpolate_b(x1, x2, opt);
                      var rightbottom = opt.interpolate_a(x1, x2, opt);

                      if (opt.polygons_full) {
                        cell.edges.tl = function() {
                          return {
                            path: [ [topleft, 1], [1, righttop] ],
                            move: {
                              x:      1,
                              y:      0,
                              enter:  'lt'
                            }
                          };
                        };
                        cell.edges.rb = function() {
                          return {
                            path: [ [1, rightbottom], [0, lefttop] ],
                            move: {
                              x:      -1,
                              y:      0,
                              enter:  'rt'
                            }
                          };
                        };
                      }

                      if (opt.polygons)
                        cell.polygons.push([ [0, lefttop], [0, 1], [topleft, 1], [1, righttop], [1, rightbottom] ]);
                    },

    pentagon_rb_bt: function(cell, x0, x1, x2, x3, opt) {
                      var righttop    = opt.interpolate(x1, x2, opt);
                      var bottomright = opt.interpolate_b(x0, x1, opt);
                      var bottomleft  = opt.interpolate_a(x0, x1, opt);
                      var topright    = opt.interpolate(x3, x2, opt);

                      if (opt.polygons_full) {
                        cell.edges.rt = function() {
                          return {
                            path: [ [1, righttop], [bottomright, 0] ],
                            move: {
                              x:      0,
                              y:      -1,
                              enter:  'tr'
                            }
                          };
                        };
                        cell.edges.bl = function() {
                          return {
                            path: [ [bottomleft, 0], [topright, 1] ],
                            move: {
                              x:      0,
                              y:      1,
                              enter:  'br'
                            }
                          };
                        };
                      }

                      if (opt.polygons)
                        cell.polygons.push([ [topright, 1], [1, 1], [1, righttop], [bottomright, 0], [bottomleft, 0] ]);
                    },

    pentagon_bl_lr: function(cell, x0, x1, x2, x3, opt) {
                      var bottomright = opt.interpolate(x0, x1, opt);
                      var leftbottom  = opt.interpolate_a(x0, x3, opt);
                      var lefttop     = opt.interpolate_b(x0, x3, opt);
                      var rightbottom = opt.interpolate(x1, x2, opt);

                      if (opt.polygons_full) {
                        cell.edges.br = function() {
                          return {
                            path: [ [bottomright, 0], [0, leftbottom] ],
                            move: {
                              x:      -1,
                              y:      0,
                              enter:  'rb'
                            }
                          };
                        };
                        cell.edges.lt = function() {
                          return {
                            path: [ [0, lefttop], [1, rightbottom] ],
                            move: {
                              x:      1,
                              y:      0,
                              enter:  'lb'
                            }
                          };
                        };
                      }

                      if (opt.polygons)
                        cell.polygons.push([ [bottomright, 0], [0, leftbottom], [0, lefttop], [1, rightbottom], [1, 0] ]);
                    },

    pentagon_lt_tb: function(cell, x0, x1, x2, x3, opt) {
                      var leftbottom  = opt.interpolate(x0, x3, opt);
                      var topleft     = opt.interpolate_a(x3, x2, opt);
                      var topright    = opt.interpolate_b(x3, x2, opt);
                      var bottomleft  = opt.interpolate(x0, x1, opt);

                      if (opt.polygons_full) {
                        cell.edges.lb = function() {
                          return {
                            path: [ [0, leftbottom], [topleft, 1] ],
                            move: {
                              x:      0,
                              y:      1,
                              enter:  'bl'
                            }
                          };
                        };
                        cell.edges.tr = function() {
                          return {
                            path: [ [topright, 1], [bottomleft, 0] ],
                            move: {
                              x:      0,
                              y:      -1,
                              enter:  'tl'
                            }
                          };
                        };
                      }

                      if (opt.polygons)
                        cell.polygons.push([ [0, 0], [0, leftbottom], [topleft, 1], [topright, 1], [bottomleft, 0] ]);
                    },

    pentagon_bl_tb: function(cell, x0, x1, x2, x3, opt) {
                      var lefttop     = opt.interpolate(x0, x3, opt);
                      var topleft     = opt.interpolate(x3, x2, opt);
                      var bottomright = opt.interpolate_b(x0, x1, opt);
                      var bottomleft  = opt.interpolate_a(x0, x1, opt);

                      if (opt.polygons_full) {
                        cell.edges.bl = function() {
                          return {
                            path: [ [bottomleft, 0], [0, lefttop] ],
                            move: {
                              x:      -1,
                              y:      0,
                              enter:  'rt'
                            }
                          };
                        };
                        cell.edges.tl = function() {
                          return {
                            path: [ [ topleft, 1], [bottomright, 0] ],
                            move: {
                              x:      0,
                              y:      -1,
                              enter:  'tr'
                            }
                          };
                        };
                      }

                      if (opt.polygons)
                        cell.polygons.push([ [0, lefttop], [0, 1], [topleft, 1], [bottomright, 0], [bottomleft, 0] ]);
                    },

    pentagon_lt_rl: function(cell, x0, x1, x2, x3, opt) {
                      var leftbottom  = opt.interpolate_a(x0, x3, opt);
                      var lefttop     = opt.interpolate_b(x0, x3, opt);
                      var topright    = opt.interpolate(x3, x2, opt);
                      var righttop    = opt.interpolate(x1, x3, opt);

                      if (opt.polygons_full) {
                        cell.edges.lt = function() {
                          return {
                            path: [ [0, lefttop], [topright, 1] ],
                            move: {
                              x:      0,
                              y:      1,
                              enter:  'br'
                            }
                          };
                        };
                        cell.edges.rt = function() {
                          return {
                            path: [ [1, righttop], [0, leftbottom] ],
                            move: {
                              x:      -1,
                              y:      0,
                              enter:  'rb'
                            }
                          };
                        };
                      }

                      if (opt.polygons)
                        cell.polygons.push([ [0, leftbottom], [0, lefttop], [topright, 1], [1, 1], [1, righttop] ]);
                    },

    pentagon_tr_bt: function(cell, x0, x1, x2, x3, opt) {
                      var topleft     = opt.interpolate_a(x3, x2, opt);
                      var topright    = opt.interpolate_b(x3, x2, opt);
                      var rightbottom = opt.interpolate(x1, x2, opt);
                      var bottomright = opt.interpolate(x0, x1, opt);

                      if (opt.polygons_full) {
                        cell.edges.br = function() {
                          return {
                            path: [ [bottomright, 0], [topleft, 1] ],
                            move: {
                              x:      0,
                              y:      1,
                              enter:  'bl'
                            }
                          };
                        };
                        cell.edges.tr = function() {
                          return {
                            path: [ [topright, 1], [1, rightbottom] ],
                            move: {
                              x:      1,
                              y:      0,
                              enter:  'lb'
                            }
                          };
                        };
                      }

                      if (opt.polygons)
                        cell.polygons.push([ [topleft, 1], [topright, 1], [1, rightbottom], [1, 0], [bottomright, 0] ]);
                    },

    pentagon_rb_lr: function(cell, x0, x1, x2, x3, opt) {
                      var leftbottom  = opt.interpolate(x0, x3, opt);
                      var righttop    = opt.interpolate_b(x1, x2, opt);
                      var rightbottom = opt.interpolate_a(x1, x2, opt);
                      var bottomleft  = opt.interpolate(x0, x1, opt);

                      if (opt.polygons_full) {
                        cell.edges.lb = function() {
                          return {
                            path: [ [0, leftbottom], [1, righttop] ],
                            move: {
                              x:      1,
                              y:      0,
                              enter:  'lt'
                            }
                          };
                        };
                        cell.edges.rb = function() {
                          return {
                            path: [ [1, rightbottom], [bottomleft, 0] ],
                            move: {
                              x:      0,
                              y:      -1,
                              enter:  'tl'
                            }
                          };
                        };
                      }
                      if (opt.polygons)
                        cell.polygons.push([ [0, 0], [0, leftbottom], [1, righttop], [1, rightbottom], [bottomleft, 0] ]);
                    },

      hexagon_lt_tr:  function(cell, x0, x1, x2, x3, opt) {
                        var leftbottom  = opt.interpolate(x0, x3, opt);
                        var topleft     = opt.interpolate_a(x3, x2, opt);
                        var topright    = opt.interpolate_b(x3, x2, opt);
                        var rightbottom = opt.interpolate(x1, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.lb = function() {
                            return {
                              path: [ [0, leftbottom], [topleft, 1] ],
                              move: {
                                x:      0,
                                y:      1,
                                enter:  'bl'
                              }
                            };
                          };
                          cell.edges.tr = function() {
                            return {
                              path: [ [topright, 1], [1, rightbottom] ],
                              move: {
                                x:      1,
                                y:      0,
                                enter:  'lb'
                              }
                            };
                          };
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [0, 0], [0, leftbottom], [topleft, 1], [topright, 1], [1, rightbottom], [1, 0] ]);
                      },

      hexagon_bl_lt:  function(cell, x0, x1, x2, x3, opt) {
                        var bottomright = opt.interpolate(x0, x1, opt);
                        var leftbottom  = opt.interpolate_a(x0, x3, opt);
                        var lefttop     = opt.interpolate_b(x0, x3, opt);
                        var topright    = opt.interpolate(x3, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.br = function() {
                            return {
                              path: [ [bottomright, 0], [0, leftbottom] ],
                              move: {
                                x:      -1,
                                y:      0,
                                enter:  'rb'
                              }
                            };
                          };
                          cell.edges.lt = function() {
                            return {
                              path: [ [0, lefttop], [topright, 1] ],
                              move: {
                                x:      0,
                                y:      1,
                                enter:  'br'
                              }
                            };
                          };
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [bottomright, 0], [0, leftbottom], [0, lefttop], [topright, 1], [1, 1], [1, 0] ]);
                      },

      hexagon_bl_rb:  function(cell, x0, x1, x2, x3, opt) {
                        var bottomleft  = opt.interpolate_a(x0, x1, opt);
                        var bottomright = opt.interpolate_b(x0, x1, opt);
                        var lefttop     = opt.interpolate(x0, x3, opt);
                        var righttop    = opt.interpolate(x1, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.bl = function() {
                            return {
                              path: [ [bottomleft, 0], [0, lefttop] ],
                              move: {
                                x:      -1,
                                y:      0,
                                enter:  'rt'
                              }
                            };
                          };
                          cell.edges.rt = function() {
                            return {
                              path: [ [1, righttop], [bottomright, 0] ],
                              move: {
                                x:      0,
                                y:      -1,
                                enter:  'tr'
                              }
                            };
                          }
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [bottomleft, 0], [0, lefttop], [0, 1], [1, 1], [1, righttop], [bottomright, 0] ]);
                      },

      hexagon_tr_rb:  function(cell, x0, x1, x2, x3, opt) {
                        var bottomleft  = opt.interpolate(x0, x1, opt);
                        var topleft     = opt.interpolate(x3, x2, opt);
                        var righttop    = opt.interpolate_b(x1, x2, opt);
                        var rightbottom = opt.interpolate_a(x1, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.tl = function() {
                            return {
                              path: [ [topleft, 1], [1, righttop] ],
                              move: {
                                x:      1,
                                y:      0,
                                enter:  'lt'
                              }
                            };
                          };
                          cell.edges.rb = function() {
                            return {
                              path: [ [1, rightbottom], [bottomleft, 0] ],
                              move: {
                                x:      0,
                                y:      -1,
                                enter:  'tl'
                              }
                            };
                          };
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [0, 0], [0, 1], [topleft, 1], [1, righttop], [1, rightbottom], [bottomleft, 0] ]);
                      },

      hexagon_lt_rb:  function(cell, x0, x1, x2, x3, opt) {
                        var leftbottom  = opt.interpolate(x0, x3, opt);
                        var topright    = opt.interpolate(x3, x2, opt);
                        var righttop    = opt.interpolate(x1, x2, opt);
                        var bottomleft  = opt.interpolate(x0, x1, opt);

                        if (opt.polygons_full) {
                          cell.edges.lb = function() {
                            return {
                              path: [ [0, leftbottom], [topright, 1] ],
                              move: {
                                x:      0,
                                y:      1,
                                enter:  'br'
                              }
                            };
                          };
                          cell.edges.rt = function() {
                            return {
                              path: [ [1, righttop], [bottomleft, 0] ],
                              move: {
                                x:      0,
                                y:      -1,
                                enter:  'tl'
                              }
                            };
                          }
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [0, 0], [0, leftbottom], [topright, 1], [1, 1], [1, righttop], [bottomleft, 0] ]);
                      },

      hexagon_bl_tr:  function(cell, x0, x1, x2, x3, opt) {
                        var bottomright = opt.interpolate(x0, x1, opt);
                        var lefttop     = opt.interpolate(x0, x3, opt);
                        var topleft     = opt.interpolate(x3, x2, opt);
                        var rightbottom = opt.interpolate(x1, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.br = function() {
                            return {
                              path: [ [bottomright, 0], [0, lefttop] ],
                              move: {
                                x:      -1,
                                y:      0,
                                enter:  'rt'
                              }
                            };
                          };
                          cell.edges.tl = function() {
                            return {
                              path: [ [topleft, 1], [1, rightbottom] ],
                              move: {
                                x:      1,
                                y:      0,
                                enter:  'lb'
                              }
                            };
                          };
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [bottomright, 0], [0, lefttop], [0, 1], [topleft, 1], [1, rightbottom], [1, 0] ]);
                      },

      heptagon_tr:    function(cell, x0, x1, x2, x3, opt) {
                        var bottomleft  = opt.interpolate_a(x0, x1, opt);
                        var bottomright = opt.interpolate_b(x0, x1, opt);
                        var leftbottom  = opt.interpolate_a(x0, x3, opt);
                        var lefttop     = opt.interpolate_b(x0, x3, opt);
                        var topright    = opt.interpolate(x3, x2, opt);
                        var righttop    = opt.interpolate(x1, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.bl = function() {
                            return {
                              path: [ [bottomleft, 0], [0, leftbottom] ],
                              move: {
                                x:      -1,
                                y:      0,
                                enter:  'rb'
                              }
                            };
                          };
                          cell.edges.lt = function() {
                            return {
                              path: [ [0, lefttop], [topright, 1] ],
                              move: {
                                x:      0,
                                y:      1,
                                enter:  'br'
                              }
                            };
                          };
                          cell.edges.rt = function() {
                            return {
                              path: [ [1, righttop], [bottomright, 0] ],
                              move: {
                                x:      0,
                                y:      -1,
                                enter:  'tr'
                              }
                            };
                          };
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [bottomleft, 0], [0, leftbottom], [0, lefttop], [topright, 1], [1, 1], [1, righttop], [bottomright, 0] ]);
                      },

      heptagon_bl:    function(cell, x0, x1, x2, x3, opt) {
                        var bottomleft  = opt.interpolate(x0, x1, opt);
                        var leftbottom  = opt.interpolate(x0, x3, opt);
                        var topleft     = opt.interpolate_a(x3, x2, opt);
                        var topright    = opt.interpolate_b(x3, x2, opt);
                        var righttop    = opt.interpolate_b(x1, x2, opt);
                        var rightbottom = opt.interpolate_a(x1, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.lb = function() {
                            return {
                              path: [ [0, leftbottom], [topleft, 1] ],
                              move: {
                                x:      0,
                                y:      1,
                                enter:  'bl'
                              }
                            };
                          };
                          cell.edges.tr = function() {
                            return {
                              path: [ [topright, 1], [1, righttop] ],
                              move: {
                                x:      1,
                                y:      0,
                                enter:  'lt'
                              }
                            };
                          };
                          cell.edges.rb = function() {
                            return {
                              path: [ [1, rightbottom], [bottomleft, 0] ],
                              move: {
                                x:      0,
                                y:      -1,
                                enter:  'tl'
                              }
                            };
                          };
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [0, 0], [0, leftbottom], [topleft, 1], [topright, 1], [1, righttop], [1, rightbottom], [bottomleft, 0] ]);
                      },

      heptagon_tl:    function(cell, x0, x1, x2, x3, opt) {
                        var bottomleft  = opt.interpolate_a(x0, x1, opt);
                        var bottomright = opt.interpolate_b(x0, x1, opt);
                        var lefttop     = opt.interpolate(x0, x3, opt);
                        var topleft     = opt.interpolate(x3, x2, opt);
                        var righttop    = opt.interpolate_b(x1, x2, opt);
                        var rightbottom = opt.interpolate_a(x1, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.bl = function() {
                            return {
                              path: [ [bottomleft, 0], [0, lefttop] ],
                              move: {
                                x:      -1,
                                y:      0,
                                enter:  'rt'
                              }
                            };
                          };
                          cell.edges.tl = function() {
                            return {
                              path: [ [topleft, 1], [1, righttop] ],
                              move: {
                                x:      1,
                                y:      0,
                                enter:  'lt'
                              }
                            };
                          };
                          cell.edges.rb = function() {
                            return {
                              path: [ [1, rightbottom], [bottomright, 0] ],
                              move: {
                                x:      0,
                                y:      -1,
                                enter:  'tr'
                              }
                            };
                          };
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [bottomleft, 0], [0, lefttop], [0, 1], [topleft, 1], [1, righttop], [1, rightbottom], [bottomright, 0] ]);
                      },

      heptagon_br:    function(cell, x0, x1, x2, x3, opt) {
                        var bottomright = opt.interpolate(x0, x1, opt);
                        var leftbottom  = opt.interpolate_a(x0, x3, opt);
                        var lefttop     = opt.interpolate_b(x0, x3, opt);
                        var topleft     = opt.interpolate_a(x3, x2, opt);
                        var topright    = opt.interpolate_b(x3, x2, opt);
                        var rightbottom = opt.interpolate(x1, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.br = function() {
                            return {
                              path: [ [bottomright, 0], [0, leftbottom] ],
                              move: {
                                x:      -1,
                                y:      0,
                                enter:  'rb'
                              }
                            };
                          };
                          cell.edges.lt = function() {
                            return {
                              path: [ [0, lefttop], [topleft, 1] ],
                              move: {
                                x:      0,
                                y:      1,
                                enter:  'bl'
                              }
                            };
                          };
                          cell.edges.tr = function() {
                            return {
                              path: [ [topright, 1], [1, rightbottom] ],
                              move: {
                                x:      1,
                                y:      0,
                                enter:  'lb'
                              }
                            };
                          };
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [bottomright,0], [0, leftbottom], [0, lefttop], [topleft, 1], [topright, 1], [1, rightbottom], [1, 0] ]);
                      },

      octagon:        function(cell, x0, x1, x2, x3, opt) {
                        var bottomleft  = opt.interpolate_a(x0, x1, opt);
                        var bottomright = opt.interpolate_b(x0, x1, opt);
                        var leftbottom  = opt.interpolate_a(x0, x3, opt);
                        var lefttop     = opt.interpolate_b(x0, x3, opt);
                        var topleft     = opt.interpolate_a(x3, x2, opt);
                        var topright    = opt.interpolate_b(x3, x2, opt);
                        var righttop    = opt.interpolate_b(x1, x2, opt);
                        var rightbottom = opt.interpolate_a(x1, x2, opt);

                        if (opt.polygons_full) {
                          cell.edges.bl = function() {
                            return {
                              path: [ [bottomleft, 0], [0, leftbottom] ],
                              move: {
                                x:      -1,
                                y:      0,
                                enter:  'rb'
                              }
                            };
                          };
                          cell.edges.lt = function() {
                            return {
                              path: [ [0, lefttop], [topleft, 1] ],
                              move: {
                                x:      0,
                                y:      1,
                                enter:  'bl'
                              }
                            };
                          };
                          cell.edges.tr = function() {
                            return {
                              path: [ [topright, 1], [1, righttop] ],
                              move: {
                                x:      1,
                                y:      0,
                                enter:  'lt'
                              }
                            };
                          };
                          cell.edges.rb = function() {
                            return {
                              path: [ [1, rightbottom], [bottomright, 0] ],
                              move: {
                                x:      0,
                                y:      -1,
                                enter:  'tr'
                              }
                            };
                          };
                        }

                        if (opt.polygons)
                          cell.polygons.push([ [bottomleft, 0], [0, leftbottom], [0, lefttop], [topleft, 1], [topright, 1], [1, righttop], [1, rightbottom], [bottomright, 0] ]);
                      }
    };

  function prepareCell(grid, x, y, opt) {
    /*  compose the 4-trit corner representation */
    var cval = 0;
    var x3 = grid[y + 1][x];
    var x2 = grid[y + 1][x + 1];
    var x1 = grid[y][x + 1];
    var x0 = grid[y][x];
    var minV  = opt.minV;
    var maxV  = opt.maxV;

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
        of the cell. Each edge value may be (i) below, (ii) within,
        or (iii) above the values of the isoband limits. We
        encode this property using 2 bits of information, where

        00 ... below,
        01 ... within, and
        10 ... above

        Then we store the cells value as vector

        cval = (x0, x1, x2, x3)

        where x0 are the two least significant bits (0th, 1st),
        x1 the 2nd and 3rd bit, and so on. This essentially
        enables us to work with a single integer number
    */

    cval |= (x3 < minV) ? 0 : (x3 > maxV) ? 128 : 64;
    cval |= (x2 < minV) ? 0 : (x2 > maxV) ? 32 : 16;
    cval |= (x1 < minV) ? 0 : (x1 > maxV) ? 8 : 4;
    cval |= (x0 < minV) ? 0 : (x0 > maxV) ? 2 : 1;

    /* make sure cval is a number */
    cval = +cval;

    /*
        cell center average trit for ambiguous cases, where
        0 ... below iso band
        1 ... within iso band
        2 ... above isoband
    */
    var center_avg = 0;

    var cell = {
      cval:         cval,
      polygons:     [],

      edges:        {},

      bottomleft:   0.5,
      bottomright:  0.5,
      rightbottom:  0.5,
      righttop:     0.5,
      topright:     0.5,
      topleft:      0.5,
      lefttop:      0.5,
      leftbottom:   0.5
    };

    /*
        Compute interpolated intersections of the polygon(s)
        with the cell borders and (i) add edges for polygon
        trace-back, or (ii) a list of small closed polygons
        according to look-up table
    */
    switch (cval) {
      case 85:  /* 1111 */
        shapeCoordinates.square(cell, x0, x1, x2, x3, opt);
        /* fall through */
      case 0:   /* 0000 */
        /* fall through */
      case 170: /* 2222 */
        break;

      /* single triangle cases */

      case 169: /* 2221 */
        shapeCoordinates.triangle_bl(cell, x0, x1, x2, x3, opt);
        break;

      case 166: /* 2212 */
        shapeCoordinates.triangle_br(cell, x0, x1, x2, x3, opt);
        break;

      case 154: /* 2122 */
        shapeCoordinates.triangle_tr(cell, x0, x1, x2, x3, opt);
        break;

      case 106: /* 1222 */
        shapeCoordinates.triangle_tl(cell, x0, x1, x2, x3, opt);
        break;

      case 1: /* 0001 */
        shapeCoordinates.triangle_bl(cell, x0, x1, x2, x3, opt);
        break;

      case 4: /* 0010 */
        shapeCoordinates.triangle_br(cell, x0, x1, x2, x3, opt);
        break;

      case 16: /* 0100 */
        shapeCoordinates.triangle_tr(cell, x0, x1, x2, x3, opt);
        break;

      case 64: /* 1000 */
        shapeCoordinates.triangle_tl(cell, x0, x1, x2, x3, opt);
        break;


      /* single trapezoid cases */

      case 168: /* 2220 */
        shapeCoordinates.tetragon_bl(cell, x0, x1, x2, x3, opt);
        break;

      case 162: /* 2202 */
        shapeCoordinates.tetragon_br(cell, x0, x1, x2, x3, opt);
        break;

      case 138: /* 2022 */
        shapeCoordinates.tetragon_tr(cell, x0, x1, x2, x3, opt);
        break;

      case 42: /* 0222 */
        shapeCoordinates.tetragon_tl(cell, x0, x1, x2, x3, opt);
        break;

      case 2: /* 0002 */
        shapeCoordinates.tetragon_bl(cell, x0, x1, x2, x3, opt);
        break;

      case 8: /* 0020 */
        shapeCoordinates.tetragon_br(cell, x0, x1, x2, x3, opt);
        break;

      case 32: /* 0200 */
        shapeCoordinates.tetragon_tr(cell, x0, x1, x2, x3, opt);
        break;

      case 128: /* 2000 */
        shapeCoordinates.tetragon_tl(cell, x0, x1, x2, x3, opt);
        break;


      /* single rectangle cases */

      case 5: /* 0011 */
        shapeCoordinates.tetragon_b(cell, x0, x1, x2, x3, opt);
        break;

      case 20: /* 0110 */
        shapeCoordinates.tetragon_r(cell, x0, x1, x2, x3, opt);
        break;

      case 80: /* 1100 */
        shapeCoordinates.tetragon_t(cell, x0, x1, x2, x3, opt);
        break;

      case 65: /* 1001 */
        shapeCoordinates.tetragon_l(cell, x0, x1, x2, x3, opt);
        break;

      case 165: /* 2211 */
        shapeCoordinates.tetragon_b(cell, x0, x1, x2, x3, opt);
        break;

      case 150: /* 2112 */
        shapeCoordinates.tetragon_r(cell, x0, x1, x2, x3, opt);
        break;

      case 90: /* 1122 */
        shapeCoordinates.tetragon_t(cell, x0, x1, x2, x3, opt);
        break;

      case 105: /* 1221 */
        shapeCoordinates.tetragon_l(cell, x0, x1, x2, x3, opt);
        break;

      case 160: /* 2200 */
        shapeCoordinates.tetragon_lr(cell, x0, x1, x2, x3, opt);
        break;

      case 130: /* 2002 */
        shapeCoordinates.tetragon_tb(cell, x0, x1, x2, x3, opt);
        break;

      case 10: /* 0022 */
        shapeCoordinates.tetragon_lr(cell, x0, x1, x2, x3, opt);
        break;

      case 40: /* 0220 */
        shapeCoordinates.tetragon_tb(cell, x0, x1, x2, x3, opt);
        break;


      /* single pentagon cases */

      case 101: /* 1211 */
        shapeCoordinates.pentagon_tr(cell, x0, x1, x2, x3, opt);
        break;

      case 149: /* 2111 */
        shapeCoordinates.pentagon_tl(cell, x0, x1, x2, x3, opt);
        break;

      case 86: /* 1112 */
        shapeCoordinates.pentagon_bl(cell, x0, x1, x2, x3, opt);
        break;

      case 89: /* 1121 */
        shapeCoordinates.pentagon_br(cell, x0, x1, x2, x3, opt);
        break;

      case 69: /* 1011 */
        shapeCoordinates.pentagon_tr(cell, x0, x1, x2, x3, opt);
        break;

      case 21: /* 0111 */
        shapeCoordinates.pentagon_tl(cell, x0, x1, x2, x3, opt);
        break;

      case 84: /* 1110 */
        shapeCoordinates.pentagon_bl(cell, x0, x1, x2, x3, opt);
        break;

      case 81: /* 1101 */
        shapeCoordinates.pentagon_br(cell, x0, x1, x2, x3, opt);
        break;

      case 96: /* 1200 */
        shapeCoordinates.pentagon_tr_rl(cell, x0, x1, x2, x3, opt);
        break;

      case 24: /* 0120 */
        shapeCoordinates.pentagon_rb_bt(cell, x0, x1, x2, x3, opt);
        break;

      case 6: /* 0012 */
        shapeCoordinates.pentagon_bl_lr(cell, x0, x1, x2, x3, opt);
        break;

      case 129: /* 2001 */
        shapeCoordinates.pentagon_lt_tb(cell, x0, x1, x2, x3, opt);
        break;

      case 74: /* 1022 */
        shapeCoordinates.pentagon_tr_rl(cell, x0, x1, x2, x3, opt);
        break;

      case 146: /* 2102 */
        shapeCoordinates.pentagon_rb_bt(cell, x0, x1, x2, x3, opt);
        break;

      case 164: /* 2210 */
        shapeCoordinates.pentagon_bl_lr(cell, x0, x1, x2, x3, opt);
        break;

      case 41: /* 0221 */
        shapeCoordinates.pentagon_lt_tb(cell, x0, x1, x2, x3, opt);
        break;

      case 66: /* 1002 */
        shapeCoordinates.pentagon_bl_tb(cell, x0, x1, x2, x3, opt);
        break;

      case 144: /* 2100 */
        shapeCoordinates.pentagon_lt_rl(cell, x0, x1, x2, x3, opt);
        break;

      case 36: /* 0210 */
        shapeCoordinates.pentagon_tr_bt(cell, x0, x1, x2, x3, opt);
        break;

      case 9: /* 0021 */
        shapeCoordinates.pentagon_rb_lr(cell, x0, x1, x2, x3, opt);
        break;

      case 104: /* 1220 */
        shapeCoordinates.pentagon_bl_tb(cell, x0, x1, x2, x3, opt);
        break;

      case 26: /* 0122 */
        shapeCoordinates.pentagon_lt_rl(cell, x0, x1, x2, x3, opt);
        break;

      case 134: /* 2012 */
        shapeCoordinates.pentagon_tr_bt(cell, x0, x1, x2, x3, opt);
        break;

      case 161: /* 2201 */
        shapeCoordinates.pentagon_rb_lr(cell, x0, x1, x2, x3, opt);
        break;


      /* single hexagon cases */

      case 37: /* 0211 */
        shapeCoordinates.hexagon_lt_tr(cell, x0, x1, x2, x3, opt);
        break;

      case 148: /* 2110 */
        shapeCoordinates.hexagon_bl_lt(cell, x0, x1, x2, x3, opt);
        break;

      case 82: /* 1102 */
        shapeCoordinates.hexagon_bl_rb(cell, x0, x1, x2, x3, opt);
        break;

      case 73: /* 1021 */
        shapeCoordinates.hexagon_tr_rb(cell, x0, x1, x2, x3, opt);
        break;

      case 133: /* 2011 */
        shapeCoordinates.hexagon_lt_tr(cell, x0, x1, x2, x3, opt);
        break;

      case 22: /* 0112 */
        shapeCoordinates.hexagon_bl_lt(cell, x0, x1, x2, x3, opt);
        break;

      case 88: /* 1120 */
        shapeCoordinates.hexagon_bl_rb(cell, x0, x1, x2, x3, opt);
        break;

      case 97: /* 1201 */
        shapeCoordinates.hexagon_tr_rb(cell, x0, x1, x2, x3, opt);
        break;

      case 145: /* 2101 */
        shapeCoordinates.hexagon_lt_rb(cell, x0, x1, x2, x3, opt);
        break;

      case 25: /* 0121 */
        shapeCoordinates.hexagon_lt_rb(cell, x0, x1, x2, x3, opt);
        break;

      case 70: /* 1012 */
        shapeCoordinates.hexagon_bl_tr(cell, x0, x1, x2, x3, opt);
        break;

      case 100: /* 1210 */
        shapeCoordinates.hexagon_bl_tr(cell, x0, x1, x2, x3, opt);
        break;


      /* 6-sided saddles */

      case 17: /* 0101 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 0) {
          shapeCoordinates.triangle_bl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.triangle_tr(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 2 */
          shapeCoordinates.hexagon_lt_rb(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 68: /* 1010 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 0) {
          shapeCoordinates.triangle_tl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.triangle_br(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 2 */
          shapeCoordinates.hexagon_bl_tr(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 153: /* 2121 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 1) {
          shapeCoordinates.hexagon_lt_rb(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 0 */
          shapeCoordinates.triangle_bl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.triangle_tr(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 102: /* 1212 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 1) {
          shapeCoordinates.hexagon_bl_tr(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 0 */
          shapeCoordinates.triangle_tl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.triangle_br(cell, x0, x1, x2, x3, opt);
        }
        break;


      /* 7-sided saddles */

      case 152: /* 2120 */

        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 1) {
          shapeCoordinates.heptagon_tr(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 0 */
          shapeCoordinates.triangle_tr(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_bl(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 137: /* 2021 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 1) {
          shapeCoordinates.heptagon_bl(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 0 */
          shapeCoordinates.triangle_bl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_tr(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 98: /* 1202 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 1) {
          shapeCoordinates.heptagon_tl(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 0 */
          shapeCoordinates.triangle_tl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_br(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 38: /* 0212 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 1) {
          shapeCoordinates.heptagon_br(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 0 */
          shapeCoordinates.triangle_br(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_tl(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 18: /* 0102 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 0) {
          shapeCoordinates.triangle_tr(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_bl(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 2 */
          shapeCoordinates.heptagon_tr(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 33: /* 0201 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 0) {
          shapeCoordinates.triangle_bl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_tr(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 2 */
          shapeCoordinates.heptagon_bl(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 72: /* 1020 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 0) {
          shapeCoordinates.triangle_tl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_br(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 2 */
          shapeCoordinates.heptagon_tl(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 132: /* 2010 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 0) {
          shapeCoordinates.triangle_br(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_tl(cell, x0, x1, x2, x3, opt);
        } else {
          /* should never be center_avg === 2 */
          shapeCoordinates.heptagon_br(cell, x0, x1, x2, x3, opt);
        }
        break;


      /* 8-sided saddles */

      case 136: /* 2020 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 0) {
          shapeCoordinates.tetragon_tl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_br(cell, x0, x1, x2, x3, opt);
        } else if (center_avg === 1) {
          shapeCoordinates.octagon(cell, x0, x1, x2, x3, opt);
        } else {
          shapeCoordinates.tetragon_bl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_tr(cell, x0, x1, x2, x3, opt);
        }
        break;

      case 34: /* 0202 */
        center_avg = computeCenterAverage(x0, x1, x2, x3, minV, maxV);
        if (center_avg === 0) {
          shapeCoordinates.tetragon_bl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_tr(cell, x0, x1, x2, x3, opt);
        } else if (center_avg === 1) {
          shapeCoordinates.octagon(cell, x0, x1, x2, x3, opt);
        } else {
          shapeCoordinates.tetragon_tl(cell, x0, x1, x2, x3, opt);
          shapeCoordinates.tetragon_br(cell, x0, x1, x2, x3, opt);
        }
        break;
    }

    return cell;
  }


  /*
  ####################################
  Below is the actual Marching Squares implementation
  ####################################
  */

  function computeBandGrid(data, minV, bandwidth){
    var rows = data.length - 1;
    var cols = data[0].length - 1;
    var BandGrid = { rows: rows, cols: cols, cells: [] };

    var maxV = minV + Math.abs(bandwidth);

    var opt = {
      polygons:       true,
      polygons_full:  true,
      interpolate:    function(a, b, o) {
        if (a < b) {
          if (a < o.minV) {
            return (o.minV - a) / (b - a);
          } else {
            return (o.maxV - a) / (b - a);
          }
        } else {
          if (a > o.maxV) {
            return (a - o.maxV) / (a - b);
          } else {
            return (a - o.minV) / (a - b);
          }
        }
      },
      interpolate_a:  function(a, b, o) {
        if (a < b) {
          return (o.minV - a) / (b - a);
        } else {
          return (a - o.maxV) / (a - b);
        }
      },
      interpolate_b:  function(a, b, o) {
        if (a < b) {
          return (o.maxV - a) / (b - a);
        } else {
          return (a - o.minV) / (a - b);
        }
      },
      minV:      minV,
      maxV:      maxV
    };

    for (var j = 0; j < rows; ++j) {
      BandGrid.cells[j] = [];
      for (var i = 0; i < cols; ++i)
        BandGrid.cells[j][i] = prepareCell(data, i, j, opt);
    }

    return BandGrid;
  }

  function TracePaths(grid) {
    var areas = [];
    var rows = grid.rows;
    var cols = grid.cols;
    var polygons = [];

    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        if (typeof grid.cells[j][i] !== 'undefined') {
          var cell = grid.cells[j][i];
          if ((cell.cval === 0) || (cell.cval === 85) || (cell.cval === 170))
            continue;

          var nextedge = null;

          var available_starts = [ 'bl', 'lb', 'lt', 'tl', 'tr', 'rt', 'rb', 'br' ];

          for (e = 0; e < 8; e++) {
            if (typeof cell.edges[available_starts[e]] === 'function') {
              nextedge = available_starts[e];
              break;
            }
          }
//          console.log("Cell " + i + ", " + j + "(cval: " + cell.cval + ", enter next at: " + nextedge + ")");
          if (nextedge) {
            /* start a new, full path */
            var path = [];

            var e = cell.edges[nextedge]();

            /* remove edge from cell */
            delete cell.edges[nextedge];

            /* add edge to path array */
//            console.log(e.path);
            e.path.forEach(function(point) { point[0] += i; point[1] += j; path.push(point); });

            var enter = e.move.enter;
            var x     = i + e.move.x;
            var y     = j + e.move.y;

//            console.log("proceed to " + x + ", " + y + ", enter: " + enter + ", cval: " + grid.cells[y][x].cval);
            /* start traceback */
            while ((x >= 0) && (x < cols) && (y >= 0) && (y < rows)) {
              cc = grid.cells[y][x];

              if (typeof cc.edges[enter] !== 'function') {
                console.log("Entry point missing for cell " + x + "," + y + " cval: " + cc.cval + "(prev " + i + "," + j + ")");
                break;
              }

              e = cc.edges[enter]();

              /* remove edge from cell */
              delete cc.edges[enter];

//              console.log(e.path);
              /* add edge to path array */
              point = e.path[1];
              point[0] += x;
              point[1] += y;
              path.push(point);

              enter = e.move.enter;
              x     = x + e.move.x;
              y     = y + e.move.y;

//              console.log("proceed to " + x + ", " + y + ", enter: " + enter + ", cval: " + grid.cells[y][x].cval);

              if (x === cols) {
                break;
              } else if (x < 0) {
                break;
              } else if (y === rows) {
                break;
              } else if (y < 0) {
                break;
              }

              /* re-entry into start cell? */
              if ((x === i) && (y === j)) {
                if (enter !== nextedge)
                  console.log("Enter != nextedge");
                break;
              }
            }

//            console.log("path");
//            console.log(path);

            polygons.push(path);
          }

//          console.log(cell);
        }
      }
    }

//    console.log(polygons);
    return polygons;
  }

  function GetPolygons(grid) {
    var areas = [];
    var rows = grid.rows;
    var cols = grid.cols;
    var polygons = [];

//    console.log("collecting polygons...");

    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        if (typeof grid.cells[j][i] !== 'undefined') {
          var cell = grid.cells[j][i];
          if ((cell.cval === 0) || (cell.cval === 170))
            continue;

          cell.polygons.forEach(function(p) {
            p.forEach(function(pp) {
              pp[0] += i;
              pp[1] += j;
            });
            polygons.push(p);
          });
        }
      }
    }

    return polygons;
  }

  return isoBands;

}));
