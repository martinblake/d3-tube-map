# d3-tube-map

[![Build Status](https://travis-ci.org/johnwalley/d3-tube-map.svg?branch=master)](https://travis-ci.org/johnwalley/d3-tube-map)
[![Dependency Status](https://gemnasium.com/badges/github.com/johnwalley/d3-tube-map.svg)](https://gemnasium.com/github.com/johnwalley/d3-tube-map)

Draw tube maps in the style of the London Underground using d3.

See a demo [here](https://bl.ocks.org/johnwalley/9b6d8af7a209b95c5b9dff99073db420).

![Screenshot](https://user-images.githubusercontent.com/981531/32612404-220d7d62-c560-11e7-8070-78c2dd328c00.png)

## Installing

If you use NPM, `npm install d3-tube-map`. Otherwise, download the [latest release](https://github.com/johnwalley/d3-tube-map/releases/latest). AMD, CommonJS, and vanilla environments are supported. In vanilla, a `d3` global is exported:

```html
<script src="https://d3js.org/d3.v4.js"></script>
<script src="../build/d3-tube-map.js"></script>

<script>
  var el = document.getElementById('tube-map');

  var svg = d3.select(el)
      .append('svg')
      .style('width', '100%')
      .style('height', '100%');

  var width = 1600;
  var height = 1024;

  const map = d3.tubeMap()
    .width(width)
    .height(height)
    .margin({
      top: height / 50,
      right: width / 7,
      bottom: height / 10,
      left: width / 7,
    });    

  d3.json("./pubs.json", function(error, data) {
    svg.datum(data).call(map);
  });
</script>
```

## API Reference

<a name="tubeMap" href="#tubeMap">#</a> d3.<b>tubeMap</b>() [<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js "Source")

Constructs a new tube map generator with the default settings.

<a name="_tubeMap" href="#_tubeMap">#</a> <i>tubeMap</i>(<i>selection</i>) [<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js#L26 "Source")

Render the tube map to the given *selection*, which is a [selection](https://github.com/d3/d3-selection) of SVG containers (either SVG or G elements).

<a name="tubeMap_width" href="#tubeMap_width">#</a> <i>tubeMap</i>.<b>width</b>(<i>w</i>) [<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js#L109 "Source")

Sets the width of the viewbox the map is rendered to.

<a name="tubeMap_height" href="#tubeMap_height">#</a> <i>tubeMap</i>.<b>height</b>(<i>h</i>) [<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js#L115 "Source")

Sets the height of the viewbox the map is rendered to.

<a name="tubeMap_margin" href="#tubeMap_margin">#</a> <i>tubeMap</i>.<b>margin</b>(<i>m</i>) [<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js#L121 "Source")

Sets the margin around the map. Takes an object of the following form:

````
{ top: 10, right: 20, bottom: 10, left: 20 }
````
