/* global axios spatialAttrURL spatialAttrs topojson */
import L from "leaflet";
import { wktToGeoJSON } from "@terraformer/wkt";

import bbox from "@turf/bbox";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

export const getSpatialAttrs = async (coords, url, token) => {
  // given a lat, lon, a url, csrf_token, call our spatial lookup api
  // to get that attributes that match lat-lon of the point to check
  // against the html widgets.  IF there an error, print it to the
  // console and return an object with empty elements for lake,
  // jurisdiction, management unit, and grid.

  const { dd_lat, dd_lon } = coords;

  const data = {
    point: `POINT(${dd_lon} ${dd_lat})`,
  };

  try {
    const response = await axios.post(spatialAttrURL, data, {
      headers: {
        "X-CSRFTOKEN": token,
      },
    });
    return response.data;
  } catch (err) {
    console.log("axios error:", err);
    return {
      lake: "",
      jurisdiction: "",
      manUnit: "",
      grid10: "",
    };
  }
};

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

export const add_roi = (leaflet_map, roi_wkt) => {
  // our our region of interest to our leaflet map including a
  // widget to toggle the layer on and off, as well as pop text to
  // make the wkt string available to users to copy for other uses.
  let popup_text = `<h4>Region of Interest as WKT:<h4><p>${roi_wkt}<p>`;
  let roi_geojson = wktToGeoJSON(roi_wkt);
  let roi_layer = new L.geoJson();

  roi_layer.addData(roi_geojson).bindPopup(popup_text);
  roi_layer.addTo(leaflet_map);
  leaflet_map.fitBounds(roi_layer.getBounds(), { padding: [50, 50] });

  let overlays = {
    "Region of Interest": roi_layer,
  };
  L.control.layers(null, overlays).addTo(leaflet_map);
};
