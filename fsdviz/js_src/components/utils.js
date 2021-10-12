import { select, selectAll } from "d3-selection";

import { scaleOrdinal } from "d3-scale";

import { timeParse } from "d3";

const dateParser = timeParse("%Y-%m-%d");

// a function to prepare the json stocking data for use in our map
export const prepare_stocking_data = (data) => {
  data.agency_code = data.agency_abbrev;
  data.species_code = data.species_name;
  data.lifestage_code = data.life_stage;
  data.stockingMethod = data.stk_method;

  data.longitude = Number.parseFloat(data.longitude).toPrecision(6);
  data.latitude = Number.parseFloat(data.latitude).toPrecision(6);

  data.point = [data.longitude, data.latitude];
  data.geom = `Point(${data.longitude} ${data.latitude})`;

  data.total = +data.total_stocked;
  data.year_class = data.year_class ? data.year_class + "" : "Unkn";
  data.yreq = +data.yreq;
  data.mark = data._mark ? data._mark : "NONE";
  data.clip = data.clip ? data.clip : "NONE";
  data.month = data.month ? data.month + "" : "0";
};

export const prepare_filtered_stocking_data = (data) => {
  // Prepare our data:

  data.jurisdiction = data.jurisdiction_code;
  data.longitude = Number.parseFloat(data.longitude).toPrecision(6);
  data.latitude = Number.parseFloat(data.latitude).toPrecision(6);
  data.point = [data.longitude, data.latitude];
  data.geom = `Point(${data.longitude} ${data.latitude})`;
  data.grid_10 = data.grid10;
  data.date = data.date ? dateParser(data.date) : "";
  data.month = data.month ? parseInt(data.month) : 0;

  data.year = parseInt(data.year);
  data.year_class = parseInt(data.year_class);
  //yreq, events, & total_stocked match names on other views
  data.yreq = parseInt(data.yreq_stocked);
  data.events = 1;
  data.total = parseInt(data.no_stocked);

  data.clip = data.clip ? data.clip : "UN";
  data.tag = data._tags ? data._tags : "None";
  data.mark = data._marks ? data._marks : "None";
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

// convert out lookup arrays to arrays of the form: {key:value}
// the format exected py our piechart slice labels: {slug:key, label: "value (key)"}
const lookupToLabels = (lookup) => {
  const labels = [];
  Object.entries(lookup).forEach(([key, val]) => {
    labels.push({ slug: key, label: `${val} (${key})` });
  });

  labels.sort((a, b) => a.label.localeCompare(b.label));

  return labels;
};
// the format exected py our piechart slice labels: {slug:key, label: "value"}
const lookupToLabelsNoKey = (lookup) => {
  const labels = [];
  Object.entries(lookup).forEach(([key, val]) => {
    labels.push({ slug: key, label: `${val}` });
  });
  labels.sort((a, b) => a.label.localeCompare(b.label));
  return labels;
};

export const makePieLabels = (data, common) => {
  // given our data and common api responses, build an object
  // containing appropriated formatted labels for each pie chart.
  // the labels for lake and agency are of the form 'value (key)',
  // jurisdiction, management unit, and point are just value.
  // Additional logic is included to format juristiction, grid.  The
  // keys of the returned object must correspond to the values used
  // for spatialUnit in mapping function.

  const lake_lookup = makeItemMap(common.lakes, "abbrev", "lake_name");
  const stateprov_lookup = makeItemMap(common.stateprov, "abbrev", "name");
  const managementUnit_lookup = makeItemMap(common.manUnits, "slug", "label");
  const jurisdiction_lookup = makeItemMap(common.jurisdictions, "slug", "name");
  // prefix the jurisdiction labels with 'Lake'
  for (const [key, val] of Object.entries(jurisdiction_lookup)) {
    jurisdiction_lookup[key] = `Lake ${val}`;
  }

  const pieLabels = {};
  pieLabels["lake"] = lookupToLabels(lake_lookup);
  pieLabels["stateProv"] = lookupToLabels(stateprov_lookup);
  pieLabels["jurisdiction"] = lookupToLabelsNoKey(jurisdiction_lookup);
  pieLabels["manUnit"] = lookupToLabelsNoKey(managementUnit_lookup);

  const mygrids = [...new Set(data.map((x) => x.grid10))];
  const grid_labels = mygrids.map((x) => {
    const [_lake, grid] = x.split("_");
    return { slug: x, label: `Grid ${grid} (${_lake.toUpperCase()})` };
  });
  pieLabels["grid10"] = grid_labels;

  const mypts = [...new Set(data.map((x) => x.geom))];
  pieLabels["geom"] = mypts.map((x) => {
    return { slug: x, label: x };
  });

  return pieLabels;
};

export const makeSliceLabels = (common, stocking) => {
  // given our commonand stocking api responses, build an object
  // containing appropriatedl formated labels for each pie chart
  // slices.  Most of the labels are of the form 'value (key)'.  The
  // keys of the returned object must correspond to the values used
  // for sliceVar in mapping function.

  const agency_lookup = makeItemMap(common.agencies, "abbrev", "agency_name");
  const species_lookup = makeItemMap(common.species, "abbrev", "common_name");
  const strain_lookup = makeItemMap(common.strains, "slug", "strain_label");
  const mark_lookup = makeItemMap(
    common.physchem_marks,
    "mark_code",
    "description"
  );
  // need to account for events without any marks:
  mark_lookup["NONE"] = "No Mark";
  const tag_lookup = makeItemMap(common.strains, "tag_code", "description");
  const clip_lookup = makeItemMap(common.clipcodes, "clip_code", "description");
  const lifestage_lookup = makeItemMap(
    stocking.lifestages,
    "abbrev",
    "description"
  );
  const stocking_method_lookup = makeItemMap(
    stocking.stockingmethods,
    "stk_meth",
    "description"
  );

  const sliceLabels = {};
  sliceLabels["agency_code"] = lookupToLabels(agency_lookup);
  sliceLabels["species_code"] = lookupToLabels(species_lookup);
  sliceLabels["strain"] = lookupToLabels(strain_lookup);
  sliceLabels["mark"] = lookupToLabels(mark_lookup);
  sliceLabels["clip"] = lookupToLabels(clip_lookup);
  sliceLabels["tag"] = lookupToLabels(tag_lookup);
  sliceLabels["lifestage_code"] = lookupToLabels(lifestage_lookup);
  sliceLabels["stockingMethod"] = lookupToLabels(stocking_method_lookup);

  return sliceLabels;
};

export const makeFillColours = (common, stocking) => {
  // given our common and stocking api responses, create an object
  // to hold the colours used for each entity type. used by all
  // script that fill graphs or maps with colours.

  const fillColours = {};
  // common
  fillColours["lake"] = makeColorMap(common.lakes);
  fillColours["stateProv"] = makeColorMap(common.stateprov);
  fillColours["jurisdiction"] = makeColorMap(common.jurisdictions, "slug");
  fillColours["agency_code"] = makeColorMap(common.agencies);
  fillColours["species_code"] = makeColorMap(common.species);
  fillColours["strain"] = makeColorMap(common.strains, "slug");
  fillColours["clip"] = makeColorMap(common.clipcodes, "clip_code");
  fillColours["mark"] = makeColorMap(common.physchem_marks, "mark_code");
  fillColours["tag"] = makeColorMap(common.fish_tags, "tag_code");
  // stocking colours
  fillColours["stockingMethod"] = makeColorMap(
    stocking.stockingmethods,
    "stk_meth"
  );
  fillColours["lifestage_code"] = makeColorMap(stocking.lifestages);

  return fillColours;
};

// given a value, and an label lookup object (with keys slug and label)
// return the label of the object where slug==val, otherwise return val.

export const pluckLabel = (val, label_lookup) => {
  const label_obj = label_lookup.filter((x) => x.slug === val);
  if (label_obj.length) {
    return label_obj[0].label;
  } else {
    return val;
  }
};

export const responseVarLabels = {
  yreq: "Yearling Equivalent",
  total: "Individual",
  events: "Event",
};

export const pluralize = (value, count) => {
  return count > 1 ? value + "s" : value;
};
