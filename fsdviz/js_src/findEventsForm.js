/* global values lakes, agencies, jurisdictions, stateProv, species, strains, lifestages, stockingMethods */

import { select } from "d3";

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
species.forEach(
  d => (species_lookup[d.abbrev] = `${d.common_name} (${d.abbrev})`)
);

let strain_lookup = {};
strains.forEach(
  d => (strain_lookup[d.id] = `${d.strain_label} (${d.strain_code})`)
);

let lifestage_lookup = {};
lifestages.forEach(
  d => (lifestage_lookup[d.id] = `${d.description} (${d.abbrev})`)
);

let method_lookup = {};
stockingMethods.forEach(
  d => (method_lookup[d.stk_meth] = `${d.description} (${d.stk_meth})`)
);

const get_selections = function(widget) {
  var selected = [];
  for (var i = widget.selectedIndex; i < widget.length; i++) {
    if (widget.options[i].selected) {
      selected.push(widget.options[i].value);
    }
  }
  console.log("selected = ", selected);
};

// create listeners for each of our form widgets

let lake_listener = select("#id_lake").on("change", function() {
  get_selections(this);
});

let stateProv_listener = select("#id_stateprov").on("change", function() {
  get_selections(this);
});

let jurisdiction_listener = select("#id_jurisdiction").on("change", function() {
  get_selections(this);
});

let firstYear_listener = select("#id_first_year").on("change", function() {
  let selected = this.value;
  console.log("selected = ", selected);
});

let lastYear_listener = select("#id_last_year").on("change", function() {
  let selected = this.value;
  console.log("selected = ", selected);
});

let agency_listener = select("#id_agency").on("change", function() {
  get_selections(this);
});

let species_listener = select("#id_species").on("change", function() {
  get_selections(this);
});

let strain_listener = select("#id_strain").on("change", function() {
  get_selections(this);
});

let lifeStage_listener = select("#id_life_stage").on("change", function() {
  get_selections(this);
});

let stockingMethod_listener = select("#id_stocking_method").on(
  "change",
  function() {
    get_selections(this);
  }
);
