/* global values dataURL, maxEvents */

import crossfilter from "crossfilter2";
import { select, json } from "d3";

console.log(dataURL);

json(dataURL).then(function(data) {
  console.log("In JS file!");
  console.log(data.length, " events");

  select("#record-count-warning").classed(
    "hidden",
    data.length >= maxEvents ? false : true
  );

  console.log(data[0]);
});
