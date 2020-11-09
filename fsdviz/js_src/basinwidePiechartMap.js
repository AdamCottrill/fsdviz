/* global  $, dataURL,  topoUrl, centroidsUrl, sliceVar, spatialUnit, */

import debug from "debug";

import crossfilter from "crossfilter2";
import { csv, selectAll, json, select, sum, scaleOrdinal } from "d3";

import Leaflet from "leaflet";

import { checkBoxes } from "./components/checkBoxArray";

import {
  prepare_stocking_data,
  initialize_filter,
  get_coordinates
} from "./components/utils";

import {
  stockingAdd,
  stockingRemove,
  stockingInitial
} from "./components/reducers";

import { piechart_overlay } from "./components/piechart_overlay";
import { polygon_overlay } from "./components/polygon_overlay";
import { spatialRadioButtons } from "./components/RadioButtons";
import { RadioButtons } from "./components/semanticRadioButtons";
import { update_stats_panel } from "./components/stats_panel";

import { speciesColours, all_species } from "./components/constants";

import {
  parseParams,
  updateUrlParams,
  updateUrlCheckBoxParams
} from "./components/url_parsing";

const log = debug("app:log");

if (ENV !== "production") {
  debug.enable("*");
  const now = new Date().toString().slice(16, -33);
  log(`Debugging is enabled! (${now})`);
} else {
  debug.disable();
}

const filters = {};

const labelLookup = {};

// empty objects to hold our lookup values - populated after we get the data from the api.
let species_lookup = {};
let species_inverse_lookup = {};

let strain_lookup = {};
let strain_inverse_lookup = {};

let lifestage_lookup = {};
let lifestage_inverse_lookup = {};

let stocking_method_lookup = {};
let stocking_method_inverse_lookup = {};

const column = "events";
// the name of the column with our response:
let responseVar = "yreq";
//let sliceVar = "agency_abbrev";

// setup the map with rough bounds (need to get pies to plot first,
// this will be tweaked later):
const mymap = Leaflet.map("mapid", {
  zoomDelta: 0.25,
  zoomSnap: 0
}).fitBounds([
  [41.38, -92.09],
  [49.01, -76.05]
]);

Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  maxZoom: 18
}).addTo(mymap);

const speciesColourScale = scaleOrdinal()
  .range(speciesColours)
  .domain(all_species);

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

//// this function is used to draw our polygons:
//function projectPointPath(x, y) {
//  const point = mymap.latLngToLayerPoint(new Leaflet.LatLng(y, x));
//  this.stream.point(point.x, point.y);
//}
//
//const transform = geoTransform({ point: projectPointPath });
//const geoPathGenerator = geoPath().projection(transform);
//
let piecharts = piechart_overlay(mymap)
  .getProjection(projectPoint)
  .fillScale(speciesColourScale);

//======================================================
//           RADIO BUTTONS

let strata = [
  { name: "lake", label: "Lake" },
  { name: "stateProv", label: "State/Province" },
  { name: "jurisdiction", label: "Jurisdiction" },
  { name: "manUnit", label: "Managment Unit" },
  { name: "grid10", label: "10-minute Grid" },
  { name: "geom", label: "Reported Point" }
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
  { name: "life_stage", label: "Life Stage" },
  { name: "stk_method", label: "Stocking Method" }
];

let sliceSelector = RadioButtons()
  .selector("#slices-selector")
  .options(slices)
  .checked("species_name");

sliceSelector();
const slice_selector = selectAll("#slices-selector input");

// Our Response Variable buttons:
let pieSizeVars = [
  { name: "yreq", label: "Yearling Equivalents" },
  { name: "total", label: "Number Stocked" },
  { name: "events", label: "Event Count" }
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
  json("/api/v1/common/lookups")
]).then(([data, centroids, topodata, slugs, stocking, common]) => {
  species_lookup = common["species"].reduce((accumulator, d) => {
    accumulator[d.abbrev] = d.common_name;
    return accumulator;
  }, {});

  species_inverse_lookup = common["species"].reduce((accumulator, d) => {
    accumulator[d.common_name] = d.abbrev;
    return accumulator;
  }, {});

  // Strain Maps (these may need some more work!)
  strain_lookup = common["strains"].reduce((accumulator, d) => {
    accumulator[d.strain_species.slug] = d.strain_label;
    return accumulator;
  }, {});

  strain_inverse_lookup = common["strains"].reduce((accumulator, d) => {
    accumulator[d.strain_label] = d.strain_species.slug;
    return accumulator;
  }, {});

  // Stocking Metods Maps:
  stocking_method_lookup = stocking["stockingmethods"].reduce(
    (accumulator, d) => {
      accumulator[d.stk_meth] = d.description;
      return accumulator;
    },
    {}
  );

  stocking_method_inverse_lookup = stocking["stockingmethods"].reduce(
    (accumulator, d) => {
      accumulator[d.description] = d.stk_meth;
      return accumulator;
    },
    {}
  );

  // Lifestage Maps:
  lifestage_lookup = stocking["lifestages"].reduce((accumulator, d) => {
    accumulator[d.abbrev] = d.description;
    return accumulator;
  }, {});

  lifestage_inverse_lookup = stocking["stockingmethods"].reduce(
    (accumulator, d) => {
      accumulator[d.description] = d.abbrev;
      return accumulator;
    },
    {}
  );

  // prepare our stocking data and set up our cross filters:

  data.forEach(d => prepare_stocking_data(d));

  slugs.forEach(d => (labelLookup[d.slug] = d.label));
  piecharts.labelLookup(labelLookup);

  // load our geometries and call our polygon overlay on the geom group:
  geomg.datum(topodata).call(polygons);

  let ndx = crossfilter(data);

  // these are dimensions that will be used by the polygon overlay:

  let lakePolygonDim = ndx.dimension(d => d.lake);
  let jurisdictionPolygonDim = ndx.dimension(d => d.jurisdiction_slug);
  let manUnitPolygonDim = ndx.dimension(d => d.man_unit);

  let lakeDim = ndx.dimension(d => d.lake);
  let agencyDim = ndx.dimension(d => d.agency_abbrev);
  let stateProvDim = ndx.dimension(d => d.stateprov);
  let jurisdictionDim = ndx.dimension(d => d.jurisdiction_slug);
  let manUnitDim = ndx.dimension(d => d.man_unit);
  let grid10Dim = ndx.dimension(d => d.grid10);
  let geomDim = ndx.dimension(d => d.geom);
  let speciesDim = ndx.dimension(d => d.species_name);
  let strainDim = ndx.dimension(d => d.strain);
  let yearClassDim = ndx.dimension(d => d.year_class);
  let lifeStageDim = ndx.dimension(d => d.life_stage);
  let markDim = ndx.dimension(d => d.mark);
  let monthDim = ndx.dimension(d => d.month);
  let stkMethDim = ndx.dimension(d => d.stk_method);

  let lakeGroup = lakeDim.group().reduceSum(d => d[column]);
  let agencyGroup = agencyDim.group().reduceSum(d => d[column]);
  let stateProvGroup = stateProvDim.group().reduceSum(d => d[column]);
  let jurisdictionGroup = jurisdictionDim.group().reduceSum(d => d[column]);
  let manUnitGroup = manUnitDim.group().reduceSum(d => d[column]);
  //let grid10Group = grid10Dim.group().reduceSum(d => d[column]);
  let speciesGroup = speciesDim.group().reduceSum(d => d[column]);
  let strainGroup = strainDim.group().reduceSum(d => d[column]);
  let yearClassGroup = yearClassDim.group().reduceSum(d => d[column]);
  let lifeStageGroup = lifeStageDim.group().reduceSum(d => d[column]);
  let markGroup = markDim.group().reduceSum(d => d[column]);
  let monthGroup = monthDim.group().reduceSum(d => d[column]);
  let stkMethGroup = stkMethDim.group().reduceSum(d => d[column]);

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

  update_stats_panel(all, {
    fillScale: speciesColourScale,
    label: slices.filter(d => d.name === sliceVar)[0].label,
    what: sliceVar
  });

  //A function to set all of the filters to checked - called when
  //the page loads of if the reset button is clicked.
  const set_or_reset_filters = () => {
    initialize_filter(filters, "lake", lakeDim);
    initialize_filter(filters, "stateProv", stateProvDim);
    initialize_filter(filters, "jurisdiction", jurisdictionDim);
    initialize_filter(filters, "manUnit", manUnitDim);
    initialize_filter(filters, "agency", agencyDim);
    initialize_filter(filters, "species", speciesDim);
    initialize_filter(filters, "strain", strainDim);
    initialize_filter(filters, "yearClass", yearClassDim);
    initialize_filter(filters, "lifeStage", lifeStageDim);
    initialize_filter(filters, "mark", markDim);
    initialize_filter(filters, "stockingMonth", monthDim);
    initialize_filter(filters, "stkMeth", stkMethDim);
  };
  // initialize our filters when everything loads
  set_or_reset_filters();

  // apply any url parameters to our filters:

  //let current = parseParams(window.location.hash);
  //console.log(current);

  let reset_button = select("#reset-button");
  reset_button.on("click", set_or_reset_filters);

  let lakeSelection = select("#lake-filter");
  checkBoxes(lakeSelection, {
    filterkey: "lake",
    xfdim: lakeDim,
    xfgroup: lakeGroup,
    filters: filters
  });

  let stateProvSelection = select("#state-prov-filter");
  checkBoxes(stateProvSelection, {
    filterkey: "stateProv",
    xfdim: stateProvDim,
    xfgroup: stateProvGroup,
    filters: filters
  });

  let jurisdictionSelection = select("#jurisdiction-filter");
  checkBoxes(jurisdictionSelection, {
    filterkey: "jurisdiction",
    xfdim: jurisdictionDim,
    xfgroup: jurisdictionGroup,
    filters: filters
  });

  let manUnitSelection = select("#manUnit-filter");
  checkBoxes(manUnitSelection, {
    filterkey: "manUnit",
    xfdim: manUnitDim,
    xfgroup: manUnitGroup,
    filters: filters
  });

  let agencySelection = select("#agency-filter");
  checkBoxes(agencySelection, {
    filterkey: "agency",
    xfdim: agencyDim,
    xfgroup: agencyGroup,
    filters: filters
  });

  let speciesSelection = select("#species-filter");
  checkBoxes(speciesSelection, {
    filterkey: "species",
    xfdim: speciesDim,
    xfgroup: speciesGroup,
    filters: filters
  });

  let strainSelection = select("#strain-filter");
  checkBoxes(strainSelection, {
    filterkey: "strain",
    xfdim: strainDim,
    xfgroup: strainGroup,
    filters: filters
  });

  let yearClassSelection = select("#year-class-filter");
  checkBoxes(yearClassSelection, {
    filterkey: "yearClass",
    xfdim: yearClassDim,
    xfgroup: yearClassGroup,
    filters: filters
  });

  let markSelection = select("#mark-filter");
  checkBoxes(markSelection, {
    filterkey: "mark",
    xfdim: markDim,
    xfgroup: markGroup,
    filters: filters
  });

  let monthSelection = select("#stocking-month-filter");
  checkBoxes(monthSelection, {
    filterkey: "stockingMonth",
    xfdim: monthDim,
    xfgroup: monthGroup,

    filters: filters
  });

  let stkMethSelection = select("#stocking-method-filter");
  checkBoxes(stkMethSelection, {
    filterkey: "stkMeth",
    xfdim: stkMethDim,
    xfgroup: stkMethGroup,
    filters: filters
  });

  let lifeStageSelection = select("#life-stage-filter");
  checkBoxes(lifeStageSelection, {
    filterkey: "lifeStage",
    xfdim: lifeStageDim,
    xfgroup: lifeStageGroup,
    filters: filters
  });

  // an accessor function to get values of our currently selected
  // response variable.
  let ptAccessor = d => Object.keys(d.value).map(x => d.value[x][responseVar]);

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
      pts.forEach(d => (d["coordinates"] = get_coordinates(d.key)));
    } else {
      pts.forEach(d => (d["coordinates"] = centroids[spatialUnit][d.key]));
    }
    pts.forEach(d => (d["total"] = sum(ptAccessor(d))));

    return pts.filter(d => d.total > 0);
  };

  // we need to create a function to update the crossfilter based on
  // the current state of our map.  it needs to take two arguments:
  // dimension and value; note - we may need to update the spatial
  // resolution to be limited to only those below the currently
  // selected spatial unit:
  const updateCrossfilter = (dimension, value) => {
    // when we update our cross filter dimension, we also
    // need to remove any existing filters from lower levels.  If
    // we go back to Lake from a management unit, all
    // management units to be included in the results.

    switch (dimension) {
      case "basin":
        lakePolygonDim.filterAll();
        jurisdictionPolygonDim.filterAll();
        manUnitPolygonDim.filterAll();
        update_spatialUnit("jurisdiction");
        break;
      case "lake":
        lakePolygonDim.filter(value);
        jurisdictionPolygonDim.filterAll();
        manUnitPolygonDim.filterAll();
        update_spatialUnit("jurisdiction");
        break;
      case "jurisdiction":
        jurisdictionPolygonDim.filter(value);
        manUnitPolygonDim.filterAll();
        update_spatialUnit("manUnit");
        break;
      case "manUnit":
        manUnitPolygonDim.filter(value);
        update_spatialUnit("grid10");
        break;
    }
    let tmp = value == "" ? "all" : value;
    updateUrlParams("map-state", `${dimension}-${tmp}`);
  };

  polygons.updateCrossfilter(updateCrossfilter);
  polygons.render();

  //piecharts.radiusAccessor(d => d.total).keyfield(spatialUnit);

  let pts = get_pts(spatialUnit, centroids, ptAccessor);
  pieg.data([pts]).call(piecharts);

  // recacalculate the points given the current spatial unit and
  // point accessor
  const updatePieCharts = () => {
    pts = get_pts(spatialUnit, centroids, ptAccessor);
    pieg.data([pts]).call(piecharts);
    piecharts.selectedPie(null).clear_pointInfo();

    update_stats_panel(all, {
      fillScale: speciesColourScale,
      label: slices.filter(d => d.name === sliceVar)[0].label,
      what: sliceVar
    });
  };

  // if the spatial radio buttons change, update the global variable
  // and update the pie charts
  const update_spatialUnit = value => {
    spatialUnit = value;
    spatialSelector.checked(spatialUnit).refresh();
    updatePieCharts();
    updateUrlParams("spatialUnit", value);
  };

  // if the pie chart slice selector radio buttons changes, update
  // the global variable and update the pie charts
  const update_sliceValue = value => {
    sliceVar = value;
    calcMapGroups();
    updatePieCharts();
    updateUrlParams("sliceValue", value);
  };

  //==================================================+
  //         RADIO BUTTON CHANGE LISTENERS

  spatial_resolution.on("change", function() {
    update_spatialUnit(this.value);
  });

  slice_selector.on("change", function() {
    update_sliceValue(this.value);
  });

  pie_size_selector.on("change", function() {
    responseVar = this.value;
    piecharts.responseVar(responseVar);
    updatePieCharts();
    //updateUrlParams("responseVar", responseVar);
  });

  //==================================================+
  //         CROSSFILTER ON CHANGE

  // if the crossfilter changes, update our checkboxes:
  ndx.onChange(() => {
    update_stats_panel(all, {
      fillScale: speciesColourScale,
      label: slices.filter(d => d.name === sliceVar)[0].label,
      what: sliceVar
    });

    checkBoxes(lakeSelection, {
      filterkey: "lake",
      xfdim: lakeDim,
      xfgroup: lakeGroup,
      filters: filters
    });

    checkBoxes(stateProvSelection, {
      filterkey: "stateProv",
      xfdim: stateProvDim,
      xfgroup: stateProvGroup,
      filters: filters
    });

    checkBoxes(jurisdictionSelection, {
      filterkey: "jurisdiction",
      xfdim: jurisdictionDim,
      xfgroup: jurisdictionGroup,
      filters: filters
    });

    checkBoxes(manUnitSelection, {
      filterkey: "manUnit",
      xfdim: manUnitDim,
      xfgroup: manUnitGroup,
      filters: filters
    });

    checkBoxes(agencySelection, {
      filterkey: "agency",
      xfdim: agencyDim,
      xfgroup: agencyGroup,
      filters: filters
    });

    checkBoxes(speciesSelection, {
      filterkey: "species",
      xfdim: speciesDim,
      xfgroup: speciesGroup,
      filters: filters
    });

    checkBoxes(strainSelection, {
      filterkey: "strain",
      xfdim: strainDim,
      xfgroup: strainGroup,
      filters: filters
    });

    checkBoxes(yearClassSelection, {
      filterkey: "yearClass",
      xfdim: yearClassDim,
      xfgroup: yearClassGroup,
      filters: filters
    });

    checkBoxes(markSelection, {
      filterkey: "mark",
      xfdim: markDim,
      xfgroup: markGroup,
      filters: filters
    });

    checkBoxes(monthSelection, {
      filterkey: "stockingMonth",
      xfdim: monthDim,
      xfgroup: monthGroup,
      filters: filters
    });

    checkBoxes(stkMethSelection, {
      filterkey: "stkMeth",
      xfdim: stkMethDim,
      xfgroup: stkMethGroup,
      filters: filters
    });

    checkBoxes(lifeStageSelection, {
      filterkey: "lifeStage",
      xfdim: lifeStageDim,
      xfgroup: lifeStageGroup,
      filters: filters
    });

    // see if there are any check box filters:
    let filter_states = Object.values(filters).map(d => d.is_filtered);

    let filtered = !filter_states.every(d => d === false);

    let reset_button = select("#reset-button");
    reset_button.classed("disabled", !filtered);

    //================================================

    // now we need to compile the list of filters needed to populate the url:
    // foo
    updateUrlCheckBoxParams(filters);

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

  mymap.on("moveend", function() {
    polygons.render();
    pieg.call(piecharts);
  });
});
