class BarChart2 {
    constructor(_config, _dispatcher, _data) {
        this.config = {
            parentElement: _config.parentElement,
            title: _config.title,
            xTitle: _config.xTitle
        }
        this.data = _data;
        this.dispatcher = _dispatcher;
        this.InitVis();
    }

    InitVis() {
        const vis = this;

        vis.margin = {top: 40, right: 20, bottom: 40, left: 40};
        vis.width = 500 - vis.margin.left - vis.margin.right;
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

        vis.months = d3.range(1, 13);

        // vis.data.sort((a, b) => a.key - b.key);

        // append the svg object to the body of the page
        vis.svg = d3.select(vis.config.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.margin.left},${vis.margin.top})`);

        // vis.data.forEach(function(d) {
        //     d.date_time = d3.timeParse("%m/%d/%Y %H:%M")(d.date_time);
        // });

        // X axis
        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.2);

        vis.xG = vis.chart.append("g")
            .attr("transform", "translate(0," + vis.height + ")")

        // Add Y axis
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
        
        vis.yG = vis.chart.append("g")

        vis.xTitle = vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('y', vis.height + 20) // Adjust Y position to move it below the X axis
            .attr('x', vis.width / 2) // Center horizontally
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text(vis.config.xTitle); // Assuming you want to dynamically set this based on the parameter

            vis.yTitle = vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 20)
            .attr('dy', '.71em')
            .text('Count');

        // Add an overall title to the histogram
        vis.overallTitle = vis.svg.append('text')
            .attr('class', 'overall-title')
            .attr('x', vis.width / 2 + vis.margin.left)
            .attr('y', vis.margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .text(vis.config.title);


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
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`)
            .call(vis.brush);

    }

    UpdateVis() {
        let vis = this;

        vis.data.forEach(function(d) {
            d.dateString = d3.timeParse("%m/%d/%Y %H:%M")(d.date_time);
        });

        // Data
        vis.dataAgg = d3.rollup(vis.data,
            v => v.length,
            d => d.month
        );

        vis.dataAgg = Array.from(vis.dataAgg, ([key, value]) => ({ key, value }));

        vis.dataAgg.sort((a, b) => a.key - b.key);

        // scale domains
        vis.x.domain(vis.months.map(d => d.toString()))
        vis.y.domain([0, d3.max(vis.dataAgg, function(d) { return d.value; })])

        vis.RenderVis();
    }

    RenderVis() {
        let vis = this;

        // Bars
        vis.bars = vis.chart.selectAll("rect")
            .data(vis.dataAgg)
            .join("rect")
            .attr("x", d => vis.x(d.key.toString())) // Position bars based on hour
            .attr("width", vis.x.bandwidth())
            .attr("y", d => vis.y(d.value))
            .attr("height", d => vis.height - vis.y(d.value))
            .attr("fill", "#69b3a2");

        vis.xG.call(d3.axisBottom(vis.x))   
            .selectAll("text")
            .style("text-anchor", "end");
        vis.yG.call(d3.axisLeft(vis.y));
    }

    BrushMoved(selection) {
        let vis = this;
        const brushedData = [];
        clearTimeout(vis.brushTimer);

        vis.brushTimer = setTimeout(() => {
            if (selection) {
                console.log("Selection", selection);
                const brushedData = vis.dataAgg.filter(d =>
                    vis.x(d.key.toString()) >= selection[0] &&
                    vis.x(d.key.toString()) + vis.x.bandwidth() <= selection[1]
                );
                // console.log("brushedData", brushedData);
                vis.Brushed(brushedData);
            } else {
                vis.Brushed(null);
                }
        }, 300);
    }

    Brushed(selection) {
        let vis = this;
        // console.log(selection);
        clearTimeout(vis.brushTimer);

        vis.svg.selectAll("rect").classed("selected", function(d) {
            const isSelected = selection && selection.includes(d);
            return isSelected;
        });
        if (selection) {
            vis.dispatcher.call(
                "filterFromBar2",
                vis.event,
                selection ? selection.map(d => d.key) : null
            );
        }
        
    
        if (!selection) {
            // vis.svg.selectAll(".selected").classed("selected", false);
            vis.dispatcher.call("reset", vis.event, vis.config.parentElement);
        }
    }
}
