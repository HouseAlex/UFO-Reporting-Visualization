class WordCloud {
    constructor(_config, _dispatcher, _data) {
        this.config = _config;
        this.dispatcher = _dispatcher;
        this.data = _data;
        this.initVis();
    }

    initVis() {

        function isColliding(rect1, rect2) {
            return !(rect1.x + rect1.width < rect2.x || 
                     rect1.x > rect2.x + rect2.width || 
                     rect1.y + rect1.height < rect2.y || 
                     rect1.y > rect2.y + rect2.height);
        }

        function adjustPosition(wordRect, existingRects) {
            let collisionDetected = false;
            let newX = wordRect.x;
            let newY = wordRect.y;
    
            // Check for collisions with existing words
            existingRects.forEach(existingRect => {
                if (isColliding(wordRect, existingRect)) {
                    collisionDetected = true;
                    // Adjust the position of the word (e.g., move it vertically)
                    newY += wordRect.height + vis.config.minFontSize;
                }
            });
    
            // If collision detected, recursively adjust position until no collision
            if (collisionDetected) {
                return adjustPosition({ x: newX, y: newY, width: wordRect.width, height: wordRect.height }, existingRects);
            } else {
                return { x: newX, y: newY };
            }
        }
    
        const vis = this;
        const stopWords = ["", "of","the","a","an","and","is", "aa", "ab", "aball", "abl", "ablat",
            "ablavan", "abo", "aboe", "aboout", "aboto", "abou", "about", "abouth", "at", "from",
            "i", "in", "it", "my", "on", "over", "saw", "then", "to", "very", "was", "with", "for",
            "like", "look", "no", "out", "r", "as", "two", "that", "up", "we", "were", "shape", "one",
            "or", "s", "be", "by", "had", "not", "off", "seen", "sight", "but", "just", "this", "three",
            "when", "w", "into", "observe", "ufo", "while", "witness", "obj", "what", "amp", "around",
            "format", "me", "across", "back", "go", "our"];

        vis.config.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.config.width = 600;
        vis.config.height = 300;
        vis.config.minFontSize = 10;
        vis.config.maxFontSize = 50;
        vis.config.textColor = "#000";
        vis.config.hoverColor = "#ff0";

        const containerWidth = vis.config.width - vis.config.margin.left - vis.config.margin.right;
        const containerHeight = vis.config.height - vis.config.margin.top - vis.config.margin.bottom;

        const maxX = containerWidth - vis.config.maxFontSize;
        const maxY = containerHeight - vis.config.maxFontSize;

        const minX = vis.config.margin.left;
        const minY = vis.config.margin.top + vis.config.minFontSize;

        const wordPositions = [];

        const new_data = this.manipulateData(vis.data, stopWords);
        // console.log("data", vis.data);
        //console.log("word count", new_data.size)
        //console.log("new_data", new_data);

        const topWords = this.getTopWords(new_data, 40);
        //console.log("topWords", topWords);


        // Set up SVG container
        vis.svg = d3.select(vis.config.parentElement)
            .append("svg")
            .attr("width", vis.config.width)
            .attr("height", vis.config.height)
            .append("g")
            .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Create scales
        vis.fontSizeScale = d3.scaleLinear()
            .domain([0, d3.max(Object.values(topWords))])
            .range([vis.config.minFontSize, vis.config.maxFontSize]);

        // Create word elements
        vis.words = vis.svg.selectAll("text")
            .data(Object.entries(topWords))
            .enter()
            .append("text")
            .text(d => d[0])
            .attr("font-size", d => vis.fontSizeScale(d[1]))
            .attr("fill", vis.config.textColor)
            .attr("x", d => Math.random() * vis.config.width)
            .attr("y", d => Math.random() * vis.config.height)

        vis.words.each(function(d, i) {
            const wordElement = d3.select(this);
            const fontSize = parseFloat(wordElement.attr("font-size"));
            const wordWidth = this.getBBox().width;
            const wordHeight = this.getBBox().height;

            // Randomly position the word within the SVG container
            let x = Math.random() * (containerWidth - wordWidth);
            let y = Math.random() * (containerHeight - wordHeight);

            const wordBBox = this.getBBox();
            let wordRect = {
                x: parseFloat(wordElement.attr("x")),
                y: parseFloat(wordElement.attr("y")),
                width: wordBBox.width,
                height: wordBBox.height
            };

            // Check for collisions with previously positioned words
            let collision = true;
            while (collision) {
                collision = false;
                // Iterate over existing word positions
                for (const position of wordPositions) {
                    const distance = Math.sqrt(Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2));
                    // Check the distance between the current position and existing positions
                    if (distance < ((fontSize + position.fontSize) * 1.25)) {
                        collision = true;
                        // Adjust the position
                        x = Math.random() * (containerWidth - wordWidth);
                        y = Math.random() * (containerHeight - wordHeight);
                        break;
                    }
                }
            }

            // Store the position and font size of the word
            wordPositions.push({ x, y, fontSize });

            // Set the position of the word element
            wordElement.attr("x", x)
                    .attr("y", y);

            // Adjust positions to ensure words remain within the SVG container boundaries
            // wordRect.x = Math.max(minX, Math.min(wordRect.x, maxX));
            // wordRect.y = Math.max(minY, Math.min(wordRect.y, maxY));

            // // Update the position of the word element
            // wordElement.attr("x", wordRect.x)
            //         .attr("y", wordRect.y);
        });

        // Define brushing
        vis.brush = d3.brush()
            .extent([[0, 0], [vis.config.width, vis.config.height]])
            .on("end", function(event) {
                const selection = event.selection;
                if (!selection) {
                    vis.dispatcher.call("reset", vis.event, vis.config.parentElement);
                    return;
                }
                const [[x0, y0], [x1, y1]] = event.selection;
                vis.words.each(function(d) {
                    const x = parseFloat(d3.select(this).attr("x"));
                    const y = parseFloat(d3.select(this).attr("y"));
                    const selected = x >= x0 && x <= x1 && y >= y0 && y <= y1;
                    d3.select(this).classed("selected", selected);
                });
                const selectedWords = vis.words.filter(".selected").data().map(d => d[0]);
                // console.log("selectedWords", selectedWords);
                vis.dispatcher.call("cloudFilter", vis.event, selectedWords);
            });

        // Append brush to SVG
        vis.svg.append("g")
            .attr("class", "brush")
            .call(vis.brush);
    }

    fixTypos(word) {
        // Common typos
        if (word == "ablong") {
            return "oblong";
        }
        if (word.startsWith("abov")) {
            return "above";
        }
        if (word == "abserv") {
            return "observe";
        }
        return word;
    }

    // Stems
    stem(word) {
        if (word.includes("light")) {
            return "light";
        }
        if (word.includes("shap")) {
            return "shape";
        }
        if (word.includes("mov")) {
            return "move";
        }
        if (word.includes("driv")) {
            return "drive";
        }
        if (word.includes("object")) {
            return "object";
        }
        if (word.includes("speed")) {
            return "speed";
        }
        if (word.includes("observ")) {
            return "observe";
        }
        if (word.includes("wing")) {
            return "wing";
        }
        if (word.includes("triang")) {
            return "triangle";
        }
        if (word.includes("slow")) {
            return "slow";
        }
        if (word.endsWith("ing")) {
            return word.slice(0, -3);
        }
        if (word.endsWith("ed")) {
            return word.slice(0, -2);
        }
        if (word.endsWith("ee")) {
            return word.slice(0, -2);
        }
        if (word.endsWith("io")) {
            return word.slice(0, -2);
        }
        if (word.endsWith("ion")) {
            return word.slice(0, -3);
        }
        if (word.endsWith("uin")) {
            return word.slice(0, -3);
        }
        if (word.endsWith("ies")) {
            return word.slice(0, -3) + 'y';
        }
        if (word == "able") {
            return "ability";
        }
        return word;
    }

    manipulateData(data, stopWords) {
        const wordFrequencyMap = {};

    // Iterate over each entry in the data
        data.forEach(entry => {
            // Extract the description and split it into words
            const descriptionWords = entry.description.split(/\s+/);
            
            // Iterate over each word in the description
            descriptionWords.forEach(word => {
                // Remove any punctuation or special characters from the word
                const cleanedWord = word.replace(/[^\w\s]/g, "").toLowerCase();

                if (/\d/.test(cleanedWord)) {
                    return;
                }

                if (stopWords.includes(cleanedWord)) {
                    return;
                }

                const stemmedWord = this.stem(cleanedWord);
                const fixedWord = this.fixTypos(stemmedWord);

                if (stopWords.includes(stemmedWord)) {
                    return;
                }

                // If the word is not in the map, add it with a frequency of 1

                // if (cleanedWord in wordFrequencyMap) {
                //     wordFrequencyMap[cleanedWord]++;
                // } else {
                //     wordFrequencyMap[cleanedWord] = 1;
                // }
                
                // Increment the frequency count for the word in the map
                if (fixedWord in wordFrequencyMap) {
                    wordFrequencyMap[fixedWord]++;
                } else {
                    wordFrequencyMap[fixedWord] = 1;
                }
            });
        });

    return wordFrequencyMap;
    }

    getTopWords(wordMap, num) {
        // Convert the word frequency map to an array of objects
        const wordEntries = Object.entries(wordMap);
    
        // Sort the entries based on the count (descending order)
        wordEntries.sort((a, b) => b[1] - a[1]);
    
        // Select the top 10 entries
        const topWords = wordEntries.slice(0, num);
    
        // Convert the selected entries back to an object
        const topWordMap = Object.fromEntries(topWords);
    
        return topWordMap;
    }
}