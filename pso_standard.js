// pso.js

// Namespace
PSO = (function () {

	// Returns a random number in [min, max)
	function random(min, max) {
		return (min + (max - min) * Math.random());
	}

	// Particle class
	var Particle = function (manager, id) 
	{
		// Unique ID
		this.id = id;
		
		// Initialize the particle with random position components bounded by the given dimensions
		this.position = [];
		this.fitness = Infinity;
		
		this.bestPosition = [];
		this.bestFitness = Infinity;
		
		for (var i = 0; i < manager.dimensions.length; i++) {
			this.position.push( random(manager.dimensions[i].min, manager.dimensions[i].max) );
			this.bestPosition.push( this.position[i] );
		}
	
		this.computeFitness(manager);
		
		// Initialize the velocity components
		this.velocity = [];
		for (var i = 0; i < manager.dimensions.length; i++) {
			var d = manager.dimensions[i].max - manager.dimensions[i].min;			
			this.velocity.push( random(-d, d) );
		}
	};
	
	Particle.prototype.computeFitness = function (manager) {
		this.fitness = manager.fitnessFunction( this.position[0], this.position[1] );
		if (this.fitness < this.bestFitness) {
			for (var i = 0; i < this.position.length; i++) {
				this.bestPosition[i] = this.position[i];
			}
			this.bestFitness = this.fitness;
		}
	};
	
	Particle.prototype.iterate = function (manager) {
		// Get the social best
		var socialBestPosition = manager.getSocialBest(this);
		
		// Update the position
		for (var i = 0; i < manager.dimensions.length; i++) 
		{	
			var vMomentum = manager.inertiaWeight * this.velocity[i];			
			
			var d1 = this.bestPosition[i] - this.position[i];
			var vCognitive = manager.cognitiveWeight * random(0,1) * d1;

			var d2 = socialBestPosition[i] - this.position[i];
			var vSocial = manager.socialWeight * random(0,1) * d2;

			this.velocity[i] = vMomentum + vCognitive + vSocial;
			this.position[i] = this.position[i] + this.velocity[i];
		}
	};

	// Manager class
	// Maintains a list of particles
	var Manager = function (fitnessFunction, numParticles) 
	{
		console.assert(fitnessFunction.dimensions);
		console.assert(fitnessFunction.dimensions.length == 2);
		console.assert(numParticles);
		console.assert(numParticles > 0);
		
		this.dimensions = [ {min: -1, max: 1}, {min: -1, max: 1} ];
		this.fitnessFunction = fitnessFunction.compute;
		
		this.inertiaWeight = 0.8;
		this.cognitiveWeight = 2.0;
		this.socialWeight = 0.1;
	
		// List of particles taking part in the estimation
		this.particles = [];
		for (var i = 0; i < numParticles; i++) {
			this.addParticle();
		}
		
		this.updateGlobalBest();
		
		// By default uses global best
		// This number must be even-valued
		this.numNeighbors = this.particles.length;
		
		//this.availableTopologies = ["ring", "star"];
		this.topology = "star";
	};

	// Adds a particle the set of particles taking
	// part in the estimation
	Manager.prototype.addParticle = function() {
		var uniqueId = this.particles.length;
		var p = new Particle(this, uniqueId);
		this.particles.push(p);
	};
	
	Manager.prototype.iterate = function() {
		this.numCollisions = 0;
		for (var i = 0; i < this.particles.length; i++) {
			this.particles[i].iterate(this);
			this.particles[i].computeFitness(this);
		}
		
		this.updateGlobalBest();
	};
	
	Manager.prototype.updateGlobalBest = function() {
		// Find the best
		// Assign initial values with the first particle
		this.bestPosition = this.particles[0].bestPosition;
		this.bestFitness = this.particles[0].bestFitness;
		for (var i = 1; i < this.particles.length; i++) {
			if (this.particles[i].bestFitness < this.bestFitness) {
				this.bestFitness = this.particles[i].bestFitness;
				this.bestPosition = this.particles[i].bestPosition;
			}
		}
	};

	Manager.prototype.getSocialBest = function(particle) {
		switch (this.topology) {
			case "ring":
				return this.getSocialBest_Ring(particle);
				break;
			case "star":
				return this.getSocialBest_Star(particle);
				break;
			default:
				console.assert("Unknown topology");
		}
	}
	
	// Ring topology
	Manager.prototype.getSocialBest_Ring = function(particle) 
	{
		// Returns a valid index into an array.
		// Wraps around values outside the valid range.
		// e.g. -1 is mapped to the array length - 1
		function fix(id, arrayLength) {
			if (id < 0) {
				// id is negative, so add it instead of subtracting
				return (arrayLength+id);
			}
			if (id >= arrayLength) {
				return (id - arrayLength);
			}
			return id;
		}
		
		// Number of neighbors
		var k = this.numNeighbors;
		console.assert(k%2 == 0); // must be even
		var kh = k / 2; // half of the neighbors per left/right side
		console.assert(this.particles.length >= k+1);
		
		// Create a list of particle ids for the current particles neighbors
		// (wrap around the index if too low or too high)
		var neighborIds = [];
		for (var i = 0; i < k+1; i++) {
			var uid = particle.id - kh + i;
			var fid = fix (uid, this.particles.length);
			neighborIds.push ( fid );
		}
				
		// find the best fitness among the neighbors
		var lbFitness = this.particles[ neighborIds[0] ].bestFitness;
		var lbId = 0;
		for (var i = 1; i < neighborIds.length; i++) {
			if (this.particles[ neighborIds[i] ].bestFitness < lbFitness) {
				lbId = neighborIds[i];

				lbFitness = this.particles[ lbId ].bestFitness;
			}
		}
		
		// return the local best position
		return this.particles[lbId].bestPosition;
	};
	
	// Star (Global best)
	Manager.prototype.getSocialBest_Star = function(particle) {
		return this.bestPosition;
	}
	
	Manager.prototype.collisionCallback = function () {
		this.numCollisions++;
	};
	
 	return {
		Manager : Manager
		};
})(); // namespace PSO
