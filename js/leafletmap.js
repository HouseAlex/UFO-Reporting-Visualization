class LeafletMap {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1200,
            containerHeight: _config.containerHeight || 500,
            margin: _config.margin || {top: 30, right: 50, bottom: 20, left: 50},
            tooltipPadding: _config.tooltipPadding || 15,
            parameter: _config.parameter
        }
        this.data = _data;

        this.InitVis();
    }

    InitVis() {
        let vis = this;

        //ESRI Base Layer
        vis.esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            id: 'esri-image',
            minZoom: 2,
            maxZoom: 17,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            ext: 'png'
        });

        //StreetMap Base Layer
        vis.streetMapLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            id: 'osm-image',
            minZoom: 2,
            maxZoom: 17,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            ext: 'png'
        })

        //Dark Layer
        vis.darkLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
            id: 'darl-image',
            maxZoom: 17,
            attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            ext: 'png'
        });

        // Topo 
        //! NOT WORKING
        /*
        var topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            minZoom: 2,
            maxZoom: 17,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
            ext: 'png'
        });*/

        vis.theMap = L.map(vis.config.parentElement, {
            center: [39.76725920290348, -65.74218213558198],
            zoom: 3,
            layers: [vis.streetMapLayer]
        });

        vis.baseMaps = {           
            "Street Map": vis.streetMapLayer,
            "Dark": vis.darkLayer,
            //"Topological": vis.topoLayer, 
            "ESRI": vis.esriLayer,
        }

        vis.layerControl = L.control.layers(vis.baseMaps).addTo(vis.theMap);

        //initialize svg for d3 to add to map
        L.svg({clickable:true}).addTo(vis.theMap)// we have to make the svg layer clickable
        vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
        vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto")
               
        //handler here for updating the map, as you zoom in and out           
        vis.theMap.on("zoomend", function(){
            vis.UpdateForZoom();
        });

        // Color Scales
        vis.yearColorScale = d3.scaleSequential()
            .interpolator(d3.interpolateGnBu)

        vis.monthColorScale = d3.scaleSequential()
            .interpolator(d3.interpolateYlOrBr);

        vis.timeOfDayColorScale = d3.scaleOrdinal()
            .range(d3.schemeSet3.slice(0,5))

        vis.colorOption = 'Default';

        // Initialize Color Scale Key
        vis.blockSize = 20;
        vis.blockKeySize = 80;
        vis.keyWidth = 1000;

        vis.legendRectHeight= 20;
        vis.legendRectWidth= 200;

        // Year color key
        vis.yearKeyContainer = d3.select("#mapScaleYear");
        vis.yearKeySvg = vis.yearKeyContainer.append('svg')
            .attr('height', 50)
            .attr('width', vis.keyWidth)

        vis.yearKeyG = vis.yearKeySvg.append('g')

        vis.yearGradient = vis.yearKeyG.append("defs")
            .append("linearGradient")
            .attr("id", "yearGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        vis.yearRect = vis.yearKeyG.append("rect")
            .attr("x", 25)
            .attr("y", 10)
            .attr("width", vis.legendRectWidth)
            .attr("height", vis.legendRectHeight);
        
        vis.yearRectMin = vis.yearKeyG.append('text')
            .attr('x', 10)
            .attr('y', 45)
        
        vis.yearRectMax = vis.yearKeyG.append('text')
            .attr('x', vis.legendRectWidth + 10)
            .attr('y', 45)

        // Month color key
        vis.monthKeyContainer = d3.select("#mapScaleMonth");
        vis.monthKeySvg = vis.monthKeyContainer.append('svg')
            .attr('height', 50)
            .attr('width', vis.keyWidth)

        vis.monthKeyG = vis.monthKeySvg.append('g')

        vis.monthGradient = vis.monthKeyG.append("defs")
            .append("linearGradient")
            .attr("id", "monthGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        vis.monthRect = vis.monthKeyG.append("rect")
            .attr("x", 25)
            .attr("y", 10)
            .attr("width", vis.legendRectWidth)
            .attr("height", vis.legendRectHeight)

        vis.monthRectMin = vis.monthKeyG.append('text')
            .attr('x', 10)
            .attr('y', 45)
        
        vis.monethRectMax = vis.monthKeyG.append('text')
            .attr('x', vis.legendRectWidth + 10)
            .attr('y', 45)
            
        // Time color key
        vis.timeKeyContainer = d3.select("#mapScaleTime")
        vis.timeKeySvg = vis.timeKeyContainer.append('svg')
            .attr('width', vis.keyWidth)

        // Ufo shape color key
        vis.shapeKeyContainer = d3.select("#mapScaleShape")
        vis.shapeKeySvg = vis.shapeKeyContainer.append('svg')
            .attr('width', vis.keyWidth);

        vis.yearKeyContainer.style('display', 'none');
        vis.monthKeyContainer.style('display', 'none');
        vis.timeKeyContainer.style('display', 'none');
        vis.shapeKeyContainer.style('display', 'none');
        
    }

    UpdateVis() {
        let vis = this;

        //console.log(vis.data)

        // Define color scale domains based on data.
        vis.yearColorScale.domain(d3.extent(vis.data, d => d.year));
        vis.monthColorScale.domain(d3.extent(vis.data, d => d.month));
        vis.timeOfDayColorScale.domain(vis.data.map(d => d.timeOfDay));
        //console.log(vis.data.map(d => d.timeOfDay).filter(vis.onlyUnique))

        vis.categoriesCombined = vis.CalculatePercentages('ufo_shape', 30)
        //console.log(vis.categoriesCombined)

        vis.ufoShapeColorScale = d3.scaleOrdinal()
            .domain(vis.categoriesCombined.map(d => d.type))
            
        vis.ufoShapeColorScale.range(d3.quantize(d3.interpolateWarm, vis.ufoShapeColorScale.domain().length))
        //console.log(vis.yearColorScale.range())
        // Setup Keys
        // Year Key
        vis.yearsDomain = vis.yearColorScale.domain();

        // Months Key
        vis.monthsDomain = vis.monthColorScale.domain();

        // Time Key
        vis.timeDomain = vis.timeOfDayColorScale.domain()
        vis.timeKeyRows = Math.ceil((vis.timeDomain.length * vis.blockKeySize + 20) / vis.keyWidth)
        vis.timeKeySvg
            .attr("height", vis.blockSize * vis.timeKeyRows + 20)
            .append("g")

        // Shape Key
        vis.shapeDomain = vis.ufoShapeColorScale.domain()
        vis.shapeKeyRows = Math.ceil((vis.shapeDomain.length * vis.blockKeySize + 20) / vis.keyWidth)
        vis.shapeKeySvg
            .attr("height", vis.blockSize * vis.shapeKeyRows + 20)
            .append("g")

        vis.RenderVis();
    }

    RenderVis() {
        let vis = this;

        //these are the city locations, displayed as a set of dots 
        vis.Dots = vis.svg.selectAll('circle')
                    .data(vis.data) 
                    .join('circle')
                        .attr("fill", d => vis.GetCurrentColor(d)) 
                        .attr("stroke", "black")
                        //Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
                        //leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
                        //Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
                        .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
                        .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y) 
                        .attr("r", 3)
                        .on('mouseover', function(event,d) { //function to add mouseover event
                            d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                                .duration('150') //how long we are transitioning between the two states (works like keyframes)
                                .attr("fill", "red") //change the fill
                                .attr('r', 4); //change radius

                            //create a tool tip
                            d3.select('#tooltip')
                                .style('display', 'block')
                                .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
                                .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                                .style('z-index', 1000000)
                                  // Format number with million and thousand separator
                                .html(`<div><div><b>${d.city_area}, ${d.state}</b></div>
                                  <ul>
                                    <li>UFO Shape: ${d.ufo_shape}</li>
                                    <li>Encounter Length: ${d.encounter_length}</li>
                                    <li>Time of Day: ${d.time}</li>
                                    <li>Description: ${d.description}</li>
                                    <li>Date Occured: ${d.date_time}
                                    <li>Date Documented: ${d.date_documented}</li>
                                  </ul>
                                </div>`);

                        })            
                        .on('mouseleave', function() { //function to add mouseover event
                            d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                            .duration('150') //how long we are transitioning between the two states (works like keyframes)
                            .attr("fill", d => vis.GetCurrentColor(d)) //change the fill
                            .attr('r', 3) //change radius

                            d3.select('#tooltip').style('display', 'none');//turn off the tooltip

                        });

        // Render color Keys
        // Year Key
        vis.yearGradientStops = vis.yearGradient.selectAll('stop')
            .data(vis.yearsDomain)
            .enter().append('stop')
            .attr("offset", (d, i) => (i / (vis.yearsDomain.length - 1)) * 100 + "%")
            .attr("stop-color", d => vis.yearColorScale(d));

        vis.yearRect.style("fill", "url(#yearGradient)");
        
        vis.yearRectMin.text(vis.yearsDomain[0])
        
        vis.yearRectMax.text(vis.yearsDomain[vis.yearsDomain.length - 1])

        // Month Key
        vis.monthGradientStops = vis.monthGradient.selectAll('stop')
            .data(vis.monthsDomain)
            .enter().append('stop')
            .attr("offset", (d, i) => (i / (vis.monthsDomain.length - 1)) * 100 + "%")
            .attr("stop-color", d => vis.monthColorScale(d));

        vis.monthRect.style("fill", "url(#monthGradient)");
        
        vis.monthRectMin.text(vis.monthsDomain[0])
        
        vis.monethRectMax.text(vis.monthsDomain[vis.monthsDomain.length - 1])

        // Time Key
        vis.timeKeySvg.selectAll('.color-block')
            .data(vis.timeDomain)
            .join('rect')
            .attr('class', 'color-block')
            .attr('x', (d, i) => (i % Math.floor(vis.keyWidth / vis.blockKeySize)) * vis.blockKeySize + 20) // Wrap to the next row if needed
            .attr('y', (d, i) => Math.floor(i / Math.floor(vis.keyWidth / vis.blockSize)) * vis.blockSize)
            .attr('width', vis.blockSize)
            .attr('height', vis.blockSize)
            .style('fill', d => vis.timeOfDayColorScale(d));

        vis.timeKeySvg.selectAll('.color-label')
            .data(vis.timeDomain)
            .join('text')
            .attr('class', 'color-label')
            .attr('x', (d, i) => (i % Math.floor(vis.keyWidth / vis.blockKeySize)) * vis.blockKeySize + vis.blockSize / 2 + 20) // Wrap to the next row if needed
            .attr('y', (d, i) => Math.floor(i / Math.floor(vis.keyWidth / vis.blockSize)) * vis.blockSize + vis.blockSize + 10)
            .attr('dy', '0.35em')
            .style('text-anchor', 'middle')
            .text(d => d);

        // Shape Key
        vis.shapeKeySvg.selectAll('.color-block')
            .data(vis.shapeDomain)
            .join('rect')
            .attr('class', 'color-block')
            .attr('x', (d, i) => (i % Math.floor(vis.keyWidth / vis.blockKeySize)) * vis.blockKeySize + 20) // Wrap to the next row if needed
            .attr('y', (d, i) => Math.floor(i / Math.floor(vis.keyWidth / vis.blockKeySize)) * vis.blockSize)
            .attr('width', vis.blockSize)
            .attr('height', vis.blockSize)
            .style('fill', d => vis.ufoShapeColorScale(d));

        vis.shapeKeySvg.selectAll('.color-label')
            .data(vis.shapeDomain)
            .join('text')
            .attr('class', 'color-label')
            .attr('x', (d, i) => (i % Math.floor(vis.keyWidth / vis.blockKeySize)) * vis.blockKeySize + vis.blockSize / 2 + 20) // Wrap to the next row if needed
            .attr('y', (d, i) => Math.floor(i / Math.floor(vis.keyWidth / vis.blockKeySize)) * vis.blockSize + vis.blockSize + 10)
            .attr('dy', '0.35em')
            .style('text-anchor', 'middle')
            .text(d => d);
    }

    UpdateForZoom() {
        let vis = this;

        //want to see how zoomed in you are? 
        // console.log(vis.map.getZoom()); //how zoomed am I
        
        //want to control the size of the radius to be a certain number of meters? 
        vis.radiusSize = 3; 

        //console.log(vis.theMap)

        // if( vis.theMap.getZoom > 15 ){
        //   metresPerPixel = 40075016.686 * Math.abs(Math.cos(map.getCenter().lat * Math.PI/180)) / Math.pow(2, map.getZoom()+8);
        //   desiredMetersForPoint = 100; //or the uncertainty measure... =) 
        //   radiusSize = desiredMetersForPoint / metresPerPixel;
        // }
        
        //console.log('update')
        //redraw based on new zoom- need to recalculate on-screen position
        vis.Dots
            .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
            .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y)
            .attr("r", vis.radiusSize) ;
    }

    ChangeColorOption(colorOption) {
        let vis = this;
        vis.colorOption = colorOption;
        vis.yearKeyContainer.style('display', 'none')
        vis.monthKeyContainer.style('display', 'none')
        vis.timeKeyContainer.style('display', 'none')
        vis.shapeKeyContainer.style('display', 'none')
        
        if (colorOption == 'Default'){
            vis.Dots.attr('fill', 'steelblue');
        }
        else if (colorOption == 'Year') {
            vis.Dots.attr('fill', d => vis.yearColorScale(d.year))
            vis.yearKeyContainer.style('display', 'block')
        }
        else if (colorOption == 'Month') {
            vis.Dots.attr('fill', d => vis.monthColorScale(d.month))
            vis.monthKeyContainer.style('display', 'block')
        }
        else if (colorOption == 'Time of Day') {
            vis.Dots.attr('fill', d => vis.timeOfDayColorScale(d.timeOfDay))
            vis.timeKeyContainer.style('display', 'block')
        }
        else if (colorOption == 'UFO Shape') {
            vis.Dots.attr('fill', d => {
                let shape = vis.typesInOther.includes(d.ufo_shape) ? 'other' : d.ufo_shape;
                return vis.ufoShapeColorScale(shape);
            })
            vis.shapeKeyContainer.style('display', 'block')
        }
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
        //console.log(final)

        return final.sort((a,b) => a.count - b.count);
    }

    GetCurrentColor(d) {
        let vis = this;
        //console.log(vis.colorOption)
        if (vis.colorOption == 'Default'){
            return 'steelblue'
        }
        else if (vis.colorOption == 'Year') {
            return vis.yearColorScale(d.year)
        }
        else if (vis.colorOption == 'Month') {
            return vis.monthColorScale(d.month)
        }
        else if (vis.colorOption == 'Time of Day') {
            return vis.timeOfDayColorScale(d.timeOfDay)
        }
        else if (vis.colorOption == 'UFO Shape') {
            let shape = vis.typesInOther.includes(d.ufo_shape) ? 'other' : d.ufo_shape;
            return vis.ufoShapeColorScale(shape)
        }
    }

    onlyUnique(value, index, array) {
        return array.indexOf(value) === index;
      }
}