globe.js
========

A javascript library visualizing individual data on an interactive globe
using the three.js library (WebGL).
It is based on webgl-globe, formerly on
[github](https://github.com/dataarts/webgl-globe) and at the time of
this writing on [code.google](http://code.google.com/p/webgl-globe/).
This project is licensed under the Apache License, Version 2.0 like
webgl-globe. See the LICENSE file for detailed information.

### Features ###
The library is able to add or remove a marker at a specified location
(longitude/latitude) on the globe. Adding a marker can optionally be
animated. Information can be attached to markers and will be shown in a
tooltip on hovering the respective marker.

Hovering a country with the mouse highlights the respective country
turning the countries color darker.
The name of the country is shown in a tooltip when hovering over it.
Additional information like the number of markers located in the
respective country and the total amount of markers can be shown in the
same tooltip.
To vizualize the ratio of markers per country compared to the total
amount of markers on the globe the regions are colored based on this
ratio.
The ISO 3166-1 ALPHA-2 codes with addition of MaxMind-specific codes for
Europe, Asia Pacific Region, Anonymous Proxy and Satellite Provider
provided by [MaxMind](http://dev.maxmind.com/geoip/legacy/codes/iso3166/)
are used to distinguish between countries.

Moreover the globe can be moved and zoomed using the mouse or using the
globe.js API which provides an additional option to toggle the view
between the normal view showing markers and colored countries and a
heatmap-like view without colored countries and marker animation.

### Usage ###
Download the minified version of three.js and this library.
Additionally download the css file and the textures to get started.

See [example.html](https://github.com/Cyber-Incident-Monitor/globe.js/blob/master/example.html)
how to include and use the library and
[advancedExample.html](https://github.com/Cyber-Incident-Monitor/globe.js/blob/master/advancedExample.html)
for a more detailed view of the globe.js API.

Hint: Use a webserver to load the examples to avoid restrictions not showing the globe
(cross-origin image load problems), for example running `python3 -m http.server` in the specific directory.

### Texture Requirements ###
#### Marker ####
The circle.png texture is used to visualize the marker by multiplying
the texture with a predefined color, e.g. red.
Therefore the inner part must have the RGBA value of (255,255,255,255)
and the outer part (0,0,0,0).
Borders must have the color (0,0,0,255).

The animation.png texture is used to visualize the animation of a newly
added marker by multiplying the texture with a predefined color, e.g.
red and varying the opacity over time from one to zero.
The shape of the animation must thereefore have the RGBA value of
(255,255,255,255) and every other part (0,0,0,0).

#### Heatmap ####
The heatmap utilizes the gradient.png which solely represents a color
gradient ranging from left (low heat) to the right (high heat).
It can be exchanged freely with any other color gradient considering
that the gradient must range from the left to the right.

The heat.png is used to visualize a heat point by multiplying the
texture with a color of the gradient.
It must be provided as a shape with the RGBA value of (255,255,255,255)
and a background value of (0,0,0,0) like the animation texture.

#### Globe ####
In order to show countries on the sphere one must provide two textures:
* [countries_colored.png](https://github.com/Cyber-Incident-Monitor/globe.js/blob/master/textures/countries_colored.png)
* [borders_oceans_lakes.png](https://github.com/Cyber-Incident-Monitor/globe.js/blob/master/textures/borders_oceans_lakes.png)

The first one is required to identify different countries.
This is achieved by setting a unique red color tone with maximum opacity
to every country.
Using this method and 8bit red colors allows differentation of 256
different countries.
Note that every non-country element like the oceans must be set to the
RBGA value (0,0,0,0) to not interact with marker or country
identification.

The second one is required to draw borders, oceans and lakes. Countries
must have the RGBA value (255,255,255,255) to work properly in the
heatmap mode.
Country borders and oceans may have an arbitrary color but maximum
opacity.

### How to Generate Textures ###
Generating the textures for the markers, animation, heat gradient and
one heat particle is straightforward and may be done using a raster
graphics editor like [GIMP](http://www.gimp.org/).
Note that the size of the rendered animation, marker, etc. does not
depend on the texture size. Only the resolution is influenced.

To generate both globe textures one may use the svgs provided in this
repository.
Since the countries_colored.png is used to identify countries the colors
must not be altered in this process. Moreover reducing the number of
different colors in a png file lowers the file size.
To achieve both requirements one must avoid anti-aliasing at the
creation of the textures for example by following this steps:
* save the svg to eps using [Inkscape](http://inkscape.org/) (set the dpi to 90)
* import the eps in [GIMP](http://www.gimp.org/) (set the dpi to 90)
* edit the image to fit in the desired range (sometimes the imported
image is too large)
* save the result to a png

### Projects using globe.js ###
* [TraCINg](https://github.com/Cyber-Incident-Monitor/TraCINg-Server), live at [ssi.cased.de](http://ssi.cased.de/#/globe)
