/* global values dc, dataURL, maxEvents, all_species, speciesColours, markLookup, tagLookup, clipLookup */

// todo - create lookup table maps for each category
// initiaze widgets
// toggle region of interest
// update check boxes to show tool tip make count optional.

//import crossfilter from "crossfilter2";
import { select, selectAll, json, extent, scaleOrdinal } from "d3";

//import { timeParse } from "d3-time-format";

import Leaflet from "leaflet";

import { checkBoxes } from "./components/checkBoxArray";
import { update_category_legend } from "./components/stats_panel";
import {
  //  update_dc_url,
  updateUrlCheckBoxParams,
  parseParams,
  apply_url_filters,
  updateUrlParams,
  getUrlParamValue,
  getUrlSearchValue,
} from "./components/url_parsing";

import { RadioButtons } from "./components/semanticRadioButtons";

import {
  speciesColours,
  all_species_abbrev,
  month_lookup,
} from "./components/constants";

import { get_coordinates, add_roi } from "./components/spatial_utils";
import {
  makeLookup,
  initialize_filter,
  hideShowTableRows,
  update_clear_button_state,
} from "./components/utils";

const filters = {};

// intial values of global variabls that control the state of our page:
const roi = getUrlSearchValue("roi") || false;
let catgory = getUrlParamValue("category_var") || "species_code";

const colourScale = scaleOrdinal()
  .range(speciesColours)
  .domain(all_species_abbrev);

let categoryVar = getUrlParamValue("categoryVar")
  ? getUrlParamValue("categoryVar")
  : "spc";

let jitter_points = getUrlParamValue("jitter-points")
  ? getUrlParamValue("jitter-points")
  : false;

let selectedEvent = getUrlParamValue("selected-event")
  ? getUrlParamValue("selected-event")
  : "";

// categorys buttons:
// name must correspond to column names in our data
// label appears on radio buttons:
let categories = [
  { name: "agency_code", label: "Agency" },
  //{ name: "tag_type", label: "CWT Type" },
  { name: "cwtReused", label: "CWT Re-used" },
  { name: "spc", label: "Species" },
  { name: "strain", label: "Strain" },
  //{ name: "mark", label: "Mark" },
  { name: "clipcode", label: "Clip Code" },
  { name: "stage", label: "Life Stage" },
  { name: "method", label: "Stocking Method" },
  { name: "stockingYear", label: "Stocking Year" },
  { name: "stockingMonth", label: "Stocking Month" },
  { name: "yearClass", label: "Year Class" },
];

const categoryLabels = categories.reduce((acc, x) => {
  acc[x.name] = x.label;
  return acc;
}, {});

let categorySelector = RadioButtons()
  .selector("#category-selector")
  .options(categories)
  .checked(categoryVar);

categorySelector();
const category_selection = selectAll("#category-selector input");

// setup the map with rough bounds (need to get pies to plot first,
// this will be tweaked later):
const mymap = Leaflet.map("mapid", {
  zoomDelta: 0.25,
  zoomSnap: 0,
}).fitBounds(
  [
    [41.38, -92.09],
    [49.01, -76.05],
  ],
  { padding: [50, 50] }
);

Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  maxZoom: 18,
}).addTo(mymap);

if (roi) {
  add_roi(mymap, roi);
}
// Add a svg layer to the map
Leaflet.svg().addTo(mymap);

// Select the svg area and add a group element we can use to move things around:
let svg = select("#mapid").select("svg");
// // add a groups to our svg - for our pie charts
let pointg = svg.append("g").attr("class", "leaflet-zoom-hide");

Promise.all([
  json(dataURL),
  json("/api/v1/stocking/lookups"),
  json("/api/v1/common/lookups"),
  //  json(centroidsURL),
  //json(topoURL),
  // csv(slugURL),
]).then(([data, stocking, common]) => {
  // create our lookups so that our widgets have nice labels:
  const lakeLookup = makeLookup(common["lakes"], "abbrev", "lake_name");
  const agencyLookup = makeLookup(common["agencies"], "abbrev", "agency_name");

  const jurisdictionLookup = makeLookup(
    common["jurisdictions"],
    "slug",
    "description"
  );

  const manUnitLookup = makeLookup(common["manUnits"], "slug", "label");

  const speciesLookup = makeLookup(common["species"], "abbrev", "common_name");
  const strainLookup = makeLookup(common["strains"], "slug", "strain_label");

  const stockingMethodLookup = makeLookup(
    stocking["stockingmethods"],
    "stk_meth",
    "description"
  );
  const lifestageLookup = makeLookup(
    stocking["lifestages"],
    "abbrev",
    "description"
  );

  const clipcodeLookup = [];

  const lookup_values = {
    //lake: lakeGroup.top(Infinity).map((d) => d.key),
    agency_code: agencyLookup,
    spc: speciesLookup,
    strain: strainLookup,
    stage: lifestageLookup,
    method: stockingMethodLookup,
    //marks:
    clipcode: clipcodeLookup,
    //stockingMonth: month_lookup
  };

  // clipcodeLookup
  // marksLookup
  // tagsLookup
  // Month?

  // Prepare our actual cwt data:
  data.forEach((d) => {
    d.key = d.stock_id + "-" + d.cwt_number;
    d.cwtReused = d.tag_reused ? "yes" : "no";
    d.point = { lng: +d.longitude, lat: +d.latitude };
    d.stockingMonth = month_lookup[d.month]
      ? "" + month_lookup[d.month]
      : "Unkn";
    d.yearClass = d.year_class ? "" + d.year_class : "9999";
    d.stockingYear = d.year ? "" + d.year : "9999";
    d.clipcode = d.clipcode ? d.clipcode.trim() : "None";
    //d.month = d.month ? parseInt(d.month) : 0;
    //d.year = parseInt(d.year);
    //d.year_class = parseInt(d.year_class);

    return d;
  });

  // get the geographic extents of our data and update our map if
  // there is no roi.
  if (!roi) {
    const latbounds = extent(data, (d) => d.latitude);
    const longbounds = extent(data, (d) => d.longitude);
    mymap.fitBounds(
      [
        [latbounds[0], longbounds[0]],
        [latbounds[1], longbounds[1]],
      ],
      { padding: [50, 50] }
    );
  }

  // //=======================================================================
  // //                         CROSSFILTER

  console.log("data[1] = ", data[0]);

  const ndx = crossfilter(data);

  const eventDim = ndx.dimension((d) => d.stock_id);
  const yearDim = ndx.dimension((d) => d.stockingYear);
  const monthDim = ndx.dimension((d) => d.stockingMonth);

  const cwtReusedDim = ndx.dimension((d) => d.cwtReused);

  const lakeDim = ndx.dimension((d) => d.lake);
  const agencyDim = ndx.dimension((d) => d.agency_code);
  const stateProvDim = ndx.dimension((d) => d.state);
  const jurisdictionDim = ndx.dimension((d) => d.jurisd);
  const manUnitDim = ndx.dimension((d) => d.man_unit);

  const speciesDim = ndx.dimension((d) => d.spc);
  const strainDim = ndx.dimension((d) => d.strain);
  const yearClassDim = ndx.dimension((d) => d.yearClass);
  const lifeStageDim = ndx.dimension((d) => d.stage);
  const stkMethDim = ndx.dimension((d) => d.method);
  const clipCodeDim = ndx.dimension((d) => d.clipcode);
  // // const markDim = ndx.dimension((d) => d.mark);
  // // const tagDim = ndx.dimension((d) => d.tag);

  const eventGroup = eventDim.group().reduceCount();
  const yearGroup = yearDim.group().reduceCount();
  const monthGroup = monthDim.group().reduceCount();
  const cwtReusedGroup = cwtReusedDim.group().reduceCount();
  const lakeGroup = lakeDim.group().reduceCount();
  const agencyGroup = agencyDim.group().reduceCount();
  const stateProvGroup = stateProvDim.group().reduceCount();
  const jurisdictionGroup = jurisdictionDim.group().reduceCount();
  const manUnitGroup = manUnitDim.group().reduceCount();

  const speciesGroup = speciesDim.group().reduceCount();
  const strainGroup = strainDim.group().reduceCount();
  const yearClassGroup = yearClassDim.group().reduceCount();
  const lifeStageGroup = lifeStageDim.group().reduceCount();
  const stkMethGroup = stkMethDim.group().reduceCount();
  const clipCodeGroup = clipCodeDim.group().reduceCount();
  // const markGroup = markDim.group().reduceCount();
  // const tagGroup = tagDim.group().reduceCount();

  const activeIds = () => {
    const ids = ndx.allFiltered().map((x) => x.key);
    // get the unique stocking events:
    return ids.filter((v, i, a) => a.indexOf(v) === i);
  };

  // unique values for each category - keys here must match name
  // attribute of corresponding category
  const months = Object.entries(month_lookup).map((x) => x[1]);
  const unique_values = {
    cwtReused: cwtReusedGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort(),
    //lake: lakeGroup.top(Infinity).map((d) => d.key),
    agency_code: agencyGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort(),
    spc: speciesGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort(),
    strain: strainGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort(),
    stage: lifeStageGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort(),
    method: stkMethGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort(),
    //marks: markGroup.top(Infinity).map((d) => d.key),
    clipcode: clipCodeGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort(),
    yearClass: yearClassGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort(),
    stockingMonth: monthGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort((a, b) => months.indexOf(a) - months.indexOf(b)),
    stockingYear: yearGroup
      .top(Infinity)
      .map((d) => d.key)
      .sort(),
  };

  // we need to add entries to our lookup object for stocking year and
  // year class that are one-to-one (the name and
  // the label are the same):

  lookup_values["stockingMonth"] = unique_values["stockingMonth"].reduce(
    (acc, x) => {
      acc[x] = x;
      return acc;
    },
    {}
  );

  lookup_values["stockingYear"] = unique_values["stockingYear"].reduce(
    (acc, x) => {
      acc[x] = x;
      return acc;
    },
    {}
  );
  lookup_values["yearClass"] = unique_values["yearClass"].reduce((acc, x) => {
    acc[x] = x;
    return acc;
  }, {});
  lookup_values["yearClass"]["9999"] = "Unknown";

  // total work around for today:
  lookup_values["clipcode"] = unique_values["clipcode"].reduce((acc, x) => {
    acc[x] = x;
    return acc;
  }, {});

  lookup_values["cwtReused"] = { yes: "Yes", no: "No" };

  // // get any query parameters from the url
  let query_args = parseParams(window.location.hash);

  const set_or_reset_filters = (query_args) => {
    initialize_filter(filters, "lake", lakeDim, query_args);
    initialize_filter(filters, "stateProv", stateProvDim, query_args);
    initialize_filter(filters, "jurisdiction", jurisdictionDim, query_args);
    initialize_filter(filters, "manUnit", manUnitDim, query_args);
    initialize_filter(filters, "agency", agencyDim, query_args);
    initialize_filter(filters, "species", speciesDim, query_args);
    initialize_filter(filters, "strain", strainDim, query_args);
    initialize_filter(filters, "yearClass", yearClassDim, query_args);
    initialize_filter(filters, "lifeStage", lifeStageDim, query_args);
    // initialize_filter(filters, "mark", markDim, query_args);
    initialize_filter(filters, "clipCode", clipCodeDim, query_args);
    initialize_filter(filters, "stkMeth", stkMethDim, query_args);
    initialize_filter(filters, "stockingMonth", monthDim, query_args);
    initialize_filter(filters, "stockingYear", yearDim, query_args);
    initialize_filter(filters, "cwtReused", cwtReusedDim, query_args);
  };

  set_or_reset_filters(query_args);

  const clear_button = select("#clear-filters-button");
  clear_button.on("click", set_or_reset_filters);

  const cwtReusedSelection = select("#cwt-reused-filter");
  checkBoxes(cwtReusedSelection, {
    filterkey: "cwtReused",
    xfdim: cwtReusedDim,
    xfgroup: cwtReusedGroup,
    filters: filters,
  });

  const lakeSelection = select("#lake-filter");
  checkBoxes(lakeSelection, {
    filterkey: "lake",
    xfdim: lakeDim,
    xfgroup: lakeGroup,
    filters: filters,
  });

  const stateProvSelection = select("#state-prov-filter");
  checkBoxes(stateProvSelection, {
    filterkey: "stateProv",
    xfdim: stateProvDim,
    xfgroup: stateProvGroup,
    filters: filters,
  });

  const jurisdictionSelection = select("#jurisdiction-filter");
  checkBoxes(jurisdictionSelection, {
    filterkey: "jurisdiction",
    xfdim: jurisdictionDim,
    xfgroup: jurisdictionGroup,
    filters: filters,
  });

  const manUnitSelection = select("#manUnit-filter");
  checkBoxes(manUnitSelection, {
    filterkey: "manUnit",
    xfdim: manUnitDim,
    xfgroup: manUnitGroup,
    filters: filters,
  });

  const agencySelection = select("#agency-filter");
  checkBoxes(agencySelection, {
    filterkey: "agency",
    xfdim: agencyDim,
    xfgroup: agencyGroup,
    filters: filters,
  });

  const speciesSelection = select("#species-filter");
  checkBoxes(speciesSelection, {
    filterkey: "species",
    xfdim: speciesDim,
    xfgroup: speciesGroup,
    filters: filters,
  });

  const strainSelection = select("#strain-filter");
  checkBoxes(strainSelection, {
    filterkey: "strain",
    xfdim: strainDim,
    xfgroup: strainGroup,
    filters: filters,
  });

  const yearClassSelection = select("#year-class-filter");
  checkBoxes(yearClassSelection, {
    filterkey: "yearClass",
    xfdim: yearClassDim,
    xfgroup: yearClassGroup,
    filters: filters,
  });

  const lifeStageSelection = select("#life-stage-filter");
  checkBoxes(lifeStageSelection, {
    filterkey: "lifeStage",
    xfdim: lifeStageDim,
    xfgroup: lifeStageGroup,
    filters: filters,
  });

  const clipCodeSelection = select("#clip-code-filter");
  checkBoxes(clipCodeSelection, {
    filterkey: "clipCode",
    xfdim: clipCodeDim,
    xfgroup: clipCodeGroup,
    filters: filters,
  });

  // const markSelection = select("#mark-filter");
  // checkBoxes(markSelection, {
  //   filterkey: "mark",
  //   xfdim: markDim,
  //   xfgroup: markGroup,
  //   filters: filters,
  // });

  const monthSelection = select("#stocking-month-filter");
  checkBoxes(monthSelection, {
    filterkey: "stockingMonth",
    xfdim: monthDim,
    xfgroup: monthGroup,

    filters: filters,
  });

  const stkMethSelection = select("#stocking-method-filter");
  checkBoxes(stkMethSelection, {
    filterkey: "stkMeth",
    xfdim: stkMethDim,
    xfgroup: stkMethGroup,
    filters: filters,
  });

  //===============================================

  const plot_points = (points) => {
    if (jitter_points) {
      let jitter_size = 20;
      const jitter = () => (Math.random() - 0.5) * jitter_size;
      points
        .attr("cx", (d) => mymap.latLngToLayerPoint(d.point).x + jitter())
        .attr("cy", (d) => mymap.latLngToLayerPoint(d.point).y + jitter())
        .transition()
        .duration(900);
    } else {
      points
        .attr("cx", (d) => mymap.latLngToLayerPoint(d.point).x)
        .attr("cy", (d) => mymap.latLngToLayerPoint(d.point).y)
        .transition()
        .duration(900);
    }
  };

  const update_map = () => {
    let points = pointg
      .selectAll(".point")
      .data(ndx.allFiltered(), (d) => d.key);

    points.exit().transition().duration(200).remove();

    let pointsEnter = points
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("id", (d) => d.key)
      .style("stroke", "black")
      .attr("stroke-width", 0.5)
      .style("opacity", 0.6)
      .attr("r", 5)
      .attr("pointer-events", "visible")
      .on("mouseover", function (d) {
        select(this).classed("hover", true);
      })
      .on("mouseout", function (d) {
        select(this).classed("hover", false);
      })
      .on("click", function (d) {
        select(`tr[id="${selectedEvent}"]`).classed("blue", false);
        select(`circle[id="${selectedEvent}"]`)
          .classed("selected-event", false)
          .attr("r", 5);
        if (d.key === selectedEvent) {
          selectedEvent = "";
        } else {
          selectedEvent = d.key;
          select(this).attr("r", 8).classed("selected-event", true);
          select(`tr[id="${d.key}"]`).classed("blue", true);
        }
        updateUrlParams("selected-event", selectedEvent);
      });

    points
      .merge(pointsEnter)
      .style("fill", (d) => colourScale(d[categoryVar]))
      .transition()
      .duration(500);

    plot_points(points);
  };

  // Function that update circle position if we zoom or pan:
  const move_points = () => {
    let points = selectAll(".point");
    plot_points(points);
    //.attr("cx", (d) => mymap.latLngToLayerPoint(d.point).x)
    //.attr("cy", (d) => mymap.latLngToLayerPoint(d.point).y);
  };

  mymap.on("zoomend", move_points);

  const jitter_toggle = select("#jitter-points-toggle");
  // initialize the jitter points to our value on page load.
  jitter_toggle.property("checked", jitter_points);

  jitter_toggle.on("change", function (e) {
    jitter_points = this.checked;
    updateUrlParams("jitter-points", jitter_points);
    move_points();
  });

  // if there is an selected event identified in the url, highlight it and its corresponding row:
  if (selectedEvent) {
    select(`circle[id="${selectedEvent}"]`)
      .classed("selected-event", true)
      .attr("r", 8);
    select(`tr[id="${selectedEvent}"]`).classed("blue", true);
  }

  selectAll("tr");

  //===============================================

  const refresh_legend = () => {
    let category_label = categoryLabels[categoryVar] || "Category";

    // get the labels by filter the global lookups for this category with
    // those values present in the current view:
    const items = unique_values[categoryVar];
    const lookup = lookup_values[categoryVar];
    const itemList = Object.entries(lookup).filter(
      (x) => items.indexOf(x[0]) >= 0
    );

    if (categoryVar === "spc") {
      colourScale.domain(all_species_abbrev);
    } else {
      colourScale.domain(items);
    }
    updateUrlParams("categoryVar", categoryVar);
    update_category_legend(colourScale, itemList, category_label);
    update_map();
  };

  // when the selected category changes - update the colour scale
  // and legend
  category_selection.on("change", function () {
    categoryVar = this.value;
    refresh_legend();
  });

  // // initialize our filters when everything loads
  update_clear_button_state(filters);
  updateUrlCheckBoxParams(filters);
  update_map();
  refresh_legend();
  hideShowTableRows("#event-list tbody tr", activeIds());

  // if the crossfilter changes, update our checkboxes:
  ndx.onChange(() => {
    update_map();
    refresh_legend();
    hideShowTableRows("#event-list tbody tr", activeIds());
    update_clear_button_state(filters);
    updateUrlCheckBoxParams(filters);

    checkBoxes(cwtReusedSelection, {
      filterkey: "cwtReused",
      xfdim: cwtReusedDim,
      xfgroup: cwtReusedGroup,
      filters: filters,
    });

    checkBoxes(lakeSelection, {
      filterkey: "lake",
      xfdim: lakeDim,
      xfgroup: lakeGroup,
      filters: filters,
    });

    checkBoxes(stateProvSelection, {
      filterkey: "stateProv",
      xfdim: stateProvDim,
      xfgroup: stateProvGroup,
      filters: filters,
    });

    checkBoxes(jurisdictionSelection, {
      filterkey: "jurisdiction",
      xfdim: jurisdictionDim,
      xfgroup: jurisdictionGroup,
      filters: filters,
    });

    checkBoxes(manUnitSelection, {
      filterkey: "manUnit",
      xfdim: manUnitDim,
      xfgroup: manUnitGroup,
      filters: filters,
    });

    checkBoxes(agencySelection, {
      filterkey: "agency",
      xfdim: agencyDim,
      xfgroup: agencyGroup,
      filters: filters,
    });

    checkBoxes(speciesSelection, {
      filterkey: "species",
      xfdim: speciesDim,
      xfgroup: speciesGroup,
      filters: filters,
    });

    checkBoxes(strainSelection, {
      filterkey: "strain",
      xfdim: strainDim,
      xfgroup: strainGroup,
      filters: filters,
    });

    checkBoxes(yearClassSelection, {
      filterkey: "yearClass",
      xfdim: yearClassDim,
      xfgroup: yearClassGroup,
      filters: filters,
    });

    checkBoxes(lifeStageSelection, {
      filterkey: "lifeStage",
      xfdim: lifeStageDim,
      xfgroup: lifeStageGroup,
      filters: filters,
    });

    checkBoxes(clipCodeSelection, {
      filterkey: "clipCode",
      xfdim: clipCodeDim,
      xfgroup: clipCodeGroup,
      filters: filters,
    });

    // checkBoxes(markSelection, {
    //   filterkey: "mark",
    //   xfdim: markDim,
    //   xfgroup: markGroup,
    //   filters: filters,
    // });

    checkBoxes(monthSelection, {
      filterkey: "stockingMonth",
      xfdim: monthDim,
      xfgroup: monthGroup,
      filters: filters,
    });

    checkBoxes(stkMethSelection, {
      filterkey: "stkMeth",
      xfdim: stkMethDim,
      xfgroup: stkMethGroup,
      filters: filters,
    });
  });
});
