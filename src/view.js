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
 * view.js - Define a renderable view containting a sphere, atmosphere
 * and markers.
 */
var GLOBE = GLOBE || {};
GLOBE.View = function(mapTexture, pickTexture, borderTexture, markerTexture, heatTexture, animationTexture, options) {

	// constants
	var ORIGIN = new THREE.Vector3(0, 0, 0);
	
	var camera;
	var scene;
	
	// globe attributes
	var radius;							// radius of the globe
	var offset;							// longitude offset/shift

	// objects - elements of the scene
	var markers;
	var sphere;
	var atmosphere;
	
	var mode;
	var markerScale;
	
	/**
	 * Initialize the globe
	 */
	function init(obj) {
		options = options || {};
		mode = options.mode || GLOBE.MapMode;
		markerScale = options.markerScale || 1;
		
		// set camera parameters
		var fov = options.fov || 30;					// field of view
		var aspectRatio = options.aspectRatio || 1;		// aspect ratio
		var zNear = options.zNear || 1;					// nearest visible point
		var zFar = options.zFar || 10000;				// farthermost visible point
		var distance = options.distance || 1000;		// distance to the object
		
		// set parameters for markers
		radius = options.radius || 200;
		offset = options.offset || 0;
		
		// set the camera
		camera = new THREE.PerspectiveCamera(fov, aspectRatio, zNear, zFar);
		camera.position.z = distance;
		
		// create a scene
		scene = new THREE.Scene();
		
		// create objects
		markers = new GLOBE.Markers(markerTexture, heatTexture, animationTexture, {
			"maxMarker": options.maxMarker,
			"markerSize": options.markerSize,
		});
		markers.setMode(mode);
		sphere = new GLOBE.Sphere({
			"radius": options.radius,
			"segments": options.segments,
			"rings": options.rings
		});
		sphere.setTexture(mapTexture);
		atmosphere = new GLOBE.Atmosphere({
			"radius": options.radius,
			"segments": options.segments,
			"rings": options.rings,
			"scale": options.scale
		});
		atmosphere.setVisibility(true);
		
		// add the objects to the scene
		scene.add(markers.system);
		scene.add(markers.animation);
		scene.add(atmosphere.mesh);
		scene.add(sphere.mesh);
		
		// make the camera and scene outside available
		obj.camera = camera;
		obj.scene = scene;
		// make functions outside available
		obj.addMarker = addMarker;
		obj.removeMarker = removeMarker;
		obj.update = update;
		obj.getLabel = getLabel;
		obj.getCC = getCC;
		obj.setMode = setMode;
		obj.getMode = getMode;
		obj.resize = resize;
		obj.setCamera = setCamera;
		obj.reset = reset;
	}
	
	/**
	 * Add a marker
	 */
	function addMarker(cc, latitude, longitude, sourceLabel, onOverflow) {
		return markers.add(cc, latitude, longitude - offset, radius * markerScale, sourceLabel, onOverflow);
	}
	
	/**
	 * Remove a marker
	 */
	function removeMarker(key) {
		markers.remove(key);
	}
	
	/**
	 * Update the view (update the vertices of the markers)
	 */
	function update() {
		markers.update();
	}
	
	/**
	 * Return the label of a marker given its key
	 */
	function getLabel(key) {
		return markers.getLabel(key);
	}
	
	/**
	 * Return the country code of the specified marker
	 */
	function getCC(key) {
		return markers.getCC(key);
	}
	
	/**
	 * Set the mode of the view
	 */
	function setMode(m) {
		mode = m;
		markers.setMode(m);
		if(m == GLOBE.PickMode) {
			atmosphere.setVisibility(false);
			sphere.setTexture(pickTexture);
		}
		else if(m == GLOBE.HeatMode) {
			atmosphere.setVisibility(true);
			sphere.setTexture(borderTexture);
		}
		else {	// MapMode
			atmosphere.setVisibility(true);
			sphere.setTexture(mapTexture);
		}
	}
	
	/**
	 * Retrieve the mode
	 */
	function getMode() {
		return mode;
	}
	
	/**
	 * Update the aspect ratio of the camera 
	 */
	function resize(aspectRatio) {
		camera.aspect = aspectRatio;
		camera.updateProjectionMatrix();
	}
	
	/**
	 * Move the camera
	 */
	function setCamera(distance, horizAngle, vertAngle) {
		// move the camera to the new position
		camera.position.x = distance * Math.sin(horizAngle) * Math.cos(vertAngle);
		camera.position.y = distance * Math.sin(vertAngle);
		camera.position.z = distance * Math.cos(horizAngle) * Math.cos(vertAngle);
		
		// let the camera look to the origin (0,0,0)
		camera.lookAt(ORIGIN);
	}
	
	/**
	 * Reset the view by removing every marker
	 */
	function reset() {
		markers.reset();
	}
	
	// init view
	init(this);
};
