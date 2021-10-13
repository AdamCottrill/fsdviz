/* global  dataURL, */

//import crossfilter from "crossfilter2";
import { json, scaleOrdinal, extent } from "d3";

import Leaflet from "leaflet";

import { update_category_legend } from "./components/stats_panel";
import { makeColorMap, makeItemMap, lookupToLabels } from "./components/utils";

const colourScale = scaleOrdinal();

let bbox = JSON.parse(document.getElementById("map-bounds").textContent);

let selectedPt;

// setup the map with rough bounds (need to get pies to plot first,
// this will be tweaked later):
const mymap = Leaflet.map("mapid", {
  zoomDelta: 0.25,
  zoomSnap: 0,
}).fitBounds([
  [bbox[1], bbox[0]],
  [bbox[3], bbox[2]],
]);

Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  maxZoom: 18,
}).addTo(mymap);

const recalc_bbox = (bbox, dd_lat, dd_lon) => {
  //longitude
  bbox[0] = bbox[0] < dd_lon[0] ? bbox[0] : dd_lon[0];
  bbox[2] = bbox[2] > dd_lon[1] ? bbox[2] : dd_lon[1];
  //latitude
  bbox[1] = bbox[1] < dd_lat[0] ? bbox[1] : dd_lat[0];
  bbox[3] = bbox[3] > dd_lat[1] ? bbox[3] : dd_lat[1];
  return bbox;
};

function onClick(e) {
  // when we click on a point, toggle the active mark style, and hide or show
  // the corresponding rows in the table:
  let marker = e.target.getElement();
  let classes = marker.getAttribute("class");
  let pt = `${e.latlng.lat}; ${e.latlng.lng}`;
  let rows;

  //remove the old active marker class if it exists:
  let oldMarker = document.getElementsByClassName("active-marker");
  if (oldMarker.length > 0) {
    oldMarker[0].classList.remove("active-marker");
  }

  if (pt == selectedPt) {
    selectedPt = "";
    rows = document.querySelectorAll("[data-coord]");
    rows.forEach((row) => (row.style.display = ""));
  } else {
    selectedPt = pt;
    marker.setAttribute("class", classes + " active-marker");
    //hide them all
    rows = document.querySelectorAll("[data-coord]");
    rows.forEach((row) => (row.style.display = "none"));
    //make the selected one appear:
    let selector = `[data-coord='${pt}']`;
    rows = document.querySelectorAll(selector);
    rows.forEach((row) => (row.style.display = ""));
  }
}

Promise.all([json(dataURL), json("/api/v1/common/lookups")]).then(
  ([data, common]) => {
    // prepare colour scale and label here:
    const colors = makeColorMap(common.species);
    const species_lookup = makeItemMap(common.species, "abbrev", "common_name");
    const label_lookup = lookupToLabels(species_lookup);

    colourScale
      .domain(Object.entries(colors).map((x) => x[0]))
      .range(Object.entries(colors).map((x) => x[1]));

    data.forEach((d) => {
      d.latitude = +d.latitude;
      d.longitude = +d.longitude;
      if (d.latitude & d.longitude) {
        let circle = Leaflet.circleMarker([d.latitude, +d.longitude], {
          color: colourScale(d.species_name),
          fillColor: colourScale(d.species_name),
          fillOpacity: 0.5,
          opacity: 0.6,
          weight: 2,
          radius: 6,
        });
        circle.addTo(mymap).on("click", onClick);
      }
    });

    const uniqueSpecies = [...new Set(data.map((x) => x.species_name))];

    const speciesList = label_lookup.filter((x) =>
      uniqueSpecies.includes(x.slug)
    );

    update_category_legend(colourScale, speciesList, "");

    //reset the the bounds of our map if required.
    let lat_extent = extent(data, (d) => d.latitude);
    let lon_extent = extent(data, (d) => d.longitude);
    bbox = recalc_bbox(bbox, lat_extent, lon_extent);
    if (bbox.every((x) => !typeof undefined)) {
      mymap.fitBounds([
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]],
      ]);
    }
  }
);
