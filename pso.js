// pso.js

// Namespace
PSO = (function () {

	// Returns a random number in [min, max)
	function random(min, max) {
		return (min + (max - min) * Math.random());
	}

	// Particle class
	var Particle = function (dimensions) 
	{			
		// Initialize the particle with random position components bounded by the given dimensions
		this.position = [];
		for (var i = 0; i < dimensions.length; i++) {
			this.position.push( random(dimensions[i].min, dimensions[i].max) );
		}
	
		// Initialize the velocity components
		this.velocity = [];
		for (var i = 0; i < dimensions.length; i++) {
			var maxVelocity = (dimensions[i].max - dimensions[i].min)/25;
			
			this.velocity.push( random(-1,1) * maxVelocity );
		}
	};
	
	Particle.prototype.iterate = function (manager) {
		// Update the position
		for (var i = 0; i < manager.dimensions.length; i++) {
			this.position[i] = this.position[i] + this.velocity[i];
			
			// Apply bounds
			if (this.position[i] < manager.dimensions[i].min) {
				this.position[i] = manager.dimensions[i].min;
				this.velocity[i] = -this.velocity[i];
				manager.collisionCallback();
			} else if (this.position[i] > manager.dimensions[i].max) {
				this.position[i] = manager.dimensions[i].max;
				this.velocity[i] = -this.velocity[i];
				manager.collisionCallback();
			}
		}
	};

	// Manager class
	var Manager = function (dimensions, numParticles, fitnessFunction) {
		console.assert(dimensions);
		console.assert(dimensions.length > 0);
		console.assert(numParticles);
		console.assert(numParticles > 0);
		console.assert(fitnessFunction);
	
		this.dimensions = dimensions;
		this.fitnessFunction = fitnessFunction;
	
		// List of particles taking part in the estimation
		this.particles = [];
		for (var i = 0; i < numParticles; i++) {
			this.addParticle();
		}
	};

	// Adds a particle the set of particles taking
	// part in the estimation
	Manager.prototype.addParticle = function() {
		var p = new Particle(this.dimensions);
		this.particles.push(p);
	};
	
	Manager.prototype.iterate = function() {
		this.numCollisions = 0;
		for (var i = 0; i < this.particles.length; i++) {
			this.particles[i].iterate(this);
		}
	};
	
	Manager.prototype.collisionCallback = function () {
		this.numCollisions++;
	};
	
 	return {
		Manager : Manager
		};
})(); // namespace PSO
