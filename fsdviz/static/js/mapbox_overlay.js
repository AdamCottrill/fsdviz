// a re-usabel chart component that will overlay points a map.



const mapbox_overlay = () => {

    // default values:

    let radiusAccessor = d => d.stats.total;
    let fillAccessor = d => d.value;
    let maxCircleSize = 50;
    let fillColours = d3.schemeCategory10;

    // we can project a lonlat coordinate pair using mapbox's built in projection function
    // takes an array of lon-lat and returns pixel corrdinates

    // this assimes that a map objects has been created in your
    // environment and is called 'map'!!
    const mapboxProjection = (lonlat) => {
        let pt = map.project(new mapboxgl.LngLat(lonlat[0], lonlat[1]));
        return [pt.x, pt.y];
    };


    const chart = function(selection) {
        selection.each(function(data) {

            const radiusScale = d3.scaleSqrt()
                  .range([0, maxCircleSize])
                  .domain([0, d3.max(data, radiusAccessor)]);

            // our fill categories will always be determined by the
            // unique values returned by our fill accessor:
            const fillcategories = [...new Set(data.map(x => fillAccessor(x)))];

            let fillScale = d3.scaleOrdinal(fillColours)
                .domain(fillcategories);


            let  dots = selection.selectAll("circle")
                .data(data, d => d.geom);

            dots.exit().remove();

            const dotsEnter = dots.enter().append("circle")
                  .attr('class', 'stockingEvent')
                  .attr( 'r', d => radiusScale(radiusAccessor(d)))
                  .attr( 'fill', d => fillScale(fillAccessor(d)));

            dots.merge(dotsEnter)
                .attr('cx', d => mapboxProjection(d.coordinates)[0])
                .attr('cy', d => mapboxProjection(d.coordinates)[1]);
        });
    };

    // update our data
    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        return chart;
    };

    chart.mapbox = function(value) {
        if (!arguments.length) return mapboxMap;
        mapboxMap = value;
        return chart;
    };


    chart.radiusAccessor = function(value) {
        if (!arguments.length) return radiusAccessor;
        radiusAccessor = value;
        return chart;
    };


    chart.fillAccessor = function(value) {
        if (!arguments.length) return fillAccessor;
        fillAccessor = value;
        return chart;
    };


    chart.fillColours = function(value) {
        if (!arguments.length) return fillColours;
        fillColours = value;
        return chart;
    };


    chart.maxCircleSize = function(value) {
        if (!arguments.length) return maxCircleSize;
        maxCircleSize = value;
        return chart;
    };



    return chart;


}
