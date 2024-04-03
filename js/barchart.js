class BarChart {
    constructor(_config, _dispatcher, _data) {
        this.config = {
            parentElement: _config.parentElement,
        }
        this.data = _data;
        this.dispatcher = dispatcher;
        this.InitVis();
    }

    InitVis() {
        const vis = this;

        vis.margin = {top: 20, right: 20, bottom: 30, left: 40};
        vis.width = 500 - vis.margin.left - vis.margin.right;
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

        const hours = d3.range(0, 24);

        // append the svg object to the body of the page
        vis.svg = d3.select(vis.config.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.data.forEach(function(d) {
            d.date_time = d3.timeParse("%m/%d/%Y %H:%M")(d.date_time);
        });

        vis.data = d3.rollup(vis.data,
            v => v.length,
            d => d.date_time.getHours()
            // d => d3.timeHour(d.date_time)
        );

        vis.data = Array.from(vis.data, ([key, value]) => ({ key, value }));

        vis.data.sort((a, b) => a.key - b.key);


        // X axis
        // vis.x = d3.scaleLinear()
        //     .range([0, vis.width])
        //     .nice();
        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .domain(hours.map(d => d.toString()))
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
            .attr("x", d => vis.x(d.key.toString())) // Position bars based on hour
            .attr("width", vis.x.bandwidth())
            .attr("y", d => vis.y(d.value))
            .attr("height", d => vis.height - vis.y(d.value))
            .attr("fill", "#69b3a2");

        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on('brush', function({selection}) {
                if (selection) vis.BrushMoved(selection);
              })
              .on('end', function({selection}) {
                if (!selection) vis.Brushed(null);
              });

        vis.svg.append("g")
            .attr("class", "brush")
            .call(vis.brush);
    }

    BrushMoved(selection) {
        // console.log(selection)
        let vis = this;
        const brushedData = [];
        clearTimeout(vis.brushTimer);

        vis.brushTimer = setTimeout(() => {
            if (selection) {
                // console.log("Selection", selection);
                const brushedData = vis.data.filter(d =>
                    vis.x(d.key.toString()) >= selection[0] &&
                    vis.x(d.key.toString()) + vis.x.bandwidth() <= selection[1]
                );
                // console.log("Hours", brushedData);
                vis.Brushed(brushedData);
            } else {
                vis.Brushed(null);
                }
        }, 300)
    }

    Brushed(selection) {
        let vis = this;

        // console.log("Hours", selection);

        clearTimeout(vis.brushTimer);

        vis.svg.selectAll("rect").classed("selected", function(d) {
            const isSelected = selection && selection.includes(d);
            return isSelected;
        });
    
        vis.dispatcher.call(
            "filterFromBar",
            vis.event,
            selection ? selection.map(d => d.key) : null
        );
    
        if (!selection) {
            // vis.svg.selectAll(".selected").classed("selected", false);
            vis.dispatcher.call("reset", vis.event, vis.config.parentElement);
        }
        
    }
}
