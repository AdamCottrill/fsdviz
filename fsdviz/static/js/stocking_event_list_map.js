
/* global d3, mapboxgl */

// hard code for now - this is the bounding box for Lake Huron as returned by postgres
// TODO: make dynamic based on url (lake, juristiction,  region of interest etc)


pgbbox = "POLYGON((-84.8052136556106 42.9479243183533,-84.8052136556106 46.5789677934838,-79.6071771544244 46.5789677934838,-79.6071771544244 42.9479243183533,-84.8052136556106 42.9479243183533))";


// UTILITY FUNCTIONS:


const pgbbox_corners = (pgbbox) => {
    // get the coordinates of each corner from the string:
    const corners = pgbbox.slice(pgbbox.indexOf('((') + 2, pgbbox.indexOf('))')).split(',');
    // mapbox requires the south west and north east corners (first
    // and third elements) as floating points numbers:
    const sw_corner = corners[0].split(" ").map(d=> +d);
    const ne_corner = corners[2].split(" ").map(d=> +d);

    return [sw_corner, ne_corner];
}

// extract the coordinates from our point and return them in
// numerical form as a two element array [lon, lat]:

const get_coordinates = pt => {
    let coords = pt.slice(pt.indexOf('(') + 1 ,pt.indexOf(')'))
        .split(' ');
    return [parseFloat(coords[0]), parseFloat(coords[1])];
};




const update_summary_table = data => {
    // generate the html for rows of our summary table body.  for each species in data
    // we want to generate html that looks like this:
    //   <tr>
    //       <td>${ row.species }</td>
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
    // this function calculates the total number of fish stocked and
    // the number of events by species and then updates the stat panel.

    let byspecies = d3.nest()
        .key(d =>  d.species )
        .rollup(values => { return {
            total: d3.sum(values, d => +d.total_yreq_stocked ),
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

// a generalized group by function for our points. It uses d3.nest to
// calculate the total number of events and fish stocked at each
// point.  'groupby' provides a second level of grouping. it returns
// an array of obj - one for each pt-group by combination (pt-species,
// pt-lifestage ect.). Each object contains a geom label, coordinates,
// value, and stat element.

const group_pts = (data, groupby, value) => {

   let pts = d3.nest()
        .key(d =>  d.geom )
        .key( d => d[groupby] )
        .rollup(values => { return {
            total: d3.sum(values, d => +d[value] ),
            events: values.length,
        };
                          })
        .entries(data);

    let flat =[];

    pts.forEach(pt=>{
        pt.values.forEach(x=> {
            flat.push({
                geom:pt.key,
                coordinates:get_coordinates(pt.key),
                value:x.key,
                stats:x.value});
        });
    });

    //finally - sort our aggregated data from largest to smallest so
    // that smaller points plot on top of larger ones and we can click
    // or hover over them.
    flat.sort((a,b) => b.stats.total - a.stats.total);

    return flat;
}



const update_map_bounds = (pts) => {
    //get the extends of our points and make sure reset the zoom of
    //our map to ensure that no points are missed at the orginal zoom:
    const max_lon = d3.max(pts, d=>d.coordinates[0]);
    const max_lat = d3.max(pts, d=>d.coordinates[1]);
    const min_lon = d3.min(pts, d=>d.coordinates[0]);
    const min_lat = d3.min(pts, d=>d.coordinates[1]);

    let sw_corner = mapBounds[0];
    let ne_corner = mapBounds[1];

    sw_corner[0]  = sw_corner[0] > min_lon ? min_lon : sw_corner[0];
    sw_corner[1]  = sw_corner[1] > min_lat ? min_lat : sw_corner[1];

    ne_corner[0]  = ne_corner[0] < max_lon ? max_lon : ne_corner[0];
    ne_corner[1]  = ne_corner[1] < max_lat ? max_lat : ne_corner[1];

    map.fitBounds([sw_corner, ne_corner]);

};



/// ACTUAL CODE


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

let selected_event;

// by convention - our api urls will be the same as our view urls
// except they will include the api and version number


let api_url = window.location.href
    .replace(window.location.host, window.location.host + '/api/v1')
    // this is uglyl, but works for now:
    .replace('/events/', '/events/mapdata/');


d3.json(api_url).then((data) => {

    update_stats_panel(data);

    // now aggregate by point and species - how many events, now many fish.
    let pts = group_pts(data, 'species', 'total_yreq_stocked');

    update_map_bounds(pts);

    let overlay =  mapbox_overlay();
    svg.data([pts]).call(overlay);

   // re-render our visualization whenever the view changes
   map.on("viewreset", function() {
       svg.call(overlay);
   });
    map.on("move", function() {
       svg.call(overlay);
   });

});
