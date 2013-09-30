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
 * atmosphere.js - Define an hideable atmosphere implemented as a sphere
 * (showing only the back side).
 */
var GLOBE = GLOBE || {};
GLOBE.Atmosphere = function(options) {
	
	var material;		// material of the atmosphere
	
	/**
	 * Initialize the atmosphere object
	 */
	function init(obj) {
		options = options || {};
		var radius = options.radius || 200;		// radius of the atmosphere
		var segments = options.segments || 40;	// segments of the atmosphere
		var rings = options.rings || 20;		// rings of the atmosphere
		var scale = options.scale || 1.15;		// scale factor of the atmosphere
		
		// generate a sphere
		var sphere = new THREE.SphereGeometry(radius, segments, rings);
		
		// determine final vertex and normal position
		var vertexShader = [
			"varying vec3 vNormal;",
			"void main() {",
			"	vNormal = normalize(normalMatrix * normal);",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
			"}",
		].join("\n");
		
		// determine a grey color dependent on normal dot (0,0,1)
		var fragmentShader = [
			"varying vec3 vNormal;",
			"void main() {",
			"	float intensity = (dot(vNormal, vec3(0, 0, 1.0)) + 0.7) * 1.6;",
			"	gl_FragColor = vec4(intensity, intensity, intensity, 1.0);",
			"}",
		].join("\n");
		
		// add the atmosphere material to the mesh
		material = new THREE.ShaderMaterial({
			"vertexShader": vertexShader,
			"fragmentShader": fragmentShader,
			"side": THREE.BackSide,
			"visible": true,
		});
		var mesh = new THREE.Mesh(sphere, material);
		mesh.scale.multiplyScalar(scale);
		mesh.matrixAutoUpdate = false;		// disable matrix update, since the sphere is static
		mesh.updateMatrix();				// update once
		
		// make mesh and setVisibility outside available
		obj.mesh = mesh;
		obj.setVisibility = setVisibility;
	}
	
	/**
	 * Hide or unhide the atmosphere
	 */
	function setVisibility(visbility) {
		material.visible = visbility;
	}
	
	// init atmosphere
	init(this);
};
