/**
 * Models populations where each member of each population has a certain chance of surviving to the
 * next generation.
 */
class PopulationModel {
  numCategories; // the length of survivalRates, initialPopulations, currPopulations
  survivalRates;
  initialPopulations;
  maxGeneration;

  currPopulations;
  currGeneration = 1;
  changes = null;

  /**
   * Initializes a population model with the given parameters.
   * 
   * survivalRates and initialPopulations much be nonempty lists of equal size.
   * survivalRates[i] and initialPopulations[i] are meant to refer to the same population group.
   * 
   * @param {number[]} survivalRates a list of survival rates with 0 <= rate <= 1 for each rate
   * @param {number[]} initialPopulations a list of initial populations (integers >= 0)
   * @param {number} maxGeneration an integer > 1 representing the maximum generation to simulate to
   */
  constructor(survivalRates, initialPopulations, maxGeneration) {
    this.survivalRates = survivalRates;
    this.initialPopulations = initialPopulations;
    this.maxGeneration = maxGeneration;
    this.currPopulations = this.initialPopulations;
    this.numCategories = survivalRates.length;
  }

  /**
   * Advance populations to the next generation, using each population's survival rate to
   * determine how many population members advance to the next generation.
   * Updates currPopulations with these new values and updates changes to reflect the change
   * between generations for each population. Also increments curr generation.
   */
  advanceToNextGeneration() {
    if (this.currGeneration >= this.maxGeneration) return;

    var newPops = [];
    const newChanges = [];
    for (var i = 0; i < this.numCategories; i++) {
      const pop = this.currPopulations[i];
      const survivalRate = this.survivalRates[i];
      var newPop = 0;

      // If this was to be used with much larger total population than the ~100k-1mil we use,
      // a more efficient simulation or approximation would be better
      for (var j = 0; j < pop; j++) {
        if (Math.random() < survivalRate) {
          newPop++;
        }
      }

      newPops.push(newPop);
      newChanges.push(newPop - pop);
    }

    // For future plotting purposes, always rescale to have the total population be ~the sum of the initial populations.
    // (we don't display actual values, so this is just to ensure detail isn't lost as population sizes shrink)
    newPops = this.relativePercentages(newPops).map(val => Math.round(val * this.sum(this.initialPopulations)))

    this.currPopulations = newPops;
    this.changes = newChanges;
    this.currGeneration++;
  }

  /**
   * Reset current populations to their initial values.
   * Also sets changes to the default value of null and curr generation back to 1.
   */
  resetModel() {
    this.currPopulations = this.initialPopulations;
    this.changes = null;
    this.currGeneration = 1;
  }

  relativePercentages(arr) {
    const sum = arr.reduce((total, curr) => total + curr);
    return arr.map(val => val / sum);
  }

  sum(arr) {
    return arr.reduce((total, curr) => total + curr);
  }

}
