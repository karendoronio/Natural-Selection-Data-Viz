class CentralVizElement {
  constructor(parentId, selectionType) {
    this.selectionType = selectionType;
    d3.select(`#${parentId}`).html(this.vizHtml());
  }

  vizHtml() {
    if (this.selectionType === "directional") {
      return this.directionalGraph();
    } else if (this.selectionType === "stabilizing") {
      return this.stabilizingGraph();
    } else if (this.selectionType === "diversifying") {
      return this.diversifyingGraph();
    }
  }

  directionalGraph() {
    return `
      <div class="static-graph">
        <svg viewBox="0 0 750 400" preserveAspectRatio="xMidYMid meet" class="responsive-svg">
          <!-- Title -->
          <text x="375" y="30" font-size="24" text-anchor="middle" font-weight="bold">
            Directional Selection Graph      
          </text>
          
          <!-- X-Axis -->
          <line x1="100" y1="350" x2="550" y2="350" stroke="black" />
          <text x="325" y="380" font-size="20" text-anchor="middle">Phenotype</text>
          
          <!-- Y-Axis -->
          <line x1="100" y1="50" x2="100" y2="350" stroke="black" />
          <text x="80" y="200" font-size="20" text-anchor="middle" transform="rotate(-90, 80, 200)">Population Count</text>
          
          <!-- Directional Selection Curves -->
          
          <!-- Dashed Curve (Left) -->
          <path 
            d="M100 350 C225 250, 175 150, 250 150 C325 150, 275 250, 400 350"
            stroke="#41b6e6" 
            stroke-width="4" 
            fill="none" 
            stroke-dasharray="6,8" 
          />
          
          <!-- Solid Curve (Right) -->
          <path 
            d="M250 350 C375 250, 325 150, 400 150 C475 150, 425 250, 550 350"
            stroke="blue" 
            stroke-width="4" 
            fill="none" 
          />
  
          <!-- Legend -->
          <text x="545" y="70" font-size="16" font-weight="bold">Legend</text>
          <line x1="550" y1="100" x2="585" y2="100" stroke="#41b6e6" stroke-width="4" stroke-dasharray="6,8" />
          <text x="600" y="105" font-size="16" text-anchor="start">Population Before</text>
          <rect x="550" y="130" width="36" height="4" fill="blue" />
          <text x="600" y="135" font-size="16" text-anchor="start">Population After</text>
        </svg>
      </div>
    `;
  }
  
  
  
  
  stabilizingGraph() {
    return `
      <div class="centered-graph">
        <svg viewBox="0 0 750 400" preserveAspectRatio="xMidYMid meet" class="responsive-svg">
          <!-- Title -->
          <text x="375" y="30" font-size="24" text-anchor="middle" font-weight="bold">
            Stabilizing Selection Graph  
          </text>
          
          <!-- X-Axis -->
          <line x1="100" y1="350" x2="550" y2="350" stroke="black" />
          <text x="325" y="380" font-size="20" text-anchor="middle">Phenotype</text>
        
          <!-- Y-Axis -->
          <line x1="100" y1="50" x2="100" y2="350" stroke="black" />
          <text x="80" y="200" font-size="20" text-anchor="middle" transform="rotate(-90, 80, 200)">Population Count</text>
        
          <!-- Stabilizing Selection Curves -->
          <!-- Solid Curve -->
          <path 
            d="M205 350 C375 -100, 300 100, 430 350"
            stroke="purple" 
            stroke-width="4" 
            fill="none" 
          />
          
          <!-- Dashed Curve -->
          <path 
            d="M100 350 C325 100, 325 100, 550 350"
            stroke="violet" 
            stroke-width="4" 
            fill="none" 
            stroke-dasharray="8,8" 
          />
  
          <!-- Legend -->
          <text x="545" y="70" font-size="16" font-weight="bold">Legend</text>
          <line x1="550" y1="100" x2="585" y2="100" stroke="violet" stroke-width="4" stroke-dasharray="8,8" />
          <text x="600" y="105" font-size="16" text-anchor="start">Population Before</text>
          <rect x="550" y="130" width="36" height="4" fill="purple" />
          <text x="600" y="135" font-size="16" text-anchor="start">Population After</text>
        </svg>
      </div>
    `;
  }
  
 

  diversifyingGraph() {
    return `
      <div class="centered-graph">
        <svg viewBox="0 0 750 400" preserveAspectRatio="xMidYMid meet" class="responsive-svg">
          <!-- Title -->
          <text x="375" y="30" font-size="24" text-anchor="middle" font-weight="bold">
            Diversifying Selection Graph  
          </text>
          
          <!-- X-Axis -->
          <line x1="100" y1="350" x2="550" y2="350" stroke="black" />
          <text x="325" y="380" font-size="20" text-anchor="middle">Phenotype</text>
        
          <!-- Y-Axis -->
          <line x1="100" y1="50" x2="100" y2="350" stroke="black" />
          <text x="80" y="200" font-size="20" text-anchor="middle" transform="rotate(-90, 80, 200)">Population Count</text>
        
          <!-- Diversifying Selection Curves -->
  
          <!-- Dashed Curve (Center) -->
          <path 
            d="M100 350 C250 250, 200 150, 325 150 C450 150, 400 250, 550 350"
            stroke="#5dbb63" 
            stroke-width="4" 
            fill="none" 
            stroke-dasharray="8,8" 
          />
            
          <!-- Solid Curve (Left Side of Saddle) -->
          <path 
            d="M100 350 C150 250, 100 150, 175 150 C250 150, 200 250, 325 250"
            stroke="green" 
            stroke-width="4" 
            fill="none" 
          />
  
          <!-- Solid Curve (Right Side of Saddle) -->
          <path 
            d="M550 350 C500 250, 550 150, 475 150 C400 150, 450 250, 325 250"
            stroke="green" 
            stroke-width="4" 
            fill="none" 
          />
  
          <!-- Legend -->
          <text x="545" y="70" font-size="16" font-weight="bold">Legend</text>
          <line x1="550" y1="100" x2="585" y2="100" stroke="#5dbb63" stroke-width="4" stroke-dasharray="8,8" />
          <text x="600" y="105" font-size="16" text-anchor="start">Population Before</text>
          <rect x="550" y="130" width="36" height="4" fill="green" />
          <text x="600" y="135" font-size="16" text-anchor="start">Population After</text>>
      </svg>
    </div>
  `;
}
}
