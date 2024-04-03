let map, ufoShape, timeline, colorBySelector, mapSelector, sightingsOriginal

let colorByOptions = ['Default', 'Year', 'Month', 'Time of Day', 'UFO Shape']
let sightings = [];

const dispatcher = d3.dispatch('filterFromTimeLine', 'filterFromUFOShapePie', 'filterFromBar', 'filterFromBar2', 'filterFromHistogram', 'reset');

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
        d.dateOccurred = new Date(d.date_time);
        d.time = split[1];
        d.month = parseInt(dateSplit[0]);
        d.year = year;
        d.timeOfDay = CalculateTimeOfDay(hour);
        d.hourOfDay = hour;

        sightings.push(d);
    }
    sightings.sort((a,b) => new Date(a.date_time) - new Date(b.date_time))

    // Clone Data for filtering purposes.
    sightingsOriginal = [...sightings];
    console.log("sightings", sightings)

    map = new LeafletMap({
        parentElement: 'map'
    }, sightings);
    map.UpdateVis();

    histogram = new Histogram({
        parentElement: '#histogram',
        parameter: 'encounter_length'
    }, dispatcher, sightings);
    histogram.UpdateVis();

    /*histogram2 = new Histogram({
        parentElement: '#histogram2',
        parameter: 'encounter_length'
    }, dispatcher, sightings);
    histogram2.UpdateVis();*/

    barchart = new BarChart({
        parentElement: '#barchart',
    }, dispatcher, sightings);

    barchart2 = new BarChart2({
        parentElement: '#barchart2',
    }, dispatcher, sightings);
    // barchart.UpdateVis();

    map.UpdateVis();

    timeline = new LineGraph({
        parentElement: '#timeline',
    }, dispatcher, sightings);
    timeline.UpdateVis();

    ufoShape = new PieChart({
        parentElement: '#ufoShape',
        parameter: 'ufo_shape',
        title: 'UFO Shape'
    }, dispatcher, sightings);
    ufoShape.UpdateVis();

    // Listener for dropdown changes
    d3.select('#colorBySelector')
        .on('change', function() {
            map.ChangeColorOption(this.value);
        })

    pieChartReset.on("click", d => ufoShape.ResetArcColors(true))
})
.catch(error => console.error(error));

dispatcher.on('filterFromTimeLine', (monthsSelected) => {
    console.log(monthsSelected);
    const filteredData = timeline.data.filter(d => monthsSelected[0] < d.dateOccurred && d.dateOccurred < monthsSelected[1]);

    console.log(filteredData);

    // Update Leaflet Map
    map.data = filteredData;
    map.UpdateVis();

    // Update UFO Shape Chart
    ufoShape.data = filteredData;
    ufoShape.UpdateVis();

    // Update histogram
    histogram.data = filteredData;
    histogram.UpdateVis();
})

dispatcher.on('filterFromUFOShapePie', (shapes) => {
    //console.log(shapes);
    //console.log(ufoShape.data)
    const filteredData = ufoShape.data.filter(d => shapes.includes(d.ufo_shape));

    //console.log(filteredData);

    // Update Leaflet Map
    map.data = filteredData;
    map.UpdateVis();

    // Update Timeline
    timeline.data = filteredData;
    timeline.UpdateVis();

    // Update histogram
    histogram.data = filteredData;
    histogram.UpdateVis();
})

dispatcher.on('filterFromBar2', (monthsSelected) => {
    let cleaned_data = []
    // console.log('Sightings 2', sightings);
    // Break apart date time
    // console.log(monthsSelected);
    const filteredData = filterDataByMonth(sightings, monthsSelected);

    // console.log(filteredData);

    // Update Leaflet Map
    map.data = filteredData;
    map.UpdateVis();
})

dispatcher.on('filterFromHistogram', (selectedRange) => {
    // Filter the sightings based on the selected range of encounter lengths
    const filteredData = sightings.filter(d => {
        const encounterLength = +d.encounter_length; // Make sure to convert to the correct type if necessary
        return encounterLength >= selectedRange[0] && encounterLength <= selectedRange[1];
    });

    ufoShape.data = filteredData;
    ufoShape.UpdateVis();

    histogram.data = filteredData;
    histogram.UpdateVis();

    // Update Leaflet Map with filtered data
    map.data = filteredData;
    map.UpdateVis();
});

dispatcher.on('reset', (elementName) => {
    console.log(elementName)
    ResetVisualizations(elementName);
})

dispatcher.on('filterFromBar', (hoursSelected) => {
    let cleaned_data = []
    // console.log('Sightings 2', sightings);
    // Break apart date time
    // console.log(monthsSelected);
    const filteredData = filterDataByHour(sightings, hoursSelected);

    // console.log(filteredData);

    // Update Leaflet Map
    map.data = filteredData;
    map.UpdateVis();
})

dispatcher.on('reset', (elementName) => {
    console.log(elementName)
    ResetVisualizations(elementName);
})

function filterDataByHour(data, hourNumbers) {
    // console.log("Hours", hourNumbers);
    if (!Array.isArray(hourNumbers)) {
        console.error('Month numbers must be provided as an array.');
        return [];
    }

    // console.log("Pre-format", monthNumbers);
    // Convert month numbers to strings with leading zeros for comparison
    // const formattedHourNumbers = hourNumbers.map(hour => hour.toString().padStart(2, '0'));
    // console.log("Month nums", formattedMonthNumbers);

    // Filter data based on the month numbers
    // console.log(data)
    const filteredData = data.filter(d => {

        const hour = d.date_time.getHours();
        // console.log('month', month)
        // Check if the month matches any of the selected month numbers
        // console.log(monthNumbers.includes(month));
        // console.log("month 2", formattedMonthNumbers);
        return hourNumbers.includes(hour);
    });
    // console.log('filteredData', filteredData)
    return filteredData;
}


function filterDataByMonth(data, monthNumbers) {
    // console.log(monthNumbers);
    if (!Array.isArray(monthNumbers)) {
        console.error('Month numbers must be provided as an array.');
        return [];
    }

    // console.log("Pre-format", monthNumbers);
    // Convert month numbers to strings with leading zeros for comparison
    // console.log("Month nums", formattedMonthNumbers);

    // Filter data based on the month numbers
    // console.log(data)
    const filteredData = data.filter(d => {

        const month = d.date_time.getMonth() + 1;
        // console.log('month', month)
        // Check if the month matches any of the selected month numbers
        // console.log(monthNumbers.includes(month));
        // console.log("month 2", formattedMonthNumbers);
        return monthNumbers.includes(month);
    });
    // console.log('filteredData', filteredData)
    return filteredData;
}

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
    else if (hour >= 18 && hour <= 24) {
        return 'Evening';
    }
    else return 'Error';
}

function ResetVisualizations(elementName) {
    console.log('resetting!')
    // Reset Leaflet Map
    if (elementName != '#map'){
        map.data = sightingsOriginal;
        map.UpdateVis();
    }

    // Reset Timeline
    if (elementName != '#timeline') {
        timeline.data = sightingsOriginal;
        timeline.UpdateVis();
    }

    // Reset UFO Shape Pie Chart
    if (elementName != '#ufoShape'){
        ufoShape.data = sightingsOriginal;
        ufoShape.UpdateVis();
    }

    // Reset UFO Shape Pie Chart
    if (elementName != '#histogram'){
        histogram.data = sightingsOriginal;
        histogram.UpdateVis();

        map.data = sightingsOriginal;
        map.UpdateVis();
    }
}


