/**
 * Creates a stacked bar chart representing the relative populations of different groups over
 * multiple generations.
 */
class PopulationChart {
  // Fields set on construction that remain unchanged
  parentId;
  bgColor;
  colors;
  maxGenerations;
  startingPercentages;

  // Values dependent on current state of chart
  currentPercentages;
  playingAnimation = false;
  internalGenerationCounter = 1; // used by tooltip

  // Selections for quick access
  root;
  percentageChart;
  clip;
  redIndicatorLine;

  // Chart specifications
  w;
  h;
  yScale;
  yAxis;
  xScale;
  percentageChartPadding = {
    top:15, left:70, bottom:28, right:20
  };

  /**
   * Initializes a population percentage chart under the html element with the given parentId.
   * The inner html of that element will be replaced with the html for the simulation/viz.
   *
   * colors, rawStartingPopulations must be nonempty lists of equal length.
   *
   * @param {string} parentId the id of an existing html element that no other PopulationChart has
   *                          created a visualization within
   * @param {string} bgColor a valid CSS color (e.g., "white", "#123456") for the background of the
   *                         plot
   * @param {number} maxGenerations an integer > 1 representing the last generation in the sim
   * @param {string[]} colors a list of valid CSS colors
   * @param {number[]} rawStartingPopulations a list of the starting populations values (not
   *                                          percentages or normalized)
   * @param {number} w width of the full graph svg
   * @param {number} h height of the full graph svg
   */
  constructor(parentId, bgColor, maxGenerations, colors, rawStartingPopulations, w, h) {
    this.bgColor = bgColor;
    this.colors = colors;
    this.maxGenerations = maxGenerations;
    this.parentId = parentId; // needed for clipping
    this.startingPercentages = this.relativePercentages(rawStartingPopulations);

    this.w = w;
    this.h = h;
    this.yScale = d3.scaleLinear()
        .domain([0, 1])
        .rangeRound([this.h - this.percentageChartPadding.bottom, this.percentageChartPadding.top]);
    this.yAxis = d3.axisLeft()
        .scale(this.yScale)
        .ticks(3)
        .tickFormat(d3.format(".0%"));
    this.xScale = d3.scaleLinear() // x scale will be set later depending on maxGenerations
        .rangeRound([this.percentageChartPadding.left, this.w - this.percentageChartPadding.right])
        .domain([1, this.maxGenerations + 1]);// + 1 to fit width of last bar

    // Set html inside the root.
    this.root = d3.select(`#${parentId}`);
    this.root.html(this.simulationHtml(parentId, bgColor));

    // Get common selections for convenient reference later
    this.percentageChart = this.root.select(".simulation-chart");
    this.clip = this.root.select(".simulation-chart-clip");

    // Set svg attributes
    this.percentageChart.attr("width", this.w)
        .attr("height", this.h)
        .style("border", "2px solid black");

    // rect covering the whole svg (we can add a bg color)
    this.percentageChart.select(".simulation-chart-outer")
        .attr("height", this.h)
        .attr("width", this.w);

    // Inset rect (the actual plot area)
    this.percentageChart.select(".simulation-chart-inner")
        .attr("x", this.xScale.range()[0])
        .attr("y", this.yScale.range()[1])
        .attr("height", this.yScale.range()[0] - this.yScale.range()[1])
        .attr("width", this.xScale.range()[1] - this.xScale.range()[0])
        .attr("style", "outline: thin solid black;");

    // Make y axis
    this.percentageChart.append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(" + this.percentageChartPadding.left + ",0)")
        .style("font-size", "14px")
        .call(this.yAxis);

    // Add x-axis label
    this.percentageChart.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", this.w / 2 + 25)
        .attr("y", this.h - this.percentageChartPadding.bottom + 18)
        .attr("font-size", "16")
        .text("Time →");

    // Add y-axis label
    this.percentageChart.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", this.percentageChartPadding.left - 260) // hardcoded for big simulation chart
        .attr("y", this.h / 2 - 175) // hardcoded for big simulation chart
        .attr("font-size", "16")
        .attr("transform", "rotate(-90)")
        .text("% of combined population");

    // Set clip to match chart area
    this.clip.append("rect")
        .attr("x", this.xScale.range()[0])
        .attr("y", this.yScale.range()[1])
        .attr("height", this.yScale.range()[0] - this.yScale.range()[1])
        .attr("width", this.xScale.range()[1] - this.xScale.range()[0]);

    // Initialize red hover indicator line
    this.redIndicatorLine = this.percentageChart.append("line")
        .classed("indicator-line", true)
        .attr("y1", this.yScale.range()[0])
        .attr("y2", this.yScale.range()[1])
        .attr("stroke", "rgba(255, 0, 0, 0.5)")
        .attr("stroke-width", 0)
        .style("pointer-events", "none"); // prevents tooltip hovering interference

    // Hide tooltip when mouse leaves the plot
    this.percentageChart.on("mouseout", () => {
      d3.select("#tooltip").style("display", "none");
      this.redIndicatorLine.attr("stroke-width", 0);
    });

    this.resetChart(); // init chart
  }


  // Returns an svg element (html string) for use by this class.
  // parentId is used to make an id needed for chart clipping.
  simulationHtml(parentId, bgColor) {
    return `
      <svg class="simulation-chart">
        <clipPath id="simulation-chart-clip-${parentId}" class="simulation-chart-clip"></clipPath>
        <rect class="simulation-chart-outer" x=0 y=0 fill="white"/>
        <rect class="simulation-chart-inner" fill="${bgColor}"/>
        <g class="stacked-bars"></g>
      </svg>
    `;
  }


  /**
   * Reset chart display back to its original percentages.
   * Defaults back to generation 1, getting the percentages from the starting population values.
   * @param {function} onExitEnd a function to be called after the final exit transition
   */
  resetChart(onExitEnd = ()=>{}) {
    this.internalGenerationCounter = 1;
    this.currentPercentages = [this.startingPercentages];
    this.updatePercentageChart(onExitEnd);
  }


  /**
   * Advance chart to next generation, updating visuals based on the given new populations.
   * Assumes there are less than maxGenerations generations currently displayed.
   * @param {number[]} newPopulations a list of new population values. Must be the same length
   *                                  as colors/rawStartingPopulations.
   */
  displayNextGeneration(newPopulations) {
    if (this.currentPercentages.length === this.maxGenerations) return;

    this.internalGenerationCounter++;
    this.currentPercentages.push(this.relativePercentages(newPopulations));
    this.updatePercentageChart();
  }


  // Update the percentage chart visuals using the current percentages.
  // Takes a function to be called after the last bar has finished its exit transition.
  updatePercentageChart(onExitEnd = ()=>{}) {
    this.percentageChart.select(".stacked-bars")
        .selectAll(".stacked-bar")
        .data(this.currentPercentages) // default index-based key
        .join(
            enter => {
              const stackedBar = enter.append("g")
                  .classed("stacked-bar", true)

                  // Stores gen as an attr (see https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)
                  .attr("data-generation", this.internalGenerationCounter)

                  // References a clip-path with an id we defined based on the chart's parent element
                  .attr("clip-path", `url(#simulation-chart-clip-${this.parentId})`)

                  // Set and show tooltip when a stacked bar is moused over
                  .on("mousemove", (event, d) => {
                    const [mouseX, mouseY] = d3.pointer(event, d3.select("html")); // absolute mouse position
                    d3.select("#tooltip")
                        .style("display", "block") // unhide the tooltip
                        .style("left", `${mouseX}px`)
                        .style("top", `${mouseY}px`)
                        .style("background-color", "rgba(200, 200, 200, 0.8)") // slightly transparent bg

                        // Set tooltip html
                        .html(
                          `<p style="text-align:center;">Gen ${stackedBar.attr("data-generation")}</p>` +
                          d.map((val, i) => `
                            <p>
                              &nbsp;
                              <svg width="10" height="10" style="outline: thin solid black;">
                                  <rect width="10" height="10" style="fill:${this.colors[i]};" />
                              </svg>
                              ${d3.format(".2%")(val) /* percentage to 2 decimal */}
                              &nbsp;
                            </p>
                          `).join("")
                        );
                  });

              // For each bar, draw each bar segment
              enter.each((dPercentages, barIndex) => {
                const chartHeight = this.percentageChart.select(".simulation-chart-inner").attr("height");
                const barWidth = this.xScale(barIndex + 2) - this.xScale(barIndex + 1);

                // Get the height of each bar according to our scale
                var pixelHeightMappings = dPercentages.map((d) => this.yScale.range()[0] - this.yScale(d));
                var totalPixelsUsed = pixelHeightMappings.reduce((currSum, val) => currSum + val);

                // Allocate spare pixels due to rounding starting with the topmost bar piece.
                // Minimal impact to viewer experience overall, but needed to prevent gaps where the
                // bars don't fill the full height and the background shows through.
                // Note rounding could also mean we already allocated more pixels than we have height
                // (can cause slight length overflow below the chart, but it gets clipped)
                var i = 0;
                while (totalPixelsUsed < chartHeight) {
                  // Distribute as evenly as possible, but keeping empty populations still visually zero
                  if (pixelHeightMappings[i] !== 0) {
                    pixelHeightMappings[i]++;
                    totalPixelsUsed++;
                  }
                  i++;
                }

                // Now we plot each segment of the bar
                var prevBottomY = this.yScale.range()[1]; // top of chart (to start)
                for (var i = 0; i < dPercentages.length; i++) {
                  stackedBar.append("rect")
                      .style("shape-rendering", "crispEdges") // fixes slight gaps between bars
                      .attr("fill", this.colors[i])
                      .attr("width", barWidth)
                      .attr("height", pixelHeightMappings[i])
                      .attr("x", this.xScale(barIndex + 1)) // + 1 to account for 1-indexed generations
                      .attr("y", prevBottomY)

                      // Show red indicator line on hover
                      .on("mouseover", (event, d) => {
                        const lineX = barWidth / 2 + this.xScale(barIndex + 1);
                        this.redIndicatorLine.attr("x1", lineX)
                            .attr("x2", lineX)
                            .attr("stroke-width", barWidth);
                      });

                  prevBottomY += pixelHeightMappings[i]; // update y for next segment
                }
              })

              // NaN values (0 population in total) result in no bar - shows background, no tooltip ability
            },
            update => update,
            exit => {
              // Remove the exiting bars in a staggered transition.
              exit.transition()
                  .duration(500)
                  .delay((d, i) => i * 3)
                  .ease(d3.easeCubicIn)
                  .on("end", (d, i, nodes) => {
                    d3.select(nodes[i]).remove();
                    if (i === exit.size()) { // only call exit function once
                      onExitEnd();
                    }
                  })
                  .selectAll(".stacked-bar rect")
                  // Translate each piece of the stacked bar down one plot's height
                  .attr("y", (d, i, nodes) =>
                      +d3.select(nodes[i]).attr("y") + this.yScale.range()[0] - this.yScale.range()[1]);
            }
        );
  }


  // Sums up the values in arr, returning an array representing each value's
  // proportion of the total sum.
  relativePercentages(arr) {
    const sum = arr.reduce((total, curr) => total + curr);
    return arr.map(val => val / sum);
  }


  /**
   * Change the background color of this plot.
   * @param {string} color a valid CSS color (e.g., "coral", "#abcdef")
   */
  setBgColor(color) {
    this.bgColor = color;
    this.root.select(".simulation-chart-inner").attr("fill", this.bgColor);
  }

}
