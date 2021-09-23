import { select, selectAll } from "d3-selection";

import { scaleOrdinal } from "d3-scale";

// a function to prepare the json stocking data for use in our map
export const prepare_stocking_data = (data) => {
  data.point = [+data.longitude, +data.latitude];
  data.geom = `Point(${data.longitude} ${data.latitude})`;

  data.total = +data.total_stocked;
  data.year_class = data.year_class ? data.year_class + "" : "Unkn";
  data.yreq = +data.yreq;
  data.mark = data._mark ? data._mark : "NONE";
  data.clip = data.clip ? data.clip : "NONE";
  data.month = data.month ? data.month + "" : "0";
};

// a funciton to add an element to our filter registry for a dimension
// and set the filter to include all of the values in that dimension
// (all boxes will be checked to start) query_args is an optional
// object containing any query arguments parsed out of the url.
export const initialize_filter = (filters, key, dim, query_args) => {
  query_args = typeof query_args === "undefined" ? {} : query_args;

  let values = dim
    .group()
    .all()
    .map((d) => d.key);

  if (typeof query_args[key] === "undefined") {
    filters[key] = { values: values, is_filtered: false };
  } else {
    values = query_args[key].split(",");
    filters[key] = { values: values, is_filtered: true };
  }

  dim.filter((val) => filters[key].values.indexOf(val) > -1);
};

// convert pts as wkt to array of two floats
// this: "Point(-84.0326737783168 45.7810170315535)" becomes
// this: [-84.0326737783168, 45.7810170315535]
export const get_coordinates = (pt) => {
  let coords = pt.slice(pt.indexOf("(") + 1, pt.indexOf(")")).split(" ");
  return [parseFloat(coords[0]), parseFloat(coords[1])];
};

export const hideShowTableRows = (selector, row_ids) => {
  // get all of the rows in the current able and set the visibility
  // if the id of the row is in the rowIds attribute.
  selectAll("#event-list tbody tr").each(function () {
    let row_id = select(this).attr("id");

    select(this).style("display", (d) =>
      row_ids.indexOf(row_id) >= 0 ? "" : "None"
    );
  });
};

export const update_clear_button_state = (filters) => {
  // see if there are any check box filters:
  let filter_states = Object.values(filters).map((d) => d.is_filtered);

  let filtered = !filter_states.every((d) => d === false);

  let clear_button = select("#clear-filters-button");
  clear_button.classed("disabled", !filtered);
};

// a little helper function that will return a custom d3 colour
// scale if we pass an object containing key-value pairs of keys and colours
export const getColorScale = (colors) => {
  return scaleOrdinal()
    .domain(Object.entries(colors).map((x) => x[0]))
    .range(Object.entries(colors).map((x) => x[1]));
};

export const makeColorMap = (itemList, key = "abbrev") => {
  const itemMap = itemList.reduce((accumulator, d) => {
    accumulator[d[`${key}`]] = d.color;
    return accumulator;
  }, {});
  return itemMap;
};

export const makeItemMap = (itemList, key, value) => {
  const itemMap = itemList.reduce((accumulator, d) => {
    accumulator[d[`${key}`]] = d[`${value}`];
    return accumulator;
  }, {});
  return itemMap;
};
