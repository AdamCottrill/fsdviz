/* global values lakes, agencies, jurisdictions, stateProv, species, strains, lifestages, stockingMethods */

import crossfilter from "crossfilter2";
import { select, selectAll, format } from "d3";

// some constants:

let commaFormat = format(",d");
let firstYear;
let lastYear;

const month_lookup = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
  0: "Unk"
};

// create our lookup tables

let lake_lookup = {};
lakes.forEach(d => (lake_lookup[d.abbrev] = `${d.lake_name} (${d.abbrev})`));

let agency_lookup = {};
agencies.forEach(
  d => (agency_lookup[d.abbrev] = `${d.agency_name} (${d.abbrev})`)
);

let jurisdiction_lookup = {};
jurisdictions.forEach(d => (jurisdiction_lookup[d.slug] = d.name));

let stateProv_lookup = {};
stateProv.forEach(
  d => (stateProv_lookup[d.abbrev] = `${d.name} (${d.abbrev})`)
);

let manUnit_lookup = {};
managementUnits.forEach(
  d => (manUnit_lookup[d.slug] = `${d.description} (${d.label})`)
);

let species_lookup = {};
species_list.forEach(
  d => (species_lookup[d.abbrev] = `${d.common_name} (${d.abbrev})`)
);

let strain_lookup = {};
strains.forEach(
  d =>
    (strain_lookup[d.id] = `${d.spc_name} - ${d.strain_label} (${
      d.strain_code
    })`)
);

let lifestage_lookup = {};
lifestages.forEach(
  d => (lifestage_lookup[d.abbrev] = `${d.description} (${d.abbrev})`)
);

let method_lookup = {};
stockingMethods.forEach(
  d => (method_lookup[d.stk_meth] = `${d.description} (${d.stk_meth})`)
);

const get_selections = function(widget) {
  let selected = [];

  if (widget.selectedIndex >= 0) {
    for (let i = widget.selectedIndex; i < widget.length; i++) {
      if (widget.options[i].selected) {
        selected.push(widget.options[i].value);
      }
    }
  }

  return selected;
};

//=============================================
//           Helper Functions

// get the options that are still available in a group
// given the active filters:
const get_options = grp =>
  grp
    .top(Infinity)
    .filter(d => d.value > 0)
    .map(d => d.key);

// update the options given a selector, the options, and a lookup table
const update_options = (selector, option_data, lookup, sortKey = "label") => {
  let options = select(selector)
    .selectAll("option")
    .data(option_data, function(d) {
      return d ? d : this.value;
    });

  options.exit().remove();

  let optionsEnter = options
    .enter()
    .append("option")
    .text(d => lookup[d])
    .attr("value", d => d);

  options = options.merge(optionsEnter);

  if (sortKey === "label") {
    options.sort(function(a, b) {
      return lookup[a].localeCompare(lookup[b]);
    });
  } else {
    options.sort(function(a, b) {
      return a - b;
    });
  }
};

const filterDim = (dimension, selected) => {
  if (selected.length) {
    dimension.filter(d => selected.indexOf(d) > -1);
  } else {
    dimension.filterAll();
  }
};

// now we are going to set up our crossfilter

let ndx = crossfilter(values);

let all = ndx.groupAll().reduceSum(d => d.events);

let yearDim = ndx.dimension(d => d.year);
let monthDim = ndx.dimension(d => d.month);
let lakeDim = ndx.dimension(d => d.lake);
let jurisdictionDim = ndx.dimension(d => d.jurisd);
let stateDim = ndx.dimension(d => d.state);
let agencyDim = ndx.dimension(d => d.agency_code);
let speciesDim = ndx.dimension(d => d.spc);
let strainDim = ndx.dimension(d => d.strain);
let markDim = ndx.dimension(d => d.mark);
let methodDim = ndx.dimension(d => d.method);
let stageDim = ndx.dimension(d => d.stage);

// set up our groups
let yearGroup = yearDim.group().reduceSum(d => d.events);
let monthGroup = monthDim.group().reduceSum(d => d.events);
let lakeGroup = lakeDim.group().reduceSum(d => d.events);
let jurisdictionGroup = jurisdictionDim.group().reduceSum(d => d.events);
let stateGroup = stateDim.group().reduceSum(d => d.events);
let agencyGroup = agencyDim.group().reduceSum(d => d.events);
let speciesGroup = speciesDim.group().reduceSum(d => d.events);
let strainGroup = strainDim.group().reduceSum(d => d.events);
let markGroup = markDim.group().reduceSum(d => d.events);
let methodGroup = methodDim.group().reduceSum(d => d.events);
let stageGroup = stageDim.group().reduceSum(d => d.events);

const update_total = () => {
  select("#event-total").text(commaFormat(all.value()));
};

const update_widgets = () => {
  let options = get_options(lakeGroup);
  update_options("#id_lake", options, lake_lookup);

  options = get_options(monthGroup);
  update_options("#id_months", options, month_lookup, "id");

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

  //options = get_options(markGroup);
  //update_options("#id_mark", options, mark_lookup);

  options = get_options(stageGroup);
  update_options("#id_life_stage", options, lifestage_lookup);

  options = get_options(methodGroup);
  update_options("#id_stocking_method", options, method_lookup);

  update_total();
};

ndx.onChange(() => {
  update_widgets();
});

//initalize everything:
update_widgets();

const filterYears = (firstYear, lastYear) => {
  if (firstYear && lastYear) {
    yearDim.filter([firstYear, lastYear]);
  } else if (firstYear) {
    yearDim.filter(d => d >= firstYear);
  } else if (lastYear) {
    yearDim.filter(d => d <= lastYear);
  } else {
    yearDim.filterAll();
  }
};

//=============================================
// create listeners for each of our form widgets

let lake_listener = select("#id_lake").on("change", function() {
  let selected = get_selections(this);
  filterDim(lakeDim, selected);
});

let stateProv_listener = select("#id_stateprov").on("change", function() {
  let selected = get_selections(this);
  filterDim(stateDim, selected);
});

let jurisdiction_listener = select("#id_jurisdiction").on("change", function() {
  let selected = get_selections(this);
  filterDim(jurisdictionDim, selected);
});

let firstYear_listener = select("#id_first_year").on("change", function() {
  firstYear = this.value;
  filterYears(firstYear, lastYear);
});

let lastYear_listener = select("#id_last_year").on("change", function() {
  firstYear = this.value;
  filterYears(firstYear, lastYear);
});

let month_listener = select("#id_months").on("change", function() {
  let selected = get_selections(this);
  filterDim(monthDim, selected);
});

let agency_listener = select("#id_agency").on("change", function() {
  let selected = get_selections(this);
  filterDim(agencyDim, selected);
});

let species_listener = select("#id_species").on("change", function() {
  let selected = get_selections(this);
  filterDim(speciesDim, selected);
});

let strain_listener = select("#id_strain").on("change", function() {
  let selected = get_selections(this);
  filterDim(strainDim, selected);
});

let lifeStage_listener = select("#id_life_stage").on("change", function() {
  let selected = get_selections(this);
  filterDim(stageDim, selected);
});

let stockingMethod_listener = select("#id_stocking_method").on(
  "change",
  function() {
    let selected = get_selections(this);
    filterDim(methodDim, selected);
  }
);

//debugger;

//events

//agency_code

//jurisd
//lake
//mark
//method
//month
//spc
//stage
//state
//strain
//year
