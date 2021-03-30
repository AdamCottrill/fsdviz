/* global mu_grids, form_errors, lake_bbox */

import { json } from "d3";

// attach blur event to each field
// return data from row on blur
// validate row - this should capture related fields

// spatial fields - check lake and state(jurisdiciton), stat district and grid with lat Longjaw

import { object, number, string } from "yup";

import { make_choices, isValidDate } from "./components/form_utils";

// // day month and year must form valid data if populated

const render_field_errors = (form_errors) => {
  console.log("form_errors:", form_errors);
  for (const [fld, err] of Object.entries(form_errors)) {
    // set the error class on the field:
    let selector = `#${fld}-field`;
    $(selector)
      .addClass("error")
      .attr("data-tooltip", err)
      .attr("data-variation", "tiny basic");
  }
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

  //return schema.cast(values);

  // values.stock_id = +values.stock_id;
  // values.year = +values.year;
  values.month = values.month === "" ? undefined : +values.month;
  values.day = values.day === "" ? undefined : +values.day;

  values.latitude = values.latitude === "" ? undefined : +values.latitude;
  values.longitude = values.longitude === "" ? undefined : +values.longitude;
  // values.grid = +values.grid;
  // values.no_stocked = +values.no_stocked;
  // values.year_class = +values.year_class;
  // values.agemonth = +values.agemonth;
  // //values.tag_ret = +values.tag_ret;
  // //values.length = +values.length;
  values.weight = values.weight ? +values.weight : undefined;
  // values.condition = +values.condition;

  return values;
};

let agency_choices = [];
let lake_choices = [];
let stateprov_choices = [];
let manUnit_choices = [];
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
  // stocking methods,
  agency_choices = common["agencies"].map((x) => x.abbrev);
  lake_choices = common["lakes"].map((x) => x.abbrev);

  stateprov_choices = common["stateprov"].map((x) => x.abbrev);
  species_choices = common["species"].map((x) => x.abbrev);
  clipcode_choices = common["clipcodes"].map((x) => x.clip_code);
  // strain, grid, manUnit - need to be nested objects.
  stocking_method_choices = stocking["stockingmethods"].map((x) => x.stk_meth);
  lifestage_choices = stocking["lifestages"].map((x) => x.abbrev);

  strain_choices = make_choices(
    common.strains.map((x) => [x.strain_species.abbrev, x.strain_code])
  );
  manUnit_choices = make_choices(
    common.manUnits
      .filter((x) => x.jurisdiction.lake.abbrev === "HU")
      .map((d) => [d.jurisdiction.stateprov.name, d.label])
  );

  grid10_choices = make_choices(mu_grids);

  console.log(grid10_choices);
  console.log(manUnit_choices);
  console.log(lake_bbox);

  const [minLon, minLat, maxLon, maxLat] = lake_bbox;
  const cwt_regex = /^[0-9]{6}((,|;)[0-9]{6})*(,|;)?$/;
  const thisYear = new Date().getFullYear();

  let schema = object().shape(
    {
      // stock_id: yup
      //   .number()
      //   .nullable(true)
      //   .transform((_, val) => (val === val ? val : null)),
      // lake: string().required().oneOf(lake_choices),
      // agency: string().required(),
      state_prov: string().required().oneOf(stateprov_choices),
      // year: number().required().positive().integer().min(1950).max(2022), // min and max
      // month: string().required(), // min and max, required if day is populated
      //day: number().required().positive().integer().min(1).max(31), // min and max,

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
      // latitude: number()
      //   .nullable(true)
      //   .transform((_, val) => (val === val ? val : null))
      //   .when("longitude", {
      //     is: (longitude) =>
      //       number().negative().min(-85).max(-75).isValid(longitude),
      //     then: number.required().positive().min(40).max(50),
      //   }), // min and max (depending on lake?)
      // longitude: number()
      //   .nullable(true)
      //   .transform((_, val) => (val === val ? val : null))
      //   .when("latitude", {
      //     is: (latitude) => number().min(40).max(45).isValid(latitude),
      //     then: number.required().negative().min(-85).max(-75),
      //   }), // min and max (depending on lake?)

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

      stat_dist: string().required(),
      // .when("state_prov", (state_prov, schema) => {
      //   if (string().oneOf(stateprov_choices).required().isValid(state_prov)) {
      //     return schema.oneOf(
      //       manUnit_choices[state_prov],
      //       `not a valid stat_dist for ${state_prov}`
      //     );
      //   }

      //   return schema;
      // }),

      grid: number().required(),
      // .when(["stat_dist", "state_prov"], (stat_dist, schema) => {
      //   if (
      //     string()
      //       .oneOf(manUnit_choices[state_prov])
      //       .required()
      //       .isValid(stat_dist)
      //   ) {
      //     return schema.oneOf(
      //       grid10_choices[stat_dist],
      //       `not a valid grid for ${stat_dist}`
      //     );
      //   }

      //   return schema;
      // }),

      species: string().required(), //
      strain: string()
        .required()
        .when("species", (species, schema) => {
          if (string().oneOf(species_choices).required().isValid(species)) {
            return schema.oneOf(
              strain_choices[species],
              `not a valid strain for ${species}`
            );
          }
          return schema;
        }),

      no_stocked: number().required().positive().integer(), // min and max
      year_class: number()
        .required("Year Class is required")
        .positive("Year Class must be positive")
        .min(1950, "Year must be after 1945")
        .max(thisYear, `Year Class must be less than today (${thisYear})`),
      stage: string().required(), // one of
      agemonth: number().positive().integer(),
      // tag_no: string()
      //   .nullable(true)
      //   .transform((_, val) => (val === val ? val : null)), // regex
      tag_no: string().matches(cwt_regex, {
        excludeEmptyString: true,
        message:
          "cwts must be exactly 6 digits separated by a comma or semicolon",
      }),
      tag_ret: number()
        .nullable(true)
        .transform((value) =>
          isNaN(value) | (value === "") ? undefined : value
        )
        .positive(),
      length: number()
        .nullable(true)
        .transform((value) =>
          isNaN(value) | (value === "") ? undefined : value
        )
        .positive(),
      weight: number()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null))
        .positive(),
      condition: number().positive().integer().min(0).max(10),
      lot_code: string()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null)),
      stock_meth: string(), // one of
      notes: string()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null)),
      hatchery: string()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null)),
      agency_stock_id: string()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null)),
      finclip: string(),
      clip_efficiency: number()
        .positive()
        .nullable(true)
        .transform((value) =>
          isNaN(value) | (value === "") ? undefined : value
        ),
      physchem_mark: string()
        .nullable(true)
        .transform((_, val) => (val === val ? val : null)),
      tag_type: string()
        .nullable(true)
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

  $("#upload-form :input").blur(function (e) {
    const form_id_regex = /id_form-[0-9]+/;
    const row_prefix = e.target.id.match(form_id_regex)[0];
    validate_row(row_prefix);
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
