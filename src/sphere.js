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
 * sphere.js - Define a sphere with a switchable texture.
 */
var GLOBE = GLOBE || {};
GLOBE.Sphere = function(options) {
	
	var material;		// material of the sphere
	
	/**
	 * Initialize the sphere object
	 */
	function init(obj) {
		options = options || {};
		var radius = options.radius || 200;			// radius of the sphere
		var segments = options.segments || 40;		// segments of the sphere
		var rings = options.rings || 20;			// rings of the sphere
		
		// generate a sphere
		var sphere = new THREE.SphereGeometry(radius, segments, rings);
		
		// add the sphere with the corresponding material into scene
		material = new THREE.MeshBasicMaterial();
		var mesh = new THREE.Mesh(sphere, material);
		mesh.matrixAutoUpdate = false;		// disable matrix update, since the sphere is static
		mesh.updateMatrix();				// update once
		
		// make the mesh and setTexture function available to the outside
		obj.mesh = mesh;
		obj.setTexture = setTexture;
	}
	
	/**
	 * Set the texture of the sphere
	 */
	function setTexture(texture) {
		material.map = texture;
	}
	
	// init sphere
	init(this);
};
