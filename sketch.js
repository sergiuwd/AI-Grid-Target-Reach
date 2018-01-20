var portWidth = 500;
var portHeight = 500;
var colsCount = 50;
var rowsCount = 50;
var cellWidth;
var cellHeight;
var agentWidth;
var agentHeight;
var grid = [];
var popCount = 100;
var startCell;
var lifespan;
var counter = 0;
var frameP;
var avgFitP;
var maxFitP;
var generationP;
var target;
var generation = 1;

function setup () {
    createCanvas(portWidth, portHeight);
    cellWidth = portWidth / colsCount;
    cellHeight = portHeight / rowsCount;
    frameP = createP();
    avgFitP = createP();
    maxFitP = createP();
    generationP = createP();

    // 4 * screen's diagonal
    lifespan = Math.sqrt(rowsCount * rowsCount + colsCount * colsCount) * 4;

    // Calculate the agent's width
    agentWidth = cellWidth / 2;
    agentHeight = cellHeight / 2;

    // Generate the grid cells
    for(var i = 0; i < rowsCount; i++) {
        var newRow = []
        for(var j = 0; j < colsCount; j++) {
            newCell = new Cell(i, j);
            newRow.push(newCell);
        }
        grid.push(newRow);
    }

    // Starting point for the agents
    startCell = grid[0][floor(colsCount / 2)];

    // Generate a new population
    population = new Population();
    population.populate();

    // Target location
    target = grid[rowsCount - 1][floor(colsCount / 2)];

    // UI
    avgFitP.html("Average fitness: 0");
    maxFitP.html("Max fitness: 0");
}

function draw () {
    background(0);
    
    // Update the UI
    frameP.html("Frame: " + counter);
    generationP.html("Generation: " + generation);
    
    // Display the grid
    for(var i = 0; i < grid.length; i++) {
        for(var j = 0; j < grid[i].length; j++) {
            grid[i][j].show();
        }
    }

    // Draw the target point
    push();
    fill(200, 100, 200);
    rect(target.x, target.y, cellHeight, cellWidth);
    pop();

    // Update the population
    population.run();
    
    // Update frame counter
    counter++;

    // Move to the next generation
    if(counter > lifespan) {
        generation++;
        counter = 0;
        population.evaluate();
        population.selection();
    }
}

function Cell (i, j) {
    // Cell's location in the grid
    this.i = i;
    this.j = j;

    // Calculate the location where it should be displayed
    this.x = this.j * cellWidth;
    this.y = this.i * cellHeight;
    
    // Draw the cell
    this.show = function () {
        noStroke();
        fill(0);
        rect(this.x, this.y, 60, 60);
    }
}

function Population () {
    this.agents = [];
    this.matingPool = [];

    // Initial population
    this.populate = function () {
        for(var i = 0; i < popCount; i++) {
            var agent = new Agent();
            this.agents.push(agent);
        }
    }

    // Ran every frame
    this.run = function () {
        for(var i = 0; i < this.agents.length; i++) {
            this.agents[i].show();
            this.agents[i].update();
        }
    }

    // Evaluate the agents
    this.evaluate = function () {
        var maxfit = 0;
        var avgFit = 0;
     
        for(i = 0; i < this.agents.length; i++) {
            this.agents[i].calcFitness();

            if(this.agents[i].targetReached) {
                this.agents[i].fitness *= 10;
            }

            // Increment the fitness based on the time it took to reach the target
            if(this.agents[i].targetReached) {
                var multiplier = map(this.agents[i].targetReachFrame, 0, lifespan, 10, 1);
                this.agents[i].fitness *= multiplier;
            }

            // Update the average fitness
            avgFit += this.agents[i].fitness;

            // Update the max fitness
            if(this.agents[i].fitness > maxfit) {
                maxfit = this.agents[i].fitness;
            }
        }

        // Calculate the average fitness
        avgFit /= this.agents.length;

        // Update the UI
        avgFitP.html("Average fitness: " + avgFit);
        maxFitP.html("Max fitness: " + maxfit);

        // Normalize the fitness
        for(i = 0; i < this.agents.length; i++) {
            this.agents[i].fitness /= maxfit;
        }

        // Generate the new mating pool
        this.matingPool = [];
        for(i = 0; i < this.agents.length; i++) {
            var n = this.agents[i].fitness * 100;
            for(var j = 0; j < n; j++) {
                this.matingPool.push(this.agents[i]);
            }
        }

    }

    // Generate the next generation
    this.selection = function () {
        var newAgents = [];
        for(var i = 0; i < this.agents.length; i++) {
            var parentA = random(this.matingPool).dna;
            var parentB = random(this.matingPool).dna;
            var child = parentA.crossover(parentB);
            child.mutation();
            newAgents[i] = new Agent(child)
        }
        this.agents = newAgents;
    }

}

function Agent (dna) {
    this.parentCell = startCell;

    // Assign the DNA
    if(dna) {
        this.dna = dna;
    } else {
        this.dna = new DNA();
    }
    this.dna.generate();
    this.fitness = 0;
    this.targetReached = false;
    this.targetReachFrame = null;

    // Agent movement
    this.move = function (dir) {
        // Check if the target is reached
        this.targetReached = (this.parentCell.i === target.i && this.parentCell.j === target.j);
        // If it is, prevent movement
        if(!this.targetReached) {
            // Move up
            if(dir === 0 && grid[this.parentCell.i - 1] != undefined) {
                this.parentCell = grid[this.parentCell.i - 1][this.parentCell.j];
            // Move down
            } else if (dir === 2 && grid[this.parentCell.i + 1] != undefined) {
                this.parentCell = grid[this.parentCell.i + 1][this.parentCell.j];
            // Move left
            } else if (dir === 3 && grid[this.parentCell.i][this.parentCell.j - 1] != undefined) {
                this.parentCell = grid[this.parentCell.i][this.parentCell.j - 1];
            // Move right
            } else if (dir === 1 && grid[this.parentCell.i][this.parentCell.j + 1]) {
                this.parentCell = grid[this.parentCell.i][this.parentCell.j + 1];
            }
        }
    }

    // Display the agent
    this.show = function () {
        fill(this.dna.r, this.dna.g, this.dna.b, 250);
        rect(this.parentCell.x + agentWidth / 2, this.parentCell.y + agentHeight / 2, agentWidth, agentHeight);
    }

    // Checks to be made every frame
    this.update = function () {
        if(!this.targetReached) {
            this.move(this.dna.directions[counter]);
        } else {
            if(!this.targetReachFrame) {
                this.targetReachFrame = counter;
            }
        }
    }

    // Calculate the agent's fitness
    this.calcFitness = function () {
        var dj = Math.abs(target.j - this.parentCell.j);
        var di = Math.abs(target.i - this.parentCell.i);
        var d = dj + di;
        var maxd = lifespan;

        this.fitness = map(d, 0, maxd, maxd, 1);
    }
}

function DNA () {
    this.r = random(0, 255);
    this.g = random(0, 255);
    this.b = random(0, 255);
    this.directions = [];

    // Generate a random direction
    this.generate = function () {
        for(i = 0; i < lifespan; i++) {
            var newDir = floor(random(0, 4));
            this.directions.push(newDir);
        }
    }

    // Merge 2 DNAs
    this.crossover = function (partner) {
        var newPaths = [];
        var mid = floor(this.directions.length / 2);
        for(var i = 0; i < this.directions.length; i++) {
            if(i < mid) {
                newPaths[i] = this.directions[i] 
            } else {
                newPaths[i] = partner.directions[i]
            }
        }
        
        newDNA = new DNA();
        // Assign the new DNA directions
        newDNA.directions = newPaths;
        // Generate a new color based on parents' colors 
        newDNA.r = (this.r + partner.r) / 2;
        newDNA.g = (this.g + partner.g) / 2;
        newDNA.b = (this.b + partner.b) / 2;

        return newDNA;
    }

    // Mutate 
    this.mutation = function () {
        // Generate a new direction and replace the old one in the array
        for(var i = 0; i < this.directions.length; i++) {
            if(random(1) < 0.01) {
                newDir = round(random(3));
                this.directions[i] = newDir;
            }
        }

        // Generate a random color
        if(random(1) < 0.01) {
            this.r = ceil(random(255));
            this.g = ceil(random(255));
            this.b = ceil(random(255));
        }
    }

}