"use strict"

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
		
		this.bestParticleId = 0;
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
	}
	
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
	}

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
		
		// Number of iterations that have been computed
		this.iterationNum = 0;
		
		// If linear scaling is enabled, then 'inertiaWeight' will change
		this.enableInertiaWeightScaling = true;
		// y = mx + b
		// m = (y_end - y_start) / (range-0) + y_start
		this.setInertiaScaling(true, 0.7, 0.7, 1);
		
		this.inertiaWeightStart = 0.7;
		this.inertiaWeightEnd = 0.7;
		this.inertiaWeightIterationRange = 1;
		console.assert(this.inertiaWeightIterationRange > 0);
		this.inertiaWeightSlope = (this.inertiaWeightEnd - this.inertiaWeightStart) / this.inertiaWeightIterationRange;
		
		this.inertiaWeight = this.inertiaWeightStart;
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
		
		this.topology = "ring";
	};
	
	Manager.prototype.setInertiaScaling = function (enable, start, finish, range) {
		this.enableInertiaWeightScaling = true;
		this.inertiaWeightStart = start;
		this.inertiaWeightEnd = finish;
		this.inertiaWeightIterationRange = range;
		this.inertiaWEight = this.inertiaWeightStart;
		this.inertiaWeightSlope = (this.inertiaWeightEnd - this.inertiaWeightStart) / (this.inertiaWeightIterationRange);
	}
	
	Manager.prototype.addParticle = function() {
		var uniqueId = this.particles.length;
		var p = new Particle(this, uniqueId);
		this.particles.push(p);
	}
	

	// Adds a particle the set of particles taking
	// part in the estimation
	Manager.prototype.addParticle = function() {
		var uniqueId = this.particles.length;
		var p = new Particle(this, uniqueId);
		this.particles.push(p);
	}
	
	// This is the main function that is called
	// to simulate an iteration of the simulation
	Manager.prototype.iterate = function() {
		this.numCollisions = 0;
		for (var i = 0; i < this.particles.length; i++) {
			this.particles[i].iterate(this);
			this.particles[i].computeFitness(this);
		}
		
		// This should only be for the fully connected topology
		// this.updateSocialBest()
		this.updateGlobalBest();
		
		this.updateInertiaWeight();
		//console.log("inertiaWeight = " + this.inertiaWeight);
		
		this.iterationNum++;
	}
	
	Manager.prototype.updateGlobalBest = function() {
		// Find the best
		// Assign initial values with the first particle
		this.bestParticleId = 0;
		this.bestPosition = this.particles[0].bestPosition;
		this.bestFitness = this.particles[0].bestFitness;
		for (var i = 1; i < this.particles.length; i++) {
			if (this.particles[i].bestFitness < this.bestFitness) {
				this.bestParticleId = i;
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
			case "fully connected":
				return this.getSocialBest_FullyConnected(particle);
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
	}
	
	// Star (Global best)
	Manager.prototype.getSocialBest_FullyConnected = function(particle) {
		return this.bestPosition;
	}
	
	Manager.prototype.collisionCallback = function () {
		this.numCollisions++;
	}
	
	// Compute inertia. This is based on equation 4.1 from:
    // http://www.hindawi.com/journals/ddns/2010/462145/
	Manager.prototype.updateInertiaWeight = function () {
		if (this.enableInertiaWeightScaling == false) {
			return;
		}
		
		if (this.iterationNum > this.inertiaWeightIterationRange) {
			this.inertiaWeight = this.inertiaWeightEnd;
			return;
		}
        
        this.inertiaWeight = this.inertiaWeightSlope * (this.iterationNum) + this.inertiaWeightStart;
	}
	
 	return {
		Manager : Manager
		};
})(); // namespace PSO
