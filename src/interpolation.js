
/*
 *  Compute the distance of a value 'v' from 'a' through linear interpolation
 *  between the values of 'a' and 'b'
 *
 *  Note, that we assume that 'a' and 'b' have unit distance (i.e. 1)
 */
function linear(a, b, v) {
  return (a < b) ? ((v - a) / (b - a)) : ((a - v) / (a - b));
}


/*
 *  Compute the distance of a pair of values ('v0', 'v1') from 'a' through linear interpolation
 *  between the values of 'a' and 'b'
 *
 *  This function assumes that exactly one value, 'v0' or 'v1', is actually located
 *  between 'a' and 'b', and choses the right one automagically
 *
 *  Note, that we assume that 'a' and 'b' have unit distance (i.e. 1)
 */
function linear_ab(a, b, v0, v1) {
    if (v0 > v1) {
      var tt = v0;
      v0 = v1;
      v1 = v0;
    }

    if (a < b) {
      if (a < v0) {
        return (v0 - a) / (b - a);
      } else {
        return (v1 - a) / (b - a);
      }
    } else {
      if (a > v1) {
        return (a - v1) / (a - b);
      } else {
        return (a - v0) / (a - b);
      }
    }
}


/*
 *  Compute the distance of a pair of values ('v0', 'v1') from 'a' through linear interpolation
 *  between the values of 'a' and 'b'
 *
 *  This function automagically choses the value 'vN' that is closer to 'a'
 *
 *  Note, that we assume that 'a' and 'b' have unit distance (i.e. 1)
 */
function linear_a(a, b, minV, maxV) {
    if (a < b) {
      return (minV - a) / (b - a);
    } else {
      return (a - maxV) / (a - b);
    }
}


/*
 *  Compute the distance of a pair of values ('v0', 'v1') from 'a' through linear interpolation
 *  between the values of 'a' and 'b'
 *
 *  This function automagically choses the value 'vN' that is closer to 'b'
 *
 *  Note, that we assume that 'a' and 'b' have unit distance (i.e. 1)
 */
function linear_b(a, b, minV, maxV) {
    if (a < b) {
      return (maxV - a) / (b - a);
    } else {
      return (a - minV) / (a - b);
    }
}


export {
  linear,
  linear_ab,
  linear_a,
  linear_b
}
