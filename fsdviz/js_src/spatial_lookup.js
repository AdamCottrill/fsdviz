/* global accessToken, $, lakeURL, jurisdictionURL, manUnitURL, grid10URL, csrf_token */

import Leaflet from "leaflet";
import helpers from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
//import * as turf from "@turf/turf";
import { selectAll } from "d3";

let grid10, grid10Geom;
let lake, lakeGeom;
let jurisdiction, jurisdictionGeom;
let manUnits = [];

const update_grid_label = obj => {
  let text = "";
  if (obj.grid) {
    text = `${obj.grid} (${obj.lake_abbrev})`;
  }
  selectAll("#grid-label").text(text);
};

const get_grid10 = (dd_lat, dd_lon) => {
  let pt = `POINT(${dd_lon} ${dd_lat})`;
  let contained = false;
  let turfpt = helpers.point([dd_lon, dd_lat]);

  if (typeof grid10Geom !== "undefined") {
    contained = booleanPointInPolygon(turfpt, grid10Geom);
  }

  if (!contained) {
    $.ajax({
      type: "POST",
      url: grid10URL + "?geom=geom",
      dataType: "json",
      data: {
        point: pt,
        csrfmiddlewaretoken: csrf_token
      },
      success: data => {
        grid10 = data;
        grid10Geom = helpers.feature(JSON.parse(grid10.geom));
        update_grid_label(grid10);
      },
      error: data => {
        grid10 = "";
        grid10Geom = undefined;
        update_grid_label(grid10);
      }
    });
  }
};

const update_lake_label = obj => {
  let text = "";
  if (obj.id) {
    text = `${obj.lake_name} (${obj.abbrev})`;
  }
  selectAll("#lake-label").text(text);
};

const get_lake = (dd_lat, dd_lon) => {
  let pt = `POINT(${dd_lon} ${dd_lat})`;

  let contained = false;
  let turfpt = helpers.point([dd_lon, dd_lat]);

  if (typeof lakeGeom !== "undefined") {
    contained = booleanPointInPolygon(turfpt, lakeGeom);
  }

  let url = lakeURL + "?geom=geom";

  if (!contained) {
    $.ajax({
      type: "POST",
      url: url,
      dataType: "json",
      data: {
        point: pt,
        csrfmiddlewaretoken: csrf_token
      },
      success: data => {
        lake = data;
        lakeGeom = helpers.feature(JSON.parse(lake.geom));
        update_lake_label(lake);
      },
      error: data => {
        lake = "";
        lakeGeom = undefined;
        update_lake_label(lake);
      }
    });
  }
};

const update_jurisdiction_label = obj => {
  let text = "";
  if (obj.id) {
    text = `${obj.stateprov_name} (${obj.stateprov_abbrev})`;
  }
  selectAll("#jurisdiction-label").text(text);
};

const get_jurisdiction = (dd_lat, dd_lon) => {
  let pt = `POINT(${dd_lon} ${dd_lat})`;

  let contained = false;
  let turfpt = helpers.point([dd_lon, dd_lat]);

  if (typeof lakeGeom !== "undefined") {
    contained = booleanPointInPolygon(turfpt, lakeGeom);
  }

  if (!contained) {
    let url = jurisdictionURL + "?geom=geom";
    $.ajax({
      type: "POST",
      url: url,
      dataType: "json",
      data: {
        point: pt,
        csrfmiddlewaretoken: csrf_token
      },
      success: data => {
        jurisdiction = data;
        jurisdictionGeom = helpers.feature(JSON.parse(jurisdiction.geom));
        update_jurisdiction_label(jurisdiction);
      },
      error: data => {
        jurisdiction = "";
        jurisdictionGeom = undefined;
        update_jurisdiction_label(jurisdiction);
      }
    });
  }
};

const update_manUnit_label = obj => {
  let text = "";
  // if (obj.id) {
  //   text = `${obj.manUnit_name} (${obj.abbrev})`;
  // }
  //selectAll("#manUnit-label").text(text);
};

const get_manUnits = (dd_lat, dd_lon) => {
  let pt = `POINT(${dd_lon} ${dd_lat})`;

  let url = manUnitURL + "?geom=geom";

  $.ajax({
    type: "POST",
    url: url,
    dataType: "json",
    data: {
      point: pt,
      csrfmiddlewaretoken: csrf_token
    },
    success: data => {
      manUnit = data;
      //manUnitGeom = helpers.feature(JSON.parse(manUnit.geom));
      update_manUnit_label(manUnit);
    },
    error: data => {
      manUnit = "";
      //manUnitGeom = undefined;
      update_manUnit_label(manUnit);
    }
  });
};

let bbox = JSON.parse(document.getElementById("map-bounds").textContent);

console.log("bbox = ", bbox);

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

//this should be a util
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
  get_grid10(lat, lon);
  get_manUnits(lat, lon);
  get_jurisdiction(lat, lon);
  get_lake(lat, lon);

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
//drawPt(lat, lon);
