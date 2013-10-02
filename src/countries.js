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
 * countries.js - Stores how many markers are in one specific country
 * using the ISO 3166-1 ALPHA-2 codes with addition of MaxMind-specific
 * codes for Europe, Asia Pacific Region, Anonymous Proxy and Satellite
 * Provider provided by MaxMind:
 * http://dev.maxmind.com/geoip/legacy/codes/iso3166/
 * Additionally a data texture provides a RGB color triple (each color
 * ranging from 0 to 255) per country to be used by a shader since WebGL
 * limits the usage of conventional arrays.
 * More detailed the values per country are defined by the markers in the
 * specific country and an interpolating function.
 * By default this function leads to a depiction of the ratio of markers
 * as a red tone. The ratio is defined by the markers in one country
 * divided by the total sum of markers on the world.
 * For a better visualization the ratio is weighted by default with a
 * third root thus raising the ratio non linearly (lower ratios near
 * zero are raised more than higher values near one).
 */
var GLOBE = GLOBE || {};
GLOBE.Countries = function(options) {
	
	// constants
	var bytes = 3;		// number of bytes per element
	var code = [		// ISO 3166-1 ALPHA-2 and MaxMind country codes
		'A1', 'A2', 'O1', 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AP',
		'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE',
		'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
		'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI',
		'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',
		'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES',
		'ET', 'EU', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE',
		'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT',
		'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL',
		'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE',
		'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB',
		'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD',
		'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR',
		'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF',
		'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF',
		'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA',
		'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH',
		'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX',
		'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN',
		'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ',
		'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA',
		'ZM', 'ZW', 'NULL', 'NULL'	// filled up to a power of two (256) elements
	];
	
	// attributes
	var interpolator;		// function interpolating the data
	var maxSaturation;		// maximum saturation of countries
	var markers;			// number of markers
	
	var cpc;				// color per country
	var markerPerCountry;	// number of markers per country
	var texture;			// the mpc data texture (a copy of cpc)
	
	/**
	 * Initialize the countries object
	 */
	function init(obj) {
		options = options || {};
		var defaultInterpolator = function(ratio) {
			return (1 - Math.pow(ratio, 1/3));
		};
		interpolator = options.interpolator || defaultInterpolator;
		maxSaturation = options.maxSaturation || 255;
		if (maxSaturation > 255) {
			maxSaturation = 255;
		}
		if (maxSaturation < 0) {
			maxSaturation = 0;
		}
		
		markerPerCountry = {};
		markers = 0;
		
		cpc = new Uint8Array(code.length * bytes);
		texture = new THREE.DataTexture(			
			cpc,				// data
			code.length,		// width
			1,					// height
			THREE.RGBFormat		// format
		);
		texture.magFilter = THREE.NearestFilter;				// avoid interpolation effects
		texture.minFilter = THREE.NearestMipMapNearestFilter;	// avoid interpolation effects
		
		reset();
		
		// make texture and functions outside available
		obj.texture = texture;
		obj.inc = inc;
		obj.dec = dec;
		obj.reset = reset;
		obj.getCC = getCC;
		obj.getMarkers = getMarkers;
		obj.getAllMarkers = getAllMarkers;
		obj.hasMarker = hasMarker;
	}
	
	/**
	 * State whether any country has at least one marker
	 */
	function hasMarker() {
		if (markers > 0) {
			return true;
		}
		return false;
	}
	
	/**
	 * Set the color of a specific country
	 */
	function setColor(index, red, green, blue) {
		cpc[index * bytes + 0] = red;
		cpc[index * bytes + 1] = green;
		cpc[index * bytes + 2] = blue;
	}
	
	/**
	 * Update the colors of every country based on the interpolating function
	 */
	function updateCountries() {
		for (var i = 0; i < code.length ; i++) {
			if (markers <= 0) {
				// if there are no markers set the ratio to zero
				// (avoiding division by zero) and set the color directly
				setColor(i, maxSaturation, maxSaturation, maxSaturation);
			} else {
				var absolute = (markerPerCountry[code[i]] | 0);	// zero if undefined
				var ratio = absolute / markers;
				var value = interpolator(ratio) * maxSaturation;
				setColor(i, maxSaturation, value, value);
			}
		}
		texture.needsUpdate = true;
	}
	
	/**
	 * Increment the marker number of a specific country
	 */
	function inc(cc) {
		markers++;
		markerPerCountry[cc] = (markerPerCountry[cc] | 0) + 1;
		updateCountries();
	}
	
	/**
	 * Decrement the marker number of a specific country
	 */
	function dec(cc) {
		if (markerPerCountry[cc] > 0) {
			markers--;
			markerPerCountry[cc] = markerPerCountry[cc] - 1;
			updateCountries();
		}
	}
	
	/**
	 * Reset the color and number of markers
	 */
	function reset() {
		for (key in markerPerCountry)
			markerPerCountry[key] = 0;
		markers = 0;
		updateCountries();
	}
	
	/**
	 * Return the country code identified by the color index
	 */
	function getCC(index) {
		return code[index];
	}
	
	/**
	 * Return the number of markers located in one country
	 */
	function getMarkers(index) {
		return (markerPerCountry[code[index]] | 0);
	}
	
	/**
	 * Get the number of markers of every country
	 */
	function getAllMarkers() {
		return markers;
	}
	
	// init country
	init(this);
};
