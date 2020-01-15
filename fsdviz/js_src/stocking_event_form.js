/* global accessToken,  $, spatialAttrURL, csrf_token */

import Leaflet from "leaflet";

import helpers from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

import {
  checkChoice,
  update_selector,
  setValid,
  setInvalid,
  addError,
  removeError,
  isValidDate,
  checkRange,
  isEmpty,
  checkEmpty,
  checkDdLat,
  checkDdLon,
  checkLatLon
} from "./form_utils";

import { checkPointInPoly, getPolygon, getSpatialAttrs } from "./spatial_utils";

let bbox = JSON.parse(document.getElementById("map-bounds").textContent);

// get our initial lat-lon values from the form:
let lat = $("#id_dd_lat").val();
let lon = $("#id_dd_lon").val();

// an object to hold the spatial attrubutes predicted by lat-long.
let spatialAttrs = {
  grid10: "",
  jurisdiction: "",
  lake: "",
  manUnit: ""
};

const updateSpatialAttrs = (lat, lon) => {
  let success = data => (spatialAttrs = data);
  let error = () => {
    spatialAttrs = {};
  };
  let pt = { dd_lat: lat, dd_lon: lon };
  getSpatialAttrs(pt, spatialAttrURL, csrf_token, success, error).then(() =>
    checkSpatialWidgets()
  );
};

const checkSpatialWidgets = () => {
  // grid10
  let gridShouldbe;
  let manUnitShouldbe;
  let stateProvShouldbe;
  let lakeShouldbe;
  // statDist
  // state/Prov
  // lake

  gridShouldbe =
    spatialAttrs["grid10"] !== "" ? spatialAttrs["grid10"].grid : "";
  validateSpatialField(gridShouldbe, "id_grid_10_id");

  manUnitShouldbe =
    spatialAttrs["manUnit"] !== "" ? spatialAttrs["manUnit"].label : "";
  validateSpatialField(manUnitShouldbe, "id_management_unit_id");

  if (spatialAttrs["jurisdiction"] !== "") {
    stateProvShouldbe = `${spatialAttrs["jurisdiction"].stateprov_name} (${spatialAttrs["jurisdiction"].stateprov_abbrev})`;
  } else {
    stateProvShouldbe = "";
  }
  validateSpatialField(stateProvShouldbe, "id_state_prov_id");

  if (spatialAttrs["lake"] !== "") {
    lakeShouldbe = `${spatialAttrs["lake"].lake_name} (${spatialAttrs["lake"].abbrev})`;
  } else {
    lakeShouldbe = "";
  }
  validateSpatialField(lakeShouldbe, "id_lake_id");
};

const validateSpatialField = (shouldbe, fieldid) => {
  //see if the selected value is the same as shouldbe
  // if so, setvalid(feild);
  // if not, see if there is already an error:
  // if there is an error - tack this one to it
  // if not - add popup html to the dom.
  const selected = $(`#${fieldid} option:selected`).html();
  let field = $(`#${fieldid}`);

  if (selected === shouldbe || shouldbe === "") {
    removeError(fieldid, "latlon");
  } else {
    let msg = "Oh snap! lat-long says " + shouldbe;
    addError(fieldid, "latlon", msg);
  }
};

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

  if (lat !== "" && lon !== "") {
    let circle = Leaflet.circleMarker([parseFloat(lat), parseFloat(lon)], {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 5
    }).addTo(mymap);
  }
};

// if we click on the map, update the lat-lon inputs:
mymap.on("click", function(e) {
  lat = e.latlng.lat;
  lon = e.latlng.lng;
  drawPt(lat, lon);
  $("#id_dd_lat").val(Number(lat).toFixed(4));
  $("#id_dd_lon").val(Number(lon).toFixed(4));
  updateSpatialAttrs(lat, lon);
});

//watch our lat-lon inputs and update the point if they change:
$("#id_dd_lat").on("change", function(e) {
  if (!checkDdLat(this, bbox)) return false;
  if (!checkLatLon(this)) return false;
  updateMapPt();
});

$("#id_dd_lon").on("change", function(e) {
  if (!checkDdLon(this, bbox)) return false;
  if (!checkLatLon(this)) return false;
  updateMapPt();
});

function updateMapPt() {
  lat = document.getElementById("id_dd_lat").value;
  lon = document.getElementById("id_dd_lon").value;
  drawPt(lat, lon);
  updateSpatialAttrs(lat, lon);
}

// draw our initail point:
drawPt(lat, lon);

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
      update_selector("id_state_prov_id", this.id, options);
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
      update_selector("id_management_unit_id", this.id, options);
    },
    error: data => {
      console.log("ajax error getting mangement units!");
    }
  });
});

$("#id_management_unit_id").on("change", function(e) {
  let url = "/api/v1/common/grid10/?manUnit_id=" + e.target.value;

  const reducer = (accumulator, d) => {
    accumulator[d.id] = `${d.grid} (${d.lake.abbrev})`;
    return accumulator;
  };

  $.ajax({
    url: url,
    dataType: "json",
    success: data => {
      let options = data.reduce(reducer, {});
      update_selector("id_grid_10_id", this.id, options);
    },
    error: data => {
      console.log("ajax error getting grids!");
    }
  });
});

//=====================================================
//              SPECIES AND STRAINS

// when species changes, update the list of strains - if there is a
// strain selected, keep it but flag it as invalid

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
      let strains = data.reduce(reducer, {});
      update_selector("id_strain_raw_id", this.id, strains);
    },
    error: data => {
      console.log("ajax error getting strains!");
    }
  });
});

$("#id_strain_raw_id").on("change", function(e) {
  const myId = this.id;
  const parentId = "id_species_id";
  checkChoice(myId, parentId);
});

//=====================================================
//         EVENT DATE

$(".ui.calendar").calendar({
  type: "date",
  maxDate: new Date(),
  onChange: function(date, text) {
    const myDate = new Date(text);

    let yr = myDate.getFullYear();
    let month = myDate.getMonth();
    let day = myDate.getDate();

    if (isValidDate(yr, month, day)) {
      let yearField = document.getElementById(this.id.replace("date", "year"));
      let monthField = document.getElementById(
        this.id.replace("date", "month")
      );
      let dayField = document.getElementById(this.id.replace("date", "day"));

      dayField.value = day;
      setValid(dayField);
      yearField.value = yr;
      setValid(yearField);
      monthField.value = month + 1;
      setValid(monthField);
    }
  }
});

const updateCalendar = function() {
  // set the calendar widget to the date represented by the day,
  // month and year fields.
  const yearElement = document.getElementById("id_year");
  const monthElement = document.getElementById("id_month");
  const dayElement = document.getElementById("id_day");

  const yr = parseInt(yearElement.value);
  const month = parseInt(monthElement.value);
  const day = parseInt(dayElement.value);

  const myDate = new Date(yr, month - 1, day);

  if (isValidDate(yr, month - 1, day)) {
    $("#id_date").calendar("set date", myDate);
  } else {
    $("#id_date").calendar("clear");
  }
};
updateCalendar();

$("#id_day").on("change", function(e) {
  updateCalendar();
  checkDate();
});

$("#id_month").on("change", function(e) {
  if (validate_month(this)) checkDate();
});

$("#id_year").on("change", function(e) {
  if (validate_year(this)) checkDate();
});

function validate_month(field) {
  // if month is provided, it must be between 1 and 12
  // get the day, month, and year from the same row and see if it
  // forms a valid date;

  let day = $("#" + field.id.replace("month", "day"));

  if (day.val()) {
    if (checkEmpty(field)) {
      setInvalid(field, "Month is required if Day is populated.");
      //addError(
      //  field.id,
      //  "month-required",
      //  "Month is required if Day is populated."
      //);
      return false;
    }
  }
  //removeError(field.id, "month-required");
  //setValid(field);
  return true;
}

function validate_year(field) {
  // year is required and must be >1950 and less than or equal to the the current year
  const thisYear = new Date().getFullYear();
  if (checkEmpty(field)) return false;
  if (!checkRange(field, 1950, thisYear)) return false;
  // - might still want setValid - always remove all errors?
  setValid(field);
  return true;
}

const checkDate = function() {
  let yearElement = document.getElementById("id_year");
  let monthElement = document.getElementById("id_month");
  let dayElement = document.getElementById("id_day");

  let yr = yearElement.value;
  let month = monthElement.value;
  let day = dayElement.value;

  //clear calendar
  updateCalendar("id_date");

  if (yr !== "" && month !== "" && day !== "") {
    const myDate = new Date(yr, month - 1, day);

    if (isValidDate(yr, month - 1, day)) {
      // update calendar
      updateCalendar("id_date", myDate);
      setValid(yearElement);
      setValid(monthElement);
      setValid(dayElement);
    } else {
      let msg = `${yr}-${month}-${day} is an invalid date or occurs in the future.`;
      setInvalid(yearElement, msg);
      setInvalid(monthElement, msg);
      setInvalid(dayElement, msg);
    }
  } else if (yr !== "" && month === "" && day !== "") {
    // day is not  populated, month and year are valid - OK
    setValid(yearElement);
    setValid(dayElement);
  } else if (yr !== "" && month === "" && day === "") {
    // day and month are not populated,year are valid - OK
    setValid(yearElement);
    setValid(monthElement);
    setValid(dayElement);
  }
};
