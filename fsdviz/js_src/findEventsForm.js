/* global values filterDim, roiDim, lakes, agencies, jurisdictions, stateProv, species_list, strains, lifestages, stockingMethods */

import crossfilter from "crossfilter2";
import { select, selectAll, format } from "d3";

import { monthLookup } from "./components/constants";

// some constants:

const commaFormat = format(",d");
let firstYear = "";
let lastYear = "";

// a little scrubbing:
values.forEach((d) => {
  d.month = d.month ? "" + d.month : "0";
  d.year = parseInt(d.year);
  d.events = parseInt(d.events);
  d.strain = d.strain + "";
  return d;
});

// create our lookup tables

const lake_lookup = lakes.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

const agency_lookup = agencies.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

const jurisdiction_lookup = jurisdictions.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

const stateProv_lookup = stateProv.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

const species_lookup = species_list.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

const strain_lookup = strains.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

const lifestage_lookup = lifestages.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

const method_lookup = stockingMethods.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

// let manUnit_lookup = {};
// managementUnits.forEach(
//   d => (manUnit_lookup[d.slug] = `${d.description} (${d.label})`)
// );

const get_selections = function (widget, what = "value") {
  const selected = [];
  if (widget.selectedIndex >= 0) {
    for (let i = widget.selectedIndex; i < widget.length; i++) {
      if (widget.options[i].selected) {
        selected.push(widget.options[i][what]);
      }
    }
  }

  return selected;
};

// = ============================================
//           Helper Functions

// get the options that are still available in a group
// given the active filters:
const get_options = (grp) =>
  grp
    .top(Infinity)
    .filter((d) => d.value > 0)
    .map((d) => d.key);

// update the options given a selector, the options, and a lookup table
const update_options = (selector, option_data, lookup, sortKey = "label") => {
  let options = select(selector)
    .selectAll("option")
    .data(option_data, function (d) {
      return d || this.value;
    });

  options.exit().remove();

  const optionsEnter = options
    .enter()
    .append("option")
    .text((d) => lookup[d])
    .attr("value", (d) => d);

  options = options.merge(optionsEnter);

  if (sortKey === "label") {
    options.sort(function (a, b) {
      return lookup[a].localeCompare(lookup[b]);
    });
  } else {
    options.sort(function (a, b) {
      return a - b;
    });
  }
};

// const filterDim = (dimension, selected) => {
//  if (selected.length) {
//    dimension.filter((d) => selected.indexOf(d) > -1);
//  } else {
//    dimension.filterAll();
//  }
// };
//
// now we are going to set up our crossfilter

const ndx = crossfilter(values);

const all = ndx.groupAll().reduceSum((d) => d.events);

const yearDim = ndx.dimension((d) => d.year);
const monthDim = ndx.dimension((d) => d.month);
const lakeDim = ndx.dimension((d) => d.lake);
const jurisdictionDim = ndx.dimension((d) => d.jurisd);
// roiDim = ndx.dimension((d) => d.jurisd);
roiDim = ndx.dimension((d) => d.manUnit);
const stateDim = ndx.dimension((d) => d.state);
const agencyDim = ndx.dimension((d) => d.agency_code);
const speciesDim = ndx.dimension((d) => d.spc);
const strainDim = ndx.dimension((d) => d.strain);
const markDim = ndx.dimension((d) => d.mark);
const methodDim = ndx.dimension((d) => d.method);
const stageDim = ndx.dimension((d) => d.stage);

// set up our groups
const yearGroup = yearDim.group().reduceSum((d) => d.events);
const monthGroup = monthDim.group().reduceSum((d) => d.events);
const lakeGroup = lakeDim.group().reduceSum((d) => d.events);
const jurisdictionGroup = jurisdictionDim.group().reduceSum((d) => d.events);
const roiGroup = roiDim.group().reduceSum((d) => d.events);
const stateGroup = stateDim.group().reduceSum((d) => d.events);
const agencyGroup = agencyDim.group().reduceSum((d) => d.events);
const speciesGroup = speciesDim.group().reduceSum((d) => d.events);
const strainGroup = strainDim.group().reduceSum((d) => d.events);
const markGroup = markDim.group().reduceSum((d) => d.events);
const methodGroup = methodDim.group().reduceSum((d) => d.events);
const stageGroup = stageDim.group().reduceSum((d) => d.events);

const update_total = () => {
  const total = all.value();
  select("#event-total")
    .text(commaFormat(total))
    .classed("total-zero", total <= 0);
};

const update_widgets = () => {
  let options = get_options(lakeGroup);
  update_options("#id_lake", options, lake_lookup);

  options = get_options(monthGroup);
  update_options("#id_months", options, monthLookup, "id");

  options = get_options(stateGroup);
  update_options("#id_stateprov", options, stateProv_lookup);

  options = get_options(jurisdictionGroup);
  update_options("#id_jurisdiction", options, jurisdiction_lookup);

  options = get_options(agencyGroup);
  update_options("#id_agency", options, agency_lookup);

  options = get_options(speciesGroup);
  update_options("#id_species", options, species_lookup);

  options = get_options(strainGroup);
  update_options("#id_strain", options, strain_lookup);

  // options = get_options(markGroup);
  // update_options("#id_mark", options, mark_lookup);

  options = get_options(stageGroup);
  update_options("#id_life_stage", options, lifestage_lookup);

  options = get_options(methodGroup);
  update_options("#id_stocking_method", options, method_lookup);

  update_total();
};

ndx.onChange(() => {
  update_widgets();
});

// initalize everything:
update_widgets();

const filterYears = (firstYear, lastYear) => {
  // clear any existing filters on year:

  if (firstYear && lastYear) {
    const top = parseInt(lastYear) + 1;
    yearDim.filter([parseInt(firstYear), top]);
  } else if (firstYear && lastYear === "") {
    yearDim.filterFunction((d) => d >= parseInt(firstYear));
  } else if (firstYear === "" && lastYear) {
    yearDim.filterFunction((d) => d <= parseInt(lastYear));
  } else {
    yearDim.filterAll();
  }
};

const checkYears = (firstYear, lastYear) => {
  const yearInputs = selectAll(".year-input");
  if (firstYear !== "" && lastYear !== "" && firstYear > lastYear) {
    yearInputs.classed("error", true);
  } else {
    yearInputs.classed("error", false);
  }
};

// = ============================================
// create listeners for each of our form widgets

select("#id_lake").on("change", function () {
  const selected = get_selections(this);
  filterDim(lakeDim, selected);
});

select("#id_stateprov").on("change", function () {
  const selected = get_selections(this);
  filterDim(stateDim, selected);
});

select("#id_jurisdiction").on("change", function () {
  const selected = get_selections(this);
  filterDim(jurisdictionDim, selected);
});

select("#id_first_year").on("change", function () {
  firstYear = this.value || "";
  checkYears(firstYear, lastYear);
  filterYears(firstYear, lastYear);
});

select("#id_last_year").on("change", function () {
  lastYear = this.value || "";
  checkYears(firstYear, lastYear);
  filterYears(firstYear, lastYear);
});

select("#id_months").on("change", function () {
  const selected = get_selections(this);
  filterDim(monthDim, selected);
});

select("#id_agency").on("change", function () {
  const selected = get_selections(this);
  filterDim(agencyDim, selected);
});

select("#id_species").on("change", function () {
  const selected = get_selections(this);
  filterDim(speciesDim, selected);
});

select("#id_strain").on("change", function () {
  const selected = get_selections(this);
  filterDim(strainDim, selected);
});

select("#id_life_stage").on("change", function () {
  const selected = get_selections(this);
  filterDim(stageDim, selected);
});

select("#id_stocking_method").on("change", function () {
  const selected = get_selections(this);
  filterDim(methodDim, selected);
});

select("#reset-button").on("click", () => {
  $("#find-events-form").form("reset");

  // TODO:  remove roi from leaflet map

  yearDim.filterAll();
  monthDim.filterAll();
  lakeDim.filterAll();
  jurisdictionDim.filterAll();
  roiDim.filterAll();
  stateDim.filterAll();
  agencyDim.filterAll();
  speciesDim.filterAll();
  strainDim.filterAll();
  markDim.filterAll();
  methodDim.filterAll();
  stageDim.filterAll();
});
