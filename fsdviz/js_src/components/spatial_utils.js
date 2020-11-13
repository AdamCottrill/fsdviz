/* global $ spatialAttrURL spatialAttrs topojson */

import helpers from "@turf/helpers";
import bbox from "@turf/bbox";
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
      csrfmiddlewaretoken: token,
    },
    success: success,
    error: error,
  });
}

// given our topojson file, the feature type, and the slug, return the
// bounding box of that feature - used to set intial zoom of our
// leaflet map.
// feature type can be one of "lakes", "jurisdictions", or "manUnits"
// get_feature_bbox(topodata, "lakes", "HU");
// get_feature_bbox(topodata, "jurisdictions", "hu_on");
// get_feature_bbox(topodata, "mus", "hu_mu_mh6");

export const get_feature_bbox = (topodata, feature_type, slug) => {
  return topojson
    .feature(topodata, topodata.objects[feature_type])
    .features.filter((d) => d.properties.slug === slug)
    .map((d) => bbox(d));
};

// converst turf bbox which are of the form:
// [minLon, minLat, maxLon, maxLat]
// to leaflet bboxes which are of the form:
// [[minLat, minLon], [maxLat, maxLon]]
//  [41.38, -92.09],
//  [49.01, -76.05],
export const turfbbToLeafletbb = (turf_bb) => {
  return [
    [turf_bb[1], turf_bb[0]],
    [turf_bb[3], turf_bb[2]],
  ];
};

// convert pts as wkt to array of two floats
// this: "Point(-84.0326737783168 45.7810170315535)" becomes
// this: [-84.0326737783168, 45.7810170315535]
export const get_coordinates = (pt) => {
  let coords = pt.slice(pt.indexOf("(") + 1, pt.indexOf(")")).split(" ");
  return [parseFloat(coords[0]), parseFloat(coords[1])];
};
