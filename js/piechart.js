class PieChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1000,
            containerHeight: _config.containerHeight || 500,
            margin: _config.margin || {top: 25, right: 20, bottom: 30, left: 50},
            tooltipPadding: _config.tooltipPadding || 15,
            parameter: _config.parameter
        }
        this.data = _data;
        this.aggData = this.CalculatePercentages(this.config.parameter, 10);

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
        vis.chart = vis.svg.append("g")
            .attr("transform", `translate(${this.width / 2},${this.height / 2})`);

        // Data calculation for 

        this.pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        this.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(this.radius);
    }

    UpdateVis() {
        let vis = this;

        vis.RenderVis();
    }

    RenderVis() {
        let vis = this;

        const arcs = vis.svg.selectAll('.arc')
            .data(vis.pie())
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
            if (tempPerc <= threshold || alonePerc < 3) {
                other.count = temp;
                other.percent = tempPerc;
            }
            else {
                item.percent = alonePerc;
                final.push(item)
            }
        })
        console.log(final)

        return final;
    }
}