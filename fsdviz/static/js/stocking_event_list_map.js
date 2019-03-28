
/* global d3, mapboxgl */


mapboxgl.accessToken = "pk.eyJ1IjoiYWNvdHRyaWxsIiwiYSI6ImNpazVmb3Q2eDAwMWZpZm0yZTQ1cjF3NTkifQ.Pb1wCYs0lKgjnTGz43DjVQ";

//Setup mapbox-gl map
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-81.857221, 45.194331],
    zoom: 7,

});

map.addControl(new mapboxgl.NavigationControl());


//Setup our svg layer that we can manipulate with d3
let  container = map.getCanvasContainer();
let  svg = d3.select(container).append("svg");


// we calculate the scale given mapbox state (derived from viewport-mercator-project's code)
// to define a d3 projection
const getD3 = (mapid) => {
    let mapElement = document.getElementById(mapid);
    var bbox = mapElement.getBoundingClientRect();

    var center = map.getCenter();
    var zoom = map.getZoom();
    // 512 is hardcoded tile size, might need to be 256 or changed to suit your map config
    var scale = (512) * 0.5 / Math.PI * Math.pow(2, zoom);
    var d3projection = d3.geoMercator()
        .center([center.lng, center.lat])
        .translate([bbox.width/2, bbox.height/2])
        .scale(scale);
    return d3projection;
}

// extract the coordinates from our point and return them in
// numerical form as a two element array [lon, lat]:

const get_coordinates = pt => {
    let coords = pt.slice(pt.indexOf('(') + 1 ,pt.indexOf(')'))
        .split(' ');
    return [parseFloat(coords[0]), parseFloat(coords[1])];
};

// we can project a lonlat coordinate pair using mapbox's built in projection function
// takes an array of lon-lat and returns pixel corrdinates
const mapboxProjection = (lonlat) => {
    let pt = map.project(new mapboxgl.LngLat(lonlat[0], lonlat[1]));
    return [pt.x, pt.y];
};


// calculate the original d3 projection
let  d3Projection = getD3('map');


// by convention - our api urls will be the same as our view urls
// except they will include the api and version number

let api_url = window.location.href
    .replace(window.location.host, window.location.host + '/api/v1');

d3.json(api_url).then((data) => {

    // now aggregate by point and species - how many events, now many fish.

    // this will abstracted out to a function or series of
    //functions that we can used to caluclate values using
    //different levels of aggregation, or different agregators
    //(species, strain, lifestage.)
    let pts = d3.nest()
        .key(d =>  d.geom )
    //.key(d => d.species.common_name )
        .rollup(values => { return {
            total: d3.sum(values, d => +d.yreq_stocked ),
            events: values.length,
        };
                          })
        .entries(data);

    pts.forEach(d=> d.value.coordinates=get_coordinates(d.key));


    let  dots = svg.selectAll("circle.dot")
        .data(pts);

    dots.enter().append("circle").classed("dot", true)
        .attr('cx', d => mapboxProjection(d.value.coordinates)[0])
        .attr('cy', d => mapboxProjection(d.value.coordinates)[1])
        .attr("r", 6)
        .style({
            fill: "#0082a3",
            "fill-opacity": 0.6,
            stroke: "#004d60",
            "stroke-width": 1
        });


    //debugger;

    function render() {
        d3Projection = getD3('map');
        //path.projection(d3Projection);

        //select the dots again
        let  dots = svg.selectAll("circle.dot");

        dots.attr('cx', d => mapboxProjection(d.value.coordinates)[0])
            .attr('cy', d => mapboxProjection(d.value.coordinates)[1]);

    }

    // re-render our visualization whenever the view changes
    map.on("viewreset", function() {
        render();
    });
    map.on("move", function() {
        render();
    });

    // render our initial visualization
    render();

});
