
var treeNode = {
    /* minimum value in subtree under this node */
    lowerBound: null,
    /* maximum value in subtree under this node */
    upperBound: null,

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
    childA: null,
    childB: null,
    childC: null,
    childD: null
};


treeNode.getCells = function(lowerBound, upperBound) {
  var cells = [];

  if ((this.lowerBound > upperBound) || (this.upperBound < lowerBound))
    return cells;

  if (!(this.childA || this.childB || this.childC || this.childD)) {
    if ((this.lowerBound <= lowerBound) ||
        (this.upperBound >= upperBound)) {
      cells.push({
        x: this.x,
        y: this.y
      });
    }
  } else {
    if (this.childA)
      cells = cells.concat(this.childA.getCells(lowerBound, upperBound));

    if (this.childB)
      cells = cells.concat(this.childB.getCells(lowerBound, upperBound));

    if (this.childC)
      cells = cells.concat(this.childC.getCells(lowerBound, upperBound));

    if (this.childD)
      cells = cells.concat(this.childD.getCells(lowerBound, upperBound));
  }

  //console.log(cells);

  return cells;
};

function constructTree(data, x, y, dx, dy) {

  var node = Object.assign({
    x: x,
    y: y,
    dx: dx,
    dy: dy
  }, treeNode);

  var dx_tmp = dx,
      dy_tmp = dy,
      msb_x  = 0,
      msb_y  = 0;

  if ((dx === 1) && (dy === 1)) {
    /* do not further subdivision */
    node.lowerBound = Math.min(
                        data[y][x],
                        data[y][x + 1],
                        data[y + 1][x + 1],
                        data[y + 1][x]
                      );
    node.upperBound = Math.max(
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

    node.childA = constructTree(data, x, y, dx_tmp, dy_tmp);
    node.lowerBound = node.childA.lowerBound;
    node.upperBound = node.childA.upperBound;

    if (dx - dx_tmp > 0) {
      node.childB = constructTree(data, x + dx_tmp, y, dx - dx_tmp, dy_tmp);
      node.lowerBound = Math.min(node.lowerBound, node.childB.lowerBound);
      node.upperBound = Math.max(node.upperBound, node.childB.upperBound);

      if (dy - dy_tmp > 0) {
        node.childC = constructTree(data, x + dx_tmp, y + dy_tmp, dx - dx_tmp, dy - dy_tmp);
        node.lowerBound = Math.min(node.lowerBound, node.childC.lowerBound);
        node.upperBound = Math.max(node.upperBound, node.childC.upperBound);
      }
    }

    if (dy - dy_tmp > 0) {
      node.childD = constructTree(data, x, y + dy_tmp, dx_tmp, dy - dy_tmp);
      node.lowerBound = Math.min(node.lowerBound, node.childD.lowerBound);
      node.upperBound = Math.max(node.upperBound, node.childD.upperBound);
    }
  }

  return node;
}


/*
 * Given a scalar field `data` construct a quadTree
 * to efficiently lookup those parts of the scalar
 * field where values are within a particular
 * range of [lowerbound, upperbound] limits.
 */
function quadTree(data, options) {
  /* root node, i.e. entry to the data */
  var root = constructTree(data, 0, 0, data[0].length - 1, data.length - 1);

  return root;
}


export {
  quadTree
};
