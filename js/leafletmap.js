class LeafletMap {
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

        //ESRI
        vis.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        vis.esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

        vis.streetMapUrl= 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        vis.streetMap = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';


        //this is the base map layer, where we are showing the map background
        vis.base_layer = L.tileLayer(vis.streetMapUrl, {
            id: 'esri-image',
            attribution: vis.streetMap,
            ext: 'png'
        });
  
        vis.theMap = L.map(vis.config.parentElement, {
            center: [37.020098201368114, -94.3586387727309],
            zoom: 4,
            layers: [vis.base_layer]
        });

        //initialize svg for d3 to add to map
        L.svg({clickable:true}).addTo(vis.theMap)// we have to make the svg layer clickable
        vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
        vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto")
               
        //handler here for updating the map, as you zoom in and out           
        vis.theMap.on("zoomend", function(){
            vis.UpdateForZoom();
        });

        vis.yearsMapped = vis.data.map(d => d.year)
        vis.yearColorScale = d3.scaleLinear()
            .domain(d3.extent(vis.data, d => d.year))
            .range(['#020024', '#ddffe7'])

        console.log(vis.yearColorScale.domain())

        vis.colorOption = 'Default';
  
    }

    UpdateVis() {
        let vis = this;

        vis.RenderVis();
    }

    RenderVis() {
        let vis = this;

        //these are the city locations, displayed as a set of dots 
        vis.Dots = vis.svg.selectAll('circle')
                    .data(vis.data) 
                    .join('circle')
                        .attr("fill", "steelblue") 
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
                                    <li>Description: ${d.description}</li>
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
    }

    UpdateForZoom() {
        let vis = this;

        //want to see how zoomed in you are? 
        // console.log(vis.map.getZoom()); //how zoomed am I
        
        //want to control the size of the radius to be a certain number of meters? 
        vis.radiusSize = 3; 

        console.log(vis.theMap)

        // if( vis.theMap.getZoom > 15 ){
        //   metresPerPixel = 40075016.686 * Math.abs(Math.cos(map.getCenter().lat * Math.PI/180)) / Math.pow(2, map.getZoom()+8);
        //   desiredMetersForPoint = 100; //or the uncertainty measure... =) 
        //   radiusSize = desiredMetersForPoint / metresPerPixel;
        // }
        
        console.log('update')
        //redraw based on new zoom- need to recalculate on-screen position
        vis.Dots
            .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
            .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y)
            .attr("r", vis.radiusSize) ;
    }

    ChangeColorOption(colorOption) { //TODO FIGURE OUT COLOR SCALES LATER
        let vis = this;
        vis.colorOption = colorOption;
        
        if (colorOption == 'Default'){
            vis.Dots.attr('fill', 'steelblue');
        }
        else if (colorOption == 'Year') {
            vis.Dots.attr('fill', d => vis.yearColorScale(d.year))
        }
        else if (colorOption == 'Month') {
            vis.Dots.attr('fill', d => vis.yearColorScale(d.year)) //! TEMPORARY
        }
        else if (colorOption == 'Time of Day') {
            vis.Dots.attr('fill', d => vis.yearColorScale(d.year)) //! TEMPORARY
        }
        else if (colorOption == 'UFO Shape') {
            vis.Dots.attr('fill', d => vis.yearColorScale(d.year)) //! TEMPORARY
        }
    }

    ChangeMapOption(mapOption) {
        let vis = this;
        vis.mapOption = mapOption;
    }

    GetCurrentColor(d) {
        let vis = this;

        if (vis.colorOption == 'Default'){
            return 'steelblue'
        }
        else if (vis.colorOption == 'Year') {
            return vis.yearColorScale(d.year)
        }
        else if (vis.colorOption == 'Month') {

        }
        else if (vis.colorOption == 'Time of Day') {

        }
        else if (vis.colorOption == 'UFO Shape') {

        }
    }
}