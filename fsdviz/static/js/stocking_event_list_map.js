
/* global d3, mapboxgl */

// hard code for now - this is the bounding box for Lake Huron as returned by postgres
// TODO: make dynamic based on url (lake, juristiction,  region of interest etc)


pgbbox = "POLYGON((-84.8052136556106 42.9479243183533,-84.8052136556106 46.5789677934838,-79.6071771544244 46.5789677934838,-79.6071771544244 42.9479243183533,-84.8052136556106 42.9479243183533))";

const pgbbox_corners = (pgbbox) => {
    // get the coordinates of each corner from the string:
    const corners = pgbbox.slice(pgbbox.indexOf('((') + 2, pgbbox.indexOf('))')).split(',');
    // mapbox requires the south west and north east corners (first
    // and third elements) as floating points numbers:
    const sw_corner = corners[0].split(" ").map(d=> +d);
    const ne_corner = corners[2].split(" ").map(d=> +d);

    return [sw_corner, ne_corner];
}


let mapBounds = pgbbox_corners(pgbbox);

mapboxgl.accessToken = "pk.eyJ1IjoiYWNvdHRyaWxsIiwiYSI6ImNpazVmb3Q2eDAwMWZpZm0yZTQ1cjF3NTkifQ.Pb1wCYs0lKgjnTGz43DjVQ";

//Setup mapbox-gl map
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    //center: [-81.857221, 45.194331],
    //zoom: 7,
    bounds: mapBounds

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



const update_map_bounds = (pts) => {
    //get the extends of our points and make sure reset the zoom of
    //our map to ensure that no points are missed at the orginal zoom:
    const max_lon = d3.max(pts, d=>d.value.coordinates[0]);
    const max_lat = d3.max(pts, d=>d.value.coordinates[1]);
    const min_lon = d3.min(pts, d=>d.value.coordinates[0]);
    const min_lat = d3.min(pts, d=>d.value.coordinates[1]);

    let sw_corner = mapBounds[0];
    let ne_corner = mapBounds[1];

    sw_corner[0]  = sw_corner[0] < min_lon ? min_lon : sw_corner[0];
    sw_corner[1]  = sw_corner[1] < min_lat ? min_lat : sw_corner[1];

    ne_corner[0]  = ne_corner[0] > max_lon ? max_lon : ne_corner[0];
    ne_corner[1]  = ne_corner[1] > max_lat ? max_lat : ne_corner[1];

    map.fitBounds([sw_corner, ne_corner]);

}



const update_summary_table = data => {
    // generate the html for rows of our summary table body.  for each species in data
    // we want to generate html that looks like this:
    //   <tr>
    //       <td>${ row.common_name.title }</td>
    //       <td>${ row.event_count }</td>
    //       <td>${ commaFormat(row.total_stocked) }</td>
    //   </tr>

    let commaFormat = d3.format(',d');
    html = "";

    data.forEach(row => {

        html += `<tr>
           <td>${ row.key }</td>
           <td>${ row.value.events }</td>
           <td>${ commaFormat(row.value.total) }</td>
       </tr>`;
    });

    d3.select("#stocked-summary-table-tbody").html(html);

}



const update_stats_panel = data =>{

    let byspecies = d3.nest()
        .key(d =>  d.species.common_name )
        .rollup(values => { return {
            total: d3.sum(values, d => +d.yreq_stocked ),
            events: values.length,
        };
                          })
        .entries(data);

    // sort out table by total number stocked:
    byspecies.sort((a,b) => b.value.total - a.value.total);

    let species_count = byspecies.length;
    let event_count = d3.sum(byspecies, d=>d.value.events);
    let total_stocked = d3.sum(byspecies, d=>d.value.total);

    let commaFormat = d3.format(',d');

    d3.selectAll("#species-count").text(commaFormat(species_count));
    d3.selectAll("#event-count").text(commaFormat(event_count));
    d3.selectAll("#total-stocked").text(commaFormat(total_stocked));

    update_summary_table(byspecies);


}



// by convention - our api urls will be the same as our view urls
// except they will include the api and version number

let api_url = window.location.href
    .replace(window.location.host, window.location.host + '/api/v1');

d3.json(api_url).then((data) => {

    update_stats_panel(data);

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

    update_map_bounds(pts);



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
