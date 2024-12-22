// Static Visualizations
new CentralVizElement("static-content-directional", "directional");
new CentralVizElement("static-content-stabilizing", "stabilizing");
new CentralVizElement("static-content-diversifying", "diversifying");

const grayGradient5Names = ["White", "Light Gray", "Gray", "Dark Gray", "Black"];
const grayGradient5Colors = ["white", "#BFBFBF", "#808080", "#404040", "black"];

// Background colors to use for each type of natural selection
const directionalColor = "#add8e6";
const stabilizingColor = "#DDA0DD";
const diversifyingColor = "#90ee90";

// Survival rates for each selection
const directionalSurvivalRates = [0.91, 0.93, 0.95, 0.97, 0.99]; // selecting for darker/black
const stabilizingSurvivalRates = [0.93, 0.97, 0.99, 0.97, 0.93];
const diversifyingSurvivalRates = [0.99, 0.97, 0.95, 0.97, 0.99];

// Selection simulation + associated buttons, labels
const shared = new NaturalSelectionViz(
  "main-content-shared-chart",
  grayGradient5Names,
  [100000, 100000, 100000, 100000, 100000],
  directionalSurvivalRates,
  grayGradient5Colors,
  directionalColor, // make sure this matches default radio button
  150,
  800,
  400,
  false
);

// Alter big selection simulator plot on radio button toggle
d3.selectAll("input[name='selection_type']")
    .on("change", function() {
      var bgColor;
      var survivalRates;
      if (this.value === "Directional Light") {
        bgColor = directionalColor;
        survivalRates = [...directionalSurvivalRates].reverse(); // reverse for light traits
      } else if (this.value === "Directional Dark") {
        bgColor = directionalColor;
        survivalRates = directionalSurvivalRates; // selects for darker traits
      } else if (this.value === "Stabilizing") {
        bgColor = stabilizingColor;
        survivalRates = stabilizingSurvivalRates;
      } else if (this.value === "Diversifying") {
        bgColor = diversifyingColor;
        survivalRates = diversifyingSurvivalRates;
      } else if (this.value === "Constant") {
        bgColor = "#f28d8d";
        survivalRates = [0.97, 0.97, 0.97, 0.97, 0.97];
      }

      shared.populationChart.setBgColor(bgColor);
      shared.populationModel.survivalRates = survivalRates;
    });

function resetSimulation(selectionPressure) {
  // Reset the progress bar and percentage display
  const progressBar = document.getElementById("progress-bar");
  const progressPercentage = document.getElementById("progress-percentage");
  progressBar.style.width = "0%";
  progressPercentage.textContent = "0%";

  // Reinitialize the visualization with the current slider value
  initializeVisualization(selectionPressure);
}

// Initializes moth viz
function initializeVisualization(selectionPressure = 5) {
  const width = 500;
  const height = 300;
  const r = 10;
  const numDots = 20;
  const numTrees = 10;
  const disappearRatio = 0.3; // 30% of gray dots will disappear
  const remainWhiteRatio = 0.1; // 10% of gray dots stay gray

  // Clear existing visualization
  const visualizationContainer = document.getElementById("visualization");
  visualizationContainer.innerHTML = ""; // Clears all child elements

  // Create SVG
  const svg = d3.create("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("background-color", "#e0e9ef");

  // Initialize random positions for dots
  const dots = d3.range(numDots).map(() => ({
    x: Math.random() * (width - 2 * r) + r,
    y: Math.random() * (height - 2 * r) + r,
    color: Math.random() > 0.8 ? "black" : "gray",
  }));

  // Initialize random positions for trees
  const trees = d3.range(numTrees).map(() => ({
    x: Math.random() * (width - 40) + 20,
    y: Math.random() * (height - 100) + 50,
    color: "#d2a679",
  }));

  // Create circles for dots
  const circles = svg
      .selectAll("circle")
      .data(dots)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", r)
      .style("fill", (d) => d.color);

  // Create rectangles for tree trunks
  const trunks = svg
      .selectAll("rect")
      .data(trees)
      .join("rect")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", 10)
      .attr("height", 50)
      .style("fill", (d) => d.color);

  // Function to move dots randomly
  function moveDots() {
    circles
        .transition()
        .duration(4500)
        .ease(d3.easeLinear)
        .attr("cx", () => Math.random() * (width ) + r)
        .attr("cy", () => Math.random() * (height ) + r)
        .on("end", (d, i) => {
          if (i === circles.size() - 1) { // only fire next movement once (on last)
            moveDots();
          }          
        });
  }

  function animateSelection() {
    const treeDuration = 15000 - (selectionPressure - 1) * 1000;
    const progressBar = document.getElementById("progress-bar");
    const progressPercentage = document.getElementById("progress-percentage");
    const totalDuration = treeDuration;

    // Reset progress bar
    progressBar.style.width = "0%";
    progressPercentage.textContent = "0%";
 
    // Disabled buttons and slider during animation
    d3.select("#resetButtonDirectional").property("disabled", true);
    d3.select("#startButtonDirectional").property("disabled", true);
    d3.select("#selectionSlider").property("disabled", true);

    // Update the progress bar dynamically
    let startTime = Date.now();
    const updateProgressBar = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min((elapsedTime / totalDuration) * 100, 100);
      progressBar.style.width = `${progress}%`;
      progressPercentage.textContent = `${Math.round(progress)}%`;

      if (progress < 100) {
        requestAnimationFrame(updateProgressBar);
      } else {
        d3.select("#resetButtonDirectional").property("disabled", false);
      }
    };
    requestAnimationFrame(updateProgressBar);

    // Darken trees
    trunks
        .transition()
        .duration(treeDuration)
        .style("fill", "#8b4513");

    // Ensure dots continue moving during color transitions
    circles.each(function (d, i) {
      const dotSelection = d3.select(this);

      // Handle gray dot color transitions and disappearances
      if (d.color === "gray") {
        const randomChoice = Math.random();
        if (randomChoice < disappearRatio) {
          // Make dot disappear
          dotSelection
              .transition("disappear") // Named transition for clarity
              .delay(i * 250 / selectionPressure) // Stagger based on index
              .duration(treeDuration)
              .style("opacity", 0)
              .on("end", (d2, j) => {
                if (j === dotSelection.size() - 1) { // only fire remove once (on last transition end)
                  dotSelection.remove();
                }
              }); // Remove dot after fading
        } else if (randomChoice < disappearRatio + remainWhiteRatio) {
          // Leave dot gray (no color change)
          dotSelection
              .transition("remain-gray")
              .delay(i * 500 / selectionPressure) // Stagger based on index
              .duration(treeDuration)
              .style("fill", "gray");
        } else {
          // Turn dot black
          dotSelection
              .transition("turn-black")
              .delay(i * 750 / selectionPressure) // Stagger based on index
              .duration(treeDuration)
              .style("fill", "black")
              .on("end", (_, j) => {
                if (j === dotSelection.size() - 1) { // only fire once (on last end)
                  d.color = "black"; // Update data for future interactions
                }
              });
        }
      }
    });
  }

  // Append the SVG to the DOM
  visualizationContainer.appendChild(svg.node());

  // Start dot movement
  moveDots();

  // Directional Section
  document.getElementById("startButtonDirectional").onclick = () => {
    animateSelection(); // Call the directional animation function
  };

}

// Add slider interactivity
const slider = document.getElementById("selectionSlider");
const selectionValue = document.getElementById("selectionValue");

slider.addEventListener("input", () => {
  const selectionPressure = +slider.value;
  selectionValue.textContent = `Selection Pressure: ${selectionPressure}`;

  // Reset the progress bar
  const progressBar = document.getElementById("progress-bar");
  const progressPercentage = document.getElementById("progress-percentage");
  progressBar.style.width = "0%";
  progressPercentage.textContent = "0%";

  // Reinitialize the visualization with the new selection pressure
  initializeVisualization(selectionPressure);
});

document.getElementById("resetButtonDirectional").onclick = () => {
  const currentSelectionPressure = +slider.value;
  d3.select("#selectionSlider").property("disabled", false);
  d3.select("#startButtonDirectional").property("disabled", false);
  resetSimulation(currentSelectionPressure);
};

// Initialize the visualization with default selection pressure
initializeVisualization(5);

function renderStabilizingSelection() {
  // Load both datasets
  Promise.all([
    d3.csv("data/finch_beaks_1975.csv"),
    d3.csv("data/finch_beaks_2012.csv")
  ]).then(([data1975, data2012]) => {
    // Preprocess the data
    data1975.forEach(d => {
      d.year = 1975;
      d.blength = +Object.values(d)[2]; // Extract the 3rd column for 1975
      d.bdepth = +Object.values(d)[3]; // Extract the 4th column for 1975
    });

    data2012.forEach(d => {
      d.year = 2012;
      d.blength = +Object.values(d)[2]; // Extract the 3rd column for 2012
      d.bdepth = +Object.values(d)[3]; // Extract the 4th column for 2012
    });

    // Get unique species
    const speciesSet = new Set([...data1975, ...data2012].map(d => d.species));
    const speciesList = Array.from(speciesSet);

    // Populate species selector
    const speciesSelector = d3.select("#species-selector");
    speciesSelector.selectAll("option")
        .data(speciesList)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Default selections
    const defaultSpecies = speciesList[0];
    const defaultYear = 1975;

    // Initial rendering
    updateChart(defaultSpecies, defaultYear);

    // Event listeners for interactivity
    speciesSelector.on("change", () => {
      const selectedSpecies = speciesSelector.property("value");
      const selectedYear = +d3.select("input[name='year']:checked").property("value");
      updateChart(selectedSpecies, selectedYear);
    });

    d3.selectAll("input[name='year']").on("change", () => {
      const selectedSpecies = speciesSelector.property("value");
      const selectedYear = +d3.select("input[name='year']:checked").property("value");
      updateChart(selectedSpecies, selectedYear);
    });

    // Function to update the chart dynamically
    function updateChart(selectedSpecies, selectedYear) {
      const data = selectedYear === 1975
          ? data1975.filter(d => d.species === selectedSpecies)
          : data2012.filter(d => d.species === selectedSpecies);

      const barColor = selectedYear === 1975 ? "violet" : "purple";

      // Identical binning for all of this species (for consistency)
      const speciesExtent = d3.extent(data1975.concat(data2012).filter(d => d.species === selectedSpecies), d => d.blength);
      const bins = d3.histogram()
        .domain([speciesExtent[0] - 0.5, speciesExtent[1] + 0.5])
        .thresholds(30)(data.map(d => d.blength));

      // Dimensions and margins
      const container = d3.select("#stabilizing-selection-viz");
      const width = parseInt(container.style("width")) || 600;
      const height = width * 0.66; // Maintain a 3:2 aspect ratio
      const margin = { top: 20, right: 20, bottom: 60, left: 70 };

      // Scales
      const x = d3.scaleLinear()
        .domain([bins[0].x0, bins[bins.length - 1].x1])
        .nice()
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
          .domain([0, d3.max(bins, d => d.length)])
          .nice()
          .range([height - margin.bottom, margin.top]);

      // Select or create the SVG
      let svg = container.select("svg");
      if (svg.empty()) {
        svg = container.append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "auto");

        // Axes groups
        svg.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${height - margin.bottom})`);
        svg.append("g").attr("class", "y-axis").attr("transform", `translate(${margin.left}, 0)`);

        // Axis labels
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height - 20)
            .attr("text-anchor", "middle")
            .text("Beak Length (mm)");

        svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .text("Frequency");
      }

      // Update axes
      svg.select(".x-axis")
          .transition()
          .duration(1000)
          .call(d3.axisBottom(x).ticks(10));

      svg.select(".y-axis")
          .transition()
          .duration(1000)
          .call(d3.axisLeft(y).ticks(5));

      // Bind data to bars
      const bars = svg.selectAll("rect").data(bins);

      // Enter new bars
      bars.enter()
          .append("rect")
          .merge(bars) // Merge with existing bars
          .transition()
          .duration(1000)
          .attr("x", d => x(d.x0) + 1)
          .attr("y", d => y(d.length))
          .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
          .attr("height", d => y(0) - y(d.length))
          .attr("fill", barColor);

      // Exit phase for old bars
      bars.exit()
          .transition()
          .duration(1000)
          .attr("y", y(0))
          .attr("height", 0)
          .remove();
    }
  }).catch(error => console.error("Error loading data:", error));
}


// Call the function to render the visualization
renderStabilizingSelection();
function createAshPolygons(ashGroup, hotspot, radius) {
  const ashShapes = d3.range(20).map(() => {
    const angle = Math.random() * 2 * Math.PI;
    const distance = radius + Math.random() * 30 + 20; // Ensure polygons appear beyond the hotspot radius
    const cx = hotspot.x + Math.cos(angle) * distance;
    const cy = hotspot.y + Math.sin(angle) * distance;

    // Generate scraggly polygon points
    const points = d3.range(5 + Math.random() * 5).map(() => {
      const dx = (Math.random() - 0.5) * 50;
      const dy = (Math.random() - 0.5) * 50;
      return [cx + dx, cy + dy].join(",");
    });
    return { points: points.join(" ") };
  });

  ashGroup
      .selectAll("polygon.ash")
      .data(ashShapes)
      .enter()
      .append("polygon")
      .attr("class", "ash")
      .attr("points", (d) => d.points)
      .attr("fill", "#000000") // Black ash
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);
}

function simulateMovement(selectionPressure) {
  const totalDuration = 10000 - (selectionPressure - 1) * 1000;

  const progressBar = d3.select("#diversifying-progress-bar").style("background-color", "#006400");
  const progressPercentage = d3.select("#diversifying-progress-percentage");
  let startTime = Date.now();

  function updateProgressBar() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / totalDuration) * 100, 100);
    progressBar.style("width", `${progress}%`);
    progressPercentage.text(`${Math.round(progress)}%`);
    if (progress < 100) requestAnimationFrame(updateProgressBar);
  }

  updateProgressBar();

  // Create ash polygons
  createAshPolygons(d3.select(".ash-group"), hotspot, hotspot.radius);

  randomMovement(texts, 100, 100);
}

function renderDiversifyingSelection() {
  const container = d3.select("#diversifying-visualization");

  // Clear any existing content
  container.selectAll("*").remove();

  const mouseColors = ["white", "gray", "black"];
  const mouseEmojis = {
    white: "🐁",
    gray: "🐭",
    black: "🐀",
  };
  const sandColor = "#FAF3E0"; // Sand background color
  const hotspotColor = "#FF4500"; // Hotspot color
  const ashColor = "#000000"; // Ash color
  const numMice = 50;

  // Dimensions
  const width = 800;
  const height = 400;
  const hotspot = { x: width / 2, y: height / 2, radius: 50 };

  // Create SVG
  const svg = container
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("background-color", sandColor);

  // Add hotspot
  // Function to generate polygon points
  function generatePolygonPoints(cx, cy, radius, numSides = 6) {
    const points = [];
    for (let i = 0; i < numSides; i++) {
      const angle = (2 * Math.PI * i) / numSides;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      points.push([x, y].join(","));
    }
    return points.join(" ");
  }

  // Create the polygon hotspot
  let hotspotPolygon = svg
      .append("polygon")
      .attr("points", generatePolygonPoints(hotspot.x, hotspot.y, hotspot.radius, 6)) // Default hexagon
      .attr("fill", "#FF4500");

  // Adjust polygon points dynamically based on the slider value
  d3.select("#diversifyingSelectionSlider").on("input", function () {
    const selectionPressure = +this.value;

    // Update hotspot radius based on slider value
    hotspot.radius = 50 + selectionPressure * 5;

    // Update the polygon points
    hotspotPolygon
        .transition()
        .duration(300)
        .attr("points", generatePolygonPoints(hotspot.x, hotspot.y, hotspot.radius, 6));

    // Reset the progress bar and visualization
    d3.select("#diversifying-progress-bar").style("width", "0%");
    d3.select("#diversifying-progress-percentage").text("0%");
    renderDiversifyingSelection();
  });



  // Group for ash polygons (beneath emojis)
  const ashGroup = svg.append("g").attr("class", "ash-group");

  // Generate random mice data
  const mice = d3.range(numMice).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    color: mouseColors[Math.floor(Math.random() * mouseColors.length)],
  }));

  // Group for emojis (above ash)
  const emojiGroup = svg.append("g").attr("class", "emoji-group");

  // Draw mice as emojis
  const texts = emojiGroup
      .selectAll("text")
      .data(mice)
      .enter()
      .append("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("font-size", "20px")
      .attr("text-anchor", "middle")
      .text((d) => mouseEmojis[d.color])

      // Because of emoji differences between browsers, use a Google fonts mouse emoji
      // for the white mice (otherwise gray/white can be basically identical)
      .style("font-family", (d) => d.color == 'white' ? "'Noto Color Emoji', serif" : "")

  function createAshPolygons() {
    ashGroup.selectAll("*").remove(); // Clear previous ash polygons

    const ashShapes = d3.range(20).map(() => {
      const angle = Math.random() * 2 * Math.PI;
      const distance = hotspot.radius + Math.random() * 30 + 20; // Ensure ash appears outside the hotspot
      const cx = hotspot.x + Math.cos(angle) * distance;
      const cy = hotspot.y + Math.sin(angle) * distance;

      const points = d3.range(5 + Math.random() * 5).map(() => {
        const dx = (Math.random() - 0.5) * 50;
        const dy = (Math.random() - 0.5) * 50;
        return [cx + dx, cy + dy].join(",");
      });
      return { points: points.join(" ") };
    });

    ashGroup
        .selectAll("polygon.ash")
        .data(ashShapes)
        .enter()
        .append("polygon")
        .attr("class", "ash")
        .attr("points", (d) => d.points)
        .attr("fill", ashColor)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
  }


  function randomMovement(miceSelection, rangeX, rangeY) {
    miceSelection
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("x", (d) => {
          d.x += (Math.random() - 0.5) * rangeX;
          return Math.min(Math.max(d.x, 20), width - 20); // Keep mice within bounds
        })
        .attr("y", (d) => {
          d.y += (Math.random() - 0.5) * rangeY;
          return Math.min(Math.max(d.y, 20), height - 20); // Keep mice within bounds
        })
        .on("end", (d, i) => {
          if (i === miceSelection.size() - 1) { // only fire next movement once (on last)
            randomMovement(miceSelection, rangeX, rangeY);
          }
        });
  }


  function simulateMovement(selectionPressure) {
    const totalDuration = 10000 - (selectionPressure - 1) * 1000;

    // Reset progress bar
    const progressBar = d3.select("#diversifying-progress-bar").style("background-color", "#006400");
    const progressPercentage = d3.select("#diversifying-progress-percentage");
    let startTime = Date.now();

    function updateProgressBar() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / totalDuration) * 100, 100);
      progressBar.style("width", `${progress}%`);
      progressPercentage.text(`${Math.round(progress)}%`);
      if (progress < 100) {
        requestAnimationFrame(updateProgressBar);
      } else {
        d3.select("#resetButtonDiversifying").property("disabled", false);
      }
    }

    updateProgressBar();

    // Generate new ash polygons
    createAshPolygons();

    // Animate mice movement
    randomMovement(texts, 100, 100);

    // Black mice move to the perimeter of the hotspot and stay there
    const blackMice = texts.filter((d) => d.color === "black");
    blackMice
        .transition()
        .duration(totalDuration)
        .ease(d3.easeCubicInOut)
        .attr("x", (d) => {
          const angle = Math.random() * 2 * Math.PI;
          return hotspot.x + hotspot.radius * Math.cos(angle);
        })
        .attr("y", (d) => {
          const angle = Math.random() * 2 * Math.PI;
          return hotspot.y + hotspot.radius * Math.sin(angle);
        })
        .transition()
        .delay(200)
        .on("end", (d, i) => {
          if (i === blackMice.size() - 1) { // only fire next movement once (on last)
            randomMovement(blackMice, 50, 50);
          }
        });

    // White mice move away from the hotspot and then move randomly
    const whiteMice = texts.filter((d) => d.color === "white");
    whiteMice
        .transition()
        .duration(totalDuration)
        .ease(d3.easeCubicInOut)
        .attr("x", (d) => {
          const dx = d.x - hotspot.x;
          const distanceFactor = Math.random();
          d.x = Math.min(Math.max(hotspot.x + dx * distanceFactor, 0), width);
          return d.x;
        })
        .attr("y", (d) => {
          const dy = d.y - hotspot.y;
          const distanceFactor = hotspot.radius + Math.random();
          d.y = Math.min(Math.max(hotspot.y + dy * distanceFactor, 20), height - 8);
          return d.y;
        })
        .transition()
        .delay(200)
        .on("end", (d, i) => {
          if (i === whiteMice.size() - 1) { // only fire next movement once (on last)
            randomMovement(whiteMice, 10, 10);
          }
        });

    // Gray mice fade out partially and some remain on-screen
    const grayMice = texts.filter((d) => d.color === "gray");
    grayMice.each(function (d, i) {
      if (Math.random() < 0.8) {
        d3.select(this)
            .transition()
            .delay(i * 100)
            .duration(4000)
            .style("opacity", 0)
            .remove();
      } else {
        randomMovement(d3.select(this), 80, 80);
      }
    });

    // Create ash polygons
    createAshPolygons();
  }

  // Attach slider interactivity
  const slider = d3.select("#diversifyingSelectionSlider");
  const selectionValue = d3.select("#diversifyingSelectionValue");

  slider.on("input", function () {
    const selectionPressure = +this.value;
    selectionValue.text(`Selection Pressure: ${selectionPressure}`);

    // Update polygon radius and points dynamically
    hotspot.radius = 50 + selectionPressure * 5;
    hotspotPolygon
        .transition()
        .duration(300)
        .attr("points", generatePolygonPoints(hotspot.x, hotspot.y, hotspot.radius, 6));

    // Reset progress bar and visualization
    d3.select("#diversifying-progress-bar").style("width", "0%");
    d3.select("#diversifying-progress-percentage").text("0%");
  });


  // Attach button functionality
  document.getElementById("startButtonDiversifying").onclick = () => {
    const selectionPressure = +slider.node().value;

    // Disable buttons and slider during animation
    d3.select("#startButtonDiversifying").property("disabled", true);
    d3.select("#resetButtonDiversifying").property("disabled", true);
    d3.select("#diversifyingSelectionSlider").property("disabled", true);

    simulateMovement(selectionPressure);
  };

  document.getElementById("resetButtonDiversifying").onclick = () => {
    // Reset progress bar and button/slider selectability
    d3.select("#diversifying-progress-bar").style("width", "0%");
    d3.select("#diversifying-progress-percentage").text("0%");
    d3.select("#startButtonDiversifying").property("disabled", false);
    d3.select("#diversifyingSelectionSlider").property("disabled", false);

    // Reset hotspot polygon to default size
    hotspot.radius = 50;
    hotspotPolygon
        .transition()
        .duration(300)
        .attr("points", generatePolygonPoints(hotspot.x, hotspot.y, hotspot.radius, 6));

    // Re-render the visualization
    renderDiversifyingSelection();
  };

  // Start initial random movement for all mice
  randomMovement(texts, 100, 100);
}

// Call the function to render the simulation
renderDiversifyingSelection();
