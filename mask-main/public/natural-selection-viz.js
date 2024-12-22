/**
 * Creates an interactive simulation about natural selection.
 */
class NaturalSelectionViz {
  // The logic/model behind the population simulation
  populationModel;

  // The population percentage chart (which will be based on the populationModel)
  populationChart;

  // Indicator of animation state: "adding", "removing", or "none"
  playingAnimation = "none";

  // The timer associated with the current animation, if any are active (for interruption purposes)
  animationTimer;
  
  // Root selection
  root;


  /**
   * Initilize a natural selection simulation visualization element.
   * The inner html of the element with parentId will be replaced by this visualization.
   * 
   * @param {string} parentId the id of the desired parent element for the viz
   * @param {string[]} categoryNames the names for each population group/category
   * @param {number[]} initialPopulations a list of integers >= 0 representing the initial
   *                                      populations for each group
   * @param {number[]} survivalRates a list of numbers 0<=x<=1 representing the probability an
   *                                 individual in each group survives to the next generation
   * @param {string[]} colors valid CSS color strings (e.g., "white", "#ABCDEF") associated with
   *                          each group (will be used in a PopulationChart)
   * @param {string} chartBgColor a valid CSS color string for the background a PopulationChart
   * @param {number} maxGeneration the maximum generation number to be displayed/simulated to
   *                               (1-indexed, inclusive)
   * @param {number} [chartW=400] width of the population chart within this viz, default 400
   * @param {number} [chartH=300] height of the population chart wihtin this viz, default 300
   * @param {boolean} [showChartLabels=true] whether we show the chart labels + pop. counts, true
   *                                         by default
   */
  constructor(
    parentId, 
    categoryNames,
    initialPopulations,
    survivalRates,
    colors,
    chartBgColor,
    maxGeneration,
    chartW=400,
    chartH=300,
    showChartLabels=true
  ) {
    // Add initial html under given parent/root
    this.root = d3.select(`#${parentId}`);
    this.root.html(this.vizHtml(parentId, categoryNames, showChartLabels));
    
    // Initialize model, then a chart based on that model (note the chart inserts new html)
    this.populationModel = new PopulationModel(survivalRates, initialPopulations, maxGeneration);
    this.populationChart = new PopulationChart(
      `chart-container-${parentId}`, // div id where the chart will be
      chartBgColor,
      maxGeneration,
      colors,
      this.populationModel.currPopulations,
      chartW,
      chartH
    );
    
    this.initButtons();

    // Initialize button selectability and population labels
    this.updateButtonSelectability();
    this.updateDisplayedValues();
  }

  // Returns html used as the basis of this object's visualization(s).
  vizHtml(parentId, categoryNames, showChartLabels) {
    return `
      <div class="simulation-container">
        <div id="central-viz-element-${parentId}" class="central-viz-element"></div>
        <h2 class="generation-counter"></h2>
        <div class="chart-and-label-row">
          <div class="chart-and-buttons-column">
            <div class="simulation-actions">
              <button class="next-gen simulation-action">Next generation</button>
              <button class="animate-chart simulation-action">Animate</button>
              <button class="reset simulation-action">Reset</button>
            </div>
            <div id="chart-container-${parentId}" class="chart-container"></div>
          </div>
          ${showChartLabels ?
            `<div class="pop-labels">
              ${categoryNames.map(name => this.populationInfoTemplate(name)).join("")}
            </div>` : ""
          }
        </div>
      </div>
    `;
  }


  // Returns html for a population info label using the given name.
  populationInfoTemplate(name) {
    return `
      <div class="pop-info">
        ${name}:
        <h3 class="pop-counter"></h3>
        <h5 class="pop-change"></h5>
      </div>
    `;
  }


  // Set click events for next generation button, animate button, reset button
  initButtons() {
    this.root.select(".next-gen")
        .on("click", () => {
          if (this.populationModel.currGeneration === this.populationModel.maxGeneration) return;

          this.advanceAndUpdateVisuals()
          this.updateButtonSelectability();
        });

    this.root.select(".animate-chart")
        .on("click", () => {
          if (this.playingAnimation === "adding") { // stop adding animation
            clearInterval(this.animationTimer);
            this.playingAnimation = "none";
            this.updateButtonSelectability();
          } else if (this.playingAnimation === "none") { // start adding animation
            this.advanceToNextGenerationPeriodically(30);
          }
          // no function on graph resetting
        });

    this.root.select(".reset")
        .on("click", () => {
          this.populationModel.resetModel();

          // Prevent button presses during animation
          this.playingAnimation = "removing";
          this.updateButtonSelectability();

          // Reset chart, then reenable buttons
          this.populationChart.resetChart(() => {// (this will be called after chart exit animation)
            this.playingAnimation = "none";
            this.updateButtonSelectability();
          });

          this.updateDisplayedValues();
        });
  }

  
  // Update selectability of buttons. Also updates "Animate"/"Pause" label for that button.
  updateButtonSelectability() {
    // Next generation button disabled if chart is full (or if an animation is going)
    this.root.select(".next-gen")
        .property("disabled", this.populationModel.currGeneration === this.populationModel.maxGeneration || this.playingAnimation !== "none");

    // Animate button disabled on "removing" animation. Also sets button text to either "Animate" or "Pause"
    this.root.select(".animate-chart")
        .property("disabled", this.populationModel.currGeneration === this.populationModel.maxGeneration || this.playingAnimation === "removing")
        .text(this.playingAnimation === "adding" ? "Pause" : "Animate");

    // Disable reset button if chart is empty, i.e. just the starting generation (or if an animation is going)
    this.root.select(".reset")
        .property("disabled", this.populationModel.currGeneration === 1 || this.playingAnimation !== "none");
  }


  // Periodically simulates next generation until max generation is reached.
  // Buttons are disable during the animation.s
  // Takes animation interval as parameter, defaulting to 100 (ms).
  advanceToNextGenerationPeriodically(intervalMs = 100) {
    if (this.populationModel.currGeneration >= this.populationModel.maxGeneration) return;
  
    // Signal that animation is playing - this will disable action buttons
    this.playingAnimation = "adding";
    this.updateButtonSelectability();
  
    // Start plotting new bars immediately (not after a timer cycle), update labels
    this.advanceAndUpdateVisuals()

    // Advance a generation every intervalMs ms, until max generation
    this.animationTimer = setInterval(() => {
      if (this.populationModel.currGeneration === this.populationModel.maxGeneration) {
        // Reenable actions and cancel interval/timer when done
        this.playingAnimation = "none";
        this.updateButtonSelectability();
        clearInterval(this.animationTimer);
      } else {
        this.advanceAndUpdateVisuals()
      }
    }, intervalMs);
  }


  // Update the text/number elements of the simulation (the generation counter and category
  // counts/changes) with the current population and changes from this chart's model.
  // Defaults change values to "--" if changes is null (i.e. for the first generation).
  updateDisplayedValues() {
    this.root.select(".generation-counter")
        .text(`Generation ${this.populationModel.currGeneration}`);

    const outerThis = this;
    this.root.selectAll(".pop-info")
        .each(function(d, i) {
          d3.select(this)
            .select(".pop-counter")
              .text(outerThis.populationModel.currPopulations[i]);

          const newChange = outerThis.populationModel.changes === null ? "--" : outerThis.populationModel.changes[i];
          d3.select(this)
            .select(".pop-change")
              .text(`(${newChange > 0 ? '+' + newChange : newChange })`);
        })
  }


  // Advance to next generation in model, then update chart and labels accordingly.
  advanceAndUpdateVisuals() {
    this.populationModel.advanceToNextGeneration();
    this.populationChart.displayNextGeneration(this.populationModel.currPopulations);
    this.updateDisplayedValues();
  }

}
