let sightings, map, pieChart, colorBySelector, mapSelector

let colorByOptions = ['Default', 'Year', 'Month', 'Time of Day', 'UFO Shape']
let mapOptions = ['Gray', 'Topological', '']

d3.csv('data/ufo_sightings.csv')
.then(data => {
    console.log(data)
    sightings = data;

    colorBySelector = d3.select('#colorBySelector')
        .selectAll('option')
        .data(colorByOptions)
        .enter().append('option')
        .attr('value', d => d)
        .text(d => d);

        mapSelector = d3.select('#mapSelector')
        .selectAll('option')
        .data(mapOptions)
        .enter().append('option')
        .attr('value', d => d)
        .text(d => d);

    const pieChartReset = d3.select('#resetpie');

    // Break apart date time
    sightings.forEach(d => {
        // Split string
        let split = d.date_time.split(' ');
        let dateSplit = split[0].split('/');
        let timeSplit = split[1].split(':');
        d.month = parseInt(dateSplit[0]);
        d.year = parseInt(dateSplit[2]);
        d.timeOfDay = CalculateTimeOfDay(parseInt(timeSplit[0]))
    });
    console.log(sightings)

    map = new LeafletMap({
        parentElement: 'map'
    }, sightings);
    map.UpdateVis();

    pieChart = new PieChart({
        parentElement: '#piechart',
        parameter: 'ufo_shape'
    }, sightings);
    pieChart.UpdateVis();

    // Listener for dropdown changes
    d3.select('#colorBySelector')
        .on('change', function() {
            map.ChangeColorOption(this.value);
        })
    
    pieChartReset.on("click", d => pieChart.ResetArcColors())
})
.catch(error => console.error(error));

function CalculateTimeOfDay(hour) {
    if (hour >= 0 && hour < 6) {
        return 'Night';
    }
    else if (hour >= 6 && hour < 12) {
        return 'Morning';
    }
    else if (hour >= 12 && hour < 18) {
        return 'Afternoon';
    }
    else if (hour >= 18 && hour < 24) {
        return 'Evening';
    }
    else return 'Error';
}