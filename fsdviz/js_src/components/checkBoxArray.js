import { select } from "d3-selection";

import { updateUrlCheckBoxParams } from "./url_parsing";

export const checkBoxes = (selection, props) => {
  const {
    filterkey,
    xfdim,
    xfgroup,
    filters,
    label_lookup,
    withKey,
    sortByLabel,
  } = props;

  // semantic-ui checkbox markup:
  //  `<div class="checkbox" id={}>
  //      <label>
  //          <input type="checkbox" value="${}" checked>
  //          ${}
  //      </label>
  //  </div>`

  let myfilters = filters[filterkey].values;

  let keys = xfgroup.top("Infinity").filter((d) => d.value > 0);

  let compareFn;
  if (sortByLabel) {
    compareFn = (a, b) =>
      label_lookup[a.key].localeCompare(label_lookup[b.key]);
  } else {
    compareFn = (a, b) => a.key.localeCompare(b.key);
  }
  if (filterkey == "stockingMonth") {
    compareFn = (a, b) => a.key - b.key;
  }
  keys.sort(compareFn);

  // an object to contain the checkbox status for each checkbox
  let checkbox_map = {};
  keys.forEach(
    (d) => (checkbox_map[d.key] = myfilters.indexOf(d.key) > -1 ? true : false)
  );

  let filtered = !Object.values(checkbox_map).every(
    (val, i, arr) => val === arr[0]
  );

  filters[filterkey].is_filtered = filtered;

  // if this dimension is filtered, add the class filtered to the title
  // so we can style it differently to indicate that:
  let selector = selection.attr("id");
  let titleclass = select(`#${selector}-title`).classed("filtered", filtered);

  let cbarray = selection.enter().append("div").merge(selection);

  let boxes = cbarray.selectAll("div").data(keys, (d) => d.key);

  boxes.exit().remove();

  let boxesEnter = boxes.enter().append("div").attr("class", "inline field");

  boxesEnter = boxesEnter.merge(boxes);

  let uiCheckbox = boxesEnter
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

  //uiCheckbox.append("label").text((d) => d.key + " (n=" + d.value + ")");
  // format the label with or withiout a the key

  if (withKey) {
    uiCheckbox.append("label").text((d) => {
      const label = d.key ? `${label_lookup[d.key]} (${d.key})` : d.key;
      return label;
    });
  } else {
    uiCheckbox.append("label").text((d) => {
      const label = d.key ? label_lookup[d.key] : d.key;
      return label;
    });
  }

  let buttonbar = select(`#${selector}-buttons`).attr("class", "ui buttons");

  let clearAllBnt = buttonbar
    .selectAll(".clear-link")
    .data([null])
    .enter()
    .append("button")
    .attr("class", "clear-link ui mini basic primary left floated button")
    .text("Clear All")
    .on("click", function () {
      let checkboxes = cbarray
        .selectAll("input[type=checkbox]")
        .property("checked", false);
      filters[filterkey].values = [];
      updateUrlCheckBoxParams(filters);
      xfdim.filter();
    });

  let selectAllBtn = buttonbar
    .selectAll(".select-link")
    .data([null])
    .enter()
    .append("button")
    .attr("class", "select-link ui mini basic primary right floated button")
    .text("Select All")
    .on("click", function () {
      let checkboxes = cbarray
        .selectAll("input[type=checkbox]")
        .property("checked", true);
      filters[filterkey].values = keys.map((d) => d.key);
      updateUrlCheckBoxParams(filters);
      xfdim.filter((val) => myfilters.indexOf(val) > -1);
    });
};
