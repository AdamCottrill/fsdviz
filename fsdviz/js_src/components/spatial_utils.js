/* global $ spatialAttrURL spatialAttrs */

import helpers from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

//export const checkPointInPoly = (lat, lon, spatialObjects, what) => {
//  // given a coordinate, and a key for our spatial objects, see if the
//  // point falls in the geometry of the object stored in that key:
//
//  let contained = false;
//  let turfpt = helpers.point([lon, lat]);
//  let geom = spatialObjects[what].geom;
//
//  if (typeof geom !== "undefined") {
//    contained = booleanPointInPolygon(
//      turfpt,
//      helpers.feature(JSON.parse(geom))
//    );
//  }
//
//  return contained;
//};
//
//export const getPolygon = (
//  dd_lat,
//  dd_lon,
//  url,
//  token,
//  spatialObjects,
//  what
//) => {
//  // given a lat, lon, a url, csrf_token, a success function, and an
//  // error function, call our spatial lookup api.
//  let success = data => (spatialObjects[what] = data);
//  let error = () => {
//    console.log("Error retrieving polygon for " + what);
//    spatialObjects[what] = "";
//  };
//
//  $.ajax({
//    type: "POST",
//    url: url + "?geom=geom",
//    dataType: "json",
//    data: {
//      point: `POINT(${dd_lon} ${dd_lat})`,
//      csrfmiddlewaretoken: token
//    },
//    success: success,
//    error: error
//  });
//};
//
export async function getSpatialAttrs(coords, url, token, success, error) {
  // given a lat, lon, a url, csrf_token, a success function, and an
  // error function, call our spatial lookup api to get that
  // attributes that match lat-lon of the point to check against the
  // html widgets.

  const { dd_lat, dd_lon } = coords;

  await $.ajax({
    type: "POST",
    url: url,
    dataType: "json",
    data: {
      point: `POINT(${dd_lon} ${dd_lat})`,
      csrfmiddlewaretoken: token
    },
    success: success,
    error: error
  });
}
