import {
  get_coordinates,
  turfbbToLeafletbb,
} from "../components/spatial_utils";

test("get_coordinates parses lat-lon from wkt point", () => {
  let wkt = "Point(-84.0326737783168 45.7810170315535)";
  let expected = [-84.0326737783168, 45.7810170315535];
  expect(get_coordinates(wkt)).toEqual(expected);
});

test("turfbbToLeafletbb converts array to nested arrays", () => {
  // converst turf bbox which are of the form:
  // [minLon, minLat, maxLon, maxLat]
  // to leaflet bboxes which are of the form:
  // [[minLat, minLon], [maxLat, maxLon]]
  let turf_bbox = [-89.56, 46.45, -84.35, 49.01];

  let expected = [
    [46.45, -89.56],
    [49.01, -84.35],
  ];
  expect(turfbbToLeafletbb(turf_bbox)).toEqual(expected);
});
