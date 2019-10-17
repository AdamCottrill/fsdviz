/* global accessToken, $, lakeURL, jurisdictionURL, manUnitURL, grid10URL, csrf_token */

import Leaflet from "leaflet";
import helpers from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
//import * as turf from "@turf/turf";
import { select, selectAll } from "d3";

// get our initial lat-lon values from the form:
let lat;
let lon;

let grid10, grid10Geom;
let lake, lakeGeom;
let jurisdiction, jurisdictionGeom;
let manUnits = [];
let manUnitGeoms = {};

const updatePolygon = (obj, geom) => {
  // set the bounds of our map to the bounds of the selected lake object,
  // remove any existing polygon layers and add a new one with the
  // geometry for our lake:
  if (typeof obj !== "undefined") {
    bbox = obj.extent;
    mymap.flyToBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]], {
      padding: [50, 50]
    });
  }

  if (typeof obj !== "undefined") {
    geomLayer.remove();
    geomLayer = Leaflet.geoJSON().addTo(mymap);
    geomLayer.addData(geom);
  }
};

const changeGeom = () => {
  let what = select('input[name="show-geom"]:checked').property("value");
  if (what === "lake") {
    updatePolygon(lake, lakeGeom);
  } else if (what === "jurisdiction") {
    updatePolygon(jurisdiction, jurisdictionGeom);
  } else if (what === "grid10") {
    updatePolygon(grid10, grid10Geom);
  } else {
    updatePolygon(manUnits.filter(d => d.slug == what)[0], manUnitGeoms[what]);
  }
};

const add_radio_buttons = (data, label, value, label_function) => {
  //data, #mu-radio-button, mu-btn, label_function

  let radioButtonsDiv = select(`#${label}-radio-buttons`);

  let radioButtons = radioButtonsDiv
    .selectAll(`.${label}-btn`)
    .data(data, d => d.id);

  radioButtons.exit().remove();

  // enter
  let newButtons = radioButtons
    .enter()
    .append("div")
    .attr("class", `field ${label}-btn`)
    .attr("id", d => d.id)
    .append("div")
    .attr("class", "ui radio checkbox");

  newButtons
    .append("input")
    .attr("type", "radio")
    .attr("name", "show-geom")
    .attr("tabindex", "0")
    .attr("class", "hidden")
    .attr("value", value)
    .on("change", changeGeom);

  newButtons.append("label").text(label_function);

  radioButtons.merge(newButtons);

  //refresh semantic checkboxes again
  $(".ui.radio.checkbox").checkbox();
};

const update_grid_radio = obj => {
  const label_function = d => `${d.grid} (${d.lake_abbrev})`;
  add_radio_buttons(obj, "grid10", "grid10", label_function);
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
        grid10 = [data];
        grid10Geom = helpers.feature(JSON.parse(data.geom));
        update_grid_radio(grid10);
      },
      error: data => {
        grid10 = [];
        grid10Geom = undefined;
        update_grid_radio(grid10);
      }
    });
  }
};

const update_lake_radio = obj => {
  const label_function = d => `${d.lake_name} (${d.abbrev})`;

  add_radio_buttons(obj, "lake", "lake", label_function);
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
        lake = [data];
        lakeGeom = helpers.feature(JSON.parse(data.geom));
        update_lake_radio(lake);
      },
      error: data => {
        lake = [];
        lakeGeom = undefined;
        update_lake_radio(lake);
      }
    });
  }
};

const update_jurisdiction_radio = obj => {
  const label_function = d => `${d.stateprov_name} (${d.stateprov_abbrev})`;
  add_radio_buttons(obj, "jurisdiction", "jurisdiction", label_function);
};

const get_jurisdiction = (dd_lat, dd_lon) => {
  let pt = `POINT(${dd_lon} ${dd_lat})`;

  let contained = false;
  let turfpt = helpers.point([dd_lon, dd_lat]);

  if (typeof jurisdictionGeom !== "undefined") {
    contained = booleanPointInPolygon(turfpt, jurisdictionGeom);
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
        jurisdiction = [data];
        jurisdictionGeom = helpers.feature(JSON.parse(data.geom));
        update_jurisdiction_radio(jurisdiction);
      },
      error: data => {
        jurisdiction = [];
        jurisdictionGeom = undefined;
        update_jurisdiction_radio(jurisdiction);
      }
    });
  }
};

const update_manUnit_radio = mus => {
  const label_function = d => `${d.label} (${d.mu_type})`;
  const value = d => d.slug;
  add_radio_buttons(mus, "mu", value, label_function);
};

const get_manUnits = (dd_lat, dd_lon) => {
  let pt = `POINT(${dd_lon} ${dd_lat})`;

  let url = manUnitURL + "?all=true&geom=geom";

  $.ajax({
    type: "POST",
    url: url,
    dataType: "json",
    data: {
      point: pt,
      csrfmiddlewaretoken: csrf_token
    },
    success: data => {
      manUnits = data;
      manUnits.forEach(mu => {
        manUnitGeoms[mu.slug] = helpers.feature(JSON.parse(mu.geom));
      });
      update_manUnit_radio(manUnits);
    },
    error: data => {
      manUnits = [];
      manUnitGeoms = {};
      update_manUnit_radio(manUnits);
    }
  });
};

let bbox = JSON.parse(document.getElementById("map-bounds").textContent);

// min_lon, min_lat, max_lon, max_lat
//[-92.0940772277101, 41.3808069346309, -76.0591720893562, 49.0158109434947]

let min_lon = bbox[0];
let min_lat = bbox[1];
let max_lon = bbox[2];
let max_lat = bbox[3];

// setup the map with rough bounds (need to get pies to plot first,
// this will be tweaked later):
const mymap = Leaflet.map("mapid", {
  zoomDelta: 0.25,
  zoomSnap: 0
}).fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]], {
  padding: [50, 50]
});

var geomLayer = Leaflet.geoJSON().addTo(mymap);

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

const update_widgets = (lat, lon) => {
  if ((lat !== "") & (lon !== "")) {
    if (
      (lat >= min_lat) &
      (lat <= max_lat) &
      (lon >= min_lon) &
      (lon <= max_lon)
    ) {
      update_text_inputs(lat, lon);
      drawPt(lat, lon);
      get_grid10(lat, lon);
      get_manUnits(lat, lon);
      get_jurisdiction(lat, lon);
      get_lake(lat, lon);
    }
  }
};

// if we click on the map, update the lat-lon inputs:
mymap.on("click", function(e) {
  lat = e.latlng.lat;
  lon = e.latlng.lng;
  update_widgets(lat, lon);
  $("#id_dd_lat").val(Number(lat).toFixed(4));
  $("#id_dd_lon").val(Number(lon).toFixed(4));
});

//watch our lat-lon inputs and update the point if they change:
$("#id_dd_lat").on("change", function(e) {
  lat = parseFloat(e.target.value);
  update_widgets(lat, lon);
});

$("#id_dd_lon").on("change", function(e) {
  lon = parseFloat(e.target.value);
  update_widgets(lat, lon);
});

selectAll('input[name="show-geom"]').on("change", changeGeom);

const update_text_inputs = (ddlat, ddlon) => {
  // latitude inputs
  var lat_idegrees = Math.floor(ddlat);
  var lat_dminutes = (ddlat - lat_idegrees) * 60;
  var lat_iminutes = Math.floor(lat_dminutes);
  var lat_seconds = (lat_dminutes - lat_iminutes) * 60;

  $('input[id="id_dd_lat"]').val(ddlat);
  $('input[id="ddm_lat_deg"]').val(lat_idegrees);
  $('input[id="ddm_lat_min"]').val(lat_dminutes.toFixed(3));

  $('input[id="dms_lat_deg"]').val(lat_idegrees);
  $('input[id="dms_lat_min"]').val(lat_iminutes);
  $('input[id="dms_lat_sec"]').val(lat_seconds.toFixed(3));

  // longitude inputs
  ddlon = Math.abs(ddlon);
  var lon_idegrees = Math.floor(ddlon);
  var lon_dminutes = (ddlon - lon_idegrees) * 60;
  var lon_iminutes = Math.floor(lon_dminutes);
  var lon_seconds = (lon_dminutes - lon_iminutes) * 60;

  $('input[id="id_dd_lon"]').val(ddlon * -1);

  $('input[id="ddm_lon_deg"]').val(lon_idegrees * -1);
  $('input[id="ddm_lon_min"]').val(lon_dminutes.toFixed(3));

  $('input[id="dms_lon_deg"]').val(lon_idegrees * -1);
  $('input[id="dms_lon_min"]').val(lon_iminutes);
  $('input[id="dms_lon_sec"]').val(lon_seconds.toFixed(3));
};

$('input[name="ddm_lat"]').change(function() {
  //if any of the latitude elements on the ddm page change, update the other formats.
  var lat_idegrees = parseFloat($('input[id="ddm_lat_deg"]').val());
  var lat_dminutes = parseFloat($('input[id="ddm_lat_min"]').val());

  // try and calculate a ddlat - if it is a number between lat-min and
  // lat max update our widgets
  if ((lat_idegrees !== "") & (lat_dminutes !== "")) {
    lat = lat_idegrees + lat_dminutes / 60;
    update_widgets(lat, lon);
  }
});

$('input[name="ddm_lon"]').change(function() {
  let lon_idegrees = parseFloat($('input[id="ddm_lon_deg"]').val());
  let lon_dminutes = parseFloat($('input[id="ddm_lon_min"]').val());

  // try and calculate a ddlat - if it is a number between lat-min and
  // lat max update our widgets
  if ((lon_idegrees !== "") & (lon_dminutes !== "")) {
    lon_idegrees = Math.abs(lon_idegrees);
    lon = (lon_idegrees + lon_dminutes / 60) * -1;
    update_widgets(lat, lon);
  }
});

$('input[name="dms_lat"]').change(function() {
  //if any of the latitude elements on the dms page change, update the other formats.

  let lat_idegrees = parseFloat($('input[id="dms_lat_deg"]').val());
  let lat_iminutes = parseFloat($('input[id="dms_lat_min"]').val());
  let lat_seconds = parseFloat($('input[id="dms_lat_sec"]').val());

  if ((lat_idegrees !== "") & (lat_iminutes !== "") & (lat_seconds !== "")) {
    let lat_dminutes = lat_iminutes + lat_seconds / 60;
    lat = lat_idegrees + lat_dminutes / 60;
    update_widgets(lat, lon);
  }
});

$('input[name="dms_lon"]').change(function() {
  //if any of the longitude elements on the dms page change, update the other formats.

  let lon_idegrees = parseFloat($('input[id="dms_lon_deg"]').val());

  let lon_iminutes = parseFloat($('input[id="dms_lon_min"]').val());
  let lon_seconds = parseFloat($('input[id="dms_lon_sec"]').val());

  if ((lon_idegrees !== "") & (lon_iminutes !== "") & (lon_seconds !== "")) {
    lon_idegrees = Math.abs(lon_idegrees);
    let lon_dminutes = lon_iminutes + lon_seconds / 60;
    lon = (lon_idegrees + lon_dminutes / 60) * -1;
    update_widgets(lat, lon);
  }
});
