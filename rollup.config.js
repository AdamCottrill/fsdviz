import babel from "rollup-plugin-babel";
import { eslint } from "rollup-plugin-eslint";
import resolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";
import commonjs from "rollup-plugin-commonjs";
import uglify from "rollup-plugin-uglify-es";
import replace from "rollup-plugin-replace";

function onwarn(warning, warn) {
  // skip certain warnings
  if (warning.code === "CIRCULAR_DEPENDENCY") return;
  // Use default for everything else
  warn(warning);
}

const plugins = [
  resolve({
    jsnext: true,
    main: true,
    browser: true,
  }),
  json(),
  commonjs(),
  eslint({
    include: ["fsdviz/js_src/**"],
    fix: true,
    //exclude: ["src/css/**"]
  }),

  replace({
    ENV: JSON.stringify(process.env.NODE_ENV || "development"),
  }),

  process.env.NODE_ENV === "production" && uglify(),
  babel({
    exclude: "node_modules/**",
    runtimeHelpers: true,
  }),
];

export default [
  {
    input: "fsdviz/js_src/basinwidePieChartMap.js",
    onwarn: onwarn,
    output: {
      name: "MainPieChartMap",
      file: "fsdviz/static/js/mainPieChartMap.js",
      format: "iife",
      sourceMap: "inline",
      globals: {
        topojson: "topojson",
        crossfilter2: "crossfilter",
      },
    },
    plugins: plugins,
  },
  {
    input: "fsdviz/js_src/findEventsForm.js",
    onwarn: onwarn,
    output: {
      name: "FindEventsForm",
      file: "fsdviz/static/js/findEventsForm.js",
      format: "iife",
      sourceMap: "inline",
      globals: {
        crossfilter2: "crossfilter",
        d3: "d3",
      },
    },
    plugins: plugins,
  },

  {
    input: "fsdviz/js_src/filteredStockingEvents.js",
    onwarn: onwarn,
    output: {
      name: "FilteredStockingEvents",
      file: "fsdviz/static/js/filteredStockingEvents.js",
      format: "iife",
      sourceMap: "inline",
      globals: {
        crossfilter2: "crossfilter",
        d3: "d3",
        dc: "dc",
      },
    },
    plugins: plugins,
  },

  {
    input: "fsdviz/js_src/uploadEventDetail.js",
    onwarn: onwarn,
    output: {
      name: "UploadEvent",
      file: "fsdviz/static/js/upload_event_detail.js",
      format: "iife",
      sourceMap: "inline",
      globals: {
        leaflet: "leaflet",
        d3: "d3",
      },
    },
    plugins: plugins,
  },

  {
    input: "fsdviz/js_src/stockingEventForm.js",
    onwarn: onwarn,
    output: {
      name: "StockingEventForm",
      file: "fsdviz/static/js/stocking_event_form.js",
      format: "iife",
      sourceMap: "inline",
      globals: {
        leaflet: "leaflet",
      },
    },
    plugins: plugins,
  },

  {
    input: "fsdviz/js_src/spatialLookup.js",
    onwarn: onwarn,
    output: {
      name: "SpatialLookup",
      file: "fsdviz/static/js/spatial_lookup.js",
      format: "iife",
      sourceMap: "inline",
      globals: {
        leaflet: "leaflet",
        d3: "d3",
        turf: "turf",
      },
    },
    plugins: plugins,
  },
];
