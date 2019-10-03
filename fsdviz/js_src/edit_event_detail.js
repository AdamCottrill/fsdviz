/* global accessToken, $ */

/* this script is used in the stocking event detail form. There are
 * functions that update the map when the spatial controls changes,
 * some that update the spatial controls when the map changes.  THere
 * are also functions that update the date, year, month and date field
 * to ensure that they remain in sync */

import Leaflet from "leaflet";

let bbox = JSON.parse(document.getElementById("map-bounds").textContent);

// setup the map with rough bounds (need to get pies to plot first,
// this will be tweaked later):
const mymap = L.map("mapid", {
  zoomDelta: 0.25,
  zoomSnap: 0
}).fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);

Leaflet.tileLayer(
  "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
  {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery � <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken: accessToken
  }
).addTo(mymap);

let lat = $("#id_dd_lat").val();
let lon = $("#id_dd_lon").val();

var circle = Leaflet.circleMarker([parseFloat(lat), parseFloat(lon)], {
  color: "red",
  fillColor: "#f03",
  fillOpacity: 0.5,
  radius: 5
}).addTo(mymap);
