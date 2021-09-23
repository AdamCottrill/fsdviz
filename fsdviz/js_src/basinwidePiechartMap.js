/* global  $, dataURL,  topoUrl, centroidsUrl, sliceVar, spatialUnit, yearRange, currentYear */

import debug from "debug";

import Leaflet from "leaflet";
import crossfilter from "crossfilter2";

import { scaleOrdinal, selectAll, select, csv, json, sum } from "d3";

import { checkBoxes } from "./components/checkBoxArray";

import {
  prepare_stocking_data,
  initialize_filter,
  update_clear_button_state,
  makeItemMap,
  makeColorMap,
} from "./components/utils";

import {
  get_feature_bbox,
  get_coordinates,
  turfbbToLeafletbb,
} from "./components/spatial_utils";

import {
  stockingAdd,
  stockingRemove,
  stockingInitial,
} from "./components/reducers";

import { piechart_overlay } from "./components/piechart_overlay";
import { polygon_overlay } from "./components/polygon_overlay";
import { spatialRadioButtons } from "./components/RadioButtons";
import { RadioButtons } from "./components/semanticRadioButtons";
import { update_stats_panel } from "./components/stats_panel";

import {
  parseParams,
  updateUrlParams,
  updateUrlCheckBoxParams,
  getUrlParamValue,
} from "./components/url_parsing";

const log = debug("app:log");

if (ENV !== "production") {
  debug.enable("*");
  const now = new Date().toString().slice(16, -33);
  log(`Debugging is enabled! (${now})`);
} else {
  debug.disable();
}

const updateYearButtons = () => {
  // if any of the url parameters change, update the href of the previous and next years
  // so that any filters or settings are preserved and we can navigate through time.
  // if the current year >= than maxYear, disable the next-year-button
  // if the current year <= than minYear, disable the previous-year-button

  let hash = window.location.hash;
  let previousYearButton = document.getElementById("previous-year-btn");
  let nextYearButton = document.getElementById("next-year-btn");

  // replace any existing hash with the new hash and enable/disable the buttons if years exist.
  let newUrl = nextYearButton.href.split("#")[0] + window.location.hash;
  nextYearButton.setAttribute("href", newUrl);
  nextYearButton.disabled = yearRange.last_year >= currentYear ? true : false;

  if (currentYear >= yearRange.last_year) {
    nextYearButton.classList.add("disabled");
  } else {
    nextYearButton.classList.remove("disabled");
  }

  newUrl = previousYearButton.href.split("#")[0] + window.location.hash;
  previousYearButton.setAttribute("href", newUrl);
  if (currentYear <= yearRange.first_year) {
    previousYearButton.classList.add("disabled");
  } else {
    previousYearButton.classList.remove("disabled");
  }
};

const filters = {};

const labelLookup = {};

// empty objects to hold our lookup values - populated after we get the data from the api.
let species_lookup = {};
let species_inverse_lookup = {};
let species_colors = {};

let strain_lookup = {};
let strain_inverse_lookup = {};
let strain_colors = {};

let lifestage_lookup = {};
let lifestage_inverse_lookup = {};
let lifestage_colors = {};

let stocking_method_lookup = {};
let stocking_method_inverse_lookup = {};
let stocking_method_colors = {};

let agency_colors = {};
let clip_colors = {};
let mark_colors = {};

// sliceVar, responseVar, column should reflect current state of the url

sliceVar = getUrlParamValue("sliceVar")
  ? getUrlParamValue("sliceVar")
  : sliceVar;
spatialUnit = getUrlParamValue("spatialUnit")
  ? getUrlParamValue("spatialUnit")
  : "jurisdiction";
let responseVar = getUrlParamValue("responseVar")
  ? getUrlParamValue("responseVar")
  : "yreq";
let mapState = getUrlParamValue("mapState")
  ? getUrlParamValue("mapState")
  : "basin-all";

let column = responseVar;

// a map from mapState strings to feature types in topodata
// used to pluck our geometries and calculate bounding box for map.
const mapState2FeatureType = {
  lake: "lakes",
  jurisdiction: "jurisdictions",
  manUnit: "mus",
};

// setup the map with rough bounds (need to get pies to plot first,
// this will be tweaked later):
const mymap = Leaflet.map("mapid", {
  zoomDelta: 0.25,
  zoomSnap: 0,
}).fitBounds([
  [41.38, -92.09],
  [49.01, -76.05],
]);

Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  maxZoom: 18,
}).addTo(mymap);

const colourScale = scaleOrdinal();

// intantiation our polygon overlay
let polygons = polygon_overlay().leafletMap(mymap);

//// Add a svg layer to the map
Leaflet.svg().addTo(mymap);
//
//// Select the svg area and add a group element we can use to move things around:
let svg = select("#mapid").select("svg");

// add two groups to our svg - one four our geometries, one for our pies
let geomg = svg.append("g").attr("class", "leaflet-zoom-hide");
let pieg = svg.append("g");

// this function is used for points events (centroids and mouse clicks)
function projectPoint(x, y) {
  const point = mymap.latLngToLayerPoint(new Leaflet.LatLng(y, x));
  return point;
}

let piecharts = piechart_overlay(mymap)
  .responseVar(responseVar)
  .getProjection(projectPoint)
  .fillScale(colourScale);

//======================================================
//           RADIO BUTTONS

let strata = [
  { name: "lake", label: "Lake" },
  { name: "stateProv", label: "State/Province" },
  { name: "jurisdiction", label: "Jurisdiction" },
  { name: "manUnit", label: "Managment Unit" },
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

// slices buttons:
// name must correspond to column names in our data
let slices = [
  { name: "agency_abbrev", label: "Agency" },
  { name: "species_name", label: "Species" },
  { name: "strain", label: "Strain" },
  { name: "mark", label: "Mark" },
  { name: "clip", label: "Clip" },
  { name: "life_stage", label: "Life Stage" },
  { name: "stk_method", label: "Stocking Method" },
];

let sliceSelector = RadioButtons()
  .selector("#slices-selector")
  .options(slices)
  .checked(sliceVar);

sliceSelector();
const slice_selector = selectAll("#slices-selector input");

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

Promise.all([
  json(dataURL),
  json(centroidsURL),
  json(topoURL),
  csv(slugURL),
  json("/api/v1/stocking/lookups"),
  json("/api/v1/common/lookups"),
]).then(([data, centroids, topodata, slugs, stocking, common]) => {
  // prepare our stocking data and set up our cross filters:
  data.forEach((d) => prepare_stocking_data(d));

  // LOOKUP MAPA

  species_lookup = makeItemMap(common.species, "abbrev", "common_name");
  species_inverse_lookup = makeItemMap(common.species, "common_name", "abbrev");
  species_colors = makeColorMap(common.species, "abbrev");

  strain_lookup = makeItemMap(common.strains, "slug", "strain_label");
  strain_inverse_lookup = makeItemMap(common.strains, "strain_label", "slug");
  strain_colors = makeColorMap(common.strains, "slug");

  stocking_method_lookup = makeItemMap(
    stocking.stockingmethods,
    "stk_meth",
    "description"
  );
  stocking_method_inverse_lookup = makeItemMap(
    stocking.stockingmethods,
    "description",
    "stk_meth"
  );
  stocking_method_colors = makeColorMap(stocking.stockingmethods, "stk_meth");

  lifestage_lookup = makeItemMap(stocking.lifestages, "abbrev", "description");
  lifestage_inverse_lookup = makeItemMap(
    stocking.lifestages,
    "description",
    "abbrev"
  );
  lifestage_colors = makeColorMap(stocking.lifestages, "abbrev");

  agency_colors = makeColorMap(common.agencies, "abbrev");
  clip_colors = makeColorMap(common.clipcodes, "clip_code");
  mark_colors = makeColorMap(common.physchem_marks, "mark_code");

  // an accessor function to get values of our currently selected
  // response variable.
  let ptAccessor = (d) =>
    Object.keys(d.value).map((x) => d.value[x][responseVar]);

  // a helper function to get the data in the correct format for plotting on the map.
  const get_pts = (spatialUnit, centriods, ptAccessor) => {
    let pts;

    switch (spatialUnit) {
      case "lake":
        pts = Object.values(lakeMapGroup.all());
        break;
      case "stateProv":
        pts = Object.values(stateProvMapGroup.all());
        break;
      case "jurisdiction":
        pts = Object.values(jurisdictionMapGroup.all());
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

  const updateColorScale = (value) => {
    let colors;
    switch (value) {
      case "agency_abbrev":
        colors = agency_colors;
        break;
      case "species_name":
        colors = species_colors;
        break;
      case "strain":
        colors = strain_colors;
        break;
      case "mark":
        colors = mark_colors;
        break;
      case "clip":
        colors = clip_colors;
        break;
      case "life_stage":
        colors = lifestage_colors;
        break;
      case "stk_method":
        colors = stocking_method_colors;
        break;
    }

    colourScale
      .domain(Object.entries(colors).map((x) => x[0]))
      .range(Object.entries(colors).map((x) => x[1]));
  };

  // recacalculate the points given the current spatial unit and
  // point accessor
  const updatePieCharts = () => {
    let pts = get_pts(spatialUnit, centroids, ptAccessor);
    pieg.data([pts]).call(piecharts);
    piecharts.selectedPie(null).clear_pointInfo();

    update_stats_panel(all, {
      fillScale: colourScale,
      label: slices.filter((d) => d.name === sliceVar)[0].label,
      what: sliceVar,
    });
  };

  // if the spatial radio buttons change, update the global variable
  // and update the pie charts
  const update_spatialUnit = (value) => {
    spatialUnit = value;
    spatialSelector.checked(spatialUnit).refresh();
    updatePieCharts();
    updateUrlParams("spatialUnit", value);
    updateYearButtons();
  };

  // if the pie chart slice selector radio buttons changes, update
  // the global variable and update the pie charts
  const update_sliceVar = (value) => {
    sliceVar = value;
    updateColorScale(sliceVar);
    calcMapGroups();
    updatePieCharts();
    updateUrlParams("sliceVar", value);
    updateYearButtons();
  };

  slugs.forEach((d) => (labelLookup[d.slug] = d.label));
  piecharts.labelLookup(labelLookup);

  // load our geometries and call our polygon overlay on the geom group:
  geomg.datum(topodata).call(polygons);

  let ndx = crossfilter(data);

  // these are dimensions that will be used by the polygon overlay:

  let lakePolygonDim = ndx.dimension((d) => d.lake);
  let jurisdictionPolygonDim = ndx.dimension((d) => d.jurisdiction_slug);
  let manUnitPolygonDim = ndx.dimension((d) => d.man_unit);

  let lakeDim = ndx.dimension((d) => d.lake);
  let agencyDim = ndx.dimension((d) => d.agency_abbrev);
  let stateProvDim = ndx.dimension((d) => d.stateprov);
  let jurisdictionDim = ndx.dimension((d) => d.jurisdiction_slug);
  let manUnitDim = ndx.dimension((d) => d.man_unit);
  let grid10Dim = ndx.dimension((d) => d.grid10);
  let geomDim = ndx.dimension((d) => d.geom);
  let speciesDim = ndx.dimension((d) => d.species_name);
  let strainDim = ndx.dimension((d) => d.strain);
  let yearClassDim = ndx.dimension((d) => d.year_class);
  let lifeStageDim = ndx.dimension((d) => d.life_stage);
  let markDim = ndx.dimension((d) => d.mark);
  let clipDim = ndx.dimension((d) => d.clip);
  let monthDim = ndx.dimension((d) => d.month);
  let stkMethDim = ndx.dimension((d) => d.stk_method);

  let lakeGroup = lakeDim.group().reduceSum((d) => d[column]);
  let agencyGroup = agencyDim.group().reduceSum((d) => d[column]);
  let stateProvGroup = stateProvDim.group().reduceSum((d) => d[column]);
  let jurisdictionGroup = jurisdictionDim.group().reduceSum((d) => d[column]);
  let manUnitGroup = manUnitDim.group().reduceSum((d) => d[column]);
  //let grid10Group = grid10Dim.group().reduceSum(d => d[column]);
  let speciesGroup = speciesDim.group().reduceSum((d) => d[column]);
  let strainGroup = strainDim.group().reduceSum((d) => d[column]);
  let yearClassGroup = yearClassDim.group().reduceSum((d) => d[column]);
  let lifeStageGroup = lifeStageDim.group().reduceSum((d) => d[column]);
  let markGroup = markDim.group().reduceSum((d) => d[column]);
  let clipGroup = clipDim.group().reduceSum((d) => d[column]);
  let monthGroup = monthDim.group().reduceSum((d) => d[column]);
  let stkMethGroup = stkMethDim.group().reduceSum((d) => d[column]);

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

  //A function to set all of the filters to checked - called when
  //the page loads or if the reset button is clicked.
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
    initialize_filter(filters, "mark", markDim, query_args);
    initialize_filter(filters, "clip", clipDim, query_args);
    initialize_filter(filters, "stockingMonth", monthDim, query_args);
    initialize_filter(filters, "stkMeth", stkMethDim, query_args);
  };

  // get any query parameters from the url
  let query_args = parseParams(window.location.hash);

  // initialize our filters when everything loads
  set_or_reset_filters(query_args);
  updateColorScale(sliceVar);
  update_clear_button_state(filters);
  update_stats_panel(all, {
    fillScale: colourScale,
    label: slices.filter((d) => d.name === sliceVar)[0].label,
    what: sliceVar,
  });

  updateYearButtons();

  let clear_button = select("#clear-filters-button");
  clear_button.on("click", set_or_reset_filters);

  let lakeSelection = select("#lake-filter");
  checkBoxes(lakeSelection, {
    filterkey: "lake",
    xfdim: lakeDim,
    xfgroup: lakeGroup,
    filters: filters,
  });

  let stateProvSelection = select("#state-prov-filter");
  checkBoxes(stateProvSelection, {
    filterkey: "stateProv",
    xfdim: stateProvDim,
    xfgroup: stateProvGroup,
    filters: filters,
  });

  let jurisdictionSelection = select("#jurisdiction-filter");
  checkBoxes(jurisdictionSelection, {
    filterkey: "jurisdiction",
    xfdim: jurisdictionDim,
    xfgroup: jurisdictionGroup,
    filters: filters,
  });

  let manUnitSelection = select("#manUnit-filter");
  checkBoxes(manUnitSelection, {
    filterkey: "manUnit",
    xfdim: manUnitDim,
    xfgroup: manUnitGroup,
    filters: filters,
  });

  let agencySelection = select("#agency-filter");
  checkBoxes(agencySelection, {
    filterkey: "agency",
    xfdim: agencyDim,
    xfgroup: agencyGroup,
    filters: filters,
  });

  let speciesSelection = select("#species-filter");
  checkBoxes(speciesSelection, {
    filterkey: "species",
    xfdim: speciesDim,
    xfgroup: speciesGroup,
    filters: filters,
  });

  let strainSelection = select("#strain-filter");
  checkBoxes(strainSelection, {
    filterkey: "strain",
    xfdim: strainDim,
    xfgroup: strainGroup,
    filters: filters,
  });

  let yearClassSelection = select("#year-class-filter");
  checkBoxes(yearClassSelection, {
    filterkey: "yearClass",
    xfdim: yearClassDim,
    xfgroup: yearClassGroup,
    filters: filters,
  });

  let markSelection = select("#mark-filter");
  checkBoxes(markSelection, {
    filterkey: "mark",
    xfdim: markDim,
    xfgroup: markGroup,
    filters: filters,
  });

  let clipSelection = select("#clip-filter");
  checkBoxes(clipSelection, {
    filterkey: "clip",
    xfdim: clipDim,
    xfgroup: clipGroup,
    filters: filters,
  });

  let monthSelection = select("#stocking-month-filter");
  checkBoxes(monthSelection, {
    filterkey: "stockingMonth",
    xfdim: monthDim,
    xfgroup: monthGroup,

    filters: filters,
  });

  let stkMethSelection = select("#stocking-method-filter");
  checkBoxes(stkMethSelection, {
    filterkey: "stkMeth",
    xfdim: stkMethDim,
    xfgroup: stkMethGroup,
    filters: filters,
  });

  let lifeStageSelection = select("#life-stage-filter");
  checkBoxes(lifeStageSelection, {
    filterkey: "lifeStage",
    xfdim: lifeStageDim,
    xfgroup: lifeStageGroup,
    filters: filters,
  });

  // we need to create a function to update the crossfilter based on
  // the current state of our map.  it needs to take two arguments:
  // dimension and value; note - we may need to update the spatial
  // resolution to be limited to only those below the currently
  // selected spatial unit:
  const updateCrossfilter = (spatialScale, value) => {
    // when we update our cross filter spatialScale, we also
    // need to remove any existing filters from lower levels.  If
    // we go back to Lake from a management unit, all
    // management units to be included in the results.

    const spatialScales = strata.map((d) => d.name);
    // if the index of the spatial unit is less than the spatial scale - we need to update
    // the spatial unit to a more appropriate value
    // if spatialScales.indexOf(spatialUnit) < spatialScales.indexOf(spatialScale)
    //

    let updateUnit =
      ~spatialScales.indexOf(spatialScale) &&
      spatialScales.indexOf(spatialUnit) <= spatialScales.indexOf(spatialScale)
        ? true
        : false;

    switch (spatialScale) {
      case "basin":
        lakePolygonDim.filterAll();
        jurisdictionPolygonDim.filterAll();
        manUnitPolygonDim.filterAll();
        if (updateUnit) {
          update_spatialUnit("jurisdiction");
        }
        break;
      case "lake":
        lakePolygonDim.filter(value);
        jurisdictionPolygonDim.filterAll();
        manUnitPolygonDim.filterAll();
        if (updateUnit) {
          update_spatialUnit("jurisdiction");
        }
        break;
      case "jurisdiction":
        jurisdictionPolygonDim.filter(value);
        manUnitPolygonDim.filterAll();
        if (updateUnit) {
          update_spatialUnit("manUnit");
        }
        break;
      case "manUnit":
        manUnitPolygonDim.filter(value);
        if (updateUnit) {
          update_spatialUnit("grid10");
        }
        break;
    }
    let tmp = value == "" ? "all" : value;
    updateUrlParams("mapState", `${spatialScale}-${tmp}`);
  };

  // if the map not set to the basin wide view, update it to the dimension and value
  // encoded in the global mapState variable.
  if (mapState !== "basin-all") {
    let splitState = mapState.split("-");
    let feature_type = mapState2FeatureType[splitState[0]];
    let slug = splitState[1];

    updateCrossfilter(splitState[0], slug);
    polygons
      .updateCrossfilter(updateCrossfilter)
      .selectedGeom(slug)
      .spatialScale(splitState[0]);

    let bbox = get_feature_bbox(topodata, feature_type, slug);
    bbox = turfbbToLeafletbb(bbox[0]);
    mymap.fitBounds(bbox, { padding: [50, 50] });

    // add the breadcrumbs for any parents of our seleted objects
    // addBreakcrumb take a feature type name and a slug.
    switch (splitState[0]) {
      case "manUnit":
        polygons.addBreadcrumb(
          "lake",
          common.manUnits.filter((d) => d.slug === slug)[0].jurisdiction.lake
            .abbrev
        );
        polygons.addBreadcrumb(
          "jurisdiction",
          common.manUnits.filter((d) => d.slug === slug)[0].jurisdiction.slug
        );
        break;

      case "jurisdiction":
        polygons.addBreadcrumb(
          "lake",
          common.jurisdictions.filter((d) => d.slug === slug)[0].lake.abbrev
        );
        break;
    }

    // muMap = {}
    //common.manUnits.map(d=>muMap[d.slug] = d.jurisdiction) ;
    // if feature type is lake - we need basin wide
    // if feature type is jurisdiction - we need basin wide and lake
    // if feature_type is manUnit we need basin, lake, and jurisdiction
  } else {
    polygons.updateCrossfilter(updateCrossfilter);
  }

  polygons.render();

  let pts = get_pts(spatialUnit, centroids, ptAccessor);
  pieg.data([pts]).call(piecharts);

  //==================================================+
  //         RADIO BUTTON CHANGE LISTENERS

  spatial_resolution.on("change", function () {
    update_spatialUnit(this.value);
  });

  slice_selector.on("change", function () {
    update_sliceVar(this.value);
  });

  pie_size_selector.on("change", function () {
    responseVar = this.value;
    piecharts.responseVar(responseVar);
    updatePieCharts();
    updateUrlParams("responseVar", responseVar);
    updateYearButtons();
  });

  //==================================================+
  //         CROSSFILTER ON CHANGE

  // if the crossfilter changes, update our checkboxes:
  ndx.onChange(() => {
    update_stats_panel(all, {
      fillScale: colourScale,
      label: slices.filter((d) => d.name === sliceVar)[0].label,
      what: sliceVar,
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

    checkBoxes(markSelection, {
      filterkey: "mark",
      xfdim: markDim,
      xfgroup: markGroup,
      filters: filters,
    });

    checkBoxes(clipSelection, {
      filterkey: "clip",
      xfdim: clipDim,
      xfgroup: clipGroup,
      filters: filters,
    });

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

    checkBoxes(lifeStageSelection, {
      filterkey: "lifeStage",
      xfdim: lifeStageDim,
      xfgroup: lifeStageGroup,
      filters: filters,
    });

    update_clear_button_state(filters);

    //================================================

    // now we need to compile the list of filters needed to populate the url:
    // foo
    updateUrlCheckBoxParams(filters);
    updateYearButtons();

    //// - update url when settings change
    //// - apply url params when page loads.
    //let url_params = decodeURIComponent($.param(filter_values, true));
    //// update the url with our url_parameters
    //window.location.hash = url_params;

    //================================================

    //update our map too:
    let pts = get_pts(spatialUnit, centroids, ptAccessor);
    pieg.data([pts]).call(piecharts);
  });

  mymap.on("moveend", function () {
    polygons.render();
    pieg.call(piecharts);
  });
});
