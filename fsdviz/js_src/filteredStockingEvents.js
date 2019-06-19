/* global values dc, dataURL, maxEvents */

import crossfilter from "crossfilter2";
import {
  select,
  selectAll,
  mouse,
  json,
  timeParse,
  format,
  range,
  scaleLinear
} from "d3";
// import dc from "dc";

const dateParser = timeParse("%Y-%m-%d");
let commaFormat = format(",");

const width1 = 425;
const height1 = 400;
const width2 = 300;
const height2 = 300;

let column = "yreq_stocked";

const markLookup = [
  ["ad", "AD"],
  ["Ad", "AD"],
  ["AD", "AD"],
  ["Ad/T-bar tag", "ADTAG"],
  ["ADCWT", "ADCWT"],
  ["ADCWTOX", "ADCWTOX"],
  ["ADDO", "ADDO"],
  ["ADDORV", "ADDORV"],
  ["ADLM", "ADLM"],
  ["ADLMLP", "ADLMLP"],
  ["ADLMLV", "ADLMLV"],
  ["ADLMRP", "ADLMRP"],
  ["ADLMRV", "ADLMRV"],
  ["ADLP", "ADLP"],
  ["ADCWTLP", "ADLPCWT"],
  ["ADLPRM", "ADLPRM"],
  ["ADLPRV", "ADLPRV"],
  ["ADLV", "ADLV"],
  ["ADCWTLV", "ADLVCWT"],
  ["ADLVOX", "ADLVOX"],
  ["ADLVRM", "ADLVRM"],
  ["ADLVRP", "ADLVRP"],
  ["ADOX", "ADOX"],
  ["ADOXRV", "ADRVOX"],
  ["ADPT", "ADPT"],
  ["ADRM", "ADRM"],
  ["ADRMRP", "ADRMRP"],
  ["ADRMRV", "ADRMRV"],
  ["ADRP", "ADRP"],
  ["ADCWTRP", "ADRPCWT"],
  ["ADRV", "ADRV"],
  ["ADCWTRV", "ADRVCWT"],
  ["CA", "CA"],
  ["CA2", "CA"],
  ["CAL", "CA"],
  ["CWT", "CWT"],
  ["CWTOX", "CWTOX"],
  ["DO", "DO"],
  ["DOLP", "DOLP"],
  ["DOLV", "DOLV"],
  ["DORP", "DORP"],
  ["DORV", "DORV"],
  ["LM", "LM"],
  ["LMLP", "LMLP"],
  ["LMLV", "LMLV"],
  ["LP", "LP"],
  ["CWTLP", "LPCWT"],
  ["LPLV", "LPLV"],
  ["LPOX", "LPOX"],
  ["LPRM", "LPRM"],
  ["BP", "LPRP"],
  ["LPRV", "LPRV"],
  ["LPOXRV", "LPRVOX"],
  ["LR", "LR"],
  ["LV", "LV"],
  ["CWTLV", "LVCWT"],
  ["LVOX", "LVOX"],
  ["LVPT", "LVPT"],
  ["LVRP", "LVRP"],
  ["LVOXRP", "LVRPOX"],
  ["BV", "LVRV"],
  ["BVPIT", "LVRVPIT"],
  ["NC", "None"],
  ["NO", "None"],
  ["None", "None"],
  ["none", "None"],
  ["", "None"],
  ["OTC", "OX"],
  ["ox", "OX"],
  ["OX", "OX"],
  ["OXRP", "OXRP"],
  ["OXRV", "OXRV"],
  ["PIT", "PT"],
  ["PIT tag", "PT"],
  ["PT", "PT"],
  ["PTRV", "PTRV"],
  ["RM", "RM"],
  ["RMRV", "RMRV"],
  ["RP", "RP"],
  ["RPRV", "RPRV"],
  ["RV", "RV"],
  ["CWTRV", "RVCWT"],
  ["CWTOXRV", "RVCWTOX"],
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

const markMap = markLookup.reduce((accumulator, d) => {
  accumulator[d[0]] = d[1];
  return accumulator;
}, {});

// Reducers for dims by species:

const speciesAdd = (p, v) => {
  let counts = p[v.species_code] || {
    yreq_stocked: 0,
    no_stocked: 0,
    event_count: 0
  };
  counts.yreq_stocked += v.yreq_stocked;
  counts.no_stocked += v.no_stocked;
  counts.event_count += v.event_count;
  p[v.species_code] = counts;
  return p;
};

const speciesRemove = (p, v) => {
  let counts = p[v.species_code] || {
    yreq_stocked: 0,
    no_stocked: 0,
    event_count: 0
  };
  counts.yreq_stocked -= v.yreq_stocked;
  counts.no_stocked -= v.no_stocked;
  counts.event_count -= v.event_count;
  p[v.species_code] = counts;
  return p;
};

const speciesInitial = () => {
  return {};
};

json(dataURL).then(function(data) {
  select("#record-count-warning").classed(
    "hidden",
    data.length >= maxEvents ? false : true
  );

  data.forEach(d => {
    //d.date: "2016-02-01"
    d.date = d.date ? dateParser(d.date) : "";
    d.dd_lat = parseFloat(d.dd_lat);
    d.dd_lon = parseFloat(d.dd_lon);
    d.grid_10 = parseInt(d.grid_10);
    d.month = d.month ? parseInt(d.month) : 0;
    d.no_stocked = parseInt(d.no_stocked);
    d.strain = parseInt(d.strain);
    d.year = parseInt(d.year);
    d.year_class = parseInt(d.year_class);
    d.yreq_stocked = parseInt(d.yreq_stocked);
    d.event_count = 1;
    d.mark = markMap[d.mark] ? markMap[d.mark] : "Unknown";
    return d;
  });

  console.log("data[2] = ", data[2]);

  // parse date
  // get strain lookup

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
  //let geomDim = ndx.dimension(d => d.geom);

  let speciesDim = ndx.dimension(d => d.species_code);
  let strainDim = ndx.dimension(d => d.strain);
  let yearClassDim = ndx.dimension(d => d.year_class);
  let lifeStageDim = ndx.dimension(d => d.lifestage_code);
  let markDim = ndx.dimension(d => d.mark);
  let stkMethDim = ndx.dimension(d => d.stockingMethod);

  let yearGroup = yearDim.group().reduceSum(d => d[column]);
  let monthGroup = monthDim.group().reduceSum(d => d[column]);
  let lakeGroup = lakeDim.group().reduceSum(d => d[column]);
  let agencyGroup = agencyDim.group().reduceSum(d => d[column]);
  let stateProvGroup = stateProvDim.group().reduceSum(d => d[column]);
  let jurisdictionGroup = jurisdictionDim.group().reduceSum(d => d[column]);
  //let manUnitGroup = manUnitDim.group().reduceSum(d => d[column]);
  let grid10Group = grid10Dim.group().reduceSum(d => d[column]);
  let speciesGroup = speciesDim.group().reduceSum(d => d[column]);
  let strainGroup = strainDim.group().reduceSum(d => d[column]);
  let yearClassGroup = yearClassDim.group().reduceSum(d => d[column]);
  let lifeStageGroup = lifeStageDim.group().reduceSum(d => d[column]);
  let markGroup = markDim.group().reduceSum(d => d[column]);
  let stkMethGroup = stkMethDim.group().reduceSum(d => d[column]);

  let speciesStockedByYear = yearDim
    .group()
    .reduce(speciesAdd, speciesRemove, speciesInitial);

  //  let strainStockedByYear = yearDim
  //    .group()
  //    .reduce(stockingAdd, stockingRemove, stockingInitial);

  //=========================================
  //      helper functions

  function sel_stack(item_name) {
    return function(d) {
      return d.value[item_name][column];
    };
  }

  // a function to create a list of distinct values
  const get_values = (x, value) => {
    let tmp = [];
    x.forEach(function(d) {
      tmp.push(d[value]);
    });
    return [...new Set(tmp)];
  };

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

  // NOTE: not sure we need this. we should be able to pluck them
  // from the strain and species dimensions.
  let species_list = get_values(data, "species_code");
  let strain_list = get_values(data, "strain");

  let speciesStockedByYear0s = ensure_group_bins(
    speciesStockedByYear,
    species_list
  );
  let strainStockedByYear0s = ensure_group_bins(
    strainStockedByYear,
    strain_list
  );

  let species = species_list[0];
  let strain = strain_list[0];

  let first_year = yearDim.bottom(1)[0].year;
  let last_year = yearDim.top(1)[0].year;

  //  let years = [];
  //  for(let i=first_year; i<=last_year; ++i){
  //    years.push(""+i);
  //  }
  let years = range(first_year, last_year);
  years.push(last_year);

  const keyTooltip = function(d) {
    const format = format(",.0f");
    return `${d.key}: ${format(d.value)} kg`;
  };

  select("#btn_reset_filters").on("click", () => {
    dc.filterAll();
    dc.renderAll();
  });

  // declare our plots

  const speciesByYearBarChart = dc.barChart("#species-year-bar-chart");
  //const strainByYearBarChart = dc.barChart('#strain-year-bar-chart');

  const lakeChart = dc.pieChart("#lake-plot");
  const stateProvChart = dc.pieChart("#state-province-plot");
  const agencyChart = dc.pieChart("#agency-plot");
  const jurisdictionChart = dc.pieChart("#jurisdiction-plot");

  const speciesChart = dc.pieChart("#species-plot");
  const strainChart = dc.pieChart("#strain-plot");
  const markChart = dc.pieChart("#mark-plot");
  //  const markChart = dc.rowChart("#mark-plot");
  const lifestageChart = dc.rowChart("#lifestage-plot");
  const stockingMethodChart = dc.rowChart("#stocking-method-plot");

  // ==================================================================

  let speciesByYearBarChartXScale = scaleLinear().domain([
    first_year,
    last_year
  ]);

  // extract the event count given the year and spc
  // used for tool tips
  let get_event_count = (yr, spc) => {
    let counts = speciesEventsByYear.all().filter(item => item.key === yr)[0];
    return counts.value[spc];
  };

  // create string for stacked bar chart tooltips:
  let speciesTooltip = function(d) {
    let yr = d.key;
    let spc = this.layer.trim();
    // TODO = lookup species common name here.
    let stocked = commaFormat(d.value[spc] == 0 ? 0 : d.value[spc][column]);

    return `${yr} - ${spc}: ${stocked}`;
  };

  speciesByYearBarChart
    .width(width1 * 2)
    .height(height1)
    .x(speciesByYearBarChartXScale)
    .margins({ left: 60, top: 20, right: 10, bottom: 30 })
    .brushOn(true)
    .centerBar(true)
    .alwaysUseRounding(true)
    .round(function(x) {
      return Math.floor(x) + 0.5;
    })
    .clipPadding(10)
    .elasticY(true)
    .yAxisLabel("Yearly Equivalents") // make this a function of 'column'
    .dimension(yearDim)
    .group(speciesStockedByYear0s, species, sel_stack(species))
    .title(speciesTooltip)
    .xAxis()
    .tickFormat(format(""));
  //.renderLabel(true);

  for (let i = 1; i < species_list.length; ++i) {
    species = species_list[i];
    speciesByYearBarChart.stack(
      speciesStockedByYear0s,
      species,
      sel_stack(species)
    );
  }

  speciesByYearBarChart.render();

  speciesByYearBarChart.on("postRender", function() {
    speciesByYearBarChart
      .select("#species-year-bar-chart rect.overlay")
      .on("dblclick", function() {
        //debugger;

        // get the mouse corrdinates relative to our overlay (plotting) rectangle
        // not sure why d3 is needed here:
        let x = d3.mouse(this)[0];
        // convert those coordinates to years
        let yr = Math.round(speciesByYearBarChartXScale.invert(x));
        // apply a filter that is exactly on year wide
        speciesByYearBarChart.filter(dc.filters.RangedFilter(yr, yr + 1));
      });
  });

  let decrementSpeciesByYearBarChartFilter = () => {
    if (speciesByYearBarChart.filters().length) {
      let yr0 = speciesByYearBarChart.filters()[0][0];
      let yr1 = speciesByYearBarChart.filters()[0][1];
      let newFilters = dc.filters.RangedFilter(yr0 - 1, yr1 - 1);
      speciesByYearBarChart.filterAll();
      speciesByYearBarChart.filter(newFilters);
    }
  };

  let incrementSpeciesByYearBarChartFilter = () => {
    if (speciesByYearBarChart.filters().length) {
      let yr0 = speciesByYearBarChart.filters()[0][0];
      let yr1 = speciesByYearBarChart.filters()[0][1];
      let newFilters = dc.filters.RangedFilter(yr0 + 1, yr1 + 1);
      speciesByYearBarChart.filterAll();
      speciesByYearBarChart.filter(newFilters);
    }
  };

  // attach our increment and decrement functions to the
  // button click events
  let nextyr = selectAll("#species-next-year").on(
    "click",
    incrementSpeciesByYearBarChartFilter
  );
  let lastyr = selectAll("#species-previous-year").on(
    "click",
    decrementSpeciesByYearBarChartFilter
  );

  // toggle the css
  let brushtoggle = selectAll(".species-brush-toggle");
  brushtoggle.on("change", function() {
    let tooltip = true ? this.value == "tooltip" : false;
    let overlay = select("#species-year-bar-chart rect.overlay");
    overlay.classed("pass-through", tooltip);
    let selection = select("#species-year-bar-chart rect.selection");
    selection.classed("pass-through", tooltip);
  });

  //==========================================================

  lakeChart
    .width(width1)
    .height(height1)
    .dimension(lakeDim)
    .group(lakeGroup);
  //.title(keyTooltip);

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
    lakeChart.filterAll();
    dc.redrawAll();
  });

  agencyChart
    .width(width1)
    .height(height1)
    .dimension(agencyDim)
    .group(agencyGroup);
  //.title(keyTooltip);

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
    agencyChart.filterAll();
    dc.redrawAll();
  });

  jurisdictionChart
    .width(width1)
    .height(height1)
    .dimension(jurisdictionDim)
    .group(jurisdictionGroup);
  //.title(keyTooltip);

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
    jurisdictionChart.filterAll();
    dc.redrawAll();
  });

  stateProvChart
    .width(width1)
    .height(height1)
    .dimension(stateProvDim)
    .group(stateProvGroup);
  //.title(keyTooltip);

  stateProvChart.on("renderlet", function(chart) {
    dc.events.trigger(function() {
      let filters = stateProvChart.filters();
      if (!filters || !filters.length) {
        select("#stateProv-filter")
          .text("All")
          .classed("filtered", false);
      } else {
        select("#stateProv-filter")
          .text(filters)
          .classed("filtered", true);
      }
    });
  });

  //   javascript:stateProvChart.filterAll();dc.redrawAll();
  // set up our reset listener
  select("#stateProv-plot-reset").on("click", () => {
    stateProvChart.filterAll();
    dc.redrawAll();
  });

  speciesChart
    .width(width1)
    .height(height1)
    .dimension(speciesDim)
    .group(speciesGroup);
  //.title(keyTooltip);

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
    speciesChart.filterAll();
    dc.redrawAll();
  });

  strainChart
    .width(width1)
    .height(height1)
    .dimension(strainDim)
    .group(strainGroup);
  //.title(keyTooltip);

  strainChart.on("renderlet", function(chart) {
    dc.events.trigger(function() {
      let filters = strainChart.filters();
      if (!filters || !filters.length) {
        select("#strain-filter")
          .text("All")
          .classed("filtered", false);
      } else {
        select("#strain-filter")
          .text(filters)
          .classed("filtered", true);
      }
    });
  });

  select("#strain-plot-reset").on("click", () => {
    strainChart.filterAll();
    dc.redrawAll();
  });

  markChart
    .width(width2)
    .height(height2)
    .dimension(markDim)
    .group(markGroup);
  //.title(keyTooltip);

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
    markChart.filterAll();
    dc.redrawAll();
  });

  // gridrow Chart
  lifestageChart
    .width(width2)
    .height(height2)
    .margins({ top: 5, left: 10, right: 10, bottom: 20 })
    .dimension(lifeStageDim)
    .group(lifeStageGroup)
    //.ordering(d => d.key)
    .gap(2)
    //.title(keyTooltip)
    .label(d => d.key)
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
    lifestageChart.filterAll();
    dc.redrawAll();
  });

  // gridrow Chart
  stockingMethodChart
    .width(width2)
    .height(height2)
    .margins({ top: 5, left: 10, right: 10, bottom: 20 })
    .dimension(stkMethDim)
    .group(stkMethGroup)
    //.ordering(d => d.key)
    .gap(2)
    //.title(keyTooltip)
    .label(d => d.key)
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
    stockingMethodChart.filterAll();
    dc.redrawAll();
  });

  dc.renderAll();
});
