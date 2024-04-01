class PieChart {
    constructor(_config, _dispatcher, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 500,
            margin: _config.margin || {top: 40, right: 50, bottom: 40, left: 50},
            tooltipPadding: _config.tooltipPadding || 15,
            parameter: _config.parameter
        }
        this.data = _data;
        this.dispatcher = _dispatcher;

        this.InitVis();
    }

    InitVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.radius = d3.min([vis.width, vis.height]) / 2;
        
        //
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.width)
            .attr('height', vis.height)

        // create chart
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.width / 2},${vis.height / 2})`);

        vis.pie = d3.pie().value(d => d.percent);

        vis.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(vis.radius);
    }

    UpdateVis() {
        let vis = this;

        // Data calculation for the chart
        vis.aggData = vis.CalculatePercentages(vis.config.parameter, 10);
        //console.log(vis.aggData.map(d => d.type))
        vis.colorScale = null;
        vis.colorScale = d3.scaleSequential()
            .domain([0, vis.aggData.length - 1])
            .interpolator(d3.interpolateViridis);

        //console.log(vis.colorScale.interpolator())
        vis.greyScale = null;
        vis.greyScale = d3.scaleSequential()
            .domain(vis.colorScale.domain())
            .interpolator(function(t) {
                var color = d3.color(vis.colorScale(t)); // Get the color at the given interpolation value
                var luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
                //console.log(luminance)
                return d3.rgb(luminance, luminance, luminance); // Return grayscale color
        });

        //console.log('t')

        vis.RenderVis();
    }

    RenderVis() {
        let vis = this;

        vis.chart.selectAll('.arc path').remove();

        vis.arcs = vis.chart.selectAll('.arc')
            .data(vis.pie(vis.aggData))
            .join('g')
            .attr('class', 'arc');

        vis.arcs.append("path")
            .attr("d", vis.arc)
            //.attr('fill', 'steelblue')
            .attr('fill', (d,i) => vis.colorScale(i));
        

        vis.arcs.on('click', function(d) {
            const isSelected = d3.select(this).classed('selected');

            //console.log(isSelected);
            d3.select(this).classed('selected', !isSelected);
            vis.UpdateArcColors();
        })

        // TODO: Text change or details on demand.
        vis.arcs.on('mousemove', function(d) {
            //console.log(d.pageY)
            var arcData = d3.select(this).datum();
            //console.log(arcData)
            d3.select('#tooltip')
                .style('display', 'block')
                .style('left', (d.pageX + vis.config.tooltipPadding) + 'px')   
                .style('top', (d.pageY + vis.config.tooltipPadding) + 'px')
                .html(`
                    <div class='tooltip-title'>${arcData.data.type}</div>
                    <ul>
                        <li>Percentage: ${arcData.data.percentFormated}</li>
                        <li>Count: ${arcData.data.count}</li>
                    </ul>
                `);
        })
        .on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
        });

        vis.ResetArcColors(false);
    }
    
    UpdateArcColors() {
        let vis = this;
        //console.log("Inside UpdateArcColors");
        var oneSelected = false;
        let selectedArcs = []

        vis.arcs.each(function(d) {
            if (d3.select(this).classed('selected')) {
                oneSelected = true;
                selectedArcs.push(d.data.type)
            }
        });
        //console.log(oneSelected)
        vis.arcs.selectAll("path")
            .attr('fill', function(t, i) { 
                if (oneSelected){
                    return d3.select(this.parentNode).classed("selected") ? vis.colorScale(vis.aggData.length - t.index - 1) : vis.greyScale(vis.aggData.length -t.index - 1)
                }
                else {
                    //console.log(vis.aggData.length - t.index - 1)
                    return vis.colorScale(vis.aggData.length - t.index - 1)
                }
            });

        if (selectedArcs.includes('other')){
            selectedArcs = selectedArcs.concat(vis.typesInOther);
        }
        console.log(selectedArcs)

        if (selectedArcs.length > 0) {
            vis.dispatcher.call('filterFromUFOShapePie', vis.event, selectedArcs);
        }
        else {
            vis.dispatcher.call('reset', vis.event, vis.config.parentElement)
        }
        
    }

    ResetArcColors(resetFilter) {
        let vis = this;

        vis.arcs.each(function() {
            d3.select(this).classed('selected', false);
        })

        vis.arcs.selectAll("path")
            .attr('fill', t => vis.colorScale(vis.aggData.length - t.index - 1));

        // Reset Filtering on other vis'
        if (resetFilter) 
            vis.dispatcher.call('reset', vis.event, vis.config.parentElement)
    }

    CalculatePercentages(parameter, threshold) {
        let counts = []
        this.data.forEach((item, index) => {
            if (item[parameter] != 'NA') {
                const obj = counts.find(t =>t.type == item[parameter]);
                if (obj) {
                    obj.count += 1;
                }
                else {
                    counts.push({
                        type: item[parameter],
                        count: 1
                    })
                }
            }
        })

        let total = d3.sum(counts.map(d => d.count))
        //console.log(counts);
        counts.sort((a,b) => a.count - b.count);

        let final = []
        let ifOther = counts.find(t => t.type == 'other');
        //console.log(ifOther)
        final.push({
            type: 'other',
            count: ifOther == null ? 0 : ifOther.count,
            percent: ifOther == null ? 0 : ifOther.count / total
        })

        this.typesInOther = []
        
        const other = final.find(t => t.type == 'other');
        //console.log(other)
        counts.filter(d => d.type != 'other').forEach(item => {
            let temp = other.count + item.count;
            let tempPerc = (temp / total) * 100;
            let alonePerc = (item.count / total) * 100
            if (tempPerc <= threshold) {
                other.count = temp;
                other.percent = tempPerc;
                this.typesInOther.push(item.type)
            }
            else {
                item.percent = alonePerc;
                final.push(item)
            }
        })
        console.log(final)

        final.forEach(d => {
            d.percentFormated = this.FormatPercent(d.percent);
        })

        return final.sort((a,b) => a.count - b.count);
    }

    FormatPercent(percent) {
        let value = percent.toFixed(2);
        value = +value;
        return `${value} %`;
    }
}