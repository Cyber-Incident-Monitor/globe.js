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
 * map.js - Define a scene, an orthographic camera and a target to
 * render a 2d representation of the world used to be mapped onto a
 * sphere.
 * This is achieved by replacing the color of every country by a color
 * supplied with the mpcTexture.
 * Additionally a country can be highlighted turning its color darker
 * by applying its index.
 */
var GLOBE = GLOBE || {};
GLOBE.Map = function(width, height, pickTexture, borderTexture, mpcTexture) {
	
	// define an orthographic camera
	var left = -width/2;
	var right = width/2;
	var top = height/2;
	var bottom = -height/2;
	var zNear = -10000;
	var zFar = 10000;
	var camera = new THREE.OrthographicCamera(left, right, top, bottom, zNear, zFar);
	camera.position.z = 100;
	
	// define render target (used as texture)
	var target = new THREE.WebGLRenderTarget(width, height, {"format": THREE.RGBFormat});
	// set linear filtering for smooth edges and deactivate mipmaping
	target.magFilter = THREE.LinearFilter;	// (default)
	target.minFilter = THREE.LinearFilter;
	
	// define the screen mesh
	var uniforms = {
		"pickTexture": {type: 't', value: pickTexture},
		"borderTexture": {type: 't', value: borderTexture},
		"mpcTexture": {type: 't', value: mpcTexture},
		"pickIndex": {type: 'f', value: -1.0},
		"hoverColor": {type: 'v3', value: new THREE.Vector3(0.8, 0.8, 0.9)},
	};
	
	// copy uv, determine final vertex and normal position
	var vertexShader = [
		"varying vec2 vUv;",
		"void main() {",
		"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"	vUv = uv;",
		"}",
	].join("\n");
	
	// if a certain color is found in texel replace it with a different color
	var fragmentShader = [
		"uniform sampler2D pickTexture;",
		"uniform sampler2D borderTexture;",
		"uniform sampler2D mpcTexture;",
		"uniform float pickIndex;",
		"uniform vec3 hoverColor;",
		"varying vec2 vUv;",
		"const float allowedError = 1.0/1024.0;		// colorResolution = 1.0/255.0;",
		"void main() {",
		"	// fetch texel",
		"	vec4 pickTexel = texture2D(pickTexture, vUv).rgba;",
		"	vec2 pos = vec2(pickTexel.r, 0.0);",
		"	vec3 mpcTexel = texture2D(mpcTexture, pos).rgb;",
		"	vec3 borderTexel = texture2D(borderTexture, vUv).rgb;",
		"	// if alpha is zero use the border texel",
		"	if (pickTexel.a == 0.0)",
		"		gl_FragColor = vec4(borderTexel, 1.0);",
		"	// if alpha is nonzero use the mpc texel multiplied by the border",
		"	// texel or the replace color indicating mouse hover",
		"	else if (pickTexel.r < (pickIndex + allowedError) && pickTexel.r > (pickIndex - allowedError))",
		"		gl_FragColor = vec4(hoverColor * mpcTexel * borderTexel, 1.0);",
		"	else",
		"		gl_FragColor = vec4(mpcTexel * borderTexel, 1.0);",
		"}",
	].join("\n");
	
	var plane = new THREE.PlaneGeometry(width, height);
	var planeMaterial = new THREE.ShaderMaterial({
		"uniforms": uniforms,
		"vertexShader": vertexShader,
		"fragmentShader": fragmentShader
	});
	var screen = new THREE.Mesh(plane, planeMaterial);
	
	// define the scene and add the screen mesh
	var scene = new THREE.Scene();
	scene.add(screen);
	
	// make the scene, camera and render target outside available
	this.scene = scene;
	this.camera = camera;
	this.target = target;
	
	/**
	 * Set the country to be highlighted by index
	 */
	this.setPickIndex = function(index) {
		screen.material.uniforms.pickIndex.value = index/255.0;
	};
};
