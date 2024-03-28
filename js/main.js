let map, pieChart, colorBySelector, mapSelector

let colorByOptions = ['Default', 'Year', 'Month', 'Time of Day', 'UFO Shape']
let sightings = []

const parseTime = d3.timeParse("%m/%d/%Y");

d3.csv('data/ufo_sightings.csv')
.then(data => {
    //console.log(data)

    colorBySelector = d3.select('#colorBySelector')
        .selectAll('option')
        .data(colorByOptions)
        .enter().append('option')
        .attr('value', d => d)
        .text(d => d);

    const pieChartReset = d3.select('#resetpie');

    // Break apart date time
    for (let i = 0; i < data.length; i++){
        // Split string
        let d = data[i];
        let split = d.date_time.split(' ');
        let dateSplit = split[0].split('/');
        let year = parseInt(dateSplit[2]);
        if (year < 1980 || year >1999) {
            continue;
        }

        let timeSplit = split[1].split(':');
        let hour = parseInt(timeSplit[0]);
        d.dateOccurred = parseTime(split[0]);
        d.time = split[1];
        d.month = parseInt(dateSplit[0]);
        d.year = year;
        d.timeOfDay = CalculateTimeOfDay(hour);
        d.hourOfDay = hour;

        sightings.push(d);
    }
    sightings.sort((a,b) => new Date(a.date_time) - new Date(b.date_time))
    console.log(sightings)

    map = new LeafletMap({
        parentElement: 'map'
    }, sightings);
    map.UpdateVis();

    timeline = new LineGraph({
        parentElement: '#timeline',
    }, sightings);
    timeline.UpdateVis();
    
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