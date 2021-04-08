/* global  $, jurisdictionURL, manUnitURL, grid10URL, spatialAttrURL, strainURL, csrf_token */

import Leaflet from "leaflet";

import {
  checkMyChoice,
  getChoices,
  update_selector,
  setValid,
  setInvalid,
  addError,
  removeError,
  isValidDate,
  checkRange,
  checkEmpty,
  checkDdLat,
  checkDdLon,
  checkLatLon,
} from "./components/form_utils";

import {
  //checkPointInPoly, getPolygon,
  getSpatialAttrs,
} from "./components/spatial_utils";

//=================================================
// GLOBALS

let bbox = JSON.parse(document.getElementById("map-bounds").textContent);

// get our initial lat-lon values from the form:
let lat = $("#id_dd_lat").val();
let lon = $("#id_dd_lon").val();

// an object to hold the spatial attrubutes predicted by lat-long.
let spatialAttrs = {
  lake: "",
  jurisdiction: "",
  grid10: "",
  manUnit: "",
};

//=================================================
//              LEAFLET MAP

// setup the map with rough bounds (need to get pies to plot first,
// this will be tweaked later):
const mymap = Leaflet.map("mapid", {
  zoomDelta: 0.25,
  zoomSnap: 0,
}).fitBounds([
  [bbox[1], bbox[0]],
  [bbox[3], bbox[2]],
]);

// set up a cross hair on our map - better for clicking
$(".leaflet-container").css("cursor", "default");

Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  maxZoom: 18,
}).addTo(mymap);

const drawPt = (lat, lon) => {
  // remove the last one - there can only ever be one point for an event:
  $("path.leaflet-interactive").remove();

  if (lat !== "" && lon !== "") {
    Leaflet.circleMarker([parseFloat(lat), parseFloat(lon)], {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 5,
    }).addTo(mymap);
  }
};

// if we click on the map, update the lat-lon inputs:
mymap.on("click", function (e) {
  lat = e.latlng.lat;
  lon = e.latlng.lng;
  $("#id_dd_lat").val(Number(lat).toFixed(4));
  $("#id_dd_lon").val(Number(lon).toFixed(4));
  updateMapPt();
});

//watch our lat-lon inputs and update the point if they change:
$("#id_dd_lat").on("change", function () {
  if (!checkDdLat(this, bbox)) return false;
  if (!checkLatLon(this)) return false;
  updateMapPt();
});

$("#id_dd_lon").on("change", function () {
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

//=================================================
// SPATIAL SELECTS EVENTS

$("#id_lake_id").on("change", () => {
  updateStateProvChoices();
  validateLake();
  //  checkMyChoice("id_state_prov_id", "id_lake_id");
  validateStateProv();
  validateManUnit();
  validateGrid10();
  checkSpatialWidgets();
});

$("#id_state_prov_id").on("change", () => {
  updateManUnitChoices();
  validateStateProv();
  validateManUnit();
  validateGrid10();
  checkSpatialWidgets();

  //  checkMyChoice("id_management_unit_id", "id_state_prov_id");
});

$("#id_management_unit_id").on("change", () => {
  updateGrid10Choices();
  validateManUnit();
  validateGrid10();
  checkSpatialWidgets();
});

$("#id_grid_10_id").on("change", () => {
  //checkSpatialWidgets();
  //  checkMyChoice("id_grid_10_id", "id_management_unit_id");
  //    checkGrid10ChoiceLatLon();
  validateGrid10();
  checkSpatialWidgets();
});

$("#id_lake_id").on("blur", () => {
  validateLake();
  validateStateProv();
  validateManUnit();
  validateGrid10();
  checkSpatialWidgets();
});

$("#id_state_prov_id").on("blur", () => {
  validateStateProv();
  validateManUnit();
  validateGrid10();
  checkSpatialWidgets();
});

$("#id_management_unit_id").on("blur", () => {
  validateManUnit();
  validateGrid10();
  validateManUnit();
  checkSpatialWidgets();
});

$("#id_grid_10_id").on("blur", () => {
  validateGrid10();
  checkSpatialWidgets();
});

//=====================================================
// in order for our spatial selects to be valid - each one must:
// + be consistent with coordinates
// + be one of the choices

const validateLake = () => {
  checkLakeChoiceLatLon();
};

const validateStateProv = () => {
  checkStateProvChoiceLatLon();
  checkMyChoice("id_state_prov_id", "id_lake_id");
};

const validateManUnit = () => {
  checkManUnitChoiceLatLon();
  checkMyChoice("id_management_unit_id", "id_state_prov_id");
};

const validateGrid10 = () => {
  checkGrid10ChoiceLatLon();
  checkMyChoice("id_grid_10_id", "id_management_unit_id");
};

//=====================================================
//         UPDATE SPATIAL SELECTS

// when a spatial select changes, update the options in the child widget:

const updateStateProvChoices = () => {
  let options;
  let lake_id = $("#id_lake_id option:selected").val();

  //let url = "/api/v1/common/jurisdiction/?lake_id=" + e.target.value;
  //let url = `${jurisdictionURL}?lake_id=${lake_id}`;
  let url = `${jurisdictionURL}?lake_id=${lake_id}`;
  const reducer = (accumulator, d) => {
    accumulator[d.stateprov.id] = `${d.stateprov.name} (${d.stateprov.abbrev})`;
    return accumulator;
  };

  const success = (data) => {
    options = data.reduce(reducer, {});
  };
  let errmsg = "ajax error getting states and provinces!";

  getChoices(url, success, errmsg)
    .then(() => {
      update_selector("id_state_prov_id", "id_lake_id", options);
    })
    .then(checkMyChoice("id_state_prov_id", "id_lake_id"));
};

const updateManUnitChoices = () => {
  let options;

  let lake_id = $("#id_lake_id option:selected").val();
  let stateprov_id = $("#id_state_prov_id option:selected").val();

  let url = `${manUnitURL}?mu_type=stat_dist&stateprov_id=${stateprov_id}&lake_id=${lake_id}`;
  const reducer = (accumulator, d) => {
    accumulator[d.id] = d.label;
    return accumulator;
  };

  const success = (data) => {
    options = data.reduce(reducer, {});
  };
  let errmsg = "ajax error getting management units!";

  getChoices(url, success, errmsg)
    .then(() => {
      update_selector("id_management_unit_id", "id_state_prov_id", options);
      //    checkSpatialWidgets();
    })
    .then(checkMyChoice("id_management_unit_id", "id_state_prov_id"));
};

const updateGrid10Choices = () => {
  // update the options available in the grid10 select box

  let selectedManUnitId = $("#id_management_unit_id option:selected").val();
  let url = `${grid10URL}?manUnit_id=${selectedManUnitId}`;

  const reducer = (accumulator, d) => {
    //accumulator[d.id] = `${d.grid} (${d.lake.abbrev})`;
    accumulator[d.id] = d.grid;
    return accumulator;
  };

  let options;
  const success = (data) => {
    options = data.reduce(reducer, {});
  };
  let errmsg = "ajax error getting grids!";
  getChoices(url, success, errmsg)
    .then(() => {
      update_selector("id_grid_10_id", "id_management_unit_id", options);
      //checkSpatialWidgets();
    })
    .then(checkMyChoice("id_grid_10_id", "id_management_unit_id"));
};

const checkLakeChoiceLatLon = () => {
  let lakeShouldbe;
  if (spatialAttrs["lake"] !== "") {
    let name = spatialAttrs["lake"].lake_name;
    let abbrev = spatialAttrs["lake"].abbrev;
    lakeShouldbe = `${name} (${abbrev})`;
  } else {
    lakeShouldbe = "";
  }
  validateSpatialField(lakeShouldbe, "id_lake_id");
};

const checkStateProvChoiceLatLon = () => {
  let stateProvShouldbe;
  if (spatialAttrs["jurisdiction"] !== "") {
    let name = spatialAttrs["jurisdiction"].stateprov_name;
    let abbrev = spatialAttrs["jurisdiction"].stateprov_abbrev;
    stateProvShouldbe = `${name} (${abbrev})`;
  } else {
    stateProvShouldbe = "";
  }
  validateSpatialField(stateProvShouldbe, "id_state_prov_id");
};

const checkManUnitChoiceLatLon = () => {
  let manUnitShouldbe;
  manUnitShouldbe =
    spatialAttrs["manUnit"] !== "" ? spatialAttrs["manUnit"].label : "";
  validateSpatialField(manUnitShouldbe, "id_management_unit_id");
};

const checkGrid10ChoiceLatLon = () => {
  let gridShouldbe;
  gridShouldbe =
    spatialAttrs["grid10"] !== "" ? spatialAttrs["grid10"].grid : "";
  validateSpatialField(gridShouldbe, "id_grid_10_id");
};

const checkSpatialWidgets = () => {
  checkLakeChoiceLatLon();
  checkManUnitChoiceLatLon();
  checkStateProvChoiceLatLon();
  checkGrid10ChoiceLatLon();
};

const validateSpatialField = (shouldbe, fieldid) => {
  //see if the selected value is the same as shouldbe
  // if not - add popup html to the dom.
  const selected = $(`#${fieldid} option:selected`).html();

  if (selected == shouldbe || shouldbe == "") {
    removeError(fieldid, "lat-lon");
  } else {
    let msg = `Lat-long suggests "${shouldbe}"`;
    addError(fieldid, "lat-lon", msg);
  }
};

/** a function to get the predicted lake, province, manUnit and grid
 * based on lat lon and compare against current values. */

const updateSpatialAttrs = async (lat, lon) => {
  let pt = { dd_lat: lat, dd_lon: lon };
  spatialAttrs = await getSpatialAttrs(pt, spatialAttrURL, csrf_token);
  checkSpatialWidgets();
};

//=====================================================
//              SPECIES AND STRAINS

// when species changes, update the list of strains - if there is a
// strain selected, keep it but flag it as invalid

$("#id_species_id").on("change", function (e) {
  //let url = "/api/v1/common/strainraw/?species_id=" + e.target.value;
  let url = `${strainURL}?species_id=${e.target.value}`;

  const reducer = (accumulator, d) => {
    accumulator[d.id] = `${d.raw_strain} (${d.description})`;
    return accumulator;
  };

  let options;
  const myid = this.id;
  const success = (data) => {
    options = data.reduce(reducer, {});
  };
  const errmsg = "ajax error getting strains!";
  getChoices(url, success, errmsg).then(() => {
    update_selector("id_strain_raw_id", myid, options);
  });
});

$("#id_strain_raw_id").on("change", function () {
  const myId = this.id;
  const parentId = "id_species_id";
  checkMyChoice(myId, parentId);
});

//=====================================================
//         EVENT DATE

$(".ui.calendar").calendar({
  type: "date",
  maxDate: new Date(),
  onChange: function (date, text) {
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
  },
});

const updateCalendar = function () {
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

$("#id_day").on("change", function () {
  updateCalendar();
  checkDate();
});

$("#id_month").on("change", function () {
  if (validate_month(this)) checkDate();
});

$("#id_year").on("change", function () {
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

const checkDate = function () {
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

// on page load:

updateCalendar();

updateStateProvChoices();
updateManUnitChoices();
updateGrid10Choices();
// draw our initail point:
updateMapPt();

if (lat && lon) {
  updateSpatialAttrs(lat, lon);
}
