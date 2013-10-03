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
 * update.js - Define a policy to call update functions with a minimum
 * distance of time between executions.
 */
var GLOBE = GLOBE || {};
GLOBE.Update = function(f, t) {
	
	// attributes
	var timeoutInterval;
	var blocked;
	var waiting;
	var updateFunction;
	
	/**
	 * Initialize the update object
	 */
	function init(obj) {
		// set attributes
		updateFunction = f;
		timeoutInterval = t;
		blocked = false;
		enqueued = false;
		
		// make the execute function outside available
		obj.execute = execute;
	}
	
	/**
	 * Execute the updateFunction if not blocked or enqueue it
	 */
	function execute() {
		// If there was no update in the last timeoutInterval blocked
		// is false and therefore the updateFunction will be executed
		// immediately.
		if (!blocked) {
			blocked = true;
			updateFunction();
			startTimeout(false);
		}
		// Otherwise enqueued will be set to true 
		else {
			enqueued = true;
		}
	}
	
	/**
	 * Set a timeout executing the update and recursively other updates
	 * if enqueued is true. If enqueued is false blocked will be set to
	 * false.
	 */
	function startTimeout(execute) {
		setTimeout(function() {
			// execute the updateFunction if required
			if (execute) {
				updateFunction();
			}
			// check if another execution is enqueued
			if (enqueued) {
				enqueued = false;
				startTimeout(true);
			} else {
				blocked = false;
			}
		}, timeoutInterval);
	}
	
	// init update
	init(this);
};
