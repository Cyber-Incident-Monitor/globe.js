globe.js
========

A javascript library visualizing individual data on an interactive globe using the three.js library (webGL).
It is based on webgl-globe, formerly on [github](https://github.com/dataarts/webgl-globe) and at the time of
this writing on [code.google](http://code.google.com/p/webgl-globe/).
This project is licensed under the Apache License, Version 2.0 like webgl-globe.

### Features

The library is able to add or remove a marker at a specified location (longitude/latitude) on the globe.
Adding a marker can optionally be animated.
Information can be attached to markers and will be shown in a tooltip on hovering the respective marker.

Hovering a country with the mouse highlights the respective country turning the countries color darker.
The name of the country is shown in a tooltip when hovering over it. Additional information like the number
of markers located in the respective country and the total amount of markers can be shown in the same tooltip.
To vizualize the ratio of markers per country compared to the total amount of markers on the globe the regions are colored
based on this ratio.
The ISO 3166-1 ALPHA-2 codes with addition of MaxMind-specific codes for Europe, Asia Pacific Region, Anonymous Proxy
and Satellite Provider provided by [MaxMind](http://dev.maxmind.com/geoip/legacy/codes/iso3166/) are used to distinguish
between countries.

Moreover the globe can be moved and zoomed using the mouse or using the globe.js API which provides an additional option
to toggle the view between the normal view showing markers and colored countries and a heatmap-like view without colored
countries and marker animation.

## Usage ###


## Attributions ##
