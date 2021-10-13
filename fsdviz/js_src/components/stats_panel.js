import { sum } from "d3-array";
import { format } from "d3-format";
import { select, selectAll } from "d3-selection";
import { pluckLabel } from "./utils";

const update_summary_table = (data, props) => {
  // generate the html for rows of our summary table body.  for each species in data
  // we want to generate html that looks like this:
  //   <tr>
  //       <td>${ row.species }</td>
  //       <td>${ row.event_count }</td>
  //       <td>${ commaFormat(row.total_stocked) }</td>
  //   </tr>
  //
  // *NOTE* data also contain a column total - it could be include
  // *and could be toggled depending on what options the user has
  //selected.

  // ad species key to each summary object and create an
  // array of objects - sorted by yreq

  const { fillScale, what, label, row_labels } = props;

  //  let tmp = props.slices.filter(d => d.name === what);
  //  let sliceVarLabel = tmp[0].label;

  Object.keys(data).forEach((x) => (data[x]["category"] = x));
  let dataArray = Object.keys(data).map((x) => data[x]);

  dataArray.sort((a, b) => b.yreq - a.yreq);

  const commaFormat = format(",d");
  let html = "";

  const rectSize = 15;

  dataArray
    .filter((d) => d.events > 0)
    .forEach((row) => {
      html += `<tr>
           <td class="species-name">
<svg width="${rectSize}" height="${rectSize}">
  <rect width="${rectSize}" height="${rectSize}"
style="fill:${fillScale(row.category)}; stroke-width:0.5;stroke:#808080" />
        </svg>  ${pluckLabel(row.category, row_labels)}</td>
           <td class="center aligned">${row.events}</td>
           <td class="right aligned">${commaFormat(row.yreq)}</td>
       </tr>`;
    });

  selectAll("#category-value-label").text(label);
  select("#stocked-summary-table-tbody").html(html);
};

export const update_stats_panel = (allxf, props) => {
  // this function calculates the total number of fish stocked and
  // the number of events by species and then updates the stat panel.

  // what: response variable
  // label: name label used on bottom row of summary

  let { what, label } = props;

  let current = allxf.value();

  // grand total accessor:
  const get_total = (varname, count = false) => {
    let mykeys = Object.keys(current);
    if (count) {
      mykeys = mykeys.filter((x) => current[x]["events"] > 0);
      return mykeys.length;
    } else {
      return sum(mykeys.map((x) => current[x][varname]));
    }
  };

  let total_stocked = get_total("total");
  let yreq_stocked = get_total("yreq");
  let event_count = get_total("events");
  let value_count = get_total(what, true);

  let commaFormat = format(",d");

  // pluralize our labels if there is more than one value
  if ((label !== "Species") & (value_count > 1)) {
    label = label === "Agency" ? "Agencies" : label + "s";
  }

  selectAll("#category-value-label-plural").text(label);
  selectAll("#value-count").text(commaFormat(value_count));
  selectAll("#event-count").text(commaFormat(event_count));
  selectAll("#total-stocked").text(commaFormat(total_stocked));
  selectAll("#yreq-stocked").text(commaFormat(yreq_stocked));

  update_summary_table(current, props);
};

export const update_category_legend = (fillScale, items, category_label) => {
  //  simplified verions of stats panel that includes just the
  //  category levels and associated colours - not stattistics. Used
  //  in the filtered cwt vizualization:

  // items is an array of two element arrays - the value and the label ["LAT", "Lake Trout"]

  const rectSize = 15;
  const vertical_offset = 7;
  let html = "";
  items.forEach((item) => {
    html += `<tr>
           <td class="center aligned">
  <svg  width="${rectSize}" height="${rectSize + vertical_offset}">
  <rect class="legend-rect" y="${vertical_offset}" width="${rectSize}" height="${rectSize}"
style="fill:${fillScale(item.slug)}; stroke-width:0.5;stroke:#808080" />
        </svg> </td><td class="category-name"> ${item.label}</td>
       </tr>`;
  });

  selectAll("#category-value-label").text(category_label);
  select("#legend-table-tbody").html(html);
};
