class BarChart2 {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
        }
        this.data = _data;
        this.InitVis();
    }

    InitVis() {
        const vis = this;

        vis.margin = {top: 20, right: 20, bottom: 30, left: 40};
        vis.width = 500 - vis.margin.left - vis.margin.right;
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

        // vis.data.sort((a, b) => a.key - b.key);

        // append the svg object to the body of the page
        vis.svg = d3.select(vis.config.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // vis.data.forEach(function(d) {
        //     d.date_time = d3.timeParse("%m/%d/%Y %H:%M")(d.date_time);
        // });

        vis.data = d3.rollup(vis.data,
            v => v.length,
            d => d.date_time.getMonth()
        );

        vis.data = Array.from(vis.data, ([key, value]) => ({ key, value }));

        vis.data.sort((a, b) => a.key - b.key);


        // X axis
        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .domain(vis.data.map(function(d) { return d.key; })) // Use hours as domain
            .padding(0.2);
        vis.svg.append("g")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(vis.x))
            .selectAll("text")
            .style("text-anchor", "end");

        // Add Y axis
        vis.y = d3.scaleLinear()
            .domain([0, d3.max(vis.data, function(d) { return d.value; })])
            .range([vis.height, 0]);
        vis.svg.append("g")
            .call(d3.axisLeft(vis.y));


        // Bars
        vis.svg.selectAll("rect")
            .data(vis.data)
            .enter()
            .append("rect")
            .attr("x", function(d) { return vis.x(d.key); }) // Position bars based on hour
            .attr("width", vis.x.bandwidth())
            .attr("y", function(d) { return vis.y(d.value); })
            .attr("height", function(d) { return vis.height - vis.y(d.value); })
            .attr("fill", "#69b3a2");
    }
}
