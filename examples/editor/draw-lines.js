function drawLines(divId, lines, intervals, boundaries) {

    var xs = boundaries.xs;
    var ys = boundaries.ys;

    var marginBottomLabel = 0;

    var width = 300;
    var height = width * (ys.length / xs.length);

    var xScale = d3.scale.linear()
        .range([0, width])
        .domain([Math.min.apply(null, xs), Math.max.apply(null, xs)]);

    var yScale = d3.scale.linear()
        .range([0, height])
        .domain([Math.min.apply(null, ys), Math.max.apply(null, ys)]);

    var colours = d3.scale.linear().domain([intervals[0], intervals[intervals.length - 1]])
        .range([d3.rgb(200, 200, 200), d3.rgb(0, 0, 0)]);

    var svg = d3.select(divId)
        .append("svg")
        .attr("width", width)
        .attr("height", height + marginBottomLabel);

    svg.selectAll("path")
        .data(lines)
        .enter().append("path")
        .style("fill", function (d) {
            return colours(d.val);
        })
        .style("stroke", "black")
        .style('opacity', 1.0)
        .attr("d", function (d) {
            var p = "";
            d.coords.forEach(function (aa) {
                p += (d3.svg.line()
                        .x(function (dat) {
                            return xScale(dat[0]);
                        })
                        .y(function (dat) {
                            return yScale(dat[1]);
                        })
                        .interpolate("linear")
                )(aa) + "Z";
            });
            return p;
        })
        .on('mouseover', function () {
            d3.select(this).style('fill', d3.rgb(204, 185, 116));
        })
        .on('mouseout', function () {
            d3.select(this).style('fill', function (d1) {
                return colours(d1.val);
            })
        });

}

