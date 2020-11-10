import { get_coordinates } from "../components/utils";

test("get_coordinates parses lat-lon from wkt point", () => {
  let wkt = "Point(-84.0326737783168 45.7810170315535)";
  let expected = [-84.0326737783168, 45.7810170315535];
  expect(get_coordinates(wkt)).toEqual(expected);
});
