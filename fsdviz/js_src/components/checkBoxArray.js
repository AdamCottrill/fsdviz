import { select } from "d3-selection";

import { updateUrlCheckBoxParams } from "./url_parsing";

import { pluckLabel } from "./utils";

export const checkBoxes = (selection, props) => {
  const { filterkey, xfdim, xfgroup, filters, label_lookup, sortByLabel } =
    props;

  // semantic-ui checkbox markup:
  //  `<div class="checkbox" id={}>
  //      <label>
  //          <input type="checkbox" value="${}" checked>
  //          ${}
  //      </label>
  //  </div>`

  let myfilters = filters[filterkey].values;

  const keys = xfgroup.top("Infinity").filter((d) => d.value > 0);

  let compareFn;
  if (sortByLabel) {
    compareFn = (a, b) => {
      return pluckLabel(a.key, label_lookup).localeCompare(
        pluckLabel(b.key, label_lookup)
      );
    };
  } else {
    compareFn = (a, b) => a.key.localeCompare(b.key);
  }
  if (filterkey == "stockingMonth") {
    compareFn = (a, b) => a.key - b.key;
  }
  keys.sort(compareFn);

  // an object to contain the checkbox status for each checkbox
  const checkbox_map = {};
  keys.forEach((d) => (checkbox_map[d.key] = myfilters.indexOf(d.key) > -1));

  const filtered = !Object.values(checkbox_map).every(
    (val, i, arr) => val === arr[0]
  );

  filters[filterkey].is_filtered = filtered;

  // if this dimension is filtered, add the class filtered to the title
  // so we can style it differently to indicate that:
  const selector = selection.attr("id");
  select(`#${selector}-title`).classed("filtered", filtered);

  const cbarray = selection.enter().append("div").merge(selection);

  const boxes = cbarray.selectAll("div").data(keys, (d) => d.key);

  boxes.exit().remove();

  let boxesEnter = boxes.enter().append("div").attr("class", "inline field");

  boxesEnter = boxesEnter.merge(boxes);

  const uiCheckbox = boxesEnter
    .append("div")
    .attr("data-tooltip", (d) => `N=${d.value.toLocaleString()}`)
    .attr("data-position", "right center")
    .append("div")
    .attr("class", "ui tiny checkbox");

  uiCheckbox
    .append("input")
    .attr("type", "checkbox")
    .property("checked", (d) => {
      return checkbox_map[d.key];
    })
    .attr("value", (d) => d.key)
    .on("click", function () {
      if (this.checked) {
        // add the value that was just selected.
        myfilters.push(this.value);
      } else {
        // remove the value of the box that was just unchecked
        myfilters = myfilters.filter((val) => val !== this.value);
      }
      filters[filterkey].values = myfilters;
      xfdim.filter((val) => myfilters.indexOf(val) > -1);
    });

  uiCheckbox.append("label").text((d) => pluckLabel(d.key, label_lookup));

  const buttonbar = select(`#${selector}-buttons`).attr("class", "ui buttons");

  const clearAllBnt = buttonbar
    .selectAll(".clear-link")
    .data([null])
    .enter()
    .append("button")
    .attr("class", "clear-link ui mini basic primary left floated button")
    .text("Clear All")
    .on("click", function () {
      const checkboxes = cbarray
        .selectAll("input[type=checkbox]")
        .property("checked", false);
      filters[filterkey].values = [];
      updateUrlCheckBoxParams(filters);
      xfdim.filter();
    });

  const selectAllBtn = buttonbar
    .selectAll(".select-link")
    .data([null])
    .enter()
    .append("button")
    .attr("class", "select-link ui mini basic primary right floated button")
    .text("Select All")
    .on("click", function () {
      const checkboxes = cbarray
        .selectAll("input[type=checkbox]")
        .property("checked", true);
      filters[filterkey].values = keys.map((d) => d.key);
      updateUrlCheckBoxParams(filters);
      xfdim.filter((val) => myfilters.indexOf(val) > -1);
    });
};
