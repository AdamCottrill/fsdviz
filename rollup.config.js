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

export default {
  input: "fsdviz/js_src/main.js",
  onwarn: onwarn,

  output: {
    name: "MainPieChartMap",
    file: "fsdviz/static/js/mainPieChartMap.js",
    format: "iife",
    sourceMap: "inline",
    globals: {
      topojson: "topojson",
      crossfilter2: "crossfilter"
    }
  },

  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    json(),
    commonjs(),
    eslint({
      include: ["fsdviz/js_src/**"]
      //exclude: ["src/css/**"]
    }),

    replace({
      ENV: JSON.stringify(process.env.NODE_ENV || "development")
    }),

    process.env.NODE_ENV === "production" && uglify(),
    babel({
      exclude: "node_modules/**"
    })
  ]
};
