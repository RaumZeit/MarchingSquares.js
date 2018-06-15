
import * as interpolate from './interpolation'


/* Settings common to all implemented algorithms */
var commonSettings = {
  successCallback:  null,
  verbose:          false,
  polygons:         false,
  polygons_full:    false,
  linearRing:       true,
}


/* Compose settings specific to IsoBands algorithm */
var optIsoBands = Object.assign(
{
  interpolate:   interpolate.linear_ab,
  interpolate_a: interpolate.linear_a,
  interpolate_b: interpolate.linear_b
}, commonSettings);


/* Compose settings specific to IsoBands algorithm */
var optIsoLines = Object.assign(
{
  interpolate: interpolate.linear
}, commonSettings);


export {
  optIsoBands as optIsoBands,
  optIsoLines as optIsoLines
};
