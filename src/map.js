import * as d3 from 'd3';
import { line, station, interchange } from './curve';
import lineList from './lines';
import stationList from './stations';

export default function() {
  var margin = { top: 80, right: 80, bottom: 20, left: 80 };
  var width = 760;
  var height = 640;
  var xScale = d3.scaleLinear();
  var yScale = d3.scaleLinear();
  var lineWidth;
  var lineWidthMultiplier = 1.2;

  var dispatch = d3.dispatch('click');

  var svg;

  var model;

  var gEnter;
  var zoom;

  var t;

  function map(selection) {
    selection.each(function(data) {
      data = transformData(data);
      model = data;

      var minX = d3.min(data.raw, function(line) {
        return d3.min(line.nodes, function(node) {
          return node.coords[0];
        });
      });
      var maxX = d3.max(data.raw, function(line) {
        return d3.max(line.nodes, function(node) {
          return node.coords[0];
        });
      });

      var minY = d3.min(data.raw, function(line) {
        return d3.min(line.nodes, function(node) {
          return node.coords[1];
        });
      });
      var maxY = d3.max(data.raw, function(line) {
        return d3.max(line.nodes, function(node) {
          return node.coords[1];
        });
      });

      var desiredAspectRatio = (maxX - minX) / (maxY - minY);
      var actualAspectRatio =
        (width - margin.left - margin.right) /
        (height - margin.top - margin.bottom);

      var ratioRatio = actualAspectRatio / desiredAspectRatio;
      var maxXRange;
      var maxYRange;

      // Note that we flip the sense of the y-axis here
      if (desiredAspectRatio > actualAspectRatio) {
        maxXRange = width - margin.left - margin.right;
        maxYRange = (height - margin.top - margin.bottom) * ratioRatio;
      } else {
        maxXRange = (width - margin.left - margin.right) / ratioRatio;
        maxYRange = height - margin.top - margin.bottom;
      }

      xScale.domain([minX, maxX]).range([0, maxXRange]);
      yScale.domain([minY, maxY]).range([maxYRange, 0]);
      lineWidth = lineWidthMultiplier * (xScale(1) - xScale(0));

      svg = d3
        .select(this)
        .selectAll('svg')
        .data([data]);

      var g = svg.enter().append('g');

      // Fill with white rectangle to capture zoom events
      g
        .append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('fill', 'white');

      var zoomed = function() {
        gEnter.attr('transform', d3.event.transform.toString());
      };

      zoom = d3
        .zoom()
        .scaleExtent([0.5, 6])
        .on('zoom', zoomed);

      gEnter = g.call(zoom).append('g');
      svg.attr('width', '100%').attr('height', '100%');

      drawRiver(gEnter);
      drawLines(gEnter);
      drawInterchanges(gEnter);
      drawStations(gEnter);
      drawLabels(gEnter);
    });
  }

  map.width = function(w) {
    if (!arguments.length) return width;
    width = w;
    return map;
  };

  map.height = function(h) {
    if (!arguments.length) return height;
    height = h;
    return map;
  };

  map.margin = function(m) {
    if (!arguments.length) return margin;
    margin = m;
    return map;
  };

  map.highlightLine = function(name) {
    var lines = d3.select('#map').selectAll('.line');
    var stations = d3.select('#map').selectAll('.station');
    var labels = d3.select('#map').selectAll('.label');

    lines.classed('translucent', true);
    stations.classed('translucent', true);
    labels.classed('translucent', true);

    stations.filter('.' + name).classed('translucent', false);
    labels.filter('.' + name).classed('translucent', false);
    d3.select('#' + name).classed('translucent', false);
  };

  map.unhighlightAll = function() {
    var lines = d3.select('#map').selectAll('.line');
    var stations = d3.select('#map').selectAll('.station');
    var labels = d3.select('#map').selectAll('.label');

    lines.classed('translucent', false);
    stations.classed('translucent', false);
    labels.classed('translucent', false);
  };

  map.unhighlightLine = function() {
    this.unhighlightAll();
  };

  map.centerOnPub = function(name) {
    if (name === undefined) return;

    var station = model.stations.stations[name];

    var width = window.innerWidth;
    var height = window.innerHeight;

    var scale = 2;

    t = [
      -scale * xScale(station.x) + width / 2,
      -scale * yScale(station.y) + height / 2,
    ];

    // FIXME: Need valid d3 v4 syntax for zooming
    zoom.translateBy(t).scaleTo(2);
    gEnter
      .transition()
      .duration(750)
      .attr(
        'transform',
        'translate(' + t[0] + ',' + t[1] + ')scale(' + scale + ')'
      );
  };

  map.addStation = function(name) {
    visitStation(name, true);
  };

  map.removeStation = function(name) {
    visitStation(name, false);
  };

  map.visitStations = function(visited) {
    d3
      .selectAll('.labels')
      .select('text')
      .classed('highlighted', false);
    visited.map(function(pub) {
      visitStation(pub, true);
    });
  };

  map.on = function(event, callback) {
    dispatch.on(event, callback);
  };

  map.selectStation = function(name) {
    selectStation(name);
  };

  function selectStation(name) {
    d3
      .select('.labels')
      .selectAll('.label')
      .classed('selected', false);

    d3
      .select('.labels')
      .select('#' + name)
      .classed('selected', true);
  }

  function visitStation(name, highlighted) {
    d3
      .select('.labels')
      .select('#' + name)
      .select('text')
      .classed('highlighted', highlighted);
  }

  function drawRiver(gEnter) {
    gEnter
      .append('g')
      .attr('class', 'river')
      .selectAll('path')
      .data(function(d) {
        return [d.river];
      })
      .enter()
      .append('path')
      .attr('d', function(d) {
        return line(d, xScale, yScale, lineWidth);
      })
      .attr('stroke', '#C4E8F8')
      .attr('fill', 'none')
      .attr('stroke-width', 1.8 * lineWidth);
  }

  function drawLines(gEnter) {
    gEnter
      .append('g')
      .attr('class', 'lines')
      .selectAll('path')
      .data(function(d) {
        return d.lines.lines;
      })
      .enter()
      .append('path')
      .attr('d', function(d) {
        return line(d, xScale, yScale, lineWidth);
      })
      .attr('id', function(d) {
        return d.name;
      })
      .attr('stroke', function(d) {
        return d.color;
      })
      .attr('fill', 'none')
      .attr('stroke-width', function(d) {
        return d.highlighted ? lineWidth * 1.3 : lineWidth;
      })
      .classed('line', true);
  }

  function drawInterchanges(gEnter) {
    var fgColor = '#000000';
    var bgColor = '#ffffff';

    gEnter
      .append('g')
      .attr('class', 'interchanges')
      .selectAll('path')
      .data(function(d) {
        return d.stations.interchanges();
      })
      .enter()
      .append('g')
      .attr('id', function(d) {
        return d.name;
      })
      .on('click', function() {
        var label = d3.select(this);
        var name = label.attr('id');

        selectStation(name);
        dispatch.call('click', this, name);
      })
      .append('path')
      .attr('d', interchange(lineWidth))
      .attr('transform', function(d) {
        return (
          'translate(' +
          xScale(d.x + d.marker[0].shiftX * lineWidthMultiplier) +
          ',' +
          yScale(d.y + d.marker[0].shiftY * lineWidthMultiplier) +
          ')'
        );
      })
      .attr('stroke-width', lineWidth / 2)
      .attr('fill', function(d) {
        return d.visited ? fgColor : bgColor;
      })
      .attr('stroke', function(d) {
        return d.visited ? bgColor : fgColor;
      })
      .classed('interchange', true)
      .style('cursor', 'pointer');
  }

  function drawStations(gEnter) {
    gEnter
      .append('g')
      .attr('class', 'stations')
      .selectAll('path')
      .data(function(d) {
        return d.stations.normalStations();
      })
      .enter()
      .append('g')
      .attr('id', function(d) {
        return d.name;
      })
      .on('click', function() {
        var label = d3.select(this);
        var name = label.attr('id');

        selectStation(name);
        dispatch.call('click', this, name);
      })
      .append('path')
      .attr('d', function(d) {
        return station(d, xScale, yScale, lineWidthMultiplier);
      })
      .attr('stroke', function(d) {
        return d.color;
      })
      .attr('stroke-width', lineWidth / 2)
      .attr('fill', 'none')
      .attr('class', function(d) {
        return d.line;
      })
      .attr('id', function(d) {
        return d.name;
      })
      .classed('station', true);
  }

  function drawLabels(gEnter) {
    gEnter
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(function(d) {
        return d.stations.toArray();
      })
      .enter()
      .append('g')
      .attr('id', function(d) {
        return d.name;
      })
      .classed('label', true)
      .on('click', function() {
        var label = d3.select(this);
        var name = label.attr('id');

        selectStation(name);

        dispatch.call('click', this, name);
      })
      .append('text')
      .text(function(d) {
        return d.label;
      })
      .attr('dy', 0.1)
      .attr('x', function(d) {
        return xScale(d.x + d.labelShiftX) + textPos(d).pos[0];
      })
      .attr('y', function(d) {
        return yScale(d.y + d.labelShiftY) - textPos(d).pos[1];
      })
      .attr('text-anchor', function(d) {
        return textPos(d).textAnchor;
      })
      .style('display', function(d) {
        return d.hide !== true ? 'block' : 'none';
      })
      .style('font-size', 1.2 * lineWidth / lineWidthMultiplier + 'px')
      .style('-webkit-user-select', 'none')
      .attr('class', function(d) {
        return d.marker
          .map(function(marker) {
            return marker.line;
          })
          .join(' ');
      })
      .classed('highlighted', function(d) {
        return d.visited;
      })
      .call(wrap);
  }

  function transformData(data) {
    return {
      raw: data.lines,
      river: data.river,
      stations: extractStations(data),
      lines: extractLines(data.lines),
    };
  }

  function extractStations(data) {
    data.lines.forEach(function(line) {
      for (var node = 0; node < line.nodes.length; node++) {
        var d = line.nodes[node];

        if (!d.hasOwnProperty('name')) continue;

        if (!data.stations.hasOwnProperty(d.name))
          throw new Error('Cannot find station with key: ' + d.name);

        var station = data.stations[d.name];

        station.x = d.coords[0];
        station.y = d.coords[1];

        if (station.labelPos === undefined) {
          station.labelPos = d.labelPos;
          station.labelShiftX = d.hasOwnProperty('shiftCoords')
            ? d.shiftCoords[0]
            : line.shiftCoords[0];
          station.labelShiftY = d.hasOwnProperty('shiftCoords')
            ? d.shiftCoords[1]
            : line.shiftCoords[1];
        }

        if (d.hasOwnProperty('canonical')) {
          station.labelShiftX = d.hasOwnProperty('shiftCoords')
            ? d.shiftCoords[0]
            : line.shiftCoords[0];
          station.labelShiftY = d.hasOwnProperty('shiftCoords')
            ? d.shiftCoords[1]
            : line.shiftCoords[1];
          station.labelPos = d.labelPos;
        }

        station.label = data.stations[d.name].title;
        station.position = data.stations[d.name].position;
        station.visited = false;

        if (!d.hide) {
          station.marker = station.marker || [];

          station.marker.push({
            line: line.name,
            color: line.color,
            labelPos: d.labelPos,
            marker: d.hasOwnProperty('marker') ? d.marker : 'station',
            shiftX: d.hasOwnProperty('shiftCoords')
              ? d.shiftCoords[0]
              : line.shiftCoords[0],
            shiftY: d.hasOwnProperty('shiftCoords')
              ? d.shiftCoords[1]
              : line.shiftCoords[1],
          });
        }
      }
    });

    return stationList(data.stations);
  }

  function extractLines(data) {
    var lines = [];

    data.forEach(function(line) {
      var lineObj = {
        name: line.name,
        title: line.label,
        stations: [],
        color: line.color,
        shiftCoords: line.shiftCoords,
        nodes: line.nodes,
        highlighted: false,
      };

      lines.push(lineObj);

      for (var node = 0; node < line.nodes.length; node++) {
        var data = line.nodes[node];

        if (!data.hasOwnProperty('name')) continue;

        lineObj.stations.push(data.name);
      }
    });

    return lineList(lines);
  }

  function textPos(data) {
    var pos;
    var textAnchor;
    var offset = lineWidth * 1.8;

    var numLines = data.label.split(/\n/).length;

    var sqrt2 = Math.sqrt(2);

    switch (data.labelPos.toLowerCase()) {
      case 'n':
        pos = [0, lineWidth * (numLines - 1) + offset];
        textAnchor = 'middle';
        break;
      case 'ne':
        pos = [offset / sqrt2, (lineWidth * (numLines - 1) + offset) / sqrt2];
        textAnchor = 'start';
        break;
      case 'e':
        pos = [offset, 0];
        textAnchor = 'start';
        break;
      case 'se':
        pos = [offset / sqrt2, -offset / sqrt2];
        textAnchor = 'start';
        break;
      case 's':
        pos = [0, -lineWidthMultiplier * offset];
        textAnchor = 'middle';
        break;
      case 'sw':
        pos = [-offset / sqrt2, -1.4 * offset / sqrt2];
        textAnchor = 'end';
        break;
      case 'w':
        pos = [-offset, 0];
        textAnchor = 'end';
        break;
      case 'nw':
        pos = [
          -(lineWidth * (numLines - 1) + offset) / sqrt2,
          (lineWidth * (numLines - 1) + offset) / sqrt2,
        ];
        textAnchor = 'end';
        break;
      default:
        break;
    }

    return {
      pos: pos,
      textAnchor: textAnchor,
    };
  }

  // Render line breaks for svg text
  function wrap(text) {
    text.each(function() {
      var text = d3.select(this);
      var lines = text.text().split(/\n/);

      var y = text.attr('y');
      var x = text.attr('x');
      var dy = parseFloat(text.attr('dy'));

      text
        .text(null)
        .append('tspan')
        .attr('x', x)
        .attr('y', y)
        .attr('dy', dy + 'em')
        .text(lines[0]);

      for (var lineNum = 1; lineNum < lines.length; lineNum++) {
        text
          .append('tspan')
          .attr('x', x)
          .attr('y', y)
          .attr('dy', lineNum * 1.1 + dy + 'em')
          .text(lines[lineNum]);
      }
    });
  }

  return map;
}