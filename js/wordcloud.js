class WordCloud {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.width = 800;
        this.height = 400;
        this.words = [];

        this.createWordCloud();
    }

    createWordCloud() {
        const container = d3.select(`#${this.containerId}`);
        container.selectAll("*").remove();

        const layout = d3.layout
            .cloud()
            .size([this.width, this.height])
            .words(this.data.map(d => ({ text: d.word, size: d.frequency })))
            .padding(5)
            .rotate(() => ~~(Math.random() * 2) * 90)
            .fontSize(d => d.size)
            .on("end", words => this.draw(words));

        layout.start();
    }

    draw(words) {
        const container = d3.select(`#${this.containerId}`);

        const tooltip = d3.select("#tooltip");

        const cloud = container.append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
            .attr("transform", `translate(${this.width / 2},${this.height / 2})`);

        cloud.selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", d => `${d.size}px`)
            .style("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
            .text(d => d.text)
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.text}</strong>: ${d.size}`);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });
    }
}

// Example data
const data = [
    { word: "hello", frequency: 30 },
    { word: "world", frequency: 20 },
    { word: "good", frequency: 15 },
    { word: "morning", frequency: 25 },
    { word: "night", frequency: 10 }
];

const wordCloud = new WordCloud("wordcloud", data);