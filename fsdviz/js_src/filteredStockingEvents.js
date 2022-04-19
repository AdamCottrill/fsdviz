/* global values dc, dataURL, maxEvents, all_species, speciesColours, markLookup, tagLookup, clipLookup */

import crossfilter from "crossfilter2";
import Leaflet from "leaflet";

import {
  select,
  selectAll,
  csv,
  json,
  format,
  scaleLinear,
  scaleOrdinal,
  range,
  extent,
  sum,
  event,
} from "d3";

import {
  update_dc_url,
  apply_url_filters,
  updateUrlParams,
  getUrlParamValue,
  getUrlSearchValue,
} from "./components/url_parsing";

import { RadioButtons } from "./components/semanticRadioButtons";
import { update_stats_panel } from "./components/stats_panel";
import { get_coordinates, add_roi } from "./components/spatial_utils";
import {
  prepare_filtered_stocking_data,
  getColorScale,
  makePieLabels,
  makeSliceLabels,
  makeFillColours,
  pluckLabel,
  pluralize,
  responseVarLabels,
} from "./components/utils";

import { piechart_overlay } from "./components/piechart_overlay";
import {
  stockingAdd,
  stockingRemove,
  stockingInitial,
} from "./components/reducers";
import { month_lookup } from "./components/constants";

let commaFormat = format(",");

const fullwidth = $("#stackedbar-chart-card").innerWidth();
const padding = 20;
const width1 = fullwidth / 2 - padding;
const width2 = fullwidth / 3 - padding;
const height1 = 400;
const height2 = 300;

let roi = getUrlSearchValue("roi") || false;

// intial values of global variabls that control the state of our page:
let spatialUnit = getUrlParamValue("spatial_unit") || "geom";

// this should probably be 'category'
let sliceVar = getUrlParamValue("category_var") || "species_code";

let responseVar = getUrlParamValue("response_var") || "yreq";

// a global object that will hold slug:label pairs for the labels of
// the currently selected spatial unit.
//const labelLookup = {};

const sharedColourScale = scaleOrdinal();

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

// add a groups to our svg - for our pie charts
let pieg = svg.append("g");

// this function is used for points events (centroids and mouse clicks)
// converts the mouse clicks and cetroids to screen corrordinates that
// correspond with current map settings:
function projectPoint(x, y) {
  const point = mymap.latLngToLayerPoint(new Leaflet.LatLng(y, x));
  return point;
}

let piecharts = piechart_overlay(mymap)
  .responseVar(responseVar)
  .getProjection(projectPoint);

//======================================================
//           RADIO BUTTONS

let strata = [
  { name: "lake", label: "Lake" },
  { name: "stateProv", label: "State/Province" },
  { name: "jurisdiction", label: "Jurisdiction" },
  { name: "manUnit", label: "Statistical District" },
  { name: "grid10", label: "10-minute Grid" },
  { name: "geom", label: "Reported Point" },
];

let spatialSelector = RadioButtons()
  .selector("#strata-selector")
  .options(strata)
  .checked(spatialUnit);

spatialSelector();

// our radio button listener
const spatial_resolution = selectAll("#strata-selector input");

// categories buttons:
// name must correspond to column names in our data
// TODO - add lookup option - for tooltip etc.

let categories = [
  { name: "lake", label: "Lake" },
  { name: "stateProv", label: "State/Province" },
  { name: "jurisdiction", label: "Jurisdiction" },
  { name: "agency_code", label: "Agency" },
  { name: "species_code", label: "Species" },
  { name: "strain", label: "Strain" },
  { name: "clip", label: "Clip" },
  { name: "mark", label: "Mark" },
  { name: "tag", label: "Tag" },
  { name: "lifestage_code", label: "Life Stage" },
  { name: "stockingMethod", label: "Stocking Method" },
];

let categorySelector = RadioButtons()
  .selector("#category-selector")
  .options(categories)
  .checked(sliceVar);

categorySelector();
const category_selector = selectAll("#category-selector input");

// Our Response Variable buttons:
let pieSizeVars = [
  { name: "yreq", label: "Yearling Equivalents" },
  { name: "total", label: "Number Stocked" },
  { name: "events", label: "Event Count" },
];

let pieSizeVarSelector = RadioButtons()
  .selector("#pie-size-selector")
  .options(pieSizeVars)
  .checked(responseVar);

pieSizeVarSelector();

const pie_size_selector = selectAll("#pie-size-selector input");

// TEMPORARY:
const centroidsURL = "/static/data/centroids.json";

Promise.all([
  json(dataURL),
  json("/api/v1/stocking/lookups"),
  json("/api/v1/common/lookups"),
  json(centroidsURL),
]).then(([data, stocking, common, centroids]) => {
  data.forEach((d) => prepare_filtered_stocking_data(d));

  // pie chart and slice labesl
  const pieLabels = makePieLabels(data, common);
  const sliceLabels = { ...pieLabels, ...makeSliceLabels(common, stocking) };
  const fillColours = makeFillColours(common, stocking);

  const updateColorScale = (value) => {
    const colors = fillColours[value];
    sharedColourScale
      .domain(Object.entries(colors).map((x) => x[0]))
      .range(Object.entries(colors).map((x) => x[1]));
  };

  updateColorScale(sliceVar);
  piecharts.fillScale(sharedColourScale);
  piecharts.pieLabelLookup(pieLabels[spatialUnit]);
  piecharts.sliceLabelLookup(sliceLabels[sliceVar]);

  // get the geographic extents of our data and update our map if
  // there is no roi.
  if (!roi) {
    const latbounds = extent(data, (d) => d.latitude);
    const longbounds = extent(data, (d) => d.longitude);
    if ((latbounds[0] == latbounds[1]) & (longbounds[0] == longbounds[1])) {
      // if there is only one point, zoom to it and use a reasonable zoom.
      mymap.flyTo([latbounds[0], longbounds[0]], 10);
    } else {
      mymap.fitBounds(
        [
          [latbounds[0], longbounds[0]],
          [latbounds[1], longbounds[1]],
        ],
        { padding: [50, 50] }
      );
    }
  }

  // see if we have the maximum number of stocking events. If so, we
  // have truncated the data and should show a warning.
  select("#record-count-warning").classed(
    "hidden",
    data.length >= maxEvents ? false : true
  );

  //=======================================================================
  //                         CROSSFILTER

  let ndx = crossfilter(data);

  let yearDim = ndx.dimension((d) => d.year);
  let monthDim = ndx.dimension((d) => d.month);

  let lakeDim = ndx.dimension((d) => d.lake);
  let agencyDim = ndx.dimension((d) => d.agency_code);
  let stateProvDim = ndx.dimension((d) => d.stateProv);
  let jurisdictionDim = ndx.dimension((d) => d.jurisdiction);
  let manUnitDim = ndx.dimension((d) => d.man_unit);
  let grid10Dim = ndx.dimension((d) => d.grid_10);
  let geomDim = ndx.dimension((d) => d.geom);

  let speciesDim = ndx.dimension((d) => d.species_code);
  let strainDim = ndx.dimension((d) => d.strain);
  let lifeStageDim = ndx.dimension((d) => d.lifestage_code);
  let clipDim = ndx.dimension((d) => d.clip);
  let tagDim = ndx.dimension((d) => d.tag);
  let markDim = ndx.dimension((d) => d.mark);
  let stkMethDim = ndx.dimension((d) => d.stockingMethod);

  // let lakeMapDim = ndx.dimension((d) => d.lake);
  // let stateProvMapDim = ndx.dimension((d) => d.stateProv);
  // let jurisdictionMapDim = ndx.dimension((d) => d.jurisdiction);

  // Create our groups here so the variables are in scope. They are
  // actually populated in a function that can be called when the
  // response variable changes and can be recalculated as needed.

  //[NOTE: this appears to work, but I'm not sure if recreateing
  //groups is the best way to do this. THe alternative would be to
  //use our custom stockingAdd, StockingRemove, stockingInital
  //reducers - but they would be continuously calculating values
  //that we might not be interested in (total, yreq and events
  //would be calculated on every change of the cross filter).]
  let yearGroup;
  let monthGroup;
  let lakeGroup;
  let agencyGroup;
  let stateProvGroup;
  let jurisdictionGroup;
  let grid10Group;
  let speciesGroup;
  let strainGroup;
  let lifeStageGroup;
  let markGroup;
  let tagGroup;
  let clipGroup;
  let stkMethGroup;

  // the function to update our groups.
  const updateGroups = (responseVar) => {
    yearGroup = yearDim.group().reduceSum((d) => d[responseVar]);
    monthGroup = monthDim.group().reduceSum((d) => d[responseVar]);
    lakeGroup = lakeDim.group().reduceSum((d) => d[responseVar]);
    agencyGroup = agencyDim.group().reduceSum((d) => d[responseVar]);
    stateProvGroup = stateProvDim.group().reduceSum((d) => d[responseVar]);
    jurisdictionGroup = jurisdictionDim
      .group()
      .reduceSum((d) => d[responseVar]);
    //let manUnitGroup = manUnitDim.group().reduceSum((d) => d[responseVar]);
    grid10Group = grid10Dim.group().reduceSum((d) => d[responseVar]);
    speciesGroup = speciesDim.group().reduceSum((d) => d[responseVar]);
    strainGroup = strainDim.group().reduceSum((d) => d[responseVar]);
    lifeStageGroup = lifeStageDim.group().reduceSum((d) => d[responseVar]);
    stkMethGroup = stkMethDim.group().reduceSum((d) => d[responseVar]);
    markGroup = markDim.group().reduceSum((d) => d[responseVar]);
    tagGroup = tagDim.group().reduceSum((d) => d[responseVar]);
    clipGroup = clipDim.group().reduceSum((d) => d[responseVar]);
  };

  updateGroups(responseVar);

  // these are the unique values for each category variable - used
  // select stack of barcharts and add 0's were necessary.
  const uniqueLakes = lakeGroup.top(Infinity).map((d) => d.key);
  const uniqueAgencies = agencyGroup.top(Infinity).map((d) => d.key);
  const uniqueStateProvs = stateProvGroup.top(Infinity).map((d) => d.key);
  const uniqueJurisdictions = jurisdictionGroup.top(Infinity).map((d) => d.key);
  const uniqueSpecies = speciesGroup.top(Infinity).map((d) => d.key);
  const uniqueStrains = strainGroup.top(Infinity).map((d) => d.key);
  const uniqueLifestages = lifeStageGroup.top(Infinity).map((d) => d.key);
  const uniqueStockingMethods = stkMethGroup.top(Infinity).map((d) => d.key);
  const uniqueMarks = markGroup.top(Infinity).map((d) => d.key);
  const uniqueClips = clipGroup.top(Infinity).map((d) => d.key);
  const uniqueTags = tagGroup.top(Infinity).map((d) => d.key);

  // set-up our spatial groups - each key will contain an object
  // with the total number of fish stocked, the number of yearling
  // equivalents, and the total number of events.  the variable
  // 'sliceVar' determines how the groups are calculated -
  // initialize them as empty objects and fill them wih a function
  // that is called again when sliceVar is changed.
  let all = {};
  let lakeMapGroup = {};
  let jurisdictionMapGroup = {};
  let stateProvMapGroup = {};
  let manUnitMapGroup = {};
  let grid10MapGroup = {};
  let geomMapGroup = {};

  const calcMapGroups = () => {
    all = ndx
      .groupAll()
      .reduce(stockingAdd(sliceVar), stockingRemove(sliceVar), stockingInitial);

    lakeMapGroup = lakeDim
      .group()
      .reduce(stockingAdd(sliceVar), stockingRemove(sliceVar), stockingInitial);

    jurisdictionMapGroup = jurisdictionDim
      .group()
      .reduce(stockingAdd(sliceVar), stockingRemove(sliceVar), stockingInitial);

    stateProvMapGroup = stateProvDim
      .group()
      .reduce(stockingAdd(sliceVar), stockingRemove(sliceVar), stockingInitial);

    manUnitMapGroup = manUnitDim
      .group()
      .reduce(stockingAdd(sliceVar), stockingRemove(sliceVar), stockingInitial);

    grid10MapGroup = grid10Dim
      .group()
      .reduce(stockingAdd(sliceVar), stockingRemove(sliceVar), stockingInitial);

    geomMapGroup = geomDim
      .group()
      .reduce(stockingAdd(sliceVar), stockingRemove(sliceVar), stockingInitial);
  };

  calcMapGroups();

  // initialize the stats panel
  update_stats_panel(all, {
    fillScale: sharedColourScale,
    label: categories.filter((d) => d.name === sliceVar)[0].label,
    //what: responseVar,
    what: sliceVar,
    row_labels: sliceLabels[sliceVar],
  });

  // set up an array of years:
  let first_year = yearDim.bottom(1)[0].year;
  let last_year = yearDim.top(1)[0].year;

  let years = range(first_year, last_year);
  years.push(last_year);

  //=========================================
  //      helper functions

  function sel_stack(item_name) {
    return function (d) {
      return d.value[item_name][responseVar];
    };
  }

  const ensure_group_bins = (group, keys) => {
    // (source_group, bins...}

    return {
      all: function () {
        let result = group.all().slice(0);
        result.forEach(function (x) {
          keys.forEach(function (d) {
            x.value[d] = x.value[d] || 0;
          });
        });
        return result;
      },
    };
  };

  select("#btn_reset_filters").on("click", () => {
    dc.filterAll();
    dc.renderAll();
  });

  //==============================================================
  // declare our dc.js plots

  const stackedByYearBarChart = dc.barChart("#stackedbar-chart");

  const lakeChart = dc.pieChart("#lake-plot");
  const stateProvChart = dc.pieChart("#state-province-plot");
  const agencyChart = dc.pieChart("#agency-plot");
  const jurisdictionChart = dc.pieChart("#jurisdiction-plot");

  const speciesChart = dc.pieChart("#species-plot");
  const strainChart = dc.pieChart("#strain-plot");

  const lifestageChart = dc.rowChart("#lifestage-plot");
  const stockingMethodChart = dc.rowChart("#stocking-method-plot");
  const stockingMonthChart = dc.rowChart("#stocking-month-plot");

  const markChart = dc.pieChart("#mark-plot");
  const tagChart = dc.pieChart("#tag-plot");
  const clipChart = dc.pieChart("#clip-plot");

  // ==================================================================

  // get the default colour scale used by DC.js so we can revert
  // the charts back if they are no longer the selected category.

  const updateChartGroups = () => {
    lakeChart.group(lakeGroup);
    stateProvChart.group(stateProvGroup);
    agencyChart.group(agencyGroup);
    jurisdictionChart.group(jurisdictionGroup);
    speciesChart.group(speciesGroup);
    strainChart.group(strainGroup);
    lifestageChart.group(lifeStageGroup);
    stockingMethodChart.group(stkMethGroup);
    stockingMonthChart.group(monthGroup);
    markChart.group(markGroup);
    tagChart.group(tagGroup);
    clipChart.group(clipGroup);
  };

  //==========================================================
  //                 DYANAMIC STACKED BAR

  let items;
  let lookupMap;
  let plotLabel;

  // a function to set our global values for item, the lookup map an plot label
  const updateStackedBarItems = (category) => {
    switch (category) {
      case "species_code":
        items = uniqueSpecies;
        lookupMap = sliceLabels["species_code"];
        plotLabel = "Species Stocked Through Time";

        break;
      case "lake":
        items = uniqueLakes;
        lookupMap = sliceLabels["lake"];
        plotLabel = "Stocking By Lake Through Time";

        break;
      case "stateProv":
        items = uniqueStateProvs;
        lookupMap = sliceLabels["stateProv"];
        plotLabel = "Stocking By State/Province Through Time";

        break;
      case "jurisdiction":
        items = uniqueJurisdictions;
        lookupMap = sliceLabels["jurisdiction"];
        plotLabel = "Stocking By Jurisdiction Through Time";

        break;
      case "agency_code":
        items = uniqueAgencies;
        lookupMap = sliceLabels["agency_code"];
        plotLabel = "Stocking By Agency Through Time";

        break;
      case "strain":
        items = uniqueStrains;
        lookupMap = sliceLabels["strain"];
        plotLabel = "Stocking By Strain Through Time";

        break;
      case "clip":
        items = uniqueClips;
        lookupMap = sliceLabels["clip"];
        plotLabel = "Stocking By Clip Through Time";

        break;
      case "mark":
        items = uniqueMarks;
        lookupMap = sliceLabels["mark"];
        plotLabel = "Stocking By Mark Through Time";

        break;
      case "tag":
        items = uniqueTags;
        lookupMap = sliceLabels["tag"];
        plotLabel = "Stocking By Tag Type Through Time";

        break;
      case "lifestage_code":
        items = uniqueLifestages;
        lookupMap = sliceLabels["lifestage_code"];
        plotLabel = "Stocking By LifeStage Through Time";

        break;
      case "stockingMethod":
        items = uniqueStockingMethods;
        lookupMap = sliceLabels["stockingMethod"];
        plotLabel = "Stocking By Stocking Method Through Time";

        break;
      default:
        items = uniqueSpecies;
        lookupMap = sliceLabels["species_code"];
        plotLabel = "Species Stocked Through Time";
    }
  };

  updateStackedBarItems(sliceVar);

  //updateStackeBarLabel(plotLabel);

  const updateStackeBarLabel = (label) => {
    select("#stackedbar-chart-heading").text(label);
  };

  const get_ylabel = (respVar) =>
    pieSizeVars.filter((x) => x.name == respVar)[0].label;

  // each time the category changes we need to redefine byYear and
  // byYearLookup so that our tooltips work.
  let byYear = yearDim
    .group()
    .reduce(stockingAdd(sliceVar), stockingRemove(sliceVar), stockingInitial);

  let byYearWith0s = ensure_group_bins(byYear, items);

  // create string for stacked bar chart tooltips:
  let barchartTooltip = function (d) {
    let layer = this.layer.trim();
    if (layer !== "0") {
      const yr = d.key;
      const N = d.value[layer] == 0 ? 0 : d.value[layer][responseVar];
      let label = pluckLabel(layer, lookupMap);
      const what = pluralize(responseVarLabels[responseVar], N);
      // some of our lookups are objects with a description attribute:
      label = typeof label === "object" ? label.description : label;

      let stocked = commaFormat(N);
      return `${yr} - ${label}: ${stocked} ${what}`;
    } else {
      return "";
    }
  };

  let stackedByYearBarChartXScale = scaleLinear().domain([
    first_year - 0.6,
    last_year + 0.55,
  ]);

  stackedByYearBarChart
    .width(fullwidth)
    .height(height1)
    .x(stackedByYearBarChartXScale)
    .margins({ left: 60, top: 20, right: 20, bottom: 33 })
    .brushOn(true)
    .centerBar(true)
    .alwaysUseRounding(true)
    .round(function (x) {
      return Math.floor(x) + 0.5;
    })
    .elasticY(true)
    .title(barchartTooltip);
  //.renderLabel(true);

  stackedByYearBarChart.xAxis().tickFormat(format("d")).ticks(years.length);

  // these are attributes we will be changing:
  stackedByYearBarChart
    .dimension(yearDim)
    .group(byYearWith0s, items[0], sel_stack(items[0]))
    .colors(sharedColourScale)
    .colorAccessor(function (d) {
      return this.layer;
    });

  for (let i = 1; i < items.length; ++i) {
    stackedByYearBarChart.stack(byYearWith0s, items[i], sel_stack(items[i]));
  }

  stackedByYearBarChart.yAxisLabel(get_ylabel(responseVar)).render();

  updateStackeBarLabel(plotLabel);

  stackedByYearBarChart.on("postRender", function () {
    stackedByYearBarChart
      .select("#stackedbar-chart rect.overlay")
      .on("dblclick", function () {
        // get the mouse corrdinates relative to our overlay (plotting) rectangle
        // not sure why d3 is needed here:
        let x = d3.mouse(this)[0];
        // convert those coordinates to years
        let yr = Math.round(stackedByYearBarChartXScale.invert(x));
        // apply a filter that is exactly on year wide
        stackedByYearBarChart.filter(dc.filters.RangedFilter(yr, yr + 1));
      });
  });

  let decrementStackedBarByYearFilter = () => {
    if (stackedByYearBarChart.filters().length) {
      let yr0 = stackedByYearBarChart.filters()[0][0];
      let yr1 = stackedByYearBarChart.filters()[0][1];
      let newFilters = dc.filters.RangedFilter(yr0 - 1, yr1 - 1);
      stackedByYearBarChart.replaceFilter(newFilters);
      dc.redrawAll();
    }
  };

  let incrementStackedBarByYearFilter = () => {
    if (stackedByYearBarChart.filters().length) {
      let yr0 = stackedByYearBarChart.filters()[0][0];
      let yr1 = stackedByYearBarChart.filters()[0][1];
      let newFilters = dc.filters.RangedFilter(yr0 + 1, yr1 + 1);
      stackedByYearBarChart.replaceFilter(newFilters);
      dc.redrawAll();
    }
  };

  // attach our increment and decrement functions to the
  // button click events
  let nextyr = select("#stackedbar-next-year").classed("visible", () => {
    return stackedByYearBarChart.hasFilter();
  });

  nextyr.on("click", incrementStackedBarByYearFilter);

  let lastyr = select("#stackedbar-previous-year").classed("visibile", () => {
    return stackedByYearBarChart.hasFilter();
  });

  lastyr.on("click", decrementStackedBarByYearFilter);

  // a function to set the state of stacked bar plot based on
  // the brush/toolip  value of tooltip (a boolean). Called by brush toggle
  // on change and when the category of the stacked bar plot is re-rendered.
  const setBrushTooltip = (tooltip) => {
    let overlay = select("#stackedbar-chart rect.overlay");
    overlay.classed("pass-through", tooltip);
    let selection = select("#stackedbar-chart rect.selection");
    selection.classed("pass-through", tooltip);
  };

  // toggle the css
  let brushtoggle = selectAll(".stackedbar-brush-toggle");
  brushtoggle.on("change", function () {
    let tooltip = true ? this.value == "tooltip" : false;
    setBrushTooltip(tooltip);
  });

  //   javascript:lakeChart.filterAll();dc.redrawAll();
  // set up our reset listener
  select("#stackedbar-chart-reset").on("click", () => {
    event.preventDefault();
    stackedByYearBarChart.filterAll();
    dc.redrawAll();
  });

  //==========================================================
  //                   LAKE

  const lakeColorScale = getColorScale(fillColours["lake"]);
  //  const getLabel = (d, lookup) => pluckLabel(d.key, lookup);
  lakeChart
    .width(width1)
    .height(height1)
    .dimension(lakeDim)
    .group(lakeGroup)
    .colors(lakeColorScale)
    .label((d) => pluckLabel(d.key, sliceLabels["lake"]))
    .title((d) => {
      const label = pluckLabel(d.key, sliceLabels["lake"]);
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${label}: ${commaFormat(d.value)} ${what}`;
    });

  lakeChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = lakeChart.filters();
      if (!filters || !filters.length) {
        select("#lake-filter").text("All").classed("filtered", false);
      } else {
        select("#lake-filter").text(filters).classed("filtered", true);
      }
    });
  });

  //   javascript:lakeChart.filterAll();dc.redrawAll();
  // set up our reset listener
  select("#lake-plot-reset").on("click", () => {
    event.preventDefault();
    lakeChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //            AGENCY

  const agencyColorScale = getColorScale(fillColours["agency_code"]);
  agencyChart
    .width(width1)
    .height(height1)
    .dimension(agencyDim)
    .group(agencyGroup)
    .colors(agencyColorScale)
    .title((d) => {
      const label = pluckLabel(d.key, sliceLabels["agency_code"]);
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${label}: ${commaFormat(d.value)} ${what}`;
    });

  agencyChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = agencyChart.filters();
      if (!filters || !filters.length) {
        select("#agency-filter").text("All").classed("filtered", false);
      } else {
        select("#agency-filter").text(filters).classed("filtered", true);
      }
    });
  });

  //   javascript:agencyChart.filterAll();dc.redrawAll();
  // set up our reset listener
  select("#agency-plot-reset").on("click", () => {
    event.preventDefault();
    agencyChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //            JURISDICTION

  const jurisdictionColorScale = getColorScale(fillColours["jurisdiction"]);

  jurisdictionChart
    .width(width1)
    .height(height1)
    .dimension(jurisdictionDim)
    .group(jurisdictionGroup)
    .colors(jurisdictionColorScale)
    .label((d) => pluckLabel(d.key, sliceLabels["jurisdiction"]))
    .title((d) => {
      const label = pluckLabel(d.key, sliceLabels["jurisdiction"]);
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${label}: ${commaFormat(d.value)} ${what}`;
    });

  jurisdictionChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = jurisdictionChart.filters();
      if (!filters || !filters.length) {
        select("#jurisdiction-filter").text("All").classed("filtered", false);
      } else {
        select("#jurisdiction-filter").text(filters).classed("filtered", true);
      }
    });
  });

  //   javascript:jurisdictionChart.filterAll();dc.redrawAll();
  // set up our reset listener
  select("#jurisdiction-plot-reset").on("click", () => {
    event.preventDefault();
    jurisdictionChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //               STATE OR PROVINCE

  const stateProvColorScale = getColorScale(fillColours["stateProv"]);
  stateProvChart
    .width(width1)
    .height(height1)
    .dimension(stateProvDim)
    .group(stateProvGroup)
    .colors(stateProvColorScale)
    .title((d) => {
      const label = pluckLabel(d.key, sliceLabels["stateProv"]);
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${label}: ${commaFormat(d.value)} ${what}`;
    });

  stateProvChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = stateProvChart.filters();
      if (!filters || !filters.length) {
        select("#state-prov-filter").text("All").classed("filtered", false);
      } else {
        select("#state-prov-filter").text(filters).classed("filtered", true);
      }
    });
  });

  //   javascript:stateProvChart.filterAll();dc.redrawAll();
  // set up our reset listener
  select("#state-province-plot-reset").on("click", () => {
    event.preventDefault();
    stateProvChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //               SPECIES

  const speciesColourScale = getColorScale(fillColours["species_code"]);
  speciesChart
    .width(width1)
    .height(height1)
    .dimension(speciesDim)
    .group(speciesGroup)
    .colors(speciesColourScale)
    .title((d) => {
      const label = pluckLabel(d.key, sliceLabels["species_code"]);
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${label}: ${commaFormat(d.value)} ${what}`;
    });

  speciesChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = speciesChart.filters();
      if (!filters || !filters.length) {
        select("#species-filter").text("All").classed("filtered", false);
      } else {
        select("#species-filter").text(filters).classed("filtered", true);
      }
    });
  });

  //   javascript:speciesChart.filterAll();dc.redrawAll();
  // set up our reset listener
  select("#species-plot-reset").on("click", () => {
    event.preventDefault();
    speciesChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //               STRAIN
  const strainColorScale = getColorScale(fillColours["strain"]);
  strainChart
    .width(width1)
    .height(height1)
    .colors(strainColorScale)
    .dimension(strainDim)
    .group(strainGroup)
    .title(
      (d) =>
        `${pluckLabel(d.key, sliceLabels["strain"])}: ${commaFormat(d.value)}`
    );

  strainChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = strainChart.filters();
      if (!filters || !filters.length) {
        select("#strain-filter").text("All").classed("filtered", false);
      } else {
        select("#strain-filter").text(filters).classed("filtered", true);
      }
    });
  });

  select("#strain-plot-reset").on("click", () => {
    event.preventDefault();
    strainChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //               LIFESTAGE

  const lifestageColorScale = getColorScale(fillColours["lifestage_code"]);

  lifestageChart
    .width(width2)
    .height(height2)
    .margins({ top: 5, left: 10, right: 10, bottom: 20 })
    .dimension(lifeStageDim)
    .group(lifeStageGroup)
    .colors(lifestageColorScale)
    //.ordering(d => d.key)
    .title((d) => {
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${commaFormat(d.value)} ${what}`;
    })
    .label((d) => pluckLabel(d.key, sliceLabels["lifestage_code"]))
    .gap(2)
    .elasticX(true)
    .xAxis()
    .ticks(4);

  lifestageChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = lifestageChart.filters();
      if (!filters || !filters.length) {
        select("#lifestage-filter").text("All").classed("filtered", false);
      } else {
        select("#lifestage-filter").text(filters).classed("filtered", true);
      }
    });
  });

  select("#lifestage-plot-reset").on("click", () => {
    event.preventDefault();
    lifestageChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //               STOCKING METHOD

  const stockingMethodColorScale = getColorScale(fillColours["stockingMethod"]);
  stockingMethodChart
    .width(width2)
    .height(height2)
    .margins({ top: 5, left: 10, right: 10, bottom: 20 })
    .dimension(stkMethDim)
    .group(stkMethGroup)
    .colors(stockingMethodColorScale)
    //.ordering(d => d.key)
    .gap(2)
    .title((d) => {
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${commaFormat(d.value)} ${what}`;
    })
    .label((d) => pluckLabel(d.key, sliceLabels["stockingMethod"]))
    .elasticX(true)
    .xAxis()
    .ticks(4);

  stockingMethodChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = stockingMethodChart.filters();
      if (!filters || !filters.length) {
        select("#stocking-method-filter")
          .text("All")
          .classed("filtered", false);
      } else {
        select("#stocking-method-filter")
          .text(filters)
          .classed("filtered", true);
      }
    });
  });

  select("#stocking-method-plot-reset").on("click", () => {
    event.preventDefault();
    stockingMethodChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //               STOCKING MONTH

  stockingMonthChart
    .width(width2)
    .height(height2)
    .margins({ top: 5, left: 10, right: 10, bottom: 20 })
    .dimension(monthDim)
    .group(monthGroup)
    .ordering((d) => d.key)
    .gap(2)
    .title((d) => {
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${commaFormat(d.value)} ${what}`;
    })
    .label((d) => month_lookup[d.key])
    .elasticX(true)
    .xAxis()
    .ticks(4);

  stockingMonthChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = stockingMonthChart.filters();
      if (!filters || !filters.length) {
        select("#stocking-month-filter").text("All").classed("filtered", false);
      } else {
        let labels = filters.map((d) => month_lookup[d]);
        select("#stocking-month-filter").text(labels).classed("filtered", true);
      }
    });
  });

  select("#stocking-month-plot-reset").on("click", () => {
    event.preventDefault();
    stockingMonthChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //               MARKS

  const markColorScale = getColorScale(fillColours["mark"]);

  markChart
    .width(width2)
    .height(height2)
    .dimension(markDim)
    .group(markGroup)
    .colors(markColorScale)
    .title((d) => {
      const label = pluckLabel(d.key, sliceLabels["mark"]);
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${label}: ${commaFormat(d.value)} ${what}`;
    });

  markChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = markChart.filters();
      if (!filters || !filters.length) {
        select("#mark-filter").text("All").classed("filtered", false);
      } else {
        select("#mark-filter").text(filters).classed("filtered", true);
      }
    });
  });

  select("#mark-plot-reset").on("click", () => {
    event.preventDefault();
    markChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //               CLIPS

  const clipColorScale = getColorScale(fillColours["clip"]);

  clipChart
    .width(width2)
    .height(height2)
    .dimension(clipDim)
    .group(clipGroup)
    .colors(clipColorScale)
    .title((d) => {
      const label = pluckLabel(d.key, sliceLabels["clip"]);
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${label}: ${commaFormat(d.value)} ${what}`;
    });

  clipChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = clipChart.filters();
      if (!filters || !filters.length) {
        select("#clip-filter").text("All").classed("filtered", false);
      } else {
        select("#clip-filter").text(filters).classed("filtered", true);
      }
    });
  });

  select("#clip-plot-reset").on("click", () => {
    event.preventDefault();
    clipChart.filterAll();
    dc.redrawAll();
  });

  //==============================================
  //               TAGS

  const tagColorScale = getColorScale(fillColours["tag"]);

  tagChart
    .width(width2)
    .height(height2)
    .dimension(tagDim)
    .group(tagGroup)
    .colors(tagColorScale)
    .title((d) => {
      const label = pluckLabel(d.key, sliceLabels["tag"]);
      const what = pluralize(responseVarLabels[responseVar], d.value);
      return `${label}: ${commaFormat(d.value)} ${what}`;
    });

  tagChart.on("renderlet", function (chart) {
    dc.events.trigger(function () {
      let filters = tagChart.filters();
      if (!filters || !filters.length) {
        select("#tag-filter").text("All").classed("filtered", false);
      } else {
        select("#tag-filter").text(filters).classed("filtered", true);
      }
    });
  });

  select("#tag-plot-reset").on("click", () => {
    event.preventDefault();
    tagChart.filterAll();
    dc.redrawAll();
  });

  //update the url when the dc plot filters change:
  dc.chartRegistry.list().forEach(function (chart) {
    chart.on("filtered", function () {
      update_dc_url();
    });
  });

  //==================================================+
  //         RADIO BUTTON CHANGE LISTENERS

  // an accessor function to get values of our currently selected
  // response variable.
  let ptAccessor = (d) =>
    Object.keys(d.value).map((x) => d.value[x][responseVar]);

  // a helper function to get the data in the correct format for
  const get_pts = (spatialUnit, centroids, ptAccessor) => {
    let pts;

    switch (spatialUnit) {
      case "lake":
        pts = Object.values(lakeMapGroup.all());
        if (lakeChart.hasFilter()) {
          pts = pts.filter((pt) => lakeChart.filters().includes(pt.key));
        }

        break;
      case "stateProv":
        pts = Object.values(stateProvMapGroup.all());
        if (stateProvChart.hasFilter()) {
          pts = pts.filter((pt) => stateProvChart.filters().includes(pt.key));
        }
        break;
      case "jurisdiction":
        pts = Object.values(jurisdictionMapGroup.all());
        if (jurisdictionChart.hasFilter()) {
          pts = pts.filter((pt) =>
            jurisdictionChart.filters().includes(pt.key)
          );
        }
        break;
      case "manUnit":
        pts = Object.values(manUnitMapGroup.all());
        break;
      case "grid10":
        pts = Object.values(grid10MapGroup.all());
        break;
      case "geom":
        pts = Object.values(geomMapGroup.all());
        break;
    }

    if (spatialUnit === "geom") {
      pts.forEach((d) => (d["coordinates"] = get_coordinates(d.key)));
    } else {
      pts.forEach((d) => (d["coordinates"] = centroids[spatialUnit][d.key]));
    }
    pts.forEach((d) => (d["total"] = sum(ptAccessor(d))));

    return pts.filter((d) => d.total > 0);
  };

  // recacalculate the points given the current spatial unit and
  // point accessor
  const updatePieCharts = () => {
    piecharts.fillScale(sharedColourScale).selectedPie(null).clear_pointInfo();
    piecharts.pieLabelLookup(pieLabels[spatialUnit]);
    piecharts.sliceLabelLookup(sliceLabels[sliceVar]);

    const pts = get_pts(spatialUnit, centroids, ptAccessor);
    pieg.data([pts]).call(piecharts);

    update_stats_panel(all, {
      fillScale: sharedColourScale,
      label: categories.filter((d) => d.name === sliceVar)[0].label,
      what: sliceVar,
      row_labels: sliceLabels[sliceVar],
    });
  };

  updatePieCharts();

  // if the spatial radio buttons change, update the global variable
  // and update the pie charts
  const update_spatialUnit = (value) => {
    spatialUnit = value;
    spatialSelector.checked(spatialUnit).refresh();
    updatePieCharts();
  };

  // if the pie chart slice selector radio buttons changes, update
  // the global variable and update the pie charts
  const update_sliceValue = (value) => {
    sliceVar = value;
    calcMapGroups();
    updatePieCharts();
  };

  // set up a change event handler each fime the crossfilter changes
  ndx.onChange(() => {
    updatePieCharts();
  });

  //==================================================+
  //         RADIO BUTTON CHANGE LISTENERS

  spatial_resolution.on("change", function () {
    updateUrlParams("spatial_unit", this.value);
    update_spatialUnit(this.value);
  });

  pie_size_selector.on("change", function () {
    updateUrlParams("response_var", this.value);
    responseVar = this.value;
    stackedByYearBarChart.yAxisLabel(get_ylabel(responseVar));
    updateGroups(responseVar);
    updateChartGroups();
    piecharts.responseVar(responseVar);
    updatePieCharts();
    dc.renderAll();

    // make sure the behaviour of the stacked bar plot matches
    // the currently selected option:
    let tmp = select('input[name="brush-toggle"]:checked').node().value;
    setBrushTooltip(tmp === "tooltip");
  });

  //==========================================================
  //     CATEGORY VARIABLE HAS CHANGED!
  category_selector.on("change", function () {
    sliceVar = this.value;
    //update_CategoryValue(sliceVar);
    updateColorScale(sliceVar);
    updateUrlParams("category_var", this.value);
    //resetChartColours();
    updateStackedBarItems(sliceVar);

    byYear = yearDim
      .group()
      .reduce(stockingAdd(sliceVar), stockingRemove(sliceVar), stockingInitial);

    byYearWith0s = ensure_group_bins(byYear, items);

    calcMapGroups(sliceVar);
    updateStackeBarLabel(plotLabel);
    updatePieCharts();

    stackedByYearBarChart
      .group(byYearWith0s, items[0], sel_stack(items[0]))
      .colors(sharedColourScale);

    for (let i = 1; i < items.length; ++i) {
      stackedByYearBarChart.stack(byYearWith0s, items[i], sel_stack(items[i]));
    }

    dc.redrawAll();
    //stackedByYearBarChart.redraw();
    stackedByYearBarChart.render();

    let tmp = select('input[name="brush-toggle"]:checked').node().value;
    setBrushTooltip(tmp === "tooltip");
  });

  mymap.on("moveend", function () {
    //polygons.render();
    pieg.call(piecharts);
  });

  //

  // page load
  dc.renderAll();
  apply_url_filters();
  dc.renderAll();
});
