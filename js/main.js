let sightings, map, pieChart

d3.csv('data/ufo_sightings.csv')
.then(data => {
    console.log(data)
    sightings = data;

    const pieChartReset = d3.select('#resetpie');

    map = new LeafletMap({
        parentElement: 'map'
    }, sightings);
    map.UpdateVis();

    pieChart = new PieChart({
        parentElement: '#piechart',
        parameter: 'ufo_shape'
    }, sightings);
    pieChart.UpdateVis();

    
    
    pieChartReset.on("click", d => pieChart.ResetArcColors())
})
.catch(error => console.error(error));