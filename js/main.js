let sightings

d3.csv('data/ufo_sightings.csv')
.then(data => {
    console.log(data)
    sightings = data;

    pieChart = new PieChart({
        parentElement: '#piechart',
        parameter: 'ufo_shape'
    }, sightings);
    pieChart.UpdateVis();
    
    console.log(d3.schemeCategory10)
})
.catch(error => console.error(error));