// PSOPlot class
function PSOPlot (manager, idTag) 
{
	this.manager = manager;
	this.graph_width  = d3.select("#"+idTag).attr("width");
	this.graph_height = d3.select("#"+idTag).attr("height");
	
	this.svg = d3.select("#"+idTag);
	
	// All of this is for the tick function
	this.simulatedTime = 0;
	this.lastTime = 0;
	this.doAnimation = true;
	this.iterationsPerSecond = 60;
	this.lastTimeIterated = 0;
	this.stopAnimation = false;
	this.sampleNumPerWidth = 100;
	this.sampleNumPerHeight = this.sampleNumPerWidth;
	
	this.sampleFitnessFunction();
};

PSOPlot.prototype.tickCallbackCallback = function (manager) {
};

PSOPlot.prototype.sampleFitnessFunction = function () {
	var numWidth = this.sampleNumPerWidth;
	var numHeight = this.sampleNumPerHeight;
	var width = this.manager.dimensions[0].max - this.manager.dimensions[0].min;
	var height = this.manager.dimensions[1].max - this.manager.dimensions[1].min;
	var Rw = width / numWidth;
	var Rh = height / numHeight;
	
	var scaleX = d3.scale.linear()
		.domain([this.manager.dimensions[0].min, this.manager.dimensions[0].max])
		.range([0, this.graph_width]);
		
	var scaleY = d3.scale.linear()
		.domain([this.manager.dimensions[1].min, this.manager.dimensions[1].max])
		.range([0, this.graph_height]);
		
	this.Rwpixel = scaleX(Rw) - scaleX(0);
	this.Rhpixel = scaleY(Rh) - scaleY(0);
	
	this.fitnessFunctionSamples = [];
	
	for (var i = 0; i < numWidth; i++) {
		for (var j = 0; j < numHeight; j++) {
			var rw = this.manager.dimensions[0].min + i * Rw;
			var rh = this.manager.dimensions[1].max - j * Rh;
			
			var sample_x = rw + Rw/2;
			var sample_y = rh - Rh/2;
			
			var sample_value = this.manager.fitnessFunction( sample_x, sample_y );
			
			this.fitnessFunctionSamples.push( {x: rw, y: rh, value: sample_value} );
		}
	}
};

PSOPlot.prototype.toggleAnimation = function() {
	if (this.doAnimation) {
		this.doAnimation = false;
	} else {
		this.doAnimation = true;
	}
};

PSOPlot.prototype.startAnimation = function() {
		var that = this;
		this.renderFitnessFunction();

		d3.timer( function(elapsedTime) { return that.tickCallback(elapsedTime);} );
};

PSOPlot.prototype.stopAnimation = function() {
		this.stopAnimation = true;
};

PSOPlot.prototype.tickCallback = function (elapsedTime) {
	if (this.doAnimation) {
		var timeDiff = elapsedTime - this.lastTime;
		this.simulatedTime += timeDiff /1000;
		
		if ( (this.simulatedTime - this.lastTimeIterated) > (1/this.iterationsPerSecond) ) 
		{
			this.manager.iterate();
			
			this.renderParticles( this.manager.particles );
			this.lastTimeIterated = this.simulatedTime;
			
			var keepLooping = this.tickCallbackCallback(this.manager);
			if (!keepLooping) {
				this.stopAnimation = true;
			}
		}
	}
	
	// End the timer process
	if (this.stopAnimation) {
		return true;
	}
	
	this.lastTime = elapsedTime;
};

/*
	This renders each of the particles.
	The best particle is coloured green. (This should be set by a style file.)
*/
PSOPlot.prototype.renderParticles = function() {
	var scaleX = d3.scale.linear()
		.domain([this.manager.dimensions[0].min, this.manager.dimensions[0].max])
		.range([0, this.graph_width]);
		
	var scaleY = d3.scale.linear()
		.domain([this.manager.dimensions[1].min, this.manager.dimensions[1].max])
		.range([this.graph_height, 0]);
		
	// Bind the data
	var circles = this.svg.selectAll("circle").data(this.manager.particles);
	
	// Enter
	circles.enter().append("circle")
		.attr("r", 4)
		.attr("border",1);
	
	// Update
	circles
		.attr("cx", function(particle) {
			return scaleX(particle.position[0]);
			})
		.attr("cy", function(particle) {
			return scaleY(particle.position[1]);
			})
		.attr("fill",
				(function(manager) {
						return function(particle) 
								{
									if (particle.bestFitness == manager.bestFitness) {
										return "rgb(0,255,0)";
									} else {
										return "rgba(255,0,0,0.6)";
									}
								};
				})(this.manager)
			);
		
	// Exit
	circles.exit().remove();
};

/*
	This renders rectangles at the places of the sampled fitness function.
	This is shown as the background behind the particles.
*/
PSOPlot.prototype.renderFitnessFunction = function() {
	var scaleX = d3.scale.linear()
		.domain([this.manager.dimensions[0].min, this.manager.dimensions[0].max])
		.range([0, this.graph_width]);
		
	var scaleY = d3.scale.linear()
		.domain([this.manager.dimensions[1].min, this.manager.dimensions[1].max])
		.range([this.graph_height, 0]);

	// scale the colour
	var scaleValue = d3.scale.linear()
		.domain(d3.extent(this.fitnessFunctionSamples, function(s) { return s["value"]; }))
		.range([255, 0]);
    
	// Bind the data
	var rects = this.svg.selectAll("rect").data(this.fitnessFunctionSamples);
	
	// Enter
	rects.enter().append("rect")
		.attr("border",1)
		.attr("width", this.Rwpixel)
		.attr("height", this.Rhpixel);
	
	// Update
	rects
		.attr("x", function(sample) {
			return scaleX(sample["x"]);
			})
		.attr("y", function(sample) {
			var y = scaleY(sample["y"]);
			
			return y;
			})
		.attr("fill",function(sample) { 
			var c = Math.floor(scaleValue(sample["value"]));
			var col = "rgb("+c+","+c+","+c+")";
			return col;
			});
		
	// Exit
	rects.exit().remove();
};

