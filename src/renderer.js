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
 * renderer.js - Define a renderer to render map target, heatmap target
 * and the view. Moreover provide and update the pixelbuffer containing
 * every pixel of the rendered screen.
 */
var GLOBE = GLOBE || {};
GLOBE.Renderer = function(container, pickTexture, borderTexture, mpcTexture, gradientTexture) {
	
	// attributes
	var renderer;
	var gl;
	var pickTarget;
	var pixelBuffer;
	
	var heatTexture;
	var map;
	var heatmap;
	
	/**
	 * Initialize the renderer object
	 */
	function init(obj) {
		var w = container.offsetWidth || window.innerWidth;
		var h = container.offsetHeight || window.innerHeight;
		// initialize renderer (and the webgl context)
		renderer = new THREE.WebGLRenderer();
		console.log(renderer.info);
		renderer.setSize(w, h);
		renderer.setClearColor(0xffffff, 1);
		container.appendChild(renderer.domElement);
		gl = renderer.getContext();
		
		// initialize pixelBuffer
		pixelBuffer = new Uint8Array(w * h * 4);
		
		// initialize pickTarget (to be render the picking scene)
		pickTarget = new THREE.WebGLRenderTarget(w, h, {"format": THREE.RGBAFormat});
		pickTarget.generateMipmaps = false;
		
		// intermediate texture to generate a heatmap (using the alpha values)
		heatTexture =  new THREE.WebGLRenderTarget(w, h, {"format": THREE.RGBAFormat});
		heatTexture.minFilter = THREE.LinearFilter;
		heatTexture.magFilter = THREE.LinearFilter;
		heatTexture.generateMipmaps = false;
		
		// heatmap and map (to retrieve their textures)
		var textureWidth = pickTexture.image.width;
		var textureHeight = pickTexture.image.height;
		map = new GLOBE.Map(textureWidth, textureHeight, pickTexture, borderTexture, mpcTexture);	// has a fixed width/height ratio
		heatmap = new GLOBE.Heatmap(w, h, heatTexture, gradientTexture);	// has a dynamic width/height ratio
		
		// make map.target and functions outside available
		obj.mapTexture = map.target;
		obj.renderView = renderView;
		obj.updateMap = updateMap;
		obj.updateColorPicking = updateColorPicking;
		obj.resize = resize;
		obj.getPixel = getPixel;
		obj.setPickIndex = map.setPickIndex;	// set country to be highlighted
		obj.dispose = dispose;
	}
	
	/**
	 * Render the view showing the 3d globe either in marker or in
	 * heatmap mode
	 */
	function renderView(view) {
		// render dependend on mode
		// FIXME view.mode
		var mode = view.getMode();
		if (mode == GLOBE.MapMode)
			renderer.render(view.scene, view.camera);
		else if (mode == GLOBE.HeatMode) {
			// renew heatTexture
			renderer.render(view.scene, view.camera, heatTexture);
			// render to screen
			renderer.render(heatmap.scene, heatmap.camera);
		}
		// do not render while in picking mode
	}
	
	/**
	 * Render the map to texture
	 */
	function updateMap() {
		renderer.render(map.scene, map.camera, map.target);
	}
	
	/**
	 * Render the picking scene to texture
	 */
	function updateColorPicking(view) {
		var w = container.offsetWidth || window.innerWidth;
		var h = container.offsetHeight || window.innerHeight;
		// update width and height of the target and the buffer
		pickTarget.width = w;
		pickTarget.height = h;
		pixelBuffer = new Uint8Array(w * h * 4);
		
		// render the picking scene to the target
		renderer.render(view.scene, view.camera, pickTarget);
		
		// read the target and store it into the buffer (very costly operation!)
		gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
	}
	
	/**
	 * Resize the renderer
	 */
	function resize(view) {
		var w = container.offsetWidth || window.innerWidth;
		var h = container.offsetHeight || window.innerHeight;
		renderer.setSize(w, h);
		view.resize(w/h);
		// TODO limit the time between recreating a FBO
		if(heatTexture.width != w || heatTexture.height - h != 10) {
			// create a new render target (and heatmap) since a FBO is not resizeable
			//heatTexture.dispose();		// TODO required?
			heatTexture =  new THREE.WebGLRenderTarget(w, h, {"format": THREE.RGBAFormat});
			heatTexture.minFilter = THREE.LinearFilter;
			heatTexture.magFilter = THREE.LinearFilter;
			heatTexture.generateMipmaps = false;
			heatmap = new GLOBE.Heatmap(w, h, heatTexture, gradientTexture);
		}
	}
	
	/**
	 * Get the pixel at the mouse position x/y (if in the render screen)
	 */
	function getPixel(mouseX, mouseY) {
		var pos = mapMouseToCoord(mouseX, mouseY);
		var w = container.offsetWidth || window.innerWidth;
		var h = container.offsetHeight || window.innerHeight;
		var index = (pos.x + (h - pos.y + 1) * w) *4;
		return {
			"r": pixelBuffer[index + 0],
			"g": pixelBuffer[index + 1],
			"b": pixelBuffer[index + 2],
			"a": pixelBuffer[index + 3]
		}
	}
	
	/**
	 * Map mouse position x/y to render position x/y
	 */
	function mapMouseToCoord(mouseX, mouseY) {
		var rect = container.getBoundingClientRect();
		var left = toInt(rect.left);
		var top = toInt(rect.top);
		return {
			'x': mouseX - left - 1,
			'y': mouseY - top,
		}
	}
	
	/**
	 * Transform a value into an integer
	 */
	function toInt(value) {
		return value | 0;
	}
	
	/**
	 * Dispose render targets
	 */
	function dispose() {
		pickTarget.dispose();
		console.log("disposed pickTarget");
		heatTexture.dispose();
		console.log("disposed heatTexture");
	}
	
	// init renderer
	init(this);
};
