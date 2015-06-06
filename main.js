"use strict"
var numIterations = 0;
var maxIterations = Infinity;

// default value
var simulationIsRunning = false;

var plot = undefined;
var manager = undefined;
var ff = undefined;

var settingsChanged = true;

function toggleSimulation() {
	if (!simulationIsRunning) {
		startSimulation();
	} else {
		stopSimulation();
	}
}

function stopSimulation() {
	simulationIsRunning = false;
	plot.stopAnimation = true;
	document.getElementById("toggleSimulationButton").innerHTML = "Start Simulation";
	document.getElementById("toggleSimulationButton").className = "inactive";
}

// Convert from PSO scale to Function scale
function scale(xPSO, dimension) {
	var functionX = (0.5*dimension.max*(1+xPSO) + 0.5*dimension.min*(1-xPSO));
	return functionX;
}

// This is called every iteration of the PSO algorithm
function iterationCallback (manager) {
	var x = scale(manager.bestPosition[0], ff.dimensions[0]);
	var y = scale(manager.bestPosition[1], ff.dimensions[1]);
	
	document.getElementById("outputBestPosition").innerHTML
		= "( " + x.toFixed(3) + ", " + y.toFixed(3) + " )";
	
	numIterations++;
	
	document.getElementById("outputNumIterations").innerHTML
		= numIterations;
		
	if (numIterations >= maxIterations) {
		stopSimulation();
		return false;
	}
	
	return true;
}

function displayContour (name) {
	// Display the contour if one is present
	if (name != "") {
		document.getElementById("outputPlotImageContour").style.display = "initial";
		document.getElementById("outputPlotImageContour").setAttribute("src", name);
	} else {
		document.getElementById("outputPlotImageContour").style.display = "none";
	}
}

function displayThreeD (name) {
	if (name != "") {
		document.getElementById("outputPlotImageThreeD").style.display = "initial";
		document.getElementById("outputPlotImageThreeD").setAttribute("src", name);
	} else {
		document.getElementById("outputPlotImageThreeD").style.display = "none";
	}
}


function loadFittingFunction() {
		var FF_Salomon = function() {

		this.dimensions = [ {min: -4, max: 4}, {min: -4, max: 4} ];
		this.global = {x: 0, y: 0};
		this.imageSrcContour = "http://i.imgur.com/3dg4gAL.jpg";
		this.imageSrcThreeD = "http://i.imgur.com/KcOFABP.png";
		
		this.compute = function (x, y) 
						{
							//console.log(this.dimensions[0].min);
							x = scale(x, this.dimensions[0]);
							y = scale(y, this.dimensions[1]);
							if ((x >= this.dimensions[0].min) && (x <= this.dimensions[0].max)
								&& (y >= this.dimensions[1].min) && (y <= this.dimensions[1].max)) 
							{
								var r = Math.sqrt(x*x + y*y);
								var f = 1 - Math.cos(2*Math.PI*r) + 0.1*r;
								return f;
							} else {
								return Infinity;
							}
						}
					.bind(this);
	};

	var FF_Bohachevsky = function() {

		this.dimensions = [ {min: -2, max: 2}, {min: -2, max: 2} ];
		this.global = {x: 0, y: 0};
		this.imageSrcContour = "http://i.imgur.com/phIMicg.png";
		this.imageSrcThreeD = "http://i.imgur.com/DZj4zdU.png";

		
		this.compute = function (x, y) 
						{
							//console.log(this.dimensions[0].min);
							x = scale(x, this.dimensions[0]);
							y = scale(y, this.dimensions[1]);
							if ((x >= this.dimensions[0].min) && (x <= this.dimensions[0].max)
								&& (y >= this.dimensions[1].min) && (y <= this.dimensions[1].max)) 
							{
								var f = x*x + 2 *y*y - 0.3*Math.cos(2*Math.PI*x) - 0.4*Math.cos(4*Math.PI*y) + 0.7;

								return f;
							} else {
								return Infinity;
							}
						}
					.bind(this);
	};

	var FF_Griewank = function() {

		this.dimensions = [ {min: -40, max: 40}, {min: -40, max: 40} ];
		this.global = {x: 0, y: 0};
		this.imageSrcContour = "http://i.imgur.com/vKt5dVe.png";
		this.imageSrcThreeD = "http://i.imgur.com/auPzgxp.png";

		this.compute = function (x, y) {
			x = scale(x, this.dimensions[0]);
			y = scale(y, this.dimensions[1]);
			if ((x >= this.dimensions[0].min) && (x <= this.dimensions[0].max)
				&& (y >= this.dimensions[1].min) && (y <= this.dimensions[1].max)) 
			{
				var f = 1 + ((1/4000)*(x*x+y*y))-(Math.cos(x)*Math.cos(y/Math.sqrt(2)));
				
				return f;
			} else {
				return Infinity;
			}
		}.bind(this);
	};

	var FF_Michaelwicz = function() {

		this.dimensions = [ {min: 0, max: 4}, {min: 0, max: 4} ];
		this.global = {x: 2.20319, y: 1.57049};
		this.imageSrcContour = "http://i.imgur.com/aHZ4751.png";
		this.imageSrcThreeD = "http://i.imgur.com/gNmFkhF.png";
		
		this.compute = function (x, y) {
			x = scale(x, this.dimensions[0]);
			y = scale(y, this.dimensions[1]);
			if ((x >= this.dimensions[0].min) && (x <= this.dimensions[0].max)
				&& (y >= this.dimensions[1].min) && (y <= this.dimensions[1].max)) 
			{
				var a = Math.sin(x*x / Math.PI);
				var b = Math.sin(2*y*y / Math.PI);
				var a20 = 1;
				var b20 = 1;
				for (var i = 0; i < 20; i++) {
					a20 *= a;
					b20 *= b;
				}
				var f = -Math.sin(x)*a20 - Math.sin(y)*b20;
				
				return f;
			} else {
				return Infinity;
			}
		}.bind(this);
	};

	/*
		This Fitness Function uses an image (translated to grey-scale) as the fitness function values.
		It assumes fixed 200x200 pixel images.
		
		It works by rendering an image to a 'canvas', and then querying that canvas for the pixel values.
		The downside is that the canvas is rendered, when not needed.
	*/
	var FF_Image = function(filename) 
	{
		this.imageSrc = filename;
		this.imageSrcContour = "";
		this.imageSrcThreeD = "";
		
		this.myImg = new Image();
		this.myImg.src = filename;
		this.context = document.getElementById('outputPlotImageCanvas').getContext('2d');
		this.context.drawImage(this.myImg, 0, 0);
		
		// Pictures are assumed to be 200x200 pixels		
		var w = 200;
		var h = 200;
		this.dimensions = [ {min: 0, max: w}, {min: 0, max: h} ];
		
		this.compute = function (x, y) 
						{
							x = scale(x, this.dimensions[0]);
							y = scale(y, this.dimensions[1]);
							//console.log(this.dimensions[0].max);
							if ((x >= this.dimensions[0].min) && (x <= this.dimensions[0].max)
								&& (y >= this.dimensions[1].min) && (y <= this.dimensions[1].max)) 
							{
								var sample_x = x;
								var sample_y = this.dimensions[1].max - y;
								// Returns an ImageData object that copies the pixel data for the specified rectangle on a canvas
								var pixelData = this.context.getImageData(Math.floor(sample_x), Math.floor(sample_y), 1, 1).data;
								var f = 255 - (pixelData[0] + pixelData[1] + pixelData[2]);
								
								return f;
							} else {
								return Infinity;
							}
						}.bind(this);
	};

	// Load the user chosen fitness function
	switch (window.localStorage["inputFunction"]) {
		case "Salomon":
			ff = new FF_Salomon;
			break;
		case "Bohachevsky": 
				ff = new FF_Bohachevsky;
				break;
		case "Griewank":
			ff = new FF_Griewank;
			break;
		case "Michaelwicz":
			ff = new FF_Michaelwicz;
			break;
		case "Image: Noise #1":
			ff = new FF_Image("http://www.revisemri.com/tools/kspace/images/k_randnoise.jpg");
			break;
		case "Image: Spiral":
			ff = new FF_Image("http://www.gifwave.com/media/102045_art-processing-adam-ferriss-p5-ellipse_200s.gif");
			break;
		default:
			console.assert(false);
	}
}


function loadManager() {
	// Create the main PSO computation object
	var numParticles = parseFloat(document.getElementById("inputNumParticles").value);
	manager = new PSO.Manager( ff, numParticles );
	manager.setInertiaScaling(true, 
		parseFloat(document.getElementById("inputInertiaWeightBegin").value),
		parseFloat(document.getElementById("inputInertiaWeightEnd").value),
		parseFloat(document.getElementById("inputInertiaWeightIterationRange").value) );
	manager.socialWeight = parseFloat(document.getElementById("inputSocialWeight").value);
	manager.cognitiveWeight = parseFloat(document.getElementById("inputCognitiveWeight").value);

	switch (document.getElementById("inputTopology").value) {
		case "Ring":
			manager.topology = "ring";
			manager.numNeighbors = parseFloat(document.getElementById("inputNumNeighbors").value);
			break;
		case "Fully Connected":
			// this should be the manger's default (but set it to be sure)
			manager.topology = "fully connected";
			manager.numNeighbors = parseFloat(manager.particles.length);
			break;
		default:
			console.assert(false);
	}
}


function loadAnimator() {
	// Create the PSO plot animator object
	plot = new PSOPlot (manager, "plot");
	plot.normalParticleRadius = parseFloat(document.getElementById("inputParticleRadius").value);
	plot.bestParticleRadius = parseFloat(document.getElementById("inputBestParticleRadius").value);
	plot.bestMinimumRadius = parseFloat(document.getElementById("inputMinimumRadius").value);
	plot.sampleNumSize = parseFloat(document.getElementById("inputSampleGridSize").value);
	plot.tickCallbackCallback = iterationCallback.bind(this);
	plot.iterationsPerSecond = parseFloat(document.getElementById("inputIterationsPerSecond").value);

	if (document.getElementById("inputDisplayDust").checked) {
		plot.featureDisplayDustEnabled = true;
	} else {
		plot.featureDisplayDustEnabled = false;
	}

	if (document.getElementById("inputDisplayLBests").checked) {
		plot.featureDisplayLBests = true;
	} else {
		plot.featureDisplayLBests = false;
	}
	plot.lbestRadius = parseFloat(document.getElementById("inputLBestRadius").value);

	plot.startAnimation();

	// Set the animation and computation stopping condition
	switch (document.getElementById("inputStoppingCondition").value) 
	{
		case "none":
			maxIterations = Infinity;
			break;
		case "25":
			maxIterations = 25;
			break;
		case "50":
			maxIterations = 50;
			break;
		case "100":
			maxIterations = 100;
			break;
		case "200":
			maxIterations = 200;
			break;
		case "300":
			maxIterations = 300;
			break;
		case "400":
			maxIterations = 400;
			break;
		case "500":
			maxIterations = 500;
			break;
		default:
			console.log("Invalid stopping condition.");
		 	console.assert(true);
	}

	simulationIsRunning = true;
	document.getElementById("toggleSimulationButton").innerHTML = "Stop Simulation";
}

/*
	This is the main function in this HTML file.
	
	It begins a new simulation by querying the input elements
	for their data, and then creating a new PSO computation object
	as well as a new PSO plot animation object.
*/
function startSimulation() {
	saveSettings();

	// Check if any current simulation is running. If so, end it.
	if (typeof plot !== 'undefined') {
		plot.stopAnimation = true;
	}

	document.getElementById("toggleSimulationButton").className = "active";

	numIterations = 0;

	loadFittingFunction();
	loadManager();
	loadAnimator();

	// Show the extra information about the fitting function
	displayContour(ff.imageSrcContour);
	displayThreeD(ff.imageSrcThreeD);

	if (typeof(ff.global) !== 'undefined') {
		document.getElementById("outputTruePosition").innerHTML = "( " + ff.global.x.toFixed(3) + ", " + ff.global.y.toFixed(3) + " )";
	} else {
		document.getElementById("outputTruePosition").innerHTML = "<i>not applicable</i>";
	}
}

// This manages the menu system
$(function() {
	
	$('.tab-panels .tabs li').on('click', function() {
		// Time to open a panel
		var panelOpenSpeedMs = 250;

		// Time to close a panel
		var panelCloseSpeedMs = 250;

		// Get the particular tab-panel the 'tab' is part of
		var panel = $(this).closest('.tab-panels');
		
		// The current 'active' tab (this can be null)
		var activeTab = panel.find('.tabs li.active');
		
		// The current 'active' panel (this can be null)
		var activePanel = panel.find('.panel.active');
		
		// The selected tab (this can NOT be null)
		var selectedTab = $(this);
		
		// The associated selected panel (this can NOT be null)
		var panelToShowRel = $(this).attr('rel');
		var panelToShow = $('#'+panelToShowRel);

		// The 'active' tab should go inactive (no matter what)
		if (activeTab.length) {
			activeTab.removeClass("active");
		} else {
			// no tab to remove 'active' from
		}
		
		// If the selected tab is not the active tab, then make it active
		if (!(selectedTab.is(activeTab))) {
			selectedTab.addClass("active");
		} else {
			// the active tab was clicked on, so no other
			// active tab to highlight
		}
		
		// If the active tab was selected, no panels should be open
		if (selectedTab.is(activeTab)) {
			// If the active panel exists, close it
			if (activePanel.length) {
				activePanel.slideUp(panelCloseSpeedMs, function() {
					activePanel.removeClass("active");
				});
			} else {
				// there is no active panel to hide
			}
		} else {
			if (activePanel.length) {
				// A panel is already open, so close it, then open the new one.
				activePanel.slideUp(panelCloseSpeedMs, function() {
					activePanel.removeClass('active');
					panelToShow.slideDown(panelOpenSpeedMs, function() {
						panelToShow.addClass('active');
					});
				});
			} else {
				// No panel is open, so just open the new one
				panelToShow.slideDown(panelOpenSpeedMs, function() {
					panelToShow.addClass("active");
				});
			}
		}
	});

});

function loadDefaultSettings () {
	window.localStorage["inputFunction"] = "Salomon";
}

function saveSettings () {
	window.localStorage["inputFunction"] = document.getElementById("inputFunction").value;
}

function handle_storage( e ) {
	console.log("localStorage changed");
}

window.addEventListener("storage", handle_storage, false);

if (typeof(Storage) !== 'undefined') {
	alert('Using HTML5 localStorage!');
}

if (!window.localStorage["inputFunction"]) {
	loadDefaultSettings();
}

toggleSimulation();

