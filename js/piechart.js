class PieChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1000,
            containerHeight: _config.containerHeight || 500,
            margin: _config.margin || {top: 40, right: 50, bottom: 40, left: 50},
            tooltipPadding: _config.tooltipPadding || 15,
            parameter: _config.parameter
        }
        this.data = _data;

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
        console.log(vis.aggData.map(d => d.type))

        vis.colorScale = d3.scaleSequential()
            .domain([0, vis.aggData.length - 1])
            .interpolator(d3.interpolateViridis);
        
        vis.greyScale = d3.scaleSequential()
            .domain(vis.colorScale.domain())
            .interpolator(function(t) {
                // Convert the color to grayscale using luminance
                var rgb = d3.color(sequentialColorScale(t)).rgb();
                var luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
                return d3.rgb(luminance, luminance, luminance);
            });

        vis.RenderVis();
    }

    RenderVis() {
        let vis = this;

        vis.arcs = vis.chart.selectAll('.arc')
            .data(vis.pie(vis.aggData))
            .enter().append('g')
            .attr('class', 'arc');

        vis.arcs.append("path")
            .attr("d", vis.arc)
            //.attr('fill', 'steelblue')
            .attr('fill', (d,i) => vis.colorScale(i));

        vis.arcs.on('click', (d, i, nodes) => {
            console.log("d:", d);
    console.log("i:", i);
    console.log("nodes:", nodes);
            var isSelected = d3.select(nodes[i]).classed('selected');

            console.log(isSelected);
            d3.select(nodes[i]).classed('selected', !isSelected);
            vis.UpdateArcColors();
        })

        // TODO: Text change or details on demand.
        /*
        arcs.append("text")
            .attr("transform", d => `translate(${vis.arc.centroid(d)})`)
            .attr("dy", "0.35em")
            .text(d => d.data.type);*/
    }

    UpdateArcColors() {
        let vis = this;

        vis.arcs.selectAll("path")
            .attr('fill', (d, i) => d3.select(this).classed("selected") ? vis.colorScale(i) : vis.greyScale(i));
    }

    CalculatePercentages(parameter, threshold) {
        const counts = []
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

        const total = d3.sum(counts.map(d => d.count))
        counts.sort((a,b) => a.count - b.count);

        const final = []
        const ifOther = counts.find(t => t.type == 'other');
        //console.log(ifOther)
        final.push({
            type: 'other',
            count: ifOther == null ? 0 : ifOther.count,
            percent: ifOther == null ? 0 : ifOther.count / total
        })
        
        const other = final.find(t => t.type == 'other');
        //console.log(other)
        counts.filter(d => d.type != 'other').forEach(item => {
            const temp = other.count + item.count;
            const tempPerc = (temp / total) * 100;
            const alonePerc = (item.count / total) * 100
            if (tempPerc <= threshold) {
                other.count = temp;
                other.percent = tempPerc;
            }
            else {
                item.percent = alonePerc;
                final.push(item)
            }
        })
        //console.log(final)

        return final.sort((a,b) => a.count - b.count);
    }
}