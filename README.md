# pso_js

**pso_js:** Particle Swarm Optimization algorithm implemented in javascript written by Marc Normandin.

## What is Particle Swarm Optimization?

This is a javascript implementation of the **Particle Swarm Optimization** (PSO) algorithm attributed to Kennedy and Eberhart in 1995, and later to Shi and Eberhart in 1998.

PSO is a computational search algorithm whose purpose is to find the coordinates of global minimum in a multi-dimensional search space. A major benefit of the algorithm is that the function whose global minimum is to be found is not required to be differentiable or smooth. In addition, the PSO control parameters are few in number, and their respective qualitative effects on the search are simple to understand.

The main PSO parameters are the following:
- **Topology**: *The communication pattern of the particles.*
- **Inertia parameter**: *This parameter determines how much a particles velocity remains constant.*
- **Social parameter**: *This parameter influences how much a particles velocity will be towards the best found minimum of its neighbors (which could be all the particles).*
- **Cognitive parameter**: *This parameter influceces how much a particles velocity will be towards the best found minimum that it itself has visited.*

<hr/>

## Repository source code

The main algorithm is found in *pso.js*. It works with multi-dimensional functions. The plotting code is found in *pso_plot.js*, and is limited to two-dimensional search spaces. i.e. functions of the form z = f(x,y), where x, and y comprise the search dimensions. An example HTML implementation is found in *index.html*, and can be run by visiting the website for this repository: http://marcnormandin.github.io/pso_js/

<hr/>

## Example HTML implementation

You can use the interactive demo by visiting: http://marcnormandin.github.io/pso_js/

It will look similar to the following screenshot:
![Interactive PSO html page](http://i.imgur.com/CzFxIyc.png)


<hr/>

#### Written by Marc Normandin, 2015.
