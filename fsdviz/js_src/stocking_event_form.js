/* global accessToken,  dataURL,  topoUrl, centroidsUrl, sliceVar, spatialUnit, */

import Leaflet from "leaflet";

let bbox = JSON.parse(document.getElementById("map-bounds").textContent);

// get our initial lat-lon values from the form:
let lat = $("#id_dd_lat").val();
let lon = $("#id_dd_lon").val();

// setup the map with rough bounds (need to get pies to plot first,
// this will be tweaked later):
const mymap = Leaflet.map("mapid", {
  zoomDelta: 0.25,
  zoomSnap: 0
}).fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);

// set up a cross hair on our map - better for clicking
$(".leaflet-container").css("cursor", "default");

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

const drawPt = (lat, lon) => {
  // remove the last one - there can only ever be one point for an event:
  $("path.leaflet-interactive").remove();
  let circle = Leaflet.circleMarker([parseFloat(lat), parseFloat(lon)], {
    color: "red",
    fillColor: "#f03",
    fillOpacity: 0.5,
    radius: 5
  }).addTo(mymap);
};

// if we click on the map, update the lat-lon inputs:
mymap.on("click", function(e) {
  lat = e.latlng.lat;
  lon = e.latlng.lng;
  drawPt(lat, lon);
  $("#id_dd_lat").val(Number(lat).toFixed(4));
  $("#id_dd_lon").val(Number(lon).toFixed(4));
});

//watch our lat-lon inputs and update the point if they change:
$("#id_dd_lat").on("change", function(e) {
  lat = parseFloat(e.target.value);
  drawPt(lat, lon);
});

$("#id_dd_lon").on("change", function(e) {
  lon = parseFloat(e.target.value);
  drawPt(lat, lon);
});

// draw our initail point:
drawPt(lat, lon);
