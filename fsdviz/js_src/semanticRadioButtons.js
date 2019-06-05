import { select, selectAll } from "d3";

export const RadioButtons = () => {
  let options = [];
  let checked = "";
  let selector = "";

  function buttons() {
    let groupedFields = select(selector)
      .append("div")
      .data([null])
      .attr("class", "grouped fields");

    groupedFields.append("label").attr("for", selector.replace("#", ""));

    let radioButtons = groupedFields
      .selectAll(".field")
      .data(options)
      .enter()
      .append("div")
      .attr("class", "field")
      .append("div")
      .attr("class", "ui radio checkbox")
      .each(function(d) {
        select(this)
          .append("input")
          .attr("value", d => d.name)
          .attr("name", selector.replace("#", ""))
          .attr("type", "radio")
          .attr("class", "hidden")
          .property("checked", d.name === checked)
          .attr("tabindex", 0);
        select(this)
          .append("label")
          .text(d.label);
      });
  }

  buttons.checked = function(value) {
    if (!arguments.length) return checked;
    checked = value;
    return buttons;
  };

  buttons.options = function(value) {
    if (!arguments.length) return options;
    options = value;
    return buttons;
  };

  buttons.selector = function(value) {
    if (!arguments.length) return selector;
    selector = value;
    return buttons;
  };

  // expose a method to update the radio buttons so we can keep them
  // in sync with other controls. (this allows us to control the state
  // of these button if another control needs to change them)
  buttons.refresh = () => {
    let me = select(selector);
    let inputOptions = me
      .selectAll("input")
      .property("checked", d => d.name === checked);
  };

  return buttons;
};
