/* global $ */

// disable button if there are any errors - or submitting is true....
/** given an array of two element arrays, return an object keyed by
 * the unique values in the first element.  the entries of the objects
 * will be an array of the second object.  Used to make dynamic select
 * widgets - choice can change depending on the value of the key
 * (e.g. strains depend on species) */
export const make_choices = (values) => {
  const choices = values.reduce((acc, x) => {
    let [key, val] = x;
    if (!acc.hasOwnProperty(key)) {
      acc[key] = [];
    }
    acc[key] = [...acc[key], val];
    //acc[key].push(val);
    return acc;
  }, {});
  return choices;
};

export async function getChoices(url, success, errmsg) {
  await $.ajax({
    url: url,
    dataType: "json",
    success: success,
    error: () => {
      console.log(errmsg);
    },
  });
}

/**  Verify that the selected option has a value, flag the select
 *   box if it doesn't and add a meaningful message
 *   eg - 'Seneca' is not a valid choice for Chinook Salmon */
export const checkMyChoice = (myId, parentId) => {
  //const el = $(`#${myId}`);
  const selected_val = $(`#${myId} option:selected`).val();
  const selected_text = $(`#${myId} option:selected`).text();
  const parent_text = $(`#${parentId} option:selected`).text();

  if (selected_val === "-999") {
    const msg = `'${selected_text}' is not a valid choice for '${parent_text}'`;
    //setInvalid(el, msg);
    addError(myId, "invalid-choice", msg);
  } else {
    //setValid(el);
    removeError(myId, "invalid-choice");
  }
};

export const update_selector = (selectorID, parentID, newOptions) => {
  const el = $(`#${selectorID}`);

  //const previous_val = $(`#${selectorID} option:selected`).val();
  const previous_text = $(`#${selectorID} option:selected`).text();
  const parent_text = $(`#${parentID} option:selected`).text();

  el.empty(); // remove old options

  if (!Object.values(newOptions).includes(previous_text)) {
    el.append($("<option></option>").attr("value", "-999").text(previous_text));

    const msg = `'${previous_text}' is not a valid choice for ${parent_text}`;
    //setInvalid(el, msg);
    addError(selectorID, "invalid-choice", msg);
  } else {
    removeError(selectorID, "invalid-choice");
    //setValid(el);
  }

  $.each(newOptions, (value, label) => {
    el.append($("<option></option>").attr("value", value).text(label));
  });

  if (Object.values(newOptions).includes(previous_text)) {
    const idx = Object.values(newOptions).indexOf(previous_text);
    el.val(Object.keys(newOptions)[idx]);
  }
};

/** update the choices in a dropdrown control to reflect the select
value in a parent widget (species and strains).  new options is list
of objects with the keys 'value' and 'text'.  This version is used in
the xls_validation form, does not flag the field as an error, and
accepts a list of objects as new Options.
*/
export const update_choices = (selectorID, parentID, newOptions) => {
  const el = $(`#${selectorID}`);

  //const previous_val = $(`#${selectorID} option:selected`).val();
  const previous_selection = $(`#${selectorID} option:selected`);
  const previous_text = previous_selection.text();
  let previous_value = previous_selection.val();

  const parent_text = $(`#${parentID} option:selected`).text();

  el.empty(); // remove old options

  // if the previous value is not in the current list, add it now:
  const was_previous =
    previous_value === "" || previous_value === "-999" ? true : previous_value;
  if (
    was_previous &&
    newOptions.filter((x) => x.value === previous_value).length === 0
  ) {
    el.append($("<option>", { value: previous_value, text: previous_text }));
  }

  $.each(newOptions, function (i, item) {
    el.append(
      $("<option>", {
        value: item.value,
        text: item.text,
      })
    );
  });

  // make sure the old value is selected.
  el.val(previous_value)
    .find(`option[value="${previous_value}"]`)
    .attr("selected", true);
};

export const setInvalid = (field, errMsg) => {
  let id = field.id ? field.id : field[0].id;
  let wrapper = $("#" + id + "-field");
  wrapper.addClass("error");
  let input = wrapper.find(".ui.input");
  // get the current errors and add our new one:
  input.attr("data-html", errMsg).attr("data-position", "top center");
};

export const setValid = (field) => {
  let id = field.id ? field.id : field[0].id;
  let wrapper = $("#" + id + "-field");
  wrapper.removeClass("error");
  let input = wrapper.find(".ui.input");
  input.removeAttr("data-html").removeAttr("data-position");
};

export const addError = (targetid, errorid, msg) => {
  errorid = targetid + "-" + errorid;
  let popup = $(`#${targetid}-popup`);

  if (popup.length === 0) {
    let html = `<div id="${targetid}-popup" class="ui flowing popup" hidden>
            <div id="${targetid}-error-list" class="ui bulleted list">
            </ul>
          </div>`;

    $(`#${targetid}-field`).append(html);
  }

  $(`#${targetid}-field`).addClass("error");
  let errorList = $(`#${targetid}-error-list`);

  // don't append duplicates
  if ($(`#${errorid}`).length === 0) {
    //let item_html = `<li id="${errorid}">${msg}</li>`;
    let item_html = `<div class="item" id="${errorid}">${msg}</div>`;
    errorList.append(item_html);
  } else {
    // update the error message (just incase it changed)
    $(`#${errorid}`).html(msg);
  }
};

// remove the specified error from the target field
// if this is the last error, remove the popup too
// note - removeing the popup entirely causes an error if we add it again.
// just leaving an empty popup is a workable solution.
export const removeError = (targetid, errorid) => {
  errorid = targetid + "-" + errorid;
  let errorSelector = `#${targetid}-error-list #${errorid}`;
  $(errorSelector).remove();
  let errorList = $(`#${targetid}-error-list .item`);
  if (errorList.length === 0) {
    $(`#${targetid}-popup`).popup("destroy");
    $(`#${targetid}-field`).removeClass("error");
  }
};

// from https://stackoverflow.com/questions/21188420/
// catch April 31, ect.
// if the input is the same as the output we are good:
export const isValidDate = (year, month, day) => {
  month = month - 1;
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
    //setValid(field);
    removeError(field.id, "out-of-range");
    return true;
  } else {
    let msg = `${field.name} must be ${
      integer ? "an integer" : ""
    } bewteen ${lower} and ${upper}.`;
    //setInvalid(field, msg);
    addError(field.id, "out-of-range", msg);
    return false;
  }
};

export const isEmpty = (value) => {
  if (value === "") return true;
  return false;
};

export const checkEmpty = (field) => {
  if (isEmpty(field.value.trim())) {
    //set field invalid
    //setInvalid(field, `${field.name} must not be empty`);
    addError(field.id, "empty", `${field.name} must not be empty`);
    return true;
  } else {
    //set field to valid
    //setValid(field);
    removeError(field.id, "empty");
    return false;
  }
};

export const checkLatLon = (field) => {
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
    //setValid(ddlat);
    //setValid(ddlon);
    removeError(ddlat.id, "latlon");
    removeError(ddlon.id, "latlon");
    return true;
  }

  let msg = "";

  if (isEmpty(ddlat.value)) {
    msg = "Latitude is required if longitude is populated.";
    //setInvalid(ddlat, msg);
    addError(ddlat.id, "latlon", msg);
    return false;
  }

  if (isEmpty(ddlon.value)) {
    msg = "Longitude is required if Latitude is populated.";
    //setInvalid(ddlon, msg);
    addError(ddlon.id, "latlon", msg);
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
    //setInvalid(field, msg);
    addError(field.id, "lat-bounds", msg);
    return false;
  }
  removeError(field.id, "lat-bounds");
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
    //setInvalid(field, msg);
    addError(field.id, "lon-bounds", msg);
    return false;
  }
  removeError(field.id, "lon-bounds");
  return true;
};
