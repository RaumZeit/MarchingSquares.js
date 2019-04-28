
import * as interpolate from './interpolation';


function Options() {
  /* Settings common to all implemented algorithms */
  this.successCallback  = null;
  this.verbose          = false;
  this.polygons         = false;
  this.polygons_full    = false;
  this.linearRing       = true;
  this.noQuadTree       = false;
  this.noFrame          = false;
}


/* Compose settings specific to IsoBands algorithm */
function isoBandOptions(userSettings) {
  var i,
    key,
    val,
    bandOptions,
    optionKeys;

  bandOptions   = new Options();
  userSettings  = userSettings ? userSettings : {};
  optionKeys    = Object.keys(bandOptions);

  for(i = 0; i < optionKeys.length; i++) {
    key = optionKeys[i];
    val = userSettings[key];
    if ((typeof val !== 'undefined') && (val !== null))
      bandOptions[key] = val;
  }

  /* restore compatibility */
  bandOptions.polygons_full  = !bandOptions.polygons;

  /* add interpolation functions (not yet user customizable) */
  bandOptions.interpolate   = interpolate.linear_ab;
  bandOptions.interpolate_a = interpolate.linear_a;
  bandOptions.interpolate_b = interpolate.linear_b;

  return bandOptions;
}


/* Compose settings specific to IsoLines algorithm */
function isoLineOptions(userSettings) {
  var i,
    key,
    val,
    lineOptions,
    optionKeys;

  lineOptions   = new Options();
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
  lineOptions.interpolate   = interpolate.linear;

  return lineOptions;
}


export {
  isoBandOptions,
  isoLineOptions
};
