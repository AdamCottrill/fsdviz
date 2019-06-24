/* global values dc, dataURL, maxEvents */

import crossfilter from "crossfilter2";
import {
  select,
  selectAll,
  mouse,
  event,
  json,
  format,
  scaleLinear,
  scaleOrdinal,
  timeParse,
  range
} from "d3";

//} from "d3";
// import dc from "dc";

const dateParser = timeParse("%Y-%m-%d");
let commaFormat = format(",");

const width1 = 425;
const height1 = 400;
const width2 = 300;
const height2 = 300;

let column = "yreq_stocked";

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

Promise.all([
  json(dataURL),
  json("/api/v1/common/lake"),
  json("/api/v1/common/agency"),
  json("/api/v1/common/jurisdiction"),
  json("/api/v1/common/state_province"),
  json("/api/v1/common/species"),
  json("/api/v1/common/strain"),
  json("/api/v1/stocking/lifestage"),
  json("/api/v1/stocking/stocking_method") //add ID
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
    stockingMethods
  ]) => {
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
      accumulator[d.id] = {
        long: `${d.strain_species.common_name} - ${d.strain_label}(${
          d.strain_code
        })`,
        short: `${d.strain_code}-${d.strain_species.abbrev}`
      };
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
      d.grid_10 = parseInt(d.grid_10);
      d.month = d.month ? parseInt(d.month) : 0;
      d.no_stocked = parseInt(d.no_stocked);
      d.strain = parseInt(d.strain);
      d.year = parseInt(d.year);
      d.year_class = parseInt(d.year_class);
      d.yreq_stocked = parseInt(d.yreq_stocked);
      d.event_count = 1;
      d.clip = clipMap[d.mark] ? clipMap[d.mark] : "Unknown";
      d.tag = tagMap[d.mark] ? tagMap[d.mark] : "Unknown";
      d.mark = markMap[d.mark] ? markMap[d.mark] : "Unknown";

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
    //let geomDim = ndx.dimension(d => d.geom);

    let speciesDim = ndx.dimension(d => d.species_code);
    let strainDim = ndx.dimension(d => d.strain);
    let yearClassDim = ndx.dimension(d => d.year_class);
    let lifeStageDim = ndx.dimension(d => d.lifestage_code);
    let markDim = ndx.dimension(d => d.mark);
    let clipDim = ndx.dimension(d => d.clip);
    let tagDim = ndx.dimension(d => d.tag);
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
    let tagGroup = tagDim.group().reduceSum(d => d[column]);
    let clipGroup = clipDim.group().reduceSum(d => d[column]);
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
    //  let strainStockedByYear0s = ensure_group_bins(
    //    strainStockedByYear,
    //    strain_list
    //  );

    let species = species_list[0];
    //let strain = strain_list[0];

    let first_year = yearDim.bottom(1)[0].year;
    let last_year = yearDim.top(1)[0].year;

    let years = range(first_year, last_year);
    years.push(last_year);

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

    const lifestageChart = dc.rowChart("#lifestage-plot");
    const stockingMethodChart = dc.rowChart("#stocking-method-plot");
    const stockingMonthChart = dc.rowChart("#stocking-month-plot");

    const markChart = dc.pieChart("#mark-plot");
    const tagChart = dc.pieChart("#tag-plot");
    const clipChart = dc.pieChart("#clip-plot");

    // ==================================================================

    let speciesByYearBarChartXScale = scaleLinear().domain([
      first_year - 0.6,
      last_year + 0.55
    ]);
    //let speciesByYearBarChartXScale = scaleBand().domain(years);

    // extract the event count given the year and spc
    // used for tool tips
    //  let get_event_count = (yr, spc) => {
    //    let counts = speciesStockedByYear.all().filter(item => item.key === yr)[0];
    //    return counts.value[spc];
    //  };

    // create string for stacked bar chart tooltips:
    let speciesTooltip = function(d) {
      let yr = d.key;
      let spc = this.layer.trim();
      let label = speciesMap[spc];
      let stocked = commaFormat(d.value[spc] == 0 ? 0 : d.value[spc][column]);
      return `${yr} - ${label}: ${stocked}`;
    };

    // colour our stacks using our colour scale:
    const speciesColourScale = scaleOrdinal()
      .range(speciesColours)
      .domain(all_species);

    speciesByYearBarChart
      .width(width1 * 2.4)
      .height(height1)
      .x(speciesByYearBarChartXScale)
      .dimension(yearDim)
      .colors(speciesColourScale)
      .colorAccessor(function(d) {
        return this.layer;
      })
      .group(speciesStockedByYear0s, species, sel_stack(species))
      .margins({ left: 60, top: 20, right: 10, bottom: 30 })
      .brushOn(true)
      .centerBar(true)
      .alwaysUseRounding(true)
      .round(function(x) {
        return Math.floor(x) + 0.5;
      })
      .elasticY(true)
      .yAxisLabel("Yearly Equivalents") // make this a function of 'column'
      .title(speciesTooltip);
    //.renderLabel(true);

    speciesByYearBarChart
      .xAxis()
      .tickFormat(format("d"))
      .ticks(years.length);

    for (let i = 1; i < species_list.length; ++i) {
      species = species_list[i];
      speciesByYearBarChart.stack(
        speciesStockedByYear0s,
        species,
        sel_stack(species)
      );
    }

    speciesByYearBarChart.render();

    //    speciesByYearBarChart.on("renderlet", function(chart) {
    //      chart.selectAll("g rect").style("fill", d => speciesColourScale(d.layer));
    //
    //      chart
    //        .selectAll("g.dc-legend-item rect")
    //        .style("fill", d => speciesColourScale(d.layer));
    //
    //      chart.selectAll("g rect.deselected").style("fill", d => "#ccc");
    //    });

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
        speciesByYearBarChart.replaceFilter(newFilters);
        dc.redrawAll();
      }
    };

    let incrementSpeciesByYearBarChartFilter = () => {
      if (speciesByYearBarChart.filters().length) {
        let yr0 = speciesByYearBarChart.filters()[0][0];
        let yr1 = speciesByYearBarChart.filters()[0][1];
        let newFilters = dc.filters.RangedFilter(yr0 + 1, yr1 + 1);
        speciesByYearBarChart.replaceFilter(newFilters);
        dc.redrawAll();
      }
    };

    // attach our increment and decrement functions to the
    // button click events
    let nextyr = select("#species-next-year").classed("visible", () => {
      return speciesByYearBarChart.hasFilter();
    });

    nextyr.on("click", incrementSpeciesByYearBarChartFilter);

    let lastyr = select("#species-previous-year").classed("visibile", () => {
      return speciesByYearBarChart.hasFilter();
    });

    lastyr.on("click", decrementSpeciesByYearBarChartFilter);

    // toggle the css
    let brushtoggle = selectAll(".species-brush-toggle");
    brushtoggle.on("change", function() {
      let tooltip = true ? this.value == "tooltip" : false;
      let overlay = select("#species-year-bar-chart rect.overlay");
      overlay.classed("pass-through", tooltip);
      let selection = select("#species-year-bar-chart rect.selection");
      selection.classed("pass-through", tooltip);
    });

    //   javascript:lakeChart.filterAll();dc.redrawAll();
    // set up our reset listener
    select("#species-year-bar-chart-reset").on("click", () => {
      event.preventDefault();
      speciesByYearBarChart.filterAll();
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
    select("#stateProv-plot-reset").on("click", () => {
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
  }
);