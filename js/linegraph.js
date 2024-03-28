class LineGraph {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1200,
            containerHeight: _config.containerHeight || 250,
            margin: _config.margin || {top: 40, right: 25, bottom: 40, left: 50},
            tooltipPadding: _config.tooltipPadding || 15,
            parameter: _config.parameter
        }
        this.data = _data;

        this.InitVis();
    }

    InitVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        console.log(vis.height)

        vis.xScale = d3.scaleTime()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])
            .nice();

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSizeOuter(0)
            .tickPadding(10);
    
        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(4)
            .tickSizeOuter(0)
            .tickPadding(10);
    
        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);
    
        // Append group element that will contain our actual chart (see margin convention)
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    
        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);
        
        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');
    
        // We need to make sure that the tracking area is on top of other chart elements
        vis.marks = vis.chart.append('g')

        vis.trackingArea = vis.chart.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');
    
            //(event,d) => {
    
        // Empty tooltip group (hidden by default)
        vis.tooltip = vis.chart.append('g')
            .attr('class', 'timelineTooltip')
            .style('display', 'none');
    
        vis.tooltip.append('circle')
            .attr('r', 4);
    
        vis.tooltip.append('text');
    }

    UpdateVis() {
        let vis = this;

        vis.aggData = vis.CalculateMonthTotals();
        console.log(vis.aggData)

        vis.xValue = d => d.date;
        vis.yValue = d => d.eventCount;

        vis.line = d3.line()
            .x(d => vis.xScale(vis.xValue(d)))
            .y(d => vis.yScale(vis.yValue(d)));

        console.log(d3.extent(vis.aggData, d => d.date))

        // Set the scale input domains
        vis.xScale.domain(d3.extent(vis.aggData, vis.xValue));
        vis.yScale.domain(d3.extent(vis.aggData, vis.yValue));

        vis.bisectDate = d3.bisector(vis.xValue).left;

        vis.RenderVis();
    }

    RenderVis() {
        let vis = this;

        // Add line path
        vis.marks.selectAll('.chart-line')
            .data([vis.aggData])
            .join('path')
            .attr('class', 'chart-line')
            .attr('d', vis.line);

        vis.trackingArea
            .on('mouseenter', () => {
                vis.tooltip.style('display', 'block');
            })
            .on('mouseleave', () => {
                vis.tooltip.style('display', 'none');
            })
            .on('mousemove', function(event) {
                // Get date that corresponds to current mouse x-coordinate
                const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
                const date = vis.xScale.invert(xPos);

                // Find nearest data point
                const index = vis.bisectDate(vis.aggData, date, 1);
                const a = vis.aggData[index - 1];
                const b = vis.aggData[index];
                const d = b && (date - a.date > b.date - date) ? b : a; 

                // Update tooltip
                vis.tooltip.select('circle')
                    .attr('transform', `translate(${vis.xScale(d.date)},${vis.yScale(d.eventCount)})`);
                
                vis.tooltip.select('text')
                    .attr('transform', `translate(${vis.xScale(d.date)},${(vis.yScale(d.eventCount) - 15)})`)
                    .text(Math.round(d.eventCount));
            });

        // Update the axes
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }

    CalculateMonthTotals() {
        let totals = {};
        let yearRange = d3.extent(this.data, d => d.year);

        this.data.forEach(d => {
            let year = d.year;
            let month = d.month;

            let monthKey = year + '-' + month;

            if (!totals[monthKey]) {
                totals[monthKey] = {
                    date: new Date(year, month, 1),
                    eventCount: 0
                };
            }

            totals[monthKey].eventCount++;
        });

        for (let year = yearRange[0]; year <= yearRange[1]; year++){
            for (let month = 0; month < 12; month++) {
                let monthKey = year + '-' + month;
                if (!totals[monthKey]) {
                    totals[monthKey] = {
                        date: new Date(year, month, 1),
                        eventCount: 0
                    };
                }
            }
        }

        let totalsArray = Object.keys(totals).map(key => totals[key]);
        totalsArray.sort((a,b) => a.date - b.date)
        return totalsArray;
    }
}