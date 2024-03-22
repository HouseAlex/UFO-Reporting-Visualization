let sightings

d3.csv('data/ufo_sightings.csv')
.then(data => {
    console.log(data)
    sightings = data;
})
.catch(error => console.error(error));