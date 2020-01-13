/* global $ */

export const checkChoice = (myId, parentId) => {
  // verify that the selected option has a value, flag the select
  // box if it doesn't and add a meaning ful message

  const el = $(`#${myId}`);
  const selected_val = $(`#${myId} option:selected`).val();
  const selected_text = $(`#${myId} option:selected`).text();
  const parent_text = $(`#${parentId} option:selected`).text();

  if (selected_val === "-999") {
    const msg = `'${selected_text}' is not a valid choice for ${parent_text}`;
    setInvalid(el, msg);
  } else {
    setValid(el);
  }
};

export const update_selector = (selectorID, parentID, newOptions) => {
  const el = $(`#${selectorID}`);

  //const previous_val = $(`#${selectorID} option:selected`).val();
  const previous_text = $(`#${selectorID} option:selected`).text();
  const parent_text = $(`#${parentID} option:selected`).text();

  el.empty(); // remove old options

  if (!Object.values(newOptions).includes(previous_text)) {
    el.append(
      $("<option></option>")
        .attr("value", "-999")
        .text(previous_text)
    );

    const msg = `'${previous_text}' is not a valid choice for ${parent_text}`;
    setInvalid(el, msg);
  } else {
    setValid(el);
  }

  $.each(newOptions, (value, label) => {
    el.append(
      $("<option></option>")
        .attr("value", value)
        .text(label)
    );
  });

  if (Object.values(newOptions).includes(previous_text)) {
    const idx = Object.values(newOptions).indexOf(previous_text);
    el.val(Object.keys(newOptions)[idx]);
  }
};

export const setInvalid = (field, errMsg) => {
  let id = field.id ? field.id : field[0].id;
  let wrapper = $("#" + id + "-field");
  wrapper.addClass("error");
  let input = wrapper.find(".ui.input");
  input.attr("data-tooltip", errMsg).attr("data-position", "top center");
};

export const setValid = field => {
  let id = field.id ? field.id : field[0].id;
  let wrapper = $("#" + id + "-field");
  wrapper.removeClass("error");
  let input = wrapper.find(".ui.input");
  input.removeAttr("data-tooltip").removeAttr("data-position");
};

// from https://stackoverflow.com/questions/21188420/
// catch April 31, ect.
// if the input is the same as the output we are good:
export const isValidDate = (year, month, day) => {
  let d = new Date(year, month, day);
  let now = new Date();

  if (
    d.getFullYear() == year &&
    d.getMonth() == month &&
    d.getDate() == day &&
    d < now
  ) {
    return true;
  }
  return false;
};

export const checkRange = (field, lower, upper, integer = true) => {
  if (field.value >= lower && field.value <= upper) {
    setValid(field);
    return true;
  } else {
    let msg = `${field.name} must be ${
      integer ? "an integer" : ""
    } bewteen ${lower} and ${upper}.`;
    setInvalid(field, msg);
    return false;
  }
};

export const isEmpty = value => {
  if (value === "") return true;
  return false;
};

export const checkEmpty = field => {
  if (isEmpty(field.value.trim())) {
    //set field invalid
    setInvalid(field, `${field.name} must not be empty`);
    return true;
  } else {
    //set field to valid
    setValid(field);
    return false;
  }
};

export const checkLatLon = field => {
  // if this is lat, get lon, if this is lon get lat not need for
  // single, event, but will be required for formset (that will have
  // mutiple lats and longs - get the one from the same row)

  const ddlatid = field.id.replace("lon", "lat");
  const ddlonid = field.id.replace("lat", "lon");
  const ddlat = document.getElementById(ddlatid);
  const ddlon = document.getElementById(ddlonid);

  if (
    (isEmpty(ddlat.value) && isEmpty(ddlon.value)) ||
    (!isEmpty(ddlat.value) && !isEmpty(ddlon.value))
  ) {
    setValid(ddlat);
    setValid(ddlon);
    return true;
  }

  let msg = "";

  if (isEmpty(ddlat.value)) {
    msg = "Latitude is required if longitude is populated.";
    setInvalid(ddlat, msg);
    return false;
  }

  if (isEmpty(ddlon.value)) {
    msg = "Longitude is required if Latitude is populated.";
    setInvalid(ddlon, msg);
    return false;
  }

  return true;
};

export const checkDdLat = (field, bbox) => {
  // make sure the latitude is between the elements of our bounding
  // box.
  const lat = parseFloat(field.value);
  if (lat < bbox[1] || lat > bbox[3]) {
    let msg = `Latitude must be bewteen ${bbox[1].toFixed(
      3
    )} and ${bbox[3].toFixed(3)}`;
    setInvalid(field, msg);
    return false;
  }
  return true;
};

export const checkDdLon = (field, bbox) => {
  // make sure the longitude is between the elements of our bounding
  // box.
  const lon = parseFloat(field.value);
  if (lon < bbox[0] || lon > bbox[2]) {
    let msg = `Longitude must be bewteen ${bbox[0].toFixed(
      3
    )} and ${bbox[2].toFixed(3)}`;
    setInvalid(field, msg);
    return false;
  }
  return true;
};
