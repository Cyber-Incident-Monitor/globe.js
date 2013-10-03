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
 * markers.js - Defines marker and heat using three.js particle systems
 * (starts using marker modus)
 */
var GLOBE = GLOBE || {};
GLOBE.Markers = function(markerTexture, heatTexture, animationTexture, options) {

	// constants
	var INFINITY = Number.POSITIVE_INFINITY;
	
	// internal marker attributes
	var marker;				// array of vertices representing a marker
	var label;				// labels of every marker
	var countryCode;		// country code of every marker
	var nextMarker;			// index of the next marker
	var markerSystem;		// the particle system containing the markers
	var maxMarker;			// the maximum number of markers
	var markerMaterial;		// the material of the markers/heat particle
	
	// internal animation attributes
	var animation;
	var nextAnimation;
	var animationSystem;
	var maxAnimation;
	var animationMaterial;
	
	/**
	 * Initialize the particle system by indexing every available marker with a
	 * color key starting at 0 (black) up to 16777215 (white).
	 */
	function init(obj) {
		// evaluate options
		options = options || {};
		maxMarker = options.maxMarker || 10000;
		maxAnimation = options.maxAnimation || 100;
		// have at least one marker
		if (maxMarker < 1) {
			maxMarker = 1;
		}
		// do not exceed 2**24 = 16777216 markers (RGB coded = 24bit)
		if (maxMarker > 16777216) {
			maxMarker = 16777216;
		}
		var markerSize = options.markerSize || 15;
		var heatSize = options.heatSize || 10;
		var animationSize = options.animationSize || 40;
		var animationDuration = options.animationDuration || 1.0;
		var heatColor = options.heatColor || new THREE.Vector4(1.0, 0.0, 0.0, 0.95);
		var circleColor = options.circleColor || new THREE.Vector4(0.8, 0.0, 0.0, 1.0);
		
		// init marker, label, nextMarker, animation and country code
		marker = [maxMarker];
		label = [maxMarker];
		countryCode = [maxMarker];
		animation = [maxAnimation];
		nextMarker = 0;
		nextAnimation = 0;
		
		// init vertices for marker
		var markerGeometry = new THREE.Geometry();
		for (var i = 0; i < maxMarker; i++) {
			marker[i] = new THREE.Vector3(INFINITY, INFINITY, INFINITY);
			markerGeometry.vertices.push(marker[i]);
			
			markerGeometry.colors[i] = new THREE.Color(i);
		}
		
		// init vertices for animation
		var animationGeometry = new THREE.Geometry();
		for (var i = 0; i < maxAnimation; i++) {
			animation[i] = new THREE.Vector3(INFINITY, INFINITY, INFINITY);
			animationGeometry.vertices.push(animation[i]);
		}
		
		// define the material of a marker
		var markerUniforms = {
			markerTexture: {type: "t", value: markerTexture},
			heatTexture: {type: "t", value: heatTexture},
			mode: {type: "i", value: GLOBE.MapMode},
			markerSize: {type: "f", value: markerSize},
			heatSize: {type: "f", value: heatSize},
			heatColor: {type: "v4", value: heatColor},
			circleColor: {type: "v4", value: circleColor}
		};
		
		// determine point size (mode dependent), vertex color and point position
		var markerVertexShader = [
			"uniform float heatSize;",
			"uniform float markerSize;",
			"uniform float animationSize;",
			"uniform int mode;",
			"varying vec3 vColor;",
			"void main() {",
			"	if(mode == 2) {",
			"		// PickMode",
			"		gl_PointSize = markerSize;",
			"	}",
			"	else if(mode == 1) {",
			"		// HeatMode",
			"		gl_PointSize = heatSize;",
			"	}",
			"	else {",
			"		// MapMode",
			"		gl_PointSize = markerSize;",
			"	}",
			"	vColor = color;",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
			"}",
		].join("\n");
		
		// determine the color of the marker (mode dependent)
		var markerFragmentShader = [
			"uniform sampler2D markerTexture;",
			"uniform sampler2D heatTexture;",
			"uniform int mode;",
			"uniform vec4 circleColor;",
			"uniform vec4 heatColor;",
			"varying vec3 vColor;",
			"void main() {",
			"	if (mode == 2){",
			"		// PickMode",
			"		gl_FragColor = vec4(vColor, 1.0);",
			"	}",
			"	else if (mode == 1) {",
			"		// HeatMode",
			"		vec4 heatTexel = texture2D(heatTexture, gl_PointCoord);",
			"		// Subtract the predefined heatColor from the texel to shape",
			"		// the heat particle. The resulting color will be subtracted",
			"		// (subtractive blending) from the background thus decreasing",
			"		// the alpha value of the heat point",
			"		gl_FragColor = heatTexel - heatColor;",
			"	}",
			"	else {",
			"		// MapMode",
			"		vec4 markerTexel = texture2D(markerTexture, gl_PointCoord);",
			"		gl_FragColor = markerTexel * circleColor;",
			"	}",
			"}",
		].join("\n");
		
		markerMaterial = new THREE.ShaderMaterial({
			"uniforms": markerUniforms,
			"vertexShader": markerVertexShader,
			"fragmentShader": markerFragmentShader,
			"transparent": true,
			"vertexColors": THREE.VertexColors,
			"blending": THREE.NormalBlending,
			"depthWrite": false,
		});
		
		// define the material of an animation
		var animationAttributes = {
			timeout: {type: "f", value: []}
		};
		var animationUniforms = {
			texture: {type: "t", value: animationTexture},
			mode: {type: "i", value: GLOBE.MapMode},
			time: {type: "f", value: 0.0},
			animationDuration: {type: "f", value: animationDuration},
			size: {type: "f", value: animationSize},
			circleColor: {type: "v4", value: circleColor}
		};
		
		// determine the point size, position and relative time of animation
		var animationVertexShader = [
			"uniform float size;",
			"uniform float time;",
			"uniform float animationDuration;",
			"attribute float timeout;",
			"varying float relTime;",
			"void main() {",
			"	gl_PointSize = size;",
			"	relTime = (timeout - time) / animationDuration;",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
			"}",
		].join("\n");
		
		// determine the color of the marker mode dependent
		var animationFragmentShader = [
			"uniform sampler2D texture;",
			"uniform int mode;",
			"uniform vec4 circleColor;",
			"uniform vec4 heatColor;",
			"varying float relTime;",
			"void main() {",
			"	if (mode == 0) {",
			"		// MapMode",
			"		vec4 texel = texture2D(texture, gl_PointCoord);",
			"		vec4 ratio = vec4(1.0 , 1.0, 1.0, relTime);",
			"		gl_FragColor = texel * circleColor*ratio;",
			"	}",
			"	else {",
			"		// disable animation in every other mode",
			"		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);",
			"	}",
			"}",
		].join("\n");
		
		animationMaterial = new THREE.ShaderMaterial({
			"attributes": animationAttributes,
			"uniforms": animationUniforms,
			"vertexShader": animationVertexShader,
			"fragmentShader": animationFragmentShader,
			"transparent": true,
			"blending": THREE.NormalBlending,
			"depthWrite": false,
		});
		
		// apply the geometry and the material to generate particle systems
		markerSystem = new THREE.ParticleSystem(markerGeometry, markerMaterial);
		animationSystem = new THREE.ParticleSystem(animationGeometry, animationMaterial);
		
		// start timer to update the time uniform of the animation
		// (the value is a float expressing seconds since startup)
		// to avoid rounding errors the time is incremented every 1/64s
		setInterval(function() {
			animationMaterial.uniforms.time.value += 0.015625;
		}, 15.625);
		
		// make the particle and animation systems outside available
		obj.system = markerSystem;
		obj.animation = animationSystem;
		
		// make functions outside available
		obj.add = add;
		obj.remove = remove;
		obj.update = update;
		obj.setMode = setMode;
		obj.getLabel = getLabel;
		obj.getCC = getCC;
		obj.reset = reset;
	}
	
	/**
	 * Add a marker to the specified position by moving one from an invisible
	 * place to a visible one, animate it, and return its key
	 */
	function add(cc, latitude, longitude, radius, sourceLabel, onOverflow) {
		// if the marker is already in use execute the supplied onOverflow function
		if (inUse(marker[nextMarker])) {
			onOverflow(countryCode[nextMarker]);
		}
		// convert from geographical coordinates into cartesian
		var cartesian = convert(latitude, longitude, radius);
		// set marker, animation, label and country code
		marker[nextMarker].set(cartesian.x, cartesian.y, cartesian.z);
		animation[nextAnimation].set(cartesian.x, cartesian.y, cartesian.z);
		label[nextMarker] = sourceLabel;
		countryCode[nextMarker] = cc;
		// set timeout of marker animation
		// TODO if animation
		animationMaterial.attributes.timeout.value[nextAnimation] = animationMaterial.uniforms.time.value + 1.0;	// TODO animation duration as option
		animationMaterial.attributes.timeout.needsUpdate = true;
		animationSystem.geometry.verticesNeedUpdate = true;
		
		// determine the key to be returned
		var returnMarker = nextMarker;
		
		// increment (with modulo) the nextMarker and nextAnimation
		nextMarker = (nextMarker + 1) % maxMarker;
		nextAnimation = (nextAnimation + 1) % maxAnimation;
		
		return returnMarker;
	}
	
	/**
	 * Return true if the corresponding marker is in use
	 */
	function inUse(marker) {
		return !(marker.x == INFINITY && marker.y == INFINITY && marker.z ==INFINITY);
	}
	
	/**
	 * Remove a specified marker by moving it out of the visibility range
	 */
	function remove(key) {
		marker[key].set(INFINITY, INFINITY, INFINITY);
		countryCode[key] = undefined;
	}
	
	/**
	 * Update the vertices of the particle systems in order to show changes
	 */
	function update() {
		markerSystem.geometry.verticesNeedUpdate = true;
	}
	
	/**
	 * Set the rendering mode of the markers and animation
	 */
	function setMode(mode) {
		markerMaterial.uniforms.mode.value = mode;
		animationMaterial.uniforms.mode.value = mode;
		if (mode == GLOBE.HeatMode) {
			markerMaterial.blending = THREE.SubtractiveBlending;
		} else {
			markerMaterial.blending = THREE.NormalBlending;
		}
	}

	/**
	 * Return the label of the specified marker
	 */
	function getLabel(key) {
		return label[key];
	}
	
	/**
	 * Return the country code of the specified marker
	 */
	function getCC(key) {
		return countryCode[key];
	}
	
	/**
	 * Reset the markers by moving them outside of the view
	 */
	function reset() {
		for(i = 0; i < maxMarker; i++) {
			marker[i].set(INFINITY, INFINITY, INFINITY);
			countryCode[i] = undefined;
		}
	}
	
	/**
	 * Convert geographical coordinates (a type of spherical coordinates) given
	 * the latitude, longitude and radius into cartesian coordinates (x,y,z).
	 * Attention: the OpenGL/three.js coordinate system is slightly altered
	 * compared to the common cartesian system:
	 * - the x axis remains unchanged
	 * - the y axis is exchanged with the z axis
	 * - the z axis direction is reversed
	 * For imagination:
	 * - x axis is at phi = 0 and theta = 0 (equator and 0th longitude)
	 * - y axis is at theta = 90 (north pole)
	 * - z axis is at phi = - pi/2 and theta = 0 (equator and -90th longitude)
	 */
	function convert(latitude, longitude, radius) {
		// map latitude from [-90:90] to theta in the interval [-pi/2 : pi/2]
		var theta = latitude * Math.PI / 180;
		// map longitude from [-180:180] to phi in the interval [-pi:pi]
		var phi = longitude * Math.PI / 180;

		// transform the coordinates
		var x = radius * Math.cos(phi) * Math.cos(theta);
		var y = radius * Math.sin(theta);
		var z = - radius * Math.sin(phi) * Math.cos(theta);
		
		// return a triple containing the cartesian coordinates
		return new THREE.Vector3(x, y, z);
	}
	
	// init markers
	init(this);
};
