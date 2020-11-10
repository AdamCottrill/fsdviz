import {
  getUrlParamValue,
  get_url_filters,
  parseParams,
  updateUrlCheckBoxParams,
  updateUrlParams,
} from "../components/url_parsing";

describe("tests associated with getUrlParamValue", () => {
  /*
the getUrlParamValue() returns the value in the url corresponding to the passed in key.

If there is not match, it should return none.

# it should return the value without any processing - everything is a
  string exactly it appears at the end of the url.

www.example.com/ => getUrlParamValue('foo') = Null
www.example.com/#foo=1 => getUrlParamValue('foo') = "1"
www.example.com/#foo=red,blue  getUrlParamValue('foo') = 'red,blue'
www.example.com/#foo=1&baz=red => getUrlParamValue('foo') = "1"
www.example.com/#foo=1&baz=red%20cars => getUrlParamValue('baz') = "red%20cars"
www.example.com/#foo=1&baz=red%20cars => getUrlParamValue('bar') = Null

 */

  test("getUrlParamValue should parse single query", () => {
    const url = "https://www.example.com/#foo=1";
    delete window.location;
    window.location = new URL(url);

    expect(getUrlParamValue("foo")).toBe("1");
  });

  test("getUrlParamValue should parse csv query", () => {
    const url = "https://www.example.com/#foo=red,blue";
    delete window.location;
    window.location = new URL(url);

    expect(getUrlParamValue("foo")).toBe("red,blue");
  });

  test("getUrlParamValue returns value with spaces", () => {
    const url = "https://www.example.com/#foo=red%20blue";
    delete window.location;
    window.location = new URL(url);

    expect(getUrlParamValue("foo")).toBe("red blue");
  });

  test("getUrlParamValue should key from multiple keys", () => {
    const url = "https://www.example.com/#foo=red,blue&baz=10&bar=large";
    delete window.location;
    window.location = new URL(url);
    expect(getUrlParamValue("foo")).toBe("red,blue");
  });

  test("getUrlParamValue should return Null url without hash", () => {
    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);
    expect(getUrlParamValue("baz")).toBeUndefined();
  });

  test("getUrlParamValue should return Null for nonexistent key", () => {
    const url = "https://www.example.com/#foo=1";
    delete window.location;
    window.location = new URL(url);
    expect(getUrlParamValue("baz")).toBeUndefined();
  });
});

describe("tests to verify that get_url_filters works as exepected", () => {
  /*
the get_url_filters() returns the value in the url corresponding to the passed in key.

The get_url_Filters() is very similar to getURLparamvalue, except that:

1. get_url_filter must be passed the url (it does not get it
automatically from the window object), 

2. works with several different query string delimiters - # or ? and & (as there is no standard)

3. it does not try to post process or standardize the returned value in anyway.


If there is not match, it should return none.

# it should return the value without any processing - everything is a
  string exactly it appears at the end of the url.

www.example.com/ => get_url_filters('foo') = Null
www.example.com/#foo=1 => get_url_filters('foo') = "1"
www.example.com/#foo=red,blue  get_url_filters('foo') = 'red,blue'
www.example.com/#foo=1&baz=red => get_url_filters('foo') = "1"
www.example.com/#foo=1&baz=red%20cars => get_url_filters('baz') = "red%20cars"
www.example.com/#foo=1&baz=red%20cars => get_url_filters('bar') = Null

 */

  test("get_url_filters should parse single query (#)", () => {
    const url = "https://www.example.com/#foo=1";

    expect(get_url_filters("foo", url)).toBe("1");
  });

  test("get_url_filters should parse single query (?)", () => {
    const url = "https://www.example.com/?foo=1";

    expect(get_url_filters("foo", url)).toBe("1");
  });

  test("get_url_filters should parse csv query", () => {
    const url = "https://www.example.com/#foo=red,blue";
    expect(get_url_filters("foo", url)).toBe("red,blue");
  });

  test("get_url_filters returns value with spaces (#)", () => {
    const url = "https://www.example.com/#foo=red%20blue";

    expect(get_url_filters("foo", url)).toBe("red%20blue");
  });

  test("get_url_filters returns value with spaces (?)", () => {
    const url = "https://www.example.com/?foo=red%20blue";

    expect(get_url_filters("foo", url)).toBe("red%20blue");
  });

  test("get_url_filters multiple keys (#)", () => {
    const url = "https://www.example.com/#bar=large&foo=red,blue&baz=10";

    expect(get_url_filters("foo", url)).toBe("red,blue");
  });

  test("get_url_filters multiple keys (?)", () => {
    const url = "https://www.example.com/?bar=large&foo=red,blue&baz=10";

    expect(get_url_filters("foo", url)).toBe("red,blue");
  });

  test("get_url_filters should return Null url without hash", () => {
    const url = "https://www.example.com/";

    expect(get_url_filters("baz", url)).toBeNull();
  });

  test("get_url_filters should return Null for nonexistent key(#)", () => {
    const url = "https://www.example.com/#foo=1";
    expect(get_url_filters("baz", url)).toBeNull();
  });
});

describe("tests asssociated with parseParams function", () => {
  /*
the parseParams function accepts a query string and returns an object
contain key-value pairs of the query parameters in the query string.
If there are spaces in the values of the queyr string inidcated by %20
characters, they will be replaced with string in the returned object.  

comma separated values are returned as an array. 

There is no attempt to coerse numbers to numeric values. '1' says as
'1' and is not covered to an integer

""=> None
foo=1 => {foo:1}
foo=red,blue  {foo:["red","blue"]}
foo=1&baz=red => {foo:1,baz:'red'}
foo=1&baz=red%20cars => {foo:1,baz:'red cars'}

*/

  test("parseParams empty string return empty object", () => {
    let query_string = "";
    expect(parseParams(query_string)).toMatchObject({});
  });

  test("parseParams single simple parameter", () => {
    let query_string = "foo=1";
    expect(parseParams(query_string)).toMatchObject({ foo: "1" });
  });

  test("parseParams parameter array", () => {
    let query_string = "foo=red,blue";
    expect(parseParams(query_string)).toMatchObject({ foo: "red,blue" });
  });

  test("parseParams multiple simple parameters", () => {
    let query_string = "foo=1&baz=red";
    expect(parseParams(query_string)).toMatchObject({ foo: "1", baz: "red" });
  });

  test("parseParams  parameters", () => {
    let query_string = "foo=1&baz=red%20cars";
    expect(parseParams(query_string)).toMatchObject({
      foo: "1",
      baz: "red cars",
    });
  });
});

describe("tests associated with updateUrlCheckBoxParams().", () => {
  /*
updateUrlcheckboxparams() takes an object that has key-value pairs
that represent the current state of filters as indicated by the check
boxes, and updates the page urls to reflect that state.

- create new key
- replace existing key
- extent existing key
- truncate existing
- delete key (is_filtered = false)

 */

  let filters_obj = {};

  beforeEach(() => {
    filters_obj = {
      species: {
        is_filtered: true,
        values: ["RBT", "CHS"],
      },
    };

    return filters_obj;
  });

  test("updateUrlCheckBoxParams reflects current state of filter_obj", () => {
    // call updateUrlcheckboxparams() with our current filters_object,
    // the url should include the string: 'species=RBT,CHS'

    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);

    updateUrlCheckBoxParams(filters_obj);
    let expected = url + "#species=RBT,CHS";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlCheckBoxParams add new key to filter_object", () => {
    // if we add a new element to our filter object and pass it to
    // updateUrlcheckboxparams() - the url should include both
    // 'species=RBT,CHS' and 'agency=OMNRF'

    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);

    updateUrlCheckBoxParams(filters_obj);

    filters_obj["agency"] = {
      is_filtered: true,
      values: ["OMNRF"],
    };

    updateUrlCheckBoxParams(filters_obj);

    let expected = url + "#species=RBT,CHS&agency=OMNRF";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlCheckBoxParams replace key of filter_object", () => {
    // if we replace the existing key of our filter object and call updateUrlcheckboxparams,
    // the new value should be in the url, and species=RBT,CHS should not

    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);

    updateUrlCheckBoxParams(filters_obj);

    filters_obj["species"] = {
      is_filtered: true,
      values: ["LAT", "COS"],
    };

    updateUrlCheckBoxParams(filters_obj);

    let expected = url + "#species=LAT,COS";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlCheckBoxParams extend key of filter_object", () => {
    // if we add an element to the existing key of our filter object
    // and call updateUrlcheckboxparams, the new, longer value should
    // be included in the window location.
    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);

    updateUrlCheckBoxParams(filters_obj);

    filters_obj["species"] = {
      is_filtered: true,
      values: ["LAT", "COS", "RBT"],
    };

    updateUrlCheckBoxParams(filters_obj);

    let expected = url + "#species=LAT,COS,RBT";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlCheckBoxParams truncate key of filter_object", () => {
    // if we remove an element to the existing key of our filter object
    // and call updateUrlcheckboxparams, the new, shorter  value should
    // be included in the window location and the value that was removed should not.
    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);

    updateUrlCheckBoxParams(filters_obj);

    filters_obj["species"] = {
      is_filtered: true,
      values: ["RBT"],
    };

    updateUrlCheckBoxParams(filters_obj);

    let expected = url + "#species=RBT";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlCheckBoxParams not filtered key of filter_object", () => {
    // if a key is not filted, it should not appear in the url

    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);

    updateUrlCheckBoxParams(filters_obj);

    filters_obj["species"].is_filtered = false;
    updateUrlCheckBoxParams(filters_obj);

    let expected = url;
    expect(window.location.href).toEqual(expected);
  });
});

describe(" tests associated with updateUrlParams() ", () => {
  /*

the updateUrlParams takes to argurments, key and value and update the
window lcoation hash with those key-value pairs as properly encoded query parameters.

If the key does not exist, it should be created:
url is "example.com/"
updateUrlParams(foo, 'red') => "example.com/#foo=red"
updateUrlParams(foo, ['red', 'blue']) => "example.com/#foo=red,blue"

It should also update an existing query parameter:
url is "example.com/#foo=blue"
updateUrlParams(foo, 'red') => "example.com/#foo=red"

# spaces in values should be handled appropriately:
updateUrlParams(foo, 'red dots') => "example.com/#foo=red%20dots"
updateUrlParams(foo, ['red dots', 'blue diamonds']) => "example.com/#foo=red%20dots,blue%20diamonds"


#other query parameters should remain unchanged:
url is "example.com/#foo=blue&baz=large"
updateUrlParams(foo, 'red') => "example.com/#foo=red&baz=large"
updateUrlParams(foo, ['red', 'blue']) => "example.com/#foo=red,blue&baz=large"



 */

  test("updateUrlParams add new key if it does not exist", () => {
    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);

    updateUrlParams("foo", "1");
    let expected = url + "#foo=1";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlParams update exsiting key", () => {
    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);
    window.location.href = url + "#foo=1";

    updateUrlParams("foo", "red");
    let expected = url + "#foo=red";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlParams update value with spaces", () => {
    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);
    window.location.href = url + "#foo=1";

    updateUrlParams("foo", "red dots");
    let expected = url + "#foo=red%20dots";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlParams update array as csv", () => {
    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);
    window.location.href = url + "#foo=1";

    updateUrlParams("foo", ["red", "blue"]);
    let expected = url + "#foo=red,blue";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlParams update exsiting key and ignore others", () => {
    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);
    window.location.href = url + "#foo=1&baz=large";

    updateUrlParams("foo", "red");
    let expected = url + "#foo=red&baz=large";
    expect(window.location.href).toEqual(expected);
  });

  test("updateUrlParams update exsiting key with csv array and ignore others", () => {
    const url = "https://www.example.com/";
    delete window.location;
    window.location = new URL(url);
    window.location.href = url + "#foo=1&baz=large";

    updateUrlParams("foo", ["red", "blue"]);
    let expected = url + "#foo=red,blue&baz=large";
    expect(window.location.href).toEqual(expected);
  });
});
