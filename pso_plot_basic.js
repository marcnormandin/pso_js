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
	
	// Render one frame so that particles are seen
	this.renderParticles( this.manager.particles );
};

PSOPlot.prototype.tickCallbackCallback = function (manager) {
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
			
			this.tickCallbackCallback(this.manager);
		}
	}
	
	// End the timer process
	if (this.stopAnimation) {
		return true;
	}
	
	this.lastTime = elapsedTime;
};

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
										return "rgba(255,0,0,0.4)";
									}
								};
				})(this.manager)
			);
		
	// Exit
	circles.exit().remove();
};
