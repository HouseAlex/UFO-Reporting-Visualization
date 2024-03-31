let sightings

d3.csv('data/ufo_sightings.csv')
.then(data => {
    console.log(data)
    sightings = data;

    const pieChartReset = d3.select('#resetpie');

    pieChart = new PieChart({
        parentElement: '#piechart',
        parameter: 'ufo_shape'
    }, sightings);
    pieChart.UpdateVis();

    histogram = new Histogram({
        parentElement: '#histogram',
        parameter: 'encounter_length'
    }, sightings);
    histogram.UpdateVis();

    histogram2 = new Histogram({
        parentElement: '#histogram2',
        parameter: 'encounter_length'
    }, sightings);
    histogram2.UpdateVis();

    
    pieChartReset.on("click", d => pieChart.ResetArcColors())
})
.catch(error => console.error(error));


