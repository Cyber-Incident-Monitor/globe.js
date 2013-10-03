/**
 * globe.js library - visualizes individual data on an interactive globe
 * 
 * Based on webgl-globe hosted at the time of this writing at
 * http://code.google.com/p/webgl-globe/
 * 
 * Copyright 2011 Data Arts Team, Google Creative Lab
 * Copyright 2013 Matthias Gazzari, Annemarie Mattmann, André Wolski
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * position.js - Define an alterable position described in spherical
 * coordinates (radius, horizontal angle and vertical angle).
 * More detailed a target position can be set and iteratively
 * approximated dependend on predefined speeds.
 * Additionally the position can be changed by storing a third point
 * and moving relatively to it.
 * An error calculation observes the current relative error dependend on
 * the difference between the current position and the target position.
 */
var GLOBE = GLOBE || {};
GLOBE.Position = function(options) {
	
	// constants
	var INFINITY = Number.POSITIVE_INFINITY;
	var ZEROS = new THREE.Vector3(0, 0, 0);
	var ONES = new THREE.Vector3(1, 1, 1);
	var MIN = new THREE.Vector3(-INFINITY, -INFINITY, -INFINITY);
	var MAX = new THREE.Vector3(INFINITY, INFINITY, INFINITY);

	// position attributes
	var currentPos;			// the current position
	var targetPos;			// the target position
	var storedPos;			// stored position of a former current position
	var lastTarget;			// last stored target position
	
	// additional attributes
	var lowerLimit;			// lower limit of the target position
	var upperLimit;			// upper limit of the target position
	var weights;			// the weights
	
	// error calculation
	var difference;			// difference between target and current pos
	
	/**
	 * Initialize the position object
	 */
	function init(obj) {
		options = options || {};
		
		// set position attributes
		currentPos = options.currentPos || ZEROS.clone();
		targetPos = options.targetPos || ZEROS.clone();
		storedPos = currentPos.clone();
		lastTarget = targetPos.clone();
		
		// set limits and weights
		lowerLimit = options.lowerLimit || MIN.clone();
		upperLimit = options.upperLimit || MAX.clone();
		weights = options.weights || ONES.clone();
		for (i = 0; i < 3; i++) {
			var component = weights.getComponent(i);
			if (component <= 0 || component > 1) {
				console.log("The " + i + "th element of initialWeights is not in the interval (0,1]");
				weights = ONES.clone();
				break;
			}
		}
		// set error
		difference = new THREE.Vector3();
		
		// clamp target to upper and lower limits
		clampTarget();
		
		updateDifference();
		
		// make functions outside available
		obj.adjustTarget = adjustTarget;
		obj.store = store;
		obj.adjustTargetRelative = adjustTargetRelative;
		obj.doStep = doStep;
		obj.getError = getError;
	}
	
	/**
	 * Return a zoom damp, damping a zoom movement (changing radius)
	 */
	function getZoomDamp() {
		return new THREE.Vector3(1, currentPos.x*currentPos.x, currentPos.x*currentPos.x);
	}
	
	/**
	 * Clamp the target to the defined limits
	 */
	function clampTarget() {
		targetPos.clamp(lowerLimit, upperLimit);
	}
	
	/**
	 * Adjust the target by adding a delta vector and clamp the result
	 * to the upper and lower limits
	 */
	function adjustTarget(delta) {
		//console.log("delta", delta.x, delta.y, delta.z);
		var zoomDamp = getZoomDamp();
		delta.multiply(zoomDamp);
		targetPos.add(delta);
		
		clampTarget();
		updateDifference();
	}
	
	/**
	 * Store the latest target position and the given position (pos) to
	 * be enabled to adjust the target relatively to the given position
	 */
	function store(pos) {
		lastTarget.copy(targetPos);
		storedPos.copy(pos);
	}
	
	/**
	 * Adjust the target by adding a vector to the stored/last
	 * target position (lastTarget). The vector is calculated by
	 * subtracting the given position (pos) by the previously stored
	 * position (storedPos).
	 * Additionally the result is clamped to the upper and lower limits.
	 */
	function adjustTargetRelative(pos, damp) {
		var damp = damp || 1;
		var zoomDamp = getZoomDamp();
		var vec = new THREE.Vector3();
		vec.subVectors(pos, storedPos);
		vec.multiplyScalar(damp);
		vec.multiply(zoomDamp);
		targetPos.addVectors(lastTarget, vec);
		clampTarget();
		updateDifference();
	}
		
	/**
	 * Increment the current position (make a transition) by adding
	 * a fractional, defined by the weights, of the difference between
	 * the target position and the current position
	 */
	function doStep() {
		//debugVector("currentPos", currentPos);
		//debugVector("targetPos", targetPos);
		//debugVector("difference", difference);
		var intermediate = new THREE.Vector3();
		intermediate.multiplyVectors(difference, weights);
		currentPos.add(intermediate);
		updateDifference();
		return currentPos;
	}
	
	/**
	 * Calculate the relative error of current to target position
	 */
	function getError() {
		//debugVector("currentPos", currentPos);
		//debugVector("targetPos", targetPos);
		//debugVector("difference", difference);
		return difference.length() / (targetPos.length() || 1);
	}
	
	/**
	 * Update the difference between target and current position
	 */
	function updateDifference() {
		difference.subVectors(targetPos, currentPos);
	}
	
	/**
	 * Show a debug message for a vector
	 */
	function debugVector(name, vec) {
		console.log(name, vec.x, vec.y, vec.z, vec.length());
	}
	
	// init position
	init(this);
};
