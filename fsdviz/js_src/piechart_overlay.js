// a re-usabel chart component that will overlay points a map.

import {
  arc,
  pie,
  descending,
  event,
  select,
  selectAll,
  max,
  sum,
  scaleSqrt,
  scaleOrdinal,
  format
} from "d3";

export const piechart_overlay = () => {
  // default values:

  let selectedPie;
  let data;

  let labelLookup = {};

  let radiusAccessor = d => d.total;
  let fillAccessor = d => d.value;
  let responseVar = "yreq";

  let maxCircleSize = 140;
  let fillScale = scaleOrdinal();

  let myArc = arc().innerRadius(0);
  let myPie = pie()
    .sort(null)
    .value(fillAccessor);

  const commaFormat = format(",d");

  // the name of the field that uniquely identifies each point:
  let keyfield = "geom";

  let pointInfoSelector = "#point-info";

  // we will pass in a function to transform lat-long to screen coordinates
  // when we instantiate the overlay
  let getProjection;

  let get_pointInfo = d => {
    // this does not work as expected - it needs to be updated if the
    // filters change.
    let data = d.values;
    let dataArray = Object.keys(data).map(x => data[x]);
    dataArray.sort((a, b) => b.value - a.value);
    let total = sum(dataArray.map(d => d.value));

    let label = labelLookup[d.key];

    if (typeof label === "undefined") {
      label = d.key;
    }

    let html = `<h5>${label}: ${commaFormat(total)}</h5>`;
    html += '<table class="ui celled compact table">';
    dataArray
      .filter(d => d.value > 0)
      .forEach(row => {
        let rowid = row.slice.replace(/ /g, "-").replace(/[()]/g, "");

        html += `<tr id="tr-${rowid}">
           <td class="species-name">${row.slice}</td>
           <td class="right aligned">${commaFormat(row.value)}</td>
       </tr>`;
      });

    html += "</table>";
    return html;
  };

  const chart = function(selection) {
    selection.each(function(data) {
      // prepare data for pie:
      //    coordinates: [-82.8801, 45.9883]
      //    key: "er_mi"
      //    total: 10000
      //    values: [{slice: "Rainbow Trout", value:0}, {slice: "Lake Trout", value: 10} ]

      data.forEach(x => {
        let mykeys = Object.keys(x.value);
        let values = mykeys.map(d => ({
          slice: d,
          value: x.value[d][responseVar]
        }));
        x["values"] = values;
      });

      // create a tooltip
      var tooltip = select("#mapid")
        .append("div")
        .attr("class", "tooltip")
        .attr("id", "pie-tooltip")
        .style("pointer-events", "none")
        .style("z-index", "999")
        .html("<p>Tool-tip</p>");

      //==========================================================
      //             PIE CHARTS

      // sort our pies so small pies plot on top of large pies
      data.sort((a, b) => descending(a.total, b.total));

      // the circles will be scaled as though there is a single large pie chart
      // (recognizing that there almost never will be)
      const radiusScale = scaleSqrt()
        .range([1, maxCircleSize])
        .domain([0, sum(data, radiusAccessor)]);

      let pies = selection.selectAll(".pie").data(data, d => d.key);

      pies
        .exit()
        .transition()
        .duration(200)
        .remove();

      let piesEnter = pies
        .enter()
        .append("g")
        .attr("class", "pie")
        .attr("id", d => d.key)
        .on("click", function(d) {
          if (selectedPie && selectedPie === d.key) {
            // second click on same circle, turn off selectedPie and make point info empty:
            selectedPie = null;
            select(pointInfoSelector).html("");
            selectAll(".selected-pie").classed("selected-pie", false);
          } else {
            // set selectedPie, fill in map info and highlight our selectedPie pie
            selectedPie = d.key;
            select(pointInfoSelector).html(get_pointInfo(d));
            selectAll(".selected-pie").classed("selected-pie", false);
            select(this).classed("selected-pie", true);
          }
        });

      pies
        .merge(piesEnter)
        .attr("transform", function(d) {
          let translate = getProjection(d.coordinates[0], d.coordinates[1]);
          return `translate( ${translate.x}  ${translate.y} )`;
        })
        .transition()
        .duration(200)
        .each(onePie);

      // a function that represents one pie chart. Repeated for each
      // elements selectedPie above
      function onePie(d) {
        const highlight_row = (d, bool) => {
          let selector =
            "#tr-" + d.data.slice.replace(/ /g, "-").replace(/[()]/g, "");

          let tmp = selectAll(selector);
          tmp.classed("error", bool);
        };

        let r = radiusScale(d.total);

        let svg = select(this)
          .attr("width", r * 2)
          .attr("height", r * 2);

        let slices = svg
          .selectAll(".arc")
          .data(d => myPie(d.values), d => d.index);

        let slicesEnter = slices
          .enter()
          .append("path")
          .attr("class", "arc")
          .on("mouseover", function(d) {
            let slug = this.parentElement.id;
            let label = labelLookup[slug];

            if (typeof label === "undefined") {
              label = slug;
            }

            let html = `<strong>${label}</strong><br>${
              d.data.slice
            }: ${commaFormat(d.data.value)}`;

            select(this).classed("hover", true);

            if (selectedPie && selectedPie === slug) {
              highlight_row(d, true);
              //select('#point-info').html(get_sliceInfo(d));
            }
            tooltip.style("visibility", "visible").html(html);
          })
          .on("mousemove", function() {
            return tooltip
              .style("top", event.layerY - 5 + "px")
              .style("left", event.layerX + 15 + "px");
          })
          .on("mouseout", function(d) {
            select(this).classed("hover", false);
            highlight_row(d, false);
            tooltip.style("visibility", "hidden").html("");
          });

        slices
          .merge(slicesEnter)
          .attr("d", myArc.outerRadius(r))
          .style("fill", d => fillScale(d.data.slice));

        slices.exit().remove();
      }
    });
  };

  chart.clear_pointInfo = () => {
    select(pointInfoSelector).html("");
  };

  // update our data
  chart.data = function(value) {
    if (!arguments.length) return data;
    data = value;
    return chart;
  };

  chart.getProjection = function(value) {
    if (!arguments.length) return getProjection;
    getProjection = value;
    return chart;
  };

  chart.radiusAccessor = function(value) {
    if (!arguments.length) return radiusAccessor;
    radiusAccessor = value;
    return chart;
  };

  chart.fillAccessor = function(value) {
    if (!arguments.length) return fillAccessor;
    fillAccessor = value;
    return chart;
  };

  chart.fillScale = function(value) {
    if (!arguments.length) return fillScale;
    fillScale = value;
    return chart;
  };

  chart.keyfield = function(value) {
    if (!arguments.length) return keyfield;
    keyfield = value;
    return chart;
  };

  chart.responseVar = function(value) {
    if (!arguments.length) return responseVar;
    responseVar = value;
    return chart;
  };

  chart.maxCircleSize = function(value) {
    if (!arguments.length) return maxCircleSize;
    maxCircleSize = value;
    return chart;
  };

  chart.pointInfoSelector = function(value) {
    if (!arguments.length) return pointInfoSelector;
    pointInfoSelector = value;
    return chart;
  };

  chart.selectedPie = function(value) {
    if (!arguments.length) return selectedPie;
    selectedPie = value;
    return chart;
  };

  // our object to connect pie chart keys (slugs) with their pretty labels
  chart.labelLookup = function(value) {
    if (!arguments.length) return labelLookup;
    labelLookup = value;
    return chart;
  };

  // the function that populates point info div with information
  // about the selectedPie point
  chart.get_pointInfo = function(value) {
    if (!arguments.length) return get_pointInfo;
    get_pointInfo = value;
    return chart;
  };

  return chart;
};
