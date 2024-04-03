class Histogram {
    constructor(_config, _dispatcher, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || {top: 50, right: 50, bottom: 50, left: 50},
            tooltipPadding: _config.tooltipPadding || 15,
            parameter: _config.parameter,
            title: _config.title,
            xTitle: _config.xTitle,
        }

        this.data = _data;
        this.dispatcher = _dispatcher;

        this.InitVis();
    }

    InitVis() {
        let vis = this;

        //console.log(vis.data.objects.counties.geometries.map(d => d.properties.selectedAttribute))

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define SVG
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Initialize X Scale
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])
            .nice();

        // Initialize Y Scale
        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])
            .nice();

        // Create Axis
        vis.xAxis = d3.axisBottom(vis.xScale);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSizeOuter(0)
            .tickFormat(d3.format('.0f'));

        // append axis groups
        vis.xAxisGroup = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`);

        vis.yAxisGroup = vis.chart.append('g')
            .attr('class', 'axis y-axis');

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
            .attr('y', 40)
            .attr('dy', '.71em')
            .text('Count');

        // Add an overall title to the histogram
        vis.overallTitle = vis.svg.append('text')
            .attr('class', 'overall-title')
            .attr('x', vis.config.containerWidth / 2)
            .attr('y', vis.config.margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .text(vis.config.title + ' Histogram');


        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("start", () => vis.BrushStart()) // Add this line
            .on("brush", function(event) {
                vis.BrushMoved(event.selection);
            })
            .on("end", function(event) {
                vis.Brushed(event.selection);
            });

        vis.brushG = vis.svg.append('g')
            .attr('class', 'brush x-brush')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)
            .call(vis.brush);


        vis.mouseMoveTimer = null;
        vis.brushTimer = null;
    }

    UpdateVis() {
        let vis = this;

        let mappedData = vis.data.map(d => +d[vis.config.parameter]);
        //console.log(mappedData);
        // cutoff is being used here in order to stop the outliers that are too large from ruining the histogram
        let cutoff = 8000; // Define a reasonable cutoff
        mappedData = mappedData.map(d => (d > cutoff ? cutoff : d));
        console.log(mappedData);

        vis.xScale.domain(d3.extent(mappedData))
        console.log(d3.extent(mappedData));

        // Histogram Bins
        vis.bins = d3.histogram().domain(vis.xScale.domain()).thresholds(vis.xScale.ticks(20))(mappedData);

        console.log("Histogram bins:", vis.bins);

        vis.yScale.domain([0, d3.max(vis.bins.map(d => d.length))])

        vis.RenderVis();
    }

    RenderVis() {
        let vis = this;

        //console.log(vis.bins)

        const bins = vis.chart.selectAll('rect')
            .data(vis.bins)
            .join('rect')
            .attr('x', (d, i) => vis.xScale(d.x0)) // TODO Possibly add widths to bins
            //.attr('x', (d, i) => vis.xScale(d.x0) + i * (binWidth + spacing))
            .attr('y', d => vis.yScale(d.length))
            .attr('width', d => vis.xScale(d.x1) - vis.xScale(d.x0))
            .attr('height', d => vis.height - vis.yScale(d.length))
            .style('fill', 'red')

        bins.on('mouseover', (event, d) => {
            //console.log('test')
            d3.select('#tooltip')
                .style('display', 'block')
                .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                .html(`
                <div>Count: ${d.length}</div>
                <div>Bin Width: ${d3.min(d)} - ${d3.max(d)}</div>`)
        })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none')
            })

        vis.xAxisGroup.call(vis.xAxis);

        vis.yAxisGroup.call(vis.yAxis);
    }

    BrushStart() {
        let vis = this;

        // Clear the current selection, effectively resetting the brush
        // Note: This does not remove the visual brush; it's prepared for a new selection
        vis.brushG.call(vis.brush.move, null);
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

            const selectedRange = [
                vis.xScale.invert(selection[0]),
                vis.xScale.invert(selection[1])
            ];

            vis.dispatcher.call('filterFromHistogram', null, selectedRange);
        } else {

            vis.dispatcher.call('reset', null);
        }
    }
}
