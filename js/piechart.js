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

        //vis.colors = d3.scaleOrdinal()
    }

    UpdateVis() {
        let vis = this;

        // Data calculation for the chart
        vis.aggData = vis.CalculatePercentages(vis.config.parameter, 10);
        console.log(vis.aggData)

        vis.RenderVis();
    }

    RenderVis() {
        let vis = this;

        console.log(vis.pie(vis.aggData))

        const arcs = vis.chart.selectAll('.arc')
            .data(vis.pie(vis.aggData))
            .enter().append('g');

        arcs.append("path")
            .attr("d", vis.arc)
            .attr('fill', 'steelblue')
            //.attr("fill", (d, i) => vis.colors(i));

        // TODO: Text change or details on demand.
        /*
        arcs.append("text")
            .attr("transform", d => `translate(${vis.arc.centroid(d)})`)
            .attr("dy", "0.35em")
            .text(d => d.data.type);*/
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
        final.push({
            type: 'other',
            count: 0,
            percent: 0
        })
        
        const other = final.find(t => t.type == 'other');
        counts.forEach(item => {
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

        return final;
    }
}