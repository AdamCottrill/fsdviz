/* global lake mu_grids, form_errors, lake_bbox */

import { json } from "d3";

// attach blur event to each field
// return data from row on blur
// validate row - this should capture related fields

// spatial fields - check lake and state(jurisdiciton), stat district and grid with lat Longjaw

import { object, number, string } from "yup";

import {
  make_choices,
  isValidDate,
  update_choices,
} from "./components/form_utils";

// // day month and year must form valid data if populated

const render_field_errors = (form_errors) => {
  for (const [fld, err] of Object.entries(form_errors)) {
    // set the error class on the field:
    let selector = `#${fld}-field`;
    $(selector)
      .addClass("error")
      .attr("data-tooltip", err)
      .attr("data-variation", "tiny basic");
  }

  // if form_errors has any elements update the error message and disable the submit button
  // if form_errors is empty - enable the submit button and remove the errors-count.
  const error_count = Object.keys(form_errors).length;
  if (error_count) {
    // select the submit button:
    $("#upload-events-button").prop("disabled", true);
    $("#form-errors-message")
      .removeClass("form-valid-message")
      .addClass("form-error-message")
      .html(`${error_count} Error${error_count > 1 ? "s" : ""} Found.`);
  } else {
    $("#upload-events-button").prop("disabled", false);
    $("#form-errors-message")
      .removeClass("form-error-message")
      .addClass("form-valid-message")
      .html("No Errors Found");
  }
};

const get_choices = (field_name) => {
  const select = $(`#id_form-0-${field_name} option`);
  const choices = $.map(select, function (x) {
    return x.value;
  });
  return choices;
};

const clear_row_field_errors = (row_prefix) => {
  // given a row identifier, remove all of the errors in the row:
  $(`#${row_prefix}-row :input`).each(function () {
    $(this)
      .parents(".field")
      .removeClass("error")
      .removeAttr("data-tooltip")
      .remove("data-variation");
  });
};

const clear_field_error = (field_id) => {
  let selector = `#${field_id}-field`;
  $(selector)
    .removeClass("error")
    .removeAttr("data-tooltip")
    .removeAttr("data-variation");
};

const get_row_values = (row_selector) => {
  // row slector should be of the form 'id_form-8'
  let values = {};
  let row = $(`#${row_selector}-row :input`);
  row.each(function () {
    values[
      $(this)
        .attr("id")
        .replace(row_selector + "-", "")
    ] = $(this).val();
  });

  const add_row_error = (row_selector) => {
    $(`#${row_selector}-icon`).attr("class", "red arrow right");
    $(`#${row_selector}-row`).addClass("error");
  };

  const clear_row_error = (row_selector) => {
    $(`#${row_selector}-icon`).attr("class", "green check icon");
    $(`#${row_selector}-row`).removeClass("error");
  };

  values.month = values.month === "" ? undefined : +values.month;
  values.day = values.day === "" ? undefined : +values.day;

  values.latitude = values.latitude === "" ? undefined : +values.latitude;
  values.longitude = values.longitude === "" ? undefined : +values.longitude;
  values.weight = values.weight ? +values.weight : undefined;

  return values;
};

let agency_choices = [];
let lake_choices = [];
let stateprov_choices = [];
let statDist_choices = [];
let grid10_choices = [];
let species_choices = [];
let strain_choices = [];
let clipcode_choices = [];
let lifestage_choices = [];
let stocking_method_choices = [];

// tags, marks, hatchery

Promise.all([
  json("/api/v1/stocking/lookups"),
  json("/api/v1/common/lookups"),
]).then(([stocking, common]) => {
  // statDist, grid and strain are all objected keyed by their respective parents

  // state/prov choices keyed by lake
  // management unit choices keyed by lake/stat prov or jurisdiction
  // grid choices keyed by mu.
  // strain choices are keyed by species

  stateprov_choices = common.jurisdictions
    .filter((x) => x.lake.abbrev === lake)
    .map((d) => ({ value: d.stateprov.abbrev, text: d.stateprov.name }));

  statDist_choices = make_choices(
    common.manUnits
      .filter((x) => x.jurisdiction.lake.abbrev === lake)
      .map((d) => [
        d.jurisdiction.stateprov.abbrev,
        { value: d.label, text: d.label },
      ])
  );
  grid10_choices = make_choices(
    mu_grids.map((d) => [d[0], { value: d[1], text: d[1] }])
  );

  species_choices = common["species"]
    .filter((d) => d.active === true)
    .map((x) => x.abbrev);
  clipcode_choices = common["clipcodes"].map((x) => x.clip_code);

  stocking_method_choices = stocking["stockingmethods"].map((x) => x.stk_meth);
  lifestage_choices = stocking["lifestages"].map((x) => x.abbrev);

  strain_choices = make_choices(
    // object keyed by species with array of 2 element arrays
    // strain code (strain label)
    common.raw_strains
      .filter((d) => d.active === true)
      .map((x) => {
        //const label = `${x.raw_strain} (${x.description})`;
        return [x.species__abbrev, { value: x.raw_strain, text: x.raw_strain }];
      })
  );

  // choices for hatcheries, finclips, physchem_marks and tag_types can come from the first row
  // of our form - there is currently no api, and the values in those select widgets are complete
  // and consistent for all other rows:

  // const hatchery_select = $("#id_form-0-hatchery option");
  // const hatchery_choices = $.map(hatchery_select, function (x) {
  //   return x.value;
  // });

  //const finclip_choices = get_choices("finclip");
  const condition_choices = get_choices("condition");
  const physchem_mark_choices = get_choices("physchem_mark");
  const tag_type_choices = get_choices("tag_type");
  const hatchery_choices = get_choices("hatchery");

  const [minLon, minLat, maxLon, maxLat] = lake_bbox;
  const cwt_regex = /^[0-9]{6}((,|;)[0-9]{6})*(,|;)?$/;
  const thisYear = new Date().getFullYear();

  let schema = object().shape(
    {
      // stock_id: yup
      //   .number()
      //   .nullable(true)
      //   .transform((_, val) => (val === val ? val : null)),

      state_prov: string()
        .required()
        .oneOf(stateprov_choices.map((x) => x.value)),

      year: number()
        .required("Year is required")
        .positive("Year must be positive")
        .min(1950, "Year must be after 1950")
        .max(thisYear, `Year must be less than today (${thisYear})`),
      month: number()
        //.required("Month is required")
        .nullable()
        .positive("Month must be positive")
        .min(1, "Month must be greater than or equal to 1")
        .max(12, "Month must be less than or equal to 12")
        .when("day", {
          is: (day) => typeof day !== "undefined",
          then: number().required("Month is required if day is provided"),
          otherwise: number().nullable(true),
        }),
      day: number()
        .positive("Day must be positive")
        .min(1, "Day must be greater than or equal to 1")
        .max(31, "Day must be less than or equal to 31")
        .nullable(true)
        .test(
          "is-valid-date",
          "day-month-year do not form a valide date.",
          function (value, context) {
            const { year, month } = context.parent;
            if (
              (typeof month !== "undefined") &
              (typeof value !== "undefined")
            ) {
              return isValidDate(year, month, value);
            } else {
              return true;
            }
          }
        ),

      site: string().required(),
      st_site: string()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null)),
      latitude: number().when("longitude", {
        is: (longitude) =>
          (typeof longitude !== "undefined") & (longitude !== 0),
        then: number()
          .required("Latitude is required if Longitude is populated")
          .min(
            minLat,
            `Latitude must be greater than ${minLat.toFixed(3)} degrees`
          )
          .max(
            maxLat,
            `Latitude must be less than ${maxLat.toFixed(3)} degrees`
          ),
      }),
      longitude: number().when("latitude", {
        is: (latitude) => (typeof latitude !== "undefined") & (latitude !== 0),
        then: number()
          .required("Longitude is required if Latitude is populated")
          .min(
            minLon,
            `Longitude must be negative and greater than ${minLon.toFixed(
              3
            )} degrees`
          )
          .max(
            maxLon,
            `Longitude must be negative and less than ${maxLon.toFixed(
              3
            )} degrees`
          ),
      }),

      stat_dist: string()
        .required()
        .when("state_prov", (state_prov, schema) => {
          if (
            string()
              .oneOf(stateprov_choices.map((x) => x.value))
              .required()
              .isValid(state_prov)
          ) {
            return schema.oneOf(
              statDist_choices[state_prov].map((x) => x.value),
              `not a valid stat_dist for ${state_prov}`
            );
          }
          return schema;
        }),

      grid: string()
        .required()
        .when(["stat_dist", "state_prov"], (stat_dist, state_prov, schema) => {
          if (
            string()
              .oneOf(statDist_choices[state_prov].map((x) => x.value))
              .required()
              .isValid(stat_dist)
          ) {
            return schema.oneOf(
              grid10_choices[stat_dist].map((x) => x.value),
              `not a valid grid for ${stat_dist}`
            );
          }
          return schema;
        }),

      species: string().required().oneOf(species_choices),
      strain: string()
        .required()
        .when("species", (species, schema) => {
          if (string().oneOf(species_choices).required().isValid(species)) {
            return schema.oneOf(
              strain_choices[species].map((x) => x.value),
              `not a valid strain for ${species}`
            );
          }
          return schema;
        }),

      no_stocked: number()
        .required()
        .positive("Ensure this value is greater than or equal to 1")
        .integer(), // min and max
      year_class: number()
        .required("Year Class is required")
        .positive("Year Class must be positive")
        .min(1950, "Year must be after 1945")
        .max(thisYear, `Year Class must be less than today (${thisYear})`),
      stage: string()
        .oneOf(["", ...lifestage_choices], "Unknown Lifestage.")
        .required(),
      agemonth: number().positive().integer(),

      tag_no: string().matches(cwt_regex, {
        excludeEmptyString: true,
        message:
          "cwts must be exactly 6 digits separated by a comma or semicolon",
      }),
      tag_ret: number()
        .nullable(true)
        .typeError("Must be a valid number.")
        .transform((value, originalValue) =>
          String(originalValue).trim() === "" ? null : value
        )
        .positive(),
      length: number("Enter a number.")
        .nullable(true)
        .typeError("Must be a valid number.")
        .transform((value, originalValue) =>
          String(originalValue).trim() === "" ? null : value
        )
        .min(1, "Length must be greater than or equal to 1")
        .positive("Ensure this value is greater than or equal to 1"),
      weight: number("Enter a number.")
        .nullable(true)
        .typeError("Must be a valid number.")
        .transform((value, originalValue) =>
          String(originalValue).trim() === "" ? null : value
        )
        .min(0.1, "Weight must be greater than or equal to 1")
        .positive("Ensure this value is greater than or equal to 0.1"),
      condition: string()
        .nullable(true)
        .oneOf(["", ...condition_choices], "Unknown Condition Code.")
        .transform((_, val) => (val === val ? val : null)),
      lot_code: string()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null)),
      stock_meth: string().oneOf(
        ["", ...stocking_method_choices],
        "Unknown Stocking Method."
      ),
      notes: string()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null)),
      hatchery: string()
        .transform((_, val) => {
          return val === val ? val : null;
        })
        .oneOf(["", ...hatchery_choices], "Unknown Hatchery Abbrev."),
      agency_stock_id: string()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null)),
      finclip: string()
        .oneOf(["", ...clipcode_choices], "Unknown Composite Clip Code")
        .test(
          "Clip contains BP",
          'BP is not a valid Composite Clip. Did you mean "LPRP"',
          (value) => !/BP/.test(value)
        )
        .test(
          "Clip contains BV",
          'BV is not a valid Composite Clip. Did you mean "LVRV"',
          (value) => !/BV/.test(value)
        ),

      clip_efficiency: number()
        .positive()
        .nullable(true)
        .transform((value, originalValue) =>
          String(originalValue).trim() === "" ? null : value
        ),
      physchem_mark: string()
        .nullable(true)
        .oneOf(["", ...physchem_mark_choices], "Unknown PhysChem Mark.")
        .transform((_, val) => (val === val ? val : null)),

      tag_type: string()
        .nullable(true)
        .oneOf(["", ...tag_type_choices], "Unknown Tag Type.")
        .transform((_, val) => (val === val ? val : null)),
    },
    [["latitude", "longitude"], ["day"]]
  );

  const validate_values = async (values) => {
    let field_errors;
    try {
      await schema.validate(values, { abortEarly: false });
    } catch (errors) {
      field_errors = errors.inner.map((err) => ({
        field: err.path,
        message: err.message,
      }));
    }
    return field_errors;
  };

  const validate_row = (row_id) => {
    const values = get_row_values(row_id);
    validate_values(values).then((valid) => {
      // remove all of the errors in this row row:
      Object.keys(form_errors)
        .filter((key) => key.startsWith(row_id))
        .forEach((key) => delete form_errors[key]);
      // ad any back in:
      if (Array.isArray(valid)) {
        valid.forEach(
          (err) => (form_errors[`${row_id}-${err.field}`] = [err.message])
        );
        //add_row_error(row_id);
        $(`#${row_id}-icon`).attr("class", "red arrow right icon");
        $(`#${row_id}-row`).addClass("error");
      } else {
        // no errors
        //clear_row_error(row_id);
        $(`#${row_id}-icon`).attr("class", "green check icon");
        $(`#${row_id}-row`).removeClass("error");
      }
      clear_row_field_errors(row_id);
      render_field_errors(form_errors);
    });
  };

  //==================
  //    ON LOAD

  // attach our row validate to the blur event of every input field
  $("#upload-form :input").blur(function (e) {
    const form_id_regex = /id_form-[0-9]+/;
    const row_prefix = e.target.id.match(form_id_regex)[0];
    validate_row(row_prefix);
  });

  $("#upload-form :input").change(function (e) {
    const form_id_regex = /id_form-[0-9]+/;
    const row_prefix = e.target.id.match(form_id_regex)[0];
    validate_row(row_prefix);
  });

  //update the mangement unit, grid, and strain choices for each row
  //based on the value of their parent widgets in the same row
  $('select[id$="-state_prov"]').each(function (x) {
    let parent_id = this.id;
    let child_id = parent_id.replace("state_prov", "stat_dist");
    update_choices(child_id, parent_id, statDist_choices[this.value]);
  });

  $('select[id$="-stat_dist"]').each(function (x) {
    let parent_id = this.id;
    let child_id = parent_id.replace("stat_dist", "grid");
    update_choices(child_id, parent_id, grid10_choices[this.value]);
  });

  //update the strain choices for each row based on the value in each species
  // loop over each one, get each id, build the strain id, and select the options from
  // the strain lookup:
  $('select[id$="-species"]').each(function (x) {
    let parent_id = this.id;
    let child_id = parent_id.replace("species", "strain");

    update_choices(child_id, parent_id, strain_choices[this.value]);
  });

  //==================
  // ON CHANGE

  $('select[id$="-state_prov"]').change(function (x) {
    let parent_id = this.id;
    let child_id = parent_id.replace("state_prov", "stat_dist");
    update_choices(child_id, parent_id, statDist_choices[this.value]);
  });

  $('select[id$="-stat_dist"]').change(function (x) {
    let parent_id = this.id;
    let child_id = parent_id.replace("stat_dist", "grid");
    update_choices(child_id, parent_id, grid10_choices[this.value]);
  });

  // if a species changes - update the available choice in the strain control:
  $('select[id$="-species"]').change(function () {
    let parent_id = this.id;
    let child_id = parent_id.replace("species", "strain");
    update_choices(child_id, parent_id, strain_choices[this.value]);
  });

  // on load, loop over all of the rows, validate the data and update the form errors dictionary
  // then update the display to show the errors.

  const events = $("#upload-form tbody tr").map(function () {
    return $(this).attr("id").replace("-row", "");
  });

  events.get().forEach((row_id) => {
    validate_row(row_id);
  });

  // we will need fucntions to:
  // manage form_errors:
  // + add field
  // + remove field
  // delete if array is null
});
