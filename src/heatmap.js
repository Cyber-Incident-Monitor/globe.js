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
 * heatmap.js - Define a scene with an orthographic camera to render the
 * final heatmap based on a supplied heatTexture and gradientTexture.
 * The heatTexture shows the globe without atmosphere and partly
 * transparent heat particles.
 * The gradientTexture defines the color range of the heatmap.
 * Rendering this scene leads to the finished view by replacing the
 * heat particles alpha values (representing the heat value) with the
 * corresponding color taken from the gradientTexture.
 */
var GLOBE = GLOBE || {};
GLOBE.Heatmap = function(width, height, heatTexture, gradientTexture) {

	// define an orthographic camera
	var left = -width/2;
	var right = width/2;
	var top = height/2;
	var bottom = -height/2;
	var zNear = -10000;
	var zFar = 10000;
	var camera = new THREE.OrthographicCamera(left, right, top, bottom, zNear, zFar);
	camera.position.z = 100;
	
	// define the screen mesh
	var uniforms = {
		"heatTexture": {type: 't', value: heatTexture},
		"gradientTexture": {type: 't', value: gradientTexture}
	};
	
	// copy uv and determine final vertex position
	var vertexShader = [
		"varying vec2 vUv;",
		"void main() {",
		"	vUv = uv;",
		"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"}",
	].join("\n");
	
	// replace translucent pixel on the heatTexture based on the gradient texture
	var fragmentShader = [
		"uniform sampler2D heatTexture;",
		"uniform sampler2D gradientTexture;",
		"varying vec2 vUv;",
		"void main() {",
		"	vec4 heatTexel = texture2D(heatTexture, vUv);",
		"	if(heatTexel.a == 1.0) {",
		"		gl_FragColor = heatTexel;",
		"	}",
		"	else {",
		"		vec2 pos = vec2(1.0 - heatTexel.a, 0.0);",
		"		vec3 gradientTexel = texture2D(gradientTexture, pos).rgb;",
		"		gl_FragColor = vec4(gradientTexel, 1.0);",
		"	}",
		"}",
	].join("\n");
	
	var plane = new THREE.PlaneGeometry(width, height);
	plane.dynamic = true;
	var planeMaterial = new THREE.ShaderMaterial({
		"uniforms": uniforms,
		"vertexShader": vertexShader,
		"fragmentShader": fragmentShader
	});
	var screen = new THREE.Mesh(plane, planeMaterial);
	
	// define the scene and add the screen mesh
	var scene = new THREE.Scene();
	scene.add(screen);
	
	// make scene and camera outside available
	this.scene = scene;
	this.camera = camera;
};
