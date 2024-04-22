import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";

import { nodeResolve as resolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

import eslint from "@rollup/plugin-eslint";

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
    preventAssignment: true,
    ENV: JSON.stringify(process.env.NODE_ENV || "development"),
  }),

  process.env.NODE_ENV === "production" && terser(),

  babel({
    exclude: "node_modules/**",
    babelHelpers: "runtime",
    skipPreflightCheck: true,
  }),
];

export default [
  {
    input: "fsdviz/js_src/basinwidePieChartMap.js",
    onwarn: onwarn,
    watch: {
      input: "fsdviz/js_src/basinwidePieChartMap.js",
      chokidar: {
        usePolling: true,
      },
    },

    output: {
      name: "MainPieChartMap",
      file: "fsdviz/static/js/mainPieChartMap.js",
      format: "iife",
      sourcemap: "inline",
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
    watch: {
      input: "fsdviz/js_src/findEventsForm.js",
      chokidar: {
        usePolling: true,
      },
    },

    output: {
      name: "FindEventsForm",
      file: "fsdviz/static/js/findEventsForm.js",
      format: "iife",
      sourcemap: "inline",
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
    watch: {
      input: "fsdviz/js_src/filteredStockingEvents.js",
      chokidar: {
        usePolling: true,
      },
    },
    output: {
      name: "FilteredStockingEvents",
      file: "fsdviz/static/js/filteredStockingEvents.js",
      format: "iife",
      sourcemap: "inline",
      globals: {
        crossfilter2: "crossfilter",
        d3: "d3",
        dc: "dc",
      },
    },
    plugins: plugins,
  },

  {
    input: "fsdviz/js_src/filteredCwtStockingEvents.js",
    onwarn: onwarn,
    watch: {
      input: "fsdviz/js_src/filteredCwtStockingEvents.js",
      chokidar: {
        usePolling: true,
      },
    },

    output: {
      name: "FilteredCwtStockingEvents",
      file: "fsdviz/static/js/filteredCwtStockingEvents.js",
      format: "iife",
      sourcemap: "inline",
      globals: {
        crossfilter2: "crossfilter",
        d3: "d3",
      },
    },
    plugins: plugins,
  },

  {
    input: "fsdviz/js_src/uploadEventDetail.js",
    onwarn: onwarn,
    watch: {
      input: "fsdviz/js_src/uploadEventDetail.js",
      chokidar: {
        usePolling: true,
      },
    },

    output: {
      name: "UploadEvent",
      file: "fsdviz/static/js/upload_event_detail.js",
      format: "iife",
      sourcemap: "inline",
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
    watch: {
      input: "fsdviz/js_src/stockingEventForm.js",
      chokidar: {
        usePolling: true,
      },
    },

    output: {
      name: "StockingEventForm",
      file: "fsdviz/static/js/stocking_event_form.js",
      format: "iife",
      sourcemap: "inline",
      globals: {
        leaflet: "leaflet",
      },
    },
    plugins: plugins,
  },

  {
    input: "fsdviz/js_src/spatialLookup.js",
    onwarn: onwarn,
    watch: {
      input: "fsdviz/js_src/spatialLookup.js",
      chokidar: {
        usePolling: true,
      },
    },

    output: {
      name: "SpatialLookup",
      file: "fsdviz/static/js/spatial_lookup.js",
      format: "iife",
      sourcemap: "inline",
      globals: {
        leaflet: "leaflet",
        d3: "d3",
        turf: "turf",
      },
    },
    plugins: plugins,
  },

  {
    input: "fsdviz/js_src/xlsx_event_validation.js",

    onwarn: onwarn,
    watch: {
      input: "fsdviz/js_src/xlsx_event_validation.js",
      chokidar: {
        usePolling: true,
      },
    },

    output: {
      name: "xlsx_upload_validations",
      file: "fsdviz/static/js/xlsx_event_validation.js",
      format: "iife",
      sourcemap: "inline",
      // globals: {
      //     jQuery: "$",
      // },
    },
    plugins: plugins,
  },
];
