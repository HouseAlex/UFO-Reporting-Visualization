let sightings

d3.csv('data/ufo_sightings.csv')
.then(data => {
    console.log(data[0])
    sightings = data[0];
})
.catch(error => console.error(error));