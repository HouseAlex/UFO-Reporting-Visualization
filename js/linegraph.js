class LineGraph {
    constructor(_config, _dispatcher, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || '100%',
            containerHeight: _config.containerHeight || 250,
            margin: _config.margin || {top: 45, right: 25, bottom: 40, left: 50},
            tooltipPadding: _config.tooltipPadding || 15,
            parameter: _config.parameter,
            title: _config.title,
        }
        this.data = _data;
        this.dispatcher = dispatcher;

        this.InitVis();
    }

    InitVis() {
        let vis = this;

        vis.parentElement = d3.select(vis.config.parentElement);

        vis.parentWidth = parseFloat(vis.parentElement.style('width'));
        vis.parentHeight = parseFloat(vis.parentElement.style('height'));

        vis.containerWidth = vis.config.containerWidth === '100%' ? vis.parentWidth : parseFloat(vis.config.containerWidth);
        vis.containerHeight = vis.config.containerHeight === '100%' ? vis.parentHeight : parseFloat(vis.config.containerHeight);

        vis.width = vis.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        //console.log(vis.height)

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
            .attr('width', vis.containerWidth)
            .attr('height', vis.containerHeight);
    
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
        
        vis.tooltip = vis.chart.append('g')
            .attr('class', 'timelineTooltip')
            .style('display', 'none');
    
        vis.tooltip.append('circle')
            .attr('r', 4);
    
        vis.tooltip.append('text');

        vis.yTitle = vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 20)
            .attr('dy', '.71em')
            .text('Count');

        // Add an overall title to the histogram
        vis.overallTitle = vis.svg.append('text')
            .attr('class', 'overall-title')
            .attr('x', vis.width / 2)
            .attr('y', vis.config.margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .text(vis.config.title);

        //!TOOLTIPS ARE NOT TRIGGERED DUE TO BRUSHING, FIX LATER.
        /*vis.trackingArea = vis.chart.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');*/
    
            //(event,d) => {
    
        // Empty tooltip group (hidden by default)

        // Brush
        // Add brushing
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on('brush', function({selection}) {
              if (selection) vis.BrushMoved(selection);
            })
            .on('end', function({selection}) {
              if (!selection) vis.Brushed(null);
            });

        vis.brushG = vis.chart.append('g')
            .attr('class', 'brush')
            .call(vis.brush);

        vis.brushG.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .style('pointer-events', 'none');;
    
        // Call the brush behavior on the brush area
        vis.brushG.call(vis.brush);
        

        vis.brushTimer = null;
    }

    UpdateVis() {
        let vis = this;

        vis.aggData = vis.CalculateMonthTotals();
        //console.log(vis.aggData)

        vis.xValue = d => d.date;
        vis.yValue = d => d.eventCount;

        vis.line = d3.line()
            .x(d => vis.xScale(vis.xValue(d)))
            .y(d => vis.yScale(vis.yValue(d)));

        //console.log(d3.extent(vis.aggData, d => d.date))

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

        //! FIND WAY TO INCLUDE Tooltips
        /*
        vis.trackingArea
            .on('mouseenter', () => {
                vis.tooltip.style('display', 'block');
            })
            .on('mouseleave', () => {
                vis.tooltip.style('display', 'none');
            })
            .on('mousemove', function(event) {
                const margin = vis.config.margin;
                const tooltipPadding = vis.config.tooltipPadding;

                // Get date that corresponds to current mouse x-coordinate
                const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
                const date = vis.xScale.invert(xPos);

                // Find nearest data point
                const index = vis.bisectDate(vis.aggData, date, 1);
                const a = vis.aggData[index - 1];
                const b = vis.aggData[index];
                const d = b && (date - a.date > b.date - date) ? b : a; 

                const tooltipWidth = vis.tooltip.node().getBoundingClientRect().width;
                const tooltipHeight = vis.tooltip.node().getBoundingClientRect().height;
                let tooltipX = vis.xScale(d.date);
                let tooltipY = vis.yScale(d.eventCount);

                // Adjust tooltip position if it's going out of the container bounds
                if (tooltipX + tooltipWidth + tooltipPadding > vis.width) {
                    tooltipX = vis.width - tooltipWidth - tooltipPadding;
                }

                if (tooltipY - tooltipHeight - tooltipPadding < 0) {
                    tooltipY = tooltipHeight + tooltipPadding;
                }

                // Update tooltip
                vis.tooltip.select('circle')
                    .attr('transform', `translate(${vis.xScale(d.date)},${vis.yScale(d.eventCount)})`);
                
                vis.tooltip.select('text')
                    .attr('transform', `translate(${tooltipX},${tooltipY - tooltipPadding})`)
                    .text(`${vis.GetMonthName(d.date)}, ${d.date.getFullYear()}: ${d.eventCount}`);
            });*/

        // Update the axes
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }

    BrushMoved(selection) {
        let vis = this;
        clearTimeout(vis.brushTimer);

        vis.brushTimer = setTimeout(() => {
            vis.Brushed(selection);
        }, 300)
    }

    Brushed(selection) {
        let vis = this;

        clearTimeout(vis.brushTimer);
        if (selection) {
            //console.log(selection)
            const [x0, x1] = selection.map(vis.xScale.invert);
            //console.log(x0)
            
            vis.dispatcher.call('filterFromTimeLine', vis.event, [x0, x1]);
        }
        if (!selection) {
            //console.log('end')
            vis.dispatcher.call('reset', vis.event, vis.config.parentElement)
        }
        
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

    GetMonthName(date) {
        return date.toLocaleDateString('en-us', {month: 'long'})
    }
}