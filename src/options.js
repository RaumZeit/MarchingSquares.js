
import * as interpolate from './interpolation'


function options() {
  /* Settings common to all implemented algorithms */
  this.successCallback  = null;
  this.verbose          = false;
  this.polygons         = false;
  this.polygons_full    = false;
  this.linearRing       = true;
}


/* Compose settings specific to IsoBands algorithm */
function isoBandOptions(userSettings) {
  var bandOptions = new options();

  userSettings = userSettings ? userSettings : {};

  var optionKeys = Object.keys(bandOptions);

  for(var i = 0; i < optionKeys.length; i++){
    var key = optionKeys[i];
    var val = userSettings[key];
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
  var LineOptions = new options();

  userSettings = userSettings ? userSettings : {};

  var optionKeys = Object.keys(LineOptions);

  for(var i = 0; i < optionKeys.length; i++){
    var key = optionKeys[i];
    var val = userSettings[key];
    if ((typeof val !== 'undefined') && (val !== null))
      LineOptions[key] = val;
  }

  /* restore compatibility */
  LineOptions.polygons_full  = !LineOptions.polygons;

  /* add interpolation functions (not yet user customizable) */
  LineOptions.interpolate   = interpolate.linear;

  return LineOptions;
}


export {
  isoBandOptions as optIsoBands,
  isoLineOptions as optIsoLines
};
