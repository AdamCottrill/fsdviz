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

let strains;

const update_selector = (selectorID, newOptions) => {
  var $el = $(`#${selectorID}`);
  $el.empty(); // remove old options
  $el.append(
    $("<option></option>")
      .attr("value", "")
      .text("---------------")
  );
  $.each(newOptions, (value, label) => {
    $el.append(
      $("<option></option>")
        .attr("value", value)
        .text(label)
    );
  });
};

$("#id_species_id").on("change", function(e) {
  let url = "/api/v1/common/strainraw/?species_id=" + e.target.value;

  const reducer = (accumulator, d) => {
    accumulator[d.id] = `${d.raw_strain} (${d.description})`;
    return accumulator;
  };

  $.ajax({
    url: url,
    dataType: "json",
    success: data => {
      strains = data.reduce(reducer, {});
      update_selector("id_strain_raw_id", strains);
    },
    error: data => {
      console.log("ajax error getting strains!");
    }
  });
});

$("#id_lake_id").on("change", function(e) {
  let url = "/api/v1/common/jurisdiction/?lake_id=" + e.target.value;
  const reducer = (accumulator, d) => {
    accumulator[d.id] = `${d.stateprov.name} (${d.stateprov.abbrev})`;
    return accumulator;
  };

  $.ajax({
    url: url,
    dataType: "json",
    success: data => {
      let options = data.reduce(reducer, {});
      update_selector("id_state_prov_id", options);
    },
    error: data => {
      console.log("ajax error getting states and provinces!");
    }
  });

  url =
    "/api/v1/common/management_unit/?mu_type=stat_dist&lake_id=" +
    e.target.value;

  const manUnitReducer = (accumulator, d) => {
    accumulator[d.id] = d.label;
    return accumulator;
  };

  $.ajax({
    url: url,
    dataType: "json",
    success: data => {
      let options = data.reduce(manUnitReducer, {});
      update_selector("id_management_unit_id", options);
    },
    error: data => {
      console.log("ajax error getting mangement units!");
    }
  });
});
