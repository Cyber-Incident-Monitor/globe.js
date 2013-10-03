/**
 * globe.js library - visualizes individual data on an interactive globe
 * 
 * Based on webgl-globe hosted at the time of this writing at
 * http://code.google.com/p/webgl-globe/
 * 
 * The zoom implementation of coredumpling-webgl-globe-firefox-opera-zoom
 * at http://code.google.com/r/coredumpling-webgl-globe-firefox-opera-zoom/
 * (revision: f843783e2e43, author: Zhan Shi <coredumpling>) is used
 * here to allow zooming using firefox. Code from this source is
 * highlighted.
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
 * main.js - Define the globe.
 */
var GLOBE = GLOBE || {};
GLOBE.MapMode = 0;
GLOBE.HeatMode = 1;
GLOBE.PickMode = 2;
GLOBE.main = function(container, imgPath, options) {
	
	var view;
	var renderer;
	var tooltip;
	var position;
	var countries;
	
	var res;
	var mouseDown = false;
	var intervalID;
	
	var pickBufferUpdate;
	var mapUpdate;
	
	var modifyMarkerLabel;
	var setCountryLabel;
	
	/**
	 * Initialize the main object (the globe)
	 */
	function init(obj) {
		// reset options if no optins are supplied
		options = options || {};
		
		// define what is shown on marker tooltip
		modifyMarkerLabel = options.modifyMarkerLabel || function(label) {
			return label;
		};
		
		// define what is shown on country tooltip
		setCountryLabel = options.setCountryLabel || function(cc, markers, allMarkers) {
			return "CC: " + cc + " Markers: " + markers + " of " + allMarkers + " total";
		};
		// fetch width and height of the container or window
		var w = container.offsetWidth || window.innerWidth;
		var h = container.offsetHeight || window.innerHeight;
		container.style.backgroundColor = "#FFFFFF";
		
		// create countries
		countries = new GLOBE.Countries();
		
		// set the tooltip showing details of markers and countries
		tooltip = new GLOBE.Tooltip();
		
		// set the camera position of the globe
		var PI_HALF = Math.PI / 2;
		var INFINITY = Number.POSITIVE_INFINITY;
		position = new GLOBE.Position({
			"currentPos": new THREE.Vector3(10000, 0, 0),
			"targetPos": new THREE.Vector3(1000, PI_HALF * 1.3, PI_HALF * 0.25),
			"weights": new THREE.Vector3(0.3, 0.1, 0.1),
			"lowerLimit": new THREE.Vector3(250, -INFINITY, -PI_HALF),
			"upperLimit": new THREE.Vector3(1000, INFINITY, PI_HALF)
		});
		
		// load resources and initialize renderer and view afterwards
		loadResources(function() {
			// set renderer
			renderer = new GLOBE.Renderer(container, res.pickTexture, res.borderTexture, countries.texture, res.gradientTexture);
			renderer.updateMap();
			
			// create scene objects
			view = new GLOBE.View(renderer.mapTexture, res.pickTexture, res.borderTexture, res.markerTexture, res.heatTexture, res.animationTexture, {
				"aspectRatio": w/h,
				"offset": 10,
				"radius": 200,
			});
			
			// define pick buffer update
			pickBufferUpdate = new GLOBE.Update(function() {
				var previous = view.getMode();
				view.setMode(GLOBE.PickMode);
				renderer.updateColorPicking(view);
				view.setMode(previous);
				//console.log("pickBufferUpdate at: " + new Date());
			}, 300);
			
			// define map update (highlighting and country coloring)
			mapUpdate = new GLOBE.Update(function() {
				renderer.updateMap();
				view.update();
				//console.log("mapUpdate at: " + new Date());
			}, 100);
			
			// register functions to be accessible from the outside
			obj.reset = reset;
			obj.removeMarker = removeMarker;
			obj.addMarker = addMarker;
			obj.zoom = zoom;
			obj.rotate = rotate;
			obj.toggleView = toggleView;
			obj.resize = resize;
			obj.hasMarker = countries.hasMarker;
			
			// zoom with mousewheel in firefox (taken from coredumpling-webgl-globe-firefox-opera-zoom)
			container.addEventListener('DOMMouseScroll', onMouseWheel, false);
			// zoom with mousewheel in chrome
			container.addEventListener('mousewheel', onMouseWheel, false);
			
			// pick color and move the globe with the mouse (grabbing)
			container.addEventListener('mousedown', onMouseDown, false);
			container.addEventListener('mousemove', onMouseMove, false);
			container.addEventListener('mouseout', onMouseOut, false);
			
			// resize event listener
			window.addEventListener('resize', resize, false);
			
			// unload event
			window.addEventListener('beforeunload', unloadResources);
			
			// start rendering the globe
			animate();
		});
	}
	
	/**
	 * Load resources and call the supplied callback function if finished
	 */
	function loadResources(callback) {
		var resCount = 0;
		
		// function to be called afer loading one texture
		var onLoad = function(texture) {
			resCount--;
			console.log(resCount + " textures left to be loaded (" + new Date() + ")");
			if (resCount == 0) {
				callback();
			}
		};
		
		// function to load a texture with specified properties
		var load = function(path, minFilter, magFilter) {
			// minFilter: if the object is far away
			// magFilter: if the object is near
			// THREE.NearestFilter: sharp edges
			// THREE.LinearFilter: smooth edges
			resCount++;
			var texture = THREE.ImageUtils.loadTexture(path, {}, onLoad);
			// specify the texture filter
			if (minFilter !== undefined) {
				texture.minFilter = minFilter;
			}
			if (magFilter !== undefined) {
				texture.magFilter = magFilter;
			}
			return texture;
		};
		
		// every texture to be used in the globe
		res = {
			// load pickTexture without any interpolation and mipmaps
			"pickTexture": load(imgPath + 'countries_colored.png', THREE.NearestFilter, THREE.NearestFilter),
			// load borderTexture with linear filtering and without mipmaps
			"borderTexture": load(imgPath + 'borders_oceans_lakes.png',  THREE.LinearFilter, THREE.LinearFilter),
			// load markerTexture with linear filtering and without mipmaps
			"markerTexture": load(imgPath + 'circle.png', THREE.LinearFilter, THREE.LinearFilter),
			// load animationTexture with linear filtering and without mipmaps
			"animationTexture": load(imgPath + 'animation.png', THREE.LinearFilter, THREE.LinearFilter),
			// load heatTexture without any interpolation and mipmaps
			"heatTexture": load(imgPath + 'heat.png', THREE.NearestFilter, THREE.NearestFilter),
			// load gradientTexture without any interpolation and mipmaps
			"gradientTexture": load(imgPath + 'gradient.png', THREE.NearestFilter, THREE.NearestFilter)
		};
	}
	
	/**
	 * Unload textures to avoid memory leaks
	 */
	function unloadResources(event) {
		for (var key in res) {
			res[key].dispose();
			console.log("disposed " + key);
		}
		renderer.dispose();
		//event.preventDefault();
	}
	
	/**
	 * Start rendering the globe
	 */
	function animate() {
		requestAnimationFrame(animate);
		var error = position.getError();
		// when to update the pick buffer:
		// - lower bound should be 1e-6 or less since 1e-5 lead to
		//   inaccuracy if zoomed near to the surface
		// - upper bound should be 1e-4 or smaller since a higher value
		//	 means more frequent updates at fast moving globe
		//	 (If the globe moves as fast as possible holding a key
		//	 the error is between 1e-2 and 1e-3. An error of 1e-1 or
		//	 higher is hard to achive.)
		if (error < 1e-4 && error > 1e-6) {
			pickBufferUpdate.execute();
		}
		render();
	}
	
	/**
	 * Render the globe
	 */
	function render() {
		var pos = position.doStep();
		view.setCamera(pos.x, pos.y, pos.z);
		renderer.renderView(view);
	}
	
	/**
	 * Zoom the globe on mouse scroll if the mouse is above the globe
	 * (taken from coredumpling-webgl-globe-firefox-opera-zoom)
	 */
	function onMouseWheel(event) {
		event.preventDefault();		// disable default behaviour
		// zoom in google chrome etc.
		if (event.wheelDeltaY) {
			zoom(event.wheelDeltaY * 0.7);
		//zoom in firefox
		} else {
			zoom(event.detail * -36);
		}
		return false;	// disable default behaviour
	}
	
	/**
	 * Toggle between the heatmap and normal view
	 */
	function toggleView() {
		var mode = view.getMode();
		if (mode == GLOBE.HeatMode) {
			view.setMode(GLOBE.MapMode);
		} else {
			view.setMode(GLOBE.HeatMode);
		}
	}
	
	/**
	 * Resize to fit it into the new window size
	 */
	function resize() {
		// only resize if the container exists
		if (container.style.display != "none") {
			renderer.resize(view);
			pickBufferUpdate.execute();
		}
	}
	
	
	/**
	 * Zoom the globe
	 */
	function zoom(delta) {
		tooltip.hide();
		// only zoom if no mouse down
		if (!mouseDown) {
			var pos = new THREE.Vector3(-delta, 0, 0);
			position.adjustTarget(pos);
		}
	}
	
	/**
	 * Rotate the globe
	 */
	function rotate(horizAngle, vertAngle) {
		tooltip.hide();
		// only rotate if no mouse down
		if (!mouseDown) {
			var pos = new THREE.Vector3(0, horizAngle, vertAngle);
			position.adjustTarget(pos);
		}
	}
	
	/**
	 * If the mouse leaves the renderer hide the tooltip
	 */
	function onMouseOut(event) {
		tooltip.hide();
		mouseDown = false;
		document.removeEventListener('mouseup', onMouseUp, false);
		container.style.cursor = 'auto';
	}
	
	/**
	 * If the mouse is pressed get its position to be able to move the globe
	 */
	function onMouseDown(event) {
		mouseDown = true;
		event.preventDefault();

		document.addEventListener('mouseup', onMouseUp, false);
		var pos = new THREE.Vector3(0, -event.clientX, event.clientY);
		position.store(pos);

		container.style.cursor = 'move';
		tooltip.hide();
	}
	
	/**
	 * Register mouseup event to stop moving the globe
	 */
	function onMouseUp(event) {
		mouseDown = false;
		document.removeEventListener('mouseup', onMouseUp, false);
		container.style.cursor = 'auto';
	}

	/**
	 * Move the globe on mouse move and log the position of the mouse
	 */
	function onMouseMove(event) {
		if (mouseDown) {
			tooltip.hide();
			var pos = new THREE.Vector3(0, -event.clientX, event.clientY);
			position.adjustTargetRelative(pos, 0.000000005);
		} else {	// TODO only show tooltip if the globe does not move
			setLabel(event.clientX, event.clientY, event.pageX, event.pageY);
			mapUpdate.execute();
		}
	}
	
	/**
	 * Set either the marker tooltip or the country tooltip
	 */
	function setLabel(posX, posY, screenPosX, screenPosY) {
		// retrieve the color (FBO) at the mouse position (color picking)
		var color = renderer.getPixel(posX, posY);
		//console.log(color.r, color.g, color.b, color.a);
		// if there is no transparency in the picked color
		if (color.a == 255) {
			// if there is no red in the color show marker label
			if (color.r == 0) {
				var hex = (color.r << 16) + (color.g << 8) + (color.b);
				//console.log("marker", hex);
				// show only standard label information if advanced information is not requested (default is advanced)
				var label = modifyMarkerLabel(view.getLabel(hex));
				tooltip.show(label, screenPosX, screenPosY);
			}
			// if the color has red color part show country label
			if (color.r > 0 && color.r < 254) {
				var cc = countries.getCC(color.r);
				var markers = countries.getMarkers(color.r);
				var allMarkers = countries.getAllMarkers();
				var label = setCountryLabel(cc, markers, allMarkers);
				renderer.setPickIndex(color.r);		// set index for hovered land (highlight indexed country)
				tooltip.show(label, screenPosX, screenPosY);
			}
		}
		// if there is neither a marker nor a country below the mouse
		// remove the tooltip and disable country highlighting
		else {
			tooltip.hide();
			renderer.setPickIndex(-1.0);	// remove index for hovered land (do not highlight any country)
		}
	}
	
	/**
	 * Add a marker
	 */
	function addMarker(cc, latitude, longitude, sourceLabel) {
		// add marker
		var onOverflow = countries.dec;
		var returnMarker = view.addMarker(cc, latitude, longitude, sourceLabel, onOverflow);
		countries.inc(cc);
		pickBufferUpdate.execute();
		mapUpdate.execute();
		return returnMarker;
	}
	
	/**
	 * Remove a marker
	 */
	function removeMarker(key) {
		var cc = view.getCC(key);
		view.removeMarker(key);
		countries.dec(cc);
		pickBufferUpdate.execute();
		mapUpdate.execute();
	}
	
	/**
	 * Reset the globe (colors of countries, remove markers, reset number of markers)
	 */
	function reset() {
		countries.reset();
		view.reset();
		pickBufferUpdate.execute();
		mapUpdate.execute();
	}
	
	// init main
	init(this);
};
