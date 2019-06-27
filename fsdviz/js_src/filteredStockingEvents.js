/* global values dc, dataURL, maxEvents */

import crossfilter from "crossfilter2";
import {
  select,
  selectAll,
  mouse,
  event,
  csv,
  json,
  format,
  scaleLinear,
  scaleOrdinal,
  timeParse,
  range,
  extent,
  sum
} from "d3";

import Leaflet from "leaflet";
import { RadioButtons } from "./semanticRadioButtons";
import { update_stats_panel } from "./stats_panel";
import { get_coordinates } from "./utils";
import { piechart_overlay } from "./piechart_overlay";

// import dc from "dc";

const dateParser = timeParse("%Y-%m-%d");
let commaFormat = format(",");

const width1 = 425;
const height1 = 400;
const width2 = 300;
const height2 = 300;

// intial values of global variabls that control the state of our page:
let spatialUnit = "jurisdiction";

let varName = "species_code"; // this should probably be 'category'
let responseVar = "yreq";
//let column = "yreq_stocked";
// TODO:make ylabel a function of the response variable radio buttons array:
let ylabel = "Yearly Equivalents";

const labelLookup = {};

const month_lookup = {
  "1": "Jan",
  "2": "Feb",
  "3": "Mar",
  "4": "Apr",
  "5": "May",
  "6": "Jun",
  "7": "Jul",
  "8": "Aug",
  "9": "Sept",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec",
  "0": "Unkn"
};

const markLookup = [
  ["ad", "None"],
  ["Ad", "None"],
  ["AD", "None"],
  ["Ad/T-bar tag", "None"],
  ["ADCWT", "None"],
  ["ADCWTOX", "OX"],
  ["ADDO", "None"],
  ["ADDORV", "None"],
  ["ADLM", "None"],
  ["ADLMLP", "None"],
  ["ADLMLV", "None"],
  ["ADLMRP", "None"],
  ["ADLMRV", "None"],
  ["ADLP", "None"],
  ["ADCWTLP", "None"],
  ["ADLPRM", "None"],
  ["ADLPRV", "None"],
  ["ADLV", "None"],
  ["ADCWTLV", "None"],
  ["ADLVOX", "OX"],
  ["ADLVRM", "None"],
  ["ADLVRP", "None"],
  ["ADOX", "OX"],
  ["ADOXRV", "OX"],
  ["ADPT", "None"],
  ["ADRM", "None"],
  ["ADRMRP", "None"],
  ["ADRMRV", "None"],
  ["ADRP", "None"],
  ["ADCWTRP", "None"],
  ["ADRV", "None"],
  ["ADCWTRV", "None"],
  ["CA", "CA"],
  ["CA2", "CA"],
  ["CAL", "CA"],
  ["CWT", "None"],
  ["CWTOX", "OX"],
  ["DO", "None"],
  ["DOLP", "None"],
  ["DOLV", "None"],
  ["DORP", "None"],
  ["DORV", "None"],
  ["LM", "None"],
  ["LMLP", "None"],
  ["LMLV", "None"],
  ["LP", "None"],
  ["CWTLP", "None"],
  ["LPLV", "None"],
  ["LPOX", "OX"],
  ["LPRM", "None"],
  ["BP", "None"],
  ["LPRV", "None"],
  ["LPOXRV", "None"],
  ["LR", "None"],
  ["LV", "None"],
  ["CWTLV", "None"],
  ["LVOX", "OX"],
  ["LVPT", "None"],
  ["LVRP", "None"],
  ["LVOXRP", "OX"],
  ["BV", "None"],
  ["BVPIT", "None"],
  ["NC", "None"],
  ["NO", "None"],
  ["None", "None"],
  ["none", "None"],
  ["", "None"],
  ["OTC", "OX"],
  ["ox", "OX"],
  ["OX", "OX"],
  ["OXRP", "OX"],
  ["OXRV", "OX"],
  ["PIT", "None"],
  ["PIT tag", "None"],
  ["PT", "None"],
  ["PTRV", "None"],
  ["RM", "None"],
  ["RMRV", "None"],
  ["RP", "None"],
  ["RPRV", "None"],
  ["RV", "None"],
  ["CWTRV", "None"],
  ["CWTOXRV", "OX"],
  ["", "Unknown"],
  [" ", "Unknown"],
  ["Chemical / Dye", "Unknown"],
  ["Chemical / Dye], Coded Wire Tag], Fin Clip", "Unknown"],
  ["FTRM", "None"],
  ["FTRV", "None"],
  ["JT", "None"],
  ["SCU", "None"],
  ["UP", "None"],
  ["UT", "None"],
  ["VIE", "None"],
  ["VIE-LFY", "None"],
  ["XX", "None"],
  ["ADFT", "None"],
  ["ADFTLP", "None"],
  ["AZR", "None"],
  ["Fin Clip", "None"],
  ["FT", "None"],
  ["RR", "None"],
  ["VIE-RFY", "None"]
];

const clipLookup = [
  ["ad", "AD"],
  ["Ad", "AD"],
  ["AD", "AD"],
  ["Ad/T-bar tag", "AD"],
  ["ADCWT", "AD"],
  ["ADCWTOX", "AD"],
  ["ADDO", "ADDO"],
  ["ADDORV", "ADDORV"],
  ["ADLM", "ADLM"],
  ["ADLMLP", "ADLMLP"],
  ["ADLMLV", "ADLMLV"],
  ["ADLMRP", "ADLMRP"],
  ["ADLMRV", "ADLMRV"],
  ["ADLP", "ADLP"],
  ["ADCWTLP", "ADLP"],
  ["ADLPRM", "ADLPRM"],
  ["ADLPRV", "ADLPRV"],
  ["ADLV", "ADLV"],
  ["ADCWTLV", "ADLV"],
  ["ADLVOX", "ADLV"],
  ["ADLVRM", "ADLVRM"],
  ["ADLVRP", "ADLVRP"],
  ["ADOX", "AD"],
  ["ADOXRV", "ADRV"],
  ["ADPT", "ADPT"],
  ["ADRM", "ADRM"],
  ["ADRMRP", "ADRMRP"],
  ["ADRMRV", "ADRMRV"],
  ["ADRP", "ADRP"],
  ["ADCWTRP", "ADRP"],
  ["ADRV", "ADRV"],
  ["ADCWTRV", "ADRV"],
  ["CA", "None"],
  ["CA2", "None"],
  ["CAL", "None"],
  ["CWT", "None"],
  ["CWTOX", "None"],
  ["DO", "DO"],
  ["DOLP", "DOLP"],
  ["DOLV", "DOLV"],
  ["DORP", "DORP"],
  ["DORV", "DORV"],
  ["LM", "LM"],
  ["LMLP", "LMLP"],
  ["LMLV", "LMLV"],
  ["LP", "LP"],
  ["CWTLP", "LP"],
  ["LPLV", "LPLV"],
  ["LPOX", "LP"],
  ["LPRM", "LPRM"],
  ["BP", "LPRP"],
  ["LPRV", "LPRV"],
  ["LPOXRV", "LPRV"],
  ["LR", "LR"],
  ["LV", "LV"],
  ["CWTLV", "LV"],
  ["LVOX", "LV"],
  ["LVPT", "LV"],
  ["LVRP", "LVRP"],
  ["LVOXRP", "LVRP"],
  ["BV", "LVRV"],
  ["BVPIT", "LVRV"],
  ["NC", "None"],
  ["NO", "None"],
  ["None", "None"],
  ["none", "None"],
  ["", "None"],
  ["OTC", "None"],
  ["ox", "None"],
  ["OX", "None"],
  ["OXRP", "RP"],
  ["OXRV", "RV"],
  ["PIT", "None"],
  ["PIT tag", "None"],
  ["PT", "None"],
  ["PTRV", "RV"],
  ["RM", "RM"],
  ["RMRV", "RMRV"],
  ["RP", "RP"],
  ["RPRV", "RPRV"],
  ["RV", "RV"],
  ["CWTRV", "RV"],
  ["CWTOXRV", "RV"],
  ["", "Unknown"],
  [" ", "Unknown"],
  ["Chemical / Dye", "Unknown"],
  ["Chemical / Dye], Coded Wire Tag], Fin Clip", "Unknown"],
  ["FTRM", "Unknown"],
  ["FTRV", "Unknown"],
  ["JT", "Unknown"],
  ["SCU", "Unknown"],
  ["UP", "Unknown"],
  ["UT", "Unknown"],
  ["VIE", "Unknown"],
  ["VIE-LFY", "Unknown"],
  ["XX", "Unknown"],
  ["ADFT", "Unknown"],
  ["ADFTLP", "Unknown"],
  ["AZR", "Unknown"],
  ["Fin Clip", "Unknown"],
  ["FT", "Unknown"],
  ["RR", "Unknown"],
  ["VIE-RFY", "Unknown"]
];

const tagLookup = [
  ["ad", "None"],
  ["Ad", "None"],
  ["AD", "None"],
  ["Ad/T-bar tag", "ATAG"],
  ["ADCWT", "CWT"],
  ["ADCWTOX", "CWT"],
  ["ADDO", "None"],
  ["ADDORV", "None"],
  ["ADLM", "None"],
  ["ADLMLP", "None"],
  ["ADLMLV", "None"],
  ["ADLMRP", "None"],
  ["ADLMRV", "None"],
  ["ADLP", "None"],
  ["ADCWTLP", "CWT"],
  ["ADLPRM", "None"],
  ["ADLPRV", "None"],
  ["ADLV", "None"],
  ["ADCWTLV", "CWT"],
  ["ADLVOX", "None"],
  ["ADLVRM", "None"],
  ["ADLVRP", "None"],
  ["ADOX", "None"],
  ["ADOXRV", "None"],
  ["ADPT", "None"],
  ["ADRM", "None"],
  ["ADRMRP", "None"],
  ["ADRMRV", "None"],
  ["ADRP", "None"],
  ["ADCWTRP", "CWT"],
  ["ADRV", "None"],
  ["ADCWTRV", "CWT"],
  ["CA", "None"],
  ["CA2", "None"],
  ["CAL", "None"],
  ["CWT", "CWT"],
  ["CWTOX", "CWT"],
  ["DO", "None"],
  ["DOLP", "None"],
  ["DOLV", "None"],
  ["DORP", "None"],
  ["DORV", "None"],
  ["LM", "None"],
  ["LMLP", "None"],
  ["LMLV", "None"],
  ["LP", "None"],
  ["CWTLP", "CWT"],
  ["LPLV", "None"],
  ["LPOX", "None"],
  ["LPRM", "None"],
  ["BP", "None"],
  ["LPRV", "None"],
  ["LPOXRV", "None"],
  ["LR", "None"],
  ["LV", "None"],
  ["CWTLV", "CWT"],
  ["LVOX", "None"],
  ["LVPT", "PIT"],
  ["LVRP", "None"],
  ["LVOXRP", "None"],
  ["BV", "None"],
  ["BVPIT", "PIT"],
  ["NC", "None"],
  ["NO", "None"],
  ["None", "None"],
  ["none", "None"],
  ["", "None"],
  ["OTC", "None"],
  ["ox", "None"],
  ["OX", "None"],
  ["OXRP", "None"],
  ["OXRV", "None"],
  ["PIT", "PIT"],
  ["PIT tag", "PIT"],
  ["PT", "PIT"],
  ["PTRV", "PIT"],
  ["RM", "None"],
  ["RMRV", "None"],
  ["RP", "None"],
  ["RPRV", "None"],
  ["RV", "None"],
  ["CWTRV", "CWT"],
  ["CWTOXRV", "CWT"],
  ["", "Unknown"],
  [" ", "Unknown"],
  ["Chemical / Dye", "Unknown"],
  ["Chemical / Dye], Coded Wire Tag], Fin Clip", "Unknown"],
  ["FTRM", "Unknown"],
  ["FTRV", "Unknown"],
  ["JT", "Unknown"],
  ["SCU", "Unknown"],
  ["UP", "Unknown"],
  ["UT", "Unknown"],
  ["VIE", "Unknown"],
  ["VIE-LFY", "Unknown"],
  ["XX", "Unknown"],
  ["ADFT", "Unknown"],
  ["ADFTLP", "Unknown"],
  ["AZR", "Unknown"],
  ["Fin Clip", "None"],
  ["FT", "Unknown"],
  ["RR", "Unknown"],
  ["VIE-RFY", "Unknown"]
];

// 19 colours
let speciesColours = [
  "#3cb44b",
  "#4363d8",
  "#e6194b",
  "#f58231",
  "#46f0f0",
  "#ffe119",
  "#f032e6",
  "#911eb4",
  "#bcf60c",
  "#fabebe",
  "#008080",
  "#e6beff",
  "#9a6324",
  "#fffac8",
  "#800000",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
  "#000075",
  "#808080",
  "#ffffff"
];

//19 species
let all_species = [
  "LAT",
  "CHS",
  "RBT",
  "BNT",
  "COS",
  "WAL",
  "LTX",
  "ATS",
  "SPE",
  "BKT",
  "SOS",
  "YEP",
  "LHR",
  "BLO",
  "LAS",
  "MUE",
  "SMB",
  "TIM",
  "NOP"
];

const clipMap = clipLookup.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

const tagMap = tagLookup.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

const markMap = markLookup.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

// colour scale that will be used anywhere scpecies are displayed
const speciesColourScale = scaleOrdinal()
  .range(speciesColours)
  .domain(all_species);

// for now - use a generic colour scale.
const sharedColourScale = scaleOrdinal()
  .range(speciesColours)
  .domain(all_species);

const stockingAdd = column => {
  return (p, v) => {
    let counts = p[v[column]] || { yreq: 0, total: 0, events: 0 };
    counts.yreq += v.yreq;
    counts.total += v.total;
    counts.events += v.events;
    p[v[column]] = counts;
    return p;
  };
};

const stockingRemove = column => {
  return (p, v) => {
    let counts = p[v[column]] || { yreq: 0, total: 0, events: 0 };
    counts.yreq -= v.yreq;
    counts.total -= v.total;
    counts.events -= v.events;
    p[v[column]] = counts;
    return p;
  };
};

export const stockingInitial = () => {
  return {};
};

// setup the map with rough bounds (need to get pies to plot first,
// this will be tweaked later):
const mymap = Leaflet.map("mapid", {
  zoomDelta: 0.25,
  zoomSnap: 0
}).fitBounds([[41.38, -92.09], [49.01, -76.05]]);

Leaflet.tileLayer(
  "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
  {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery � <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken: accessToken
  }
).addTo(mymap);

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
  .getProjection(projectPoint)
  .fillScale(speciesColourScale);

//======================================================
//           RADIO BUTTONS

let strata = [
  { name: "lake", label: "Lake" },
  { name: "stateProv", label: "State/Province" },
  { name: "jurisdiction", label: "Jurisdiction" },
  //  { name: "manUnit", label: "Managment Unit" },
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

// categories buttons:
// name must correspond to column names in our data
// TODO - add lookup option - for tooltip etc.

let categories = [
  { name: "lake", label: "Lake" },
  { name: "stateProv", label: "State/Province" },
  { name: "jurisdiction_code", label: "Jurisdiction" },
  { name: "agency_code", label: "Agency" },
  { name: "species_code", label: "Species" },
  { name: "strain", label: "Strain" },
  { name: "clip", label: "Clip" },
  { name: "mark", label: "Mark" },
  { name: "tag", label: "Tag" },
  { name: "lifestage_code", label: "Life Stage" },
  { name: "stockingMethod", label: "Stocking Method" }
];

let categorySelector = RadioButtons()
  .selector("#category-selector")
  .options(categories)
  .checked("species_code");

categorySelector();
const category_selector = selectAll("#category-selector input");

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

// TEMPORARY:
const centroidsURL = "/static/data/centroids.json";
const slugURL = "/static/data/slugs.csv";

// TODO: combine all of the api calls into a single call that returns a single json object:
Promise.all([
  json(dataURL),
  json("/api/v1/common/lake"),
  json("/api/v1/common/agency"),
  json("/api/v1/common/jurisdiction"),
  json("/api/v1/common/state_province"),
  json("/api/v1/common/species"),
  json("/api/v1/common/strain"),
  json("/api/v1/stocking/lifestage"),
  json("/api/v1/stocking/stocking_method"),
  json(centroidsURL),
  //json(topoURL),
  csv(slugURL)
]).then(
  ([
    data,
    lakes,
    agencies,
    jurisdictions,
    states,
    species1,
    strains,
    lifestages,
    stockingMethods,
    centroids,
    //topodata,
    slugs
  ]) => {
    slugs.forEach(d => (labelLookup[d.slug] = d.label));
    piecharts.labelLookup(labelLookup);

    // geographic extents:
    const latbounds = extent(data, d => d.dd_lat);
    const longbounds = extent(data, d => d.dd_lon);
    mymap.fitBounds([
      [latbounds[0], longbounds[0]],
      [latbounds[1], longbounds[1]]
    ]);

    select("#record-count-warning").classed(
      "hidden",
      data.length >= maxEvents ? false : true
    );

    const lakeMap = lakes.reduce((accumulator, d) => {
      accumulator[d.abbrev] = d.lake_name;
      return accumulator;
    }, {});

    const agencyMap = agencies.reduce((accumulator, d) => {
      accumulator[d.abbrev] = d.agency_name;
      return accumulator;
    }, {});

    const jurisdictionMap = jurisdictions.reduce((accumulator, d) => {
      accumulator[d.slug] = {
        description: d.description,
        stateprov: d.stateprov.name
      };
      return accumulator;
    }, {});

    const stateProvMap = states.reduce((accumulator, d) => {
      accumulator[d.abbrev] = d.name;
      return accumulator;
    }, {});

    const speciesMap = species1.reduce((accumulator, d) => {
      accumulator[d.abbrev] = `${d.common_name} - (${d.abbrev})`;
      return accumulator;
    }, {});

    const strainMap = strains.reduce((accumulator, d) => {
      let key = `${d.strain_code}-${d.strain_species.abbrev}`;
      accumulator[key] = {
        long: `${d.strain_species.common_name} - ${d.strain_label}(${
          d.strain_code
        })`,
        short: `${d.strain_code}-${d.strain_species.abbrev}`
      };
      return accumulator;
    }, {});

    //just the short form for the stack bar labels:
    // key of of the form: <strain_code>-<species_abbrev>
    const strainShortMap = strains.reduce((accumulator, d) => {
      let key = `${d.strain_code}-${d.strain_species.abbrev}`;
      accumulator[key] = key;
      return accumulator;
    }, {});

    const stockingMethodMap = stockingMethods.reduce((accumulator, d) => {
      accumulator[d.stk_meth] = d.description;
      return accumulator;
    }, {});

    const lifestageMap = lifestages.reduce((accumulator, d) => {
      accumulator[d.abbrev] = d.description;
      return accumulator;
    }, {});

    // Prepare our data:
    data.forEach(d => {
      //d.date: "2016-02-01"
      d.date = d.date ? dateParser(d.date) : "";
      d.dd_lat = parseFloat(d.dd_lat);
      d.dd_lon = parseFloat(d.dd_lon);
      //d.grid_10 = d.lake.toLowerCase() + "_" + d.grid_10; // this should be the slug
      d.grid_10 = d.grid10;
      d.month = d.month ? parseInt(d.month) : 0;

      //NOTE: this will break when we get the database to return the strain slug.
      d.strain = d.strain + "-" + d.species_code;
      d.year = parseInt(d.year);
      d.year_class = parseInt(d.year_class);
      //yreq, events, & total_stocked match names on other views
      d.yreq = parseInt(d.yreq_stocked);
      d.events = 1;
      d.total = parseInt(d.no_stocked);
      d.clip = clipMap[d.mark] ? clipMap[d.mark] : "Unknown";
      d.tag = tagMap[d.mark] ? tagMap[d.mark] : "Unknown";
      d.mark = markMap[d.mark] ? markMap[d.mark] : "Unknown";

      d.point = [+d.dd_lon, +d.dd_lat];
      d.geom = "Point(" + d.dd_lon + " " + d.dd_lat + ")";

      return d;
    });

    // setup our cross filter:
    let ndx = crossfilter(data);

    let yearDim = ndx.dimension(d => d.year);
    let monthDim = ndx.dimension(d => d.month);

    let lakeDim = ndx.dimension(d => d.lake);
    let agencyDim = ndx.dimension(d => d.agency_code);
    let stateProvDim = ndx.dimension(d => d.stateProv);
    let jurisdictionDim = ndx.dimension(d => d.jurisdiction_code);
    //let manUnitDim = ndx.dimension(d => d.man_unit);
    let grid10Dim = ndx.dimension(d => d.grid_10);
    let geomDim = ndx.dimension(d => d.geom);

    let speciesDim = ndx.dimension(d => d.species_code);
    let strainDim = ndx.dimension(d => d.strain);
    let lifeStageDim = ndx.dimension(d => d.lifestage_code);
    let markDim = ndx.dimension(d => d.mark);
    let clipDim = ndx.dimension(d => d.clip);
    let tagDim = ndx.dimension(d => d.tag);
    let stkMethDim = ndx.dimension(d => d.stockingMethod);

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

    const updateGroups = responseVar => {
      yearGroup = yearDim.group().reduceSum(d => d[responseVar]);
      monthGroup = monthDim.group().reduceSum(d => d[responseVar]);
      lakeGroup = lakeDim.group().reduceSum(d => d[responseVar]);
      agencyGroup = agencyDim.group().reduceSum(d => d[responseVar]);
      stateProvGroup = stateProvDim.group().reduceSum(d => d[responseVar]);
      jurisdictionGroup = jurisdictionDim
        .group()
        .reduceSum(d => d[responseVar]);
      //let manUnitGroup = manUnitDim.group().reduceSum(d => d[responseVar]);
      grid10Group = grid10Dim.group().reduceSum(d => d[responseVar]);
      speciesGroup = speciesDim.group().reduceSum(d => d[responseVar]);
      strainGroup = strainDim.group().reduceSum(d => d[responseVar]);
      lifeStageGroup = lifeStageDim.group().reduceSum(d => d[responseVar]);
      markGroup = markDim.group().reduceSum(d => d[responseVar]);
      tagGroup = tagDim.group().reduceSum(d => d[responseVar]);
      clipGroup = clipDim.group().reduceSum(d => d[responseVar]);
      stkMethGroup = stkMethDim.group().reduceSum(d => d[responseVar]);
    };

    updateGroups(responseVar);

    // these are the unique values for each category variable - used
    // select stack of barcharts and add 0's were necessary.
    const uniqueLakes = lakeGroup.top(Infinity).map(d => d.key);
    const uniqueAgencies = agencyGroup.top(Infinity).map(d => d.key);
    const uniqueStateProvs = stateProvGroup.top(Infinity).map(d => d.key);
    const uniqueJurisdictions = jurisdictionGroup.top(Infinity).map(d => d.key);
    const uniqueSpecies = speciesGroup.top(Infinity).map(d => d.key);
    const uniqueStrains = strainGroup.top(Infinity).map(d => d.key);
    const uniqueLifestages = lifeStageGroup.top(Infinity).map(d => d.key);
    const uniqueStockingMethods = stkMethGroup.top(Infinity).map(d => d.key);
    const uniqueMarks = markGroup.top(Infinity).map(d => d.key);
    const uniqueClips = clipGroup.top(Infinity).map(d => d.key);
    const uniqueTags = tagGroup.top(Infinity).map(d => d.key);

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
    //let manUnitMapGroup = {};
    let grid10MapGroup = {};
    let geomMapGroup = {};

    const calcMapGroups = varName => {
      all = ndx
        .groupAll()
        .reduce(stockingAdd(varName), stockingRemove(varName), stockingInitial);

      lakeMapGroup = lakeDim
        .group()
        .reduce(stockingAdd(varName), stockingRemove(varName), stockingInitial);

      jurisdictionMapGroup = jurisdictionDim
        .group()
        .reduce(stockingAdd(varName), stockingRemove(varName), stockingInitial);

      stateProvMapGroup = stateProvDim
        .group()
        .reduce(stockingAdd(varName), stockingRemove(varName), stockingInitial);

      //      manUnitMapGroup = manUnitDim
      //        .group()
      //        .reduce(
      //          stockingAdd(varName),
      //          stockingRemove(varName),
      //            stockingInitial
      //        );

      grid10MapGroup = grid10Dim
        .group()
        .reduce(stockingAdd(varName), stockingRemove(varName), stockingInitial);

      geomMapGroup = geomDim
        .group()
        .reduce(stockingAdd(varName), stockingRemove(varName), stockingInitial);
    };

    calcMapGroups(varName);

    // initialize the stats panel
    update_stats_panel(all, {
      fillScale: sharedColourScale,
      label: categories.filter(d => d.name === varName)[0].label,
      what: responseVar
    });

    // set up an array of years:
    let first_year = yearDim.bottom(1)[0].year;
    let last_year = yearDim.top(1)[0].year;

    let years = range(first_year, last_year);
    years.push(last_year);

    //=========================================
    //      helper functions

    function sel_stack(item_name) {
      return function(d) {
        return d.value[item_name][responseVar];
      };
    }

    const ensure_group_bins = (group, keys) => {
      // (source_group, bins...}

      return {
        all: function() {
          let result = group.all().slice(0);
          result.forEach(function(x) {
            keys.forEach(function(d) {
              x.value[d] = x.value[d] || 0;
            });
          });
          return result;
        }
      };
    };

    select("#btn_reset_filters").on("click", () => {
      dc.filterAll();
      dc.renderAll();
    });

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

    // get teh default colour scale used by DC.js so we can revert
    // the charts back if they are no longer the selected category.
    const dcColours = strainChart.colors();

    const resetChartColours = () => {
      lakeChart.colors(dcColours);
      stateProvChart.colors(dcColours);
      agencyChart.colors(dcColours);
      jurisdictionChart.colors(dcColours);
      speciesChart.colors(dcColours);
      strainChart.colors(dcColours);
      lifestageChart.colors(dcColours);
      stockingMethodChart.colors(dcColours);
      stockingMonthChart.colors(dcColours);
      markChart.colors(dcColours);
      tagChart.colors(dcColours);
      clipChart.colors(dcColours);
    };

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

    let items = uniqueSpecies;
    let lookupMap = speciesMap;
    let plotLabel = "Species Stocked Through Time";

    //updateStackeBarLabel(plotLabel);

    const updateStackeBarLabel = label => {
      select("#stackedbar-chart-heading").text(label);
    };

    // each time the category changes we need to redefine byYear and
    // byYearLookup so that our tooltips work.
    let byYear = yearDim
      .group()
      .reduce(stockingAdd(varName), stockingRemove(varName), stockingInitial);

    let byYearWith0s = ensure_group_bins(byYear, items);

    // create string for stacked bar chart tooltips:
    let barchartTooltip = function(d) {
      let layer = this.layer.trim();
      if (layer !== "0") {
        let yr = d.key;
        let label = lookupMap[layer];
        // some of our lookups are objects with a description attribute:
        label = typeof label === "object" ? label.description : label;
        let stocked = commaFormat(
          d.value[layer] == 0 ? 0 : d.value[layer][responseVar]
        );
        return `${yr} - ${label}: ${stocked}`;
      } else {
        return "";
      }
    };

    let stackedByYearBarChartXScale = scaleLinear().domain([
      first_year - 0.6,
      last_year + 0.55
    ]);

    stackedByYearBarChart
      .width(width1 * 2.4)
      .height(height1)
      .x(stackedByYearBarChartXScale)
      .margins({ left: 60, top: 20, right: 10, bottom: 30 })
      .brushOn(true)
      .centerBar(true)
      .alwaysUseRounding(true)
      .round(function(x) {
        return Math.floor(x) + 0.5;
      })
      .elasticY(true)
      .title(barchartTooltip);
    //.renderLabel(true);

    stackedByYearBarChart
      .xAxis()
      .tickFormat(format("d"))
      .ticks(years.length);

    // these are attributes we will be changing:
    stackedByYearBarChart
      .dimension(yearDim)
      .group(byYearWith0s, items[0], sel_stack(items[0]))
      .colors(sharedColourScale)
      .colorAccessor(function(d) {
        return this.layer;
      })
      .yAxisLabel(ylabel); // make this a function of 'column'

    for (let i = 1; i < items.length; ++i) {
      stackedByYearBarChart.stack(byYearWith0s, items[i], sel_stack(items[i]));
    }

    stackedByYearBarChart.render();

    updateStackeBarLabel(plotLabel);

    stackedByYearBarChart.on("postRender", function() {
      stackedByYearBarChart
        .select("#stackedbar-chart rect.overlay")
        .on("dblclick", function() {
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
    const setBrushTooltip = tooltip => {
      let overlay = select("#stackedbar-chart rect.overlay");
      overlay.classed("pass-through", tooltip);
      let selection = select("#stackedbar-chart rect.selection");
      selection.classed("pass-through", tooltip);
    };

    // toggle the css
    let brushtoggle = selectAll(".stackedbar-brush-toggle");
    brushtoggle.on("change", function() {
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
    lakeChart
      .width(width1)
      .height(height1)
      .dimension(lakeDim)
      .group(lakeGroup)
      .label(d => lakeMap[d.key])
      .title(d => `${lakeMap[d.key]}: ${commaFormat(d.value)}`);

    lakeChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = lakeChart.filters();
        if (!filters || !filters.length) {
          select("#lake-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          select("#lake-filter")
            .text(filters)
            .classed("filtered", true);
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

    agencyChart
      .width(width1)
      .height(height1)
      .dimension(agencyDim)
      .group(agencyGroup)
      .title(d => `${agencyMap[d.key]}: ${commaFormat(d.value)}`);

    agencyChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = agencyChart.filters();
        if (!filters || !filters.length) {
          select("#agency-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          select("#agency-filter")
            .text(filters)
            .classed("filtered", true);
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

    jurisdictionChart
      .width(width1)
      .height(height1)
      .dimension(jurisdictionDim)
      .group(jurisdictionGroup)
      .label(d => jurisdictionMap[d.key].stateprov)
      .title(
        d => `${jurisdictionMap[d.key].description}: ${commaFormat(d.value)}`
      );

    jurisdictionChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = jurisdictionChart.filters();
        if (!filters || !filters.length) {
          select("#jurisdiction-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          select("#jurisdiction-filter")
            .text(filters)
            .classed("filtered", true);
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

    stateProvChart
      .width(width1)
      .height(height1)
      .dimension(stateProvDim)
      .group(stateProvGroup)
      .title(d => `${stateProvMap[d.key]}: ${commaFormat(d.value)}`);

    stateProvChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = stateProvChart.filters();
        if (!filters || !filters.length) {
          select("#state-prov-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          select("#state-prov-filter")
            .text(filters)
            .classed("filtered", true);
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

    speciesChart
      .width(width1)
      .height(height1)
      .dimension(speciesDim)
      .group(speciesGroup)
      .colors(speciesColourScale)

      .title(d => `${speciesMap[d.key]}: ${commaFormat(d.value)}`);

    speciesChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = speciesChart.filters();
        if (!filters || !filters.length) {
          select("#species-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          select("#species-filter")
            .text(filters)
            .classed("filtered", true);
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

    strainChart
      .width(width1)
      .height(height1)
      .dimension(strainDim)
      .group(strainGroup)
      .title(d => `${strainMap[d.key].long}: ${commaFormat(d.value)}`)
      .label(d => strainMap[d.key].short);

    strainChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = strainChart.filters();
        if (!filters || !filters.length) {
          select("#strain-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          let labels = filters.map(d => strainMap[d].short);
          select("#strain-filter")
            .text(labels)
            .classed("filtered", true);
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

    lifestageChart
      .width(width2)
      .height(height2)
      .margins({ top: 5, left: 10, right: 10, bottom: 20 })
      .dimension(lifeStageDim)
      .group(lifeStageGroup)
      //.ordering(d => d.key)
      .gap(2)
      .title(d => commaFormat(d.value))
      .label(d => lifestageMap[d.key])
      .elasticX(true)
      .xAxis()
      .ticks(4);

    lifestageChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = lifestageChart.filters();
        if (!filters || !filters.length) {
          select("#lifestage-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          select("#lifestage-filter")
            .text(filters)
            .classed("filtered", true);
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

    stockingMethodChart
      .width(width2)
      .height(height2)
      .margins({ top: 5, left: 10, right: 10, bottom: 20 })
      .dimension(stkMethDim)
      .group(stkMethGroup)
      //.ordering(d => d.key)
      .gap(2)
      .title(d => commaFormat(d.value))
      .label(d => stockingMethodMap[d.key])
      .elasticX(true)
      .xAxis()
      .ticks(4);

    stockingMethodChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
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
      .ordering(d => d.key)
      .gap(2)
      .title(d => commaFormat(d.value))
      .label(d => month_lookup[d.key])
      .elasticX(true)
      .xAxis()
      .ticks(4);

    stockingMonthChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = stockingMonthChart.filters();
        if (!filters || !filters.length) {
          select("#stocking-month-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          let labels = filters.map(d => month_lookup[d]);
          select("#stocking-month-filter")
            .text(labels)
            .classed("filtered", true);
        }
      });
    });

    select("#stocking-month-plot-reset").on("click", () => {
      event.preventDefault();
      stockingMethodChart.filterAll();
      dc.redrawAll();
    });

    //==============================================
    //               MARKS

    markChart
      .width(width2)
      .height(height2)
      .dimension(markDim)
      .group(markGroup)
      .title(d => `${d.key}: ${commaFormat(d.value)}`);

    markChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = markChart.filters();
        if (!filters || !filters.length) {
          select("#mark-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          select("#mark-filter")
            .text(filters)
            .classed("filtered", true);
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

    clipChart
      .width(width2)
      .height(height2)
      .dimension(clipDim)
      .group(clipGroup)
      .title(d => `${d.key}: ${commaFormat(d.value)}`);

    clipChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = clipChart.filters();
        if (!filters || !filters.length) {
          select("#clip-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          select("#clip-filter")
            .text(filters)
            .classed("filtered", true);
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

    tagChart
      .width(width2)
      .height(height2)
      .dimension(tagDim)
      .group(tagGroup)
      .title(d => `${d.key}: ${commaFormat(d.value)}`);

    tagChart.on("renderlet", function(chart) {
      dc.events.trigger(function() {
        let filters = tagChart.filters();
        if (!filters || !filters.length) {
          select("#tag-filter")
            .text("All")
            .classed("filtered", false);
        } else {
          select("#tag-filter")
            .text(filters)
            .classed("filtered", true);
        }
      });
    });

    select("#tag-plot-reset").on("click", () => {
      event.preventDefault();
      tagChart.filterAll();
      dc.redrawAll();
    });

    dc.renderAll();

    //==================================================+
    //         RADIO BUTTON CHANGE LISTENERS

    spatial_resolution.on("change", function() {
      update_spatialUnit(this.value);
    });

    // an accessor function to get values of our currently selected
    // response variable.
    let ptAccessor = d =>
      Object.keys(d.value).map(x => d.value[x][responseVar]);

    // a helper function to get the data in the correct format for
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
        //        case "manUnit":
        //               pts = Object.values(manUnitMapGroup.all());
        //                break;
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

    let pts = get_pts(spatialUnit, centroids, ptAccessor);
    pieg.data([pts]).call(piecharts);

    // recacalculate the points given the current spatial unit and
    // point accessor
    const updatePieCharts = () => {
      piecharts
        .fillScale(sharedColourScale)
        .selectedPie(null)
        .clear_pointInfo();

      pts = get_pts(spatialUnit, centroids, ptAccessor);
      pieg.data([pts]).call(piecharts);

      update_stats_panel(all, {
        //fillScale: speciesColourScale,
        fillScale: sharedColourScale,
        label: categories.filter(d => d.name === varName)[0].label,
        what: varName
      });
    };

    // if the spatial radio buttons change, update the global variable
    // and update the pie charts
    const update_spatialUnit = value => {
      spatialUnit = value;
      spatialSelector.checked(spatialUnit).refresh();
      updatePieCharts();
    };

    // if the pie chart slice selector radio buttons changes, update
    // the global variable and update the pie charts
    const update_sliceValue = value => {
      varName = value;
      calcMapGroups();
      updatePieCharts();
    };

    // set up a change event handler each fime the crossfilter changes
    ndx.onChange(() => {
      //update our map too:
      pts = get_pts(spatialUnit, centroids, ptAccessor);
      pieg.data([pts]).call(piecharts);
      updatePieCharts();
      update_stats_panel(all, {
        fillScale: sharedColourScale,
        label: categories.filter(d => d.name === varName)[0].label,
        what: responseVar
      });
    });

    //==================================================+
    //         RADIO BUTTON CHANGE LISTENERS

    spatial_resolution.on("change", function() {
      update_spatialUnit(this.value);
    });

    pie_size_selector.on("change", function() {
      responseVar = this.value;
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
    category_selector.on("change", function() {
      varName = this.value;
      //update_CategoryValue(varName);

      resetChartColours();

      switch (varName) {
        case "species_code":
          items = uniqueSpecies;
          lookupMap = speciesMap;
          plotLabel = "Species Stocked Through Time";
          speciesChart.colors(sharedColourScale);
          break;
        case "lake":
          items = uniqueLakes;
          lookupMap = lakeMap;
          plotLabel = "Stocking By Lake Through Time";
          lakeChart.colors(sharedColourScale);
          break;
        case "stateProv":
          items = uniqueStateProvs;
          lookupMap = stateProvMap;
          plotLabel = "Stocking By State/Province Through Time";
          stateProvChart.colors(sharedColourScale);
          break;
        case "jurisdiction_code":
          items = uniqueJurisdictions;
          lookupMap = jurisdictionMap;
          plotLabel = "Stocking By Jurisdiction Through Time";
          jurisdictionChart.colors(sharedColourScale);
          break;
        case "agency_code":
          items = uniqueAgencies;
          lookupMap = agencyMap;
          plotLabel = "Stocking By Agency Through Time";
          agencyChart.colors(sharedColourScale);
          break;
        case "strain":
          items = uniqueStrains;
          lookupMap = strainShortMap;
          plotLabel = "Stocking By Strain Through Time";
          strainChart.colors(sharedColourScale);
          break;
        case "clip":
          items = uniqueClips;
          lookupMap = clipMap;
          plotLabel = "Stocking By Clip Through Time";
          clipChart.colors(sharedColourScale);
          break;
        case "mark":
          items = uniqueMarks;
          lookupMap = markMap;
          plotLabel = "Stocking By Mark Through Time";
          markChart.colors(sharedColourScale);
          break;
        case "tag":
          items = uniqueTags;
          lookupMap = tagMap;
          plotLabel = "Stocking By Tag Type Through Time";
          tagChart.colors(sharedColourScale);
          break;
        case "lifestage_code":
          items = uniqueLifestages;
          lookupMap = lifestageMap;
          plotLabel = "Stocking By LifeStage Through Time";
          lifestageChart.colors(sharedColourScale);
          break;
        case "stockingMethod":
          items = uniqueStockingMethods;
          lookupMap = stockingMethodMap;
          plotLabel = "Stocking By Stocking Method Through Time";
          stockingMethodChart.colors(sharedColourScale);
          break;
        default:
          items = uniqueSpecies;
          lookupMap = speciesMap;
          plotLabel = "Species Stocked Through Time";
          speciesChart.colors(sharedColourScale);
      }

      // these need to be recalculated.  All Species is Global to the application,
      // items list of unique values of the resposne variable available when the page loaded.
      if (varName === "species_code") {
        sharedColourScale.domain(all_species);
      } else {
        sharedColourScale.domain(items);
      }

      byYear = yearDim
        .group()
        .reduce(stockingAdd(varName), stockingRemove(varName), stockingInitial);

      byYearWith0s = ensure_group_bins(byYear, items);

      calcMapGroups(varName);
      updateStackeBarLabel(plotLabel);
      updatePieCharts();

      stackedByYearBarChart
        .group(byYearWith0s, items[0], sel_stack(items[0]))
        .colors(sharedColourScale);

      for (let i = 1; i < items.length; ++i) {
        stackedByYearBarChart.stack(
          byYearWith0s,
          items[i],
          sel_stack(items[i])
        );
      }

      update_stats_panel(all, {
        fillScale: sharedColourScale,
        label: categories.filter(d => d.name === varName)[0].label,
        what: responseVar
      });

      dc.redrawAll();
      //stackedByYearBarChart.redraw();
      stackedByYearBarChart.render();

      let tmp = select('input[name="brush-toggle"]:checked').node().value;
      setBrushTooltip(tmp === "tooltip");
    });

    mymap.on("moveend", function() {
      //polygons.render();
      pieg.call(piecharts);
    });
  }
);
