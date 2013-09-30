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
 * tooltip.js - Define a hidable tooltip containting arbitrary content.
 */
var GLOBE = GLOBE || {};
GLOBE.Tooltip = function() {
	
	var element = document.createElement("div");
	element.className = "globe-tooltip";
	document.body.appendChild(element);
	
	/**
	 * Hide the tooltip
	 */
	this.hide = function() {
		element.style.display = "none";
	};
	
	/**
	 * Show the tooltip with the supplied data at the supplied position
	 */
	this.show = function(label, x, y) {
		element.style.display = "inline";
		element.innerHTML = label;
		element.style.left = x + "px";
		element.style.top = y + "px";
	};
};
