/* global , dc, location */

import $ from "jquery";

// = ==============================================
//          URL PARSING AND UPDATING

// loop over our charts and get the values of any currently
// applied filters convert the filters to an array of objects of
// the form {name: , value:} and pass that to our jQuery param
// function. Finally update the location has with our url:
// export const update_url = () => {
//   let my_filters = [];
//   let tmp = {};
//   dc.chartRegistry.list().forEach(plot => {
//     let filters = plot.filters();
//     if (filters.length) {
//       let anchor = plot.anchorName();
//       tmp[anchor] = filters;
//     }
//   });

//     Object.keys(tmp).map(k => my_filters.push({ name: k, value: tmp[k] }));

//   let url = $.param(my_filters);
//   location.hash = url;
// };

export const update_dc_url = () => {
  // update the url with the current state of our dc.js plots:
  let current = parseParams(window.location.hash);
  delete current[""];

  const dc_filters = {};
  dc.chartRegistry.list().forEach((plot) => {
    const filters = plot.filters();
    const anchor = plot.anchorName();
    if (typeof filters[0] !== "undefined") {
      if (anchor == "stackedbar-chart") {
        dc_filters[anchor] = filters[0].slice(0, 2).join(",");
      } else {
        dc_filters[anchor] = filters.join(",");
      }
    }
  });

  // update our current filters with current dc values
  current = { ...current, ...dc_filters };

  // remove any keys that are empty:
  Object.keys(current).forEach(
    (key) => current[key] == "" && delete current[key]
  );

  const url = decodeURIComponent($.param(current));
  location.hash = url;
};

export const apply_url_filters = () => {
  // get the existing url filters and apply them to the charts
  // when the page first loads.
  const url = location.hash;
  // loop over our plots and see of any othe anchor-tags appear in the url
  // if so - spit them out (for now)
  dc.chartRegistry.list().forEach((plot) => {
    const anchor = plot.anchorName();
    const val = get_url_filters(anchor, url);
    if (val) {
      const filterValues = val.split(",");
      if (anchor == "stackedbar-chart") {
        const asNumber = filterValues.map(Number);
        plot.replaceFilter(dc.filters.RangedFilter(asNumber[0], asNumber[1]));
      } else {
        plot.replaceFilter([filterValues]);
      }
    }
  });
};

// modified from https://stackoverflow.com/questions/19491336
// returns the current filter values specified in the url for the given chartAnchor.
export const get_url_filters = (chartAnchor, url) => {
  const results = new RegExp("[?&#]" + chartAnchor + "=([^&#]*)").exec(url);
  if (results == null) {
    return null;
  }
  // return decodeURI(results[1]) || 0;
  return results[1];
};

// https://stackoverflow.com/questions/1131630
// given an url string, return an object containing the key-value pairs of
// query parameters.
export const parseParams = (str) => {
  return str
    .replace("#", "")
    .replace("?", "")
    .split("&")
    .reduce(function (params, param) {
      const paramSplit = param.split("=").map(function (value) {
        return decodeURIComponent(value.replace(/\+/g, " "));
      });
      params[paramSplit[0]] = paramSplit[1];
      return params;
    }, {});
};

export const updateUrlParams = (key, value) => {
  const current = parseParams(window.location.hash);
  if (value == "" || typeof value === "undefined") {
    delete current[key];
  } else {
    current[key] = typeof value === "object" ? value.join(",") : value;
  }
  delete current[""];
  const url = decodeURIComponent($.param(current));
  window.location.hash = url;
};

export const getUrlParamValue = (param) => {
  const current = parseParams(window.location.hash);
  return current[param];
};

export const getUrlSearchValue = (param) => {
  const current = parseParams(window.location.search);
  return current[param];
};

// a helper function that will update the url based on the contents of filters
// called when the check boxes are clicked.
export const updateUrlCheckBoxParams = (filters_obj) => {
  // update the url with the current state of the filters - delete
  // entries as necessary:
  for (const [key, value] of Object.entries(filters_obj)) {
    if (value.is_filtered) {
      updateUrlParams(key, value.values.join(","));
    } else {
      updateUrlParams(key, "");
    }
  }

  // let tmp = Object.fromEntries(
  //   Object.entries(filters_obj).filter(x => x[1].is_filtered)
  // );
  // for (let key in tmp) {
  //   //filter_values[key] = tmp[key].values.join(",");
  //   updateUrlParams(key, tmp[key].values.join(","));
  //  }
};
