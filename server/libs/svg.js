const extract   = require('extract-svg-path');
const parse     = require('parse-svg-path');
const abs       = require('abs-svg-path');
const normalize = require('normalize-svg-path');
const bezier    = require('adaptive-bezier-curve');


function sanitize(svg) { return normalize(abs(svg)); }
function sort(svg) { return svg; }

module.exports = function svg(filePath, _scale) {
  let file = extract(filePath);
  let paths = sanitize(parse(file));

  let points = [];
  let scale = _scale || 2;
  for (let i = 0, ppos; i < paths.length; i++) {
    let path = paths[i];
    if (path[0] === 'M') {
      points.push(path);
      ppos = [path[1], path[2]];
    } else if (ppos &&path[0] === 'C') {
      let start = ppos;
      let c1 = [path[1], path[2]];
      let c2 = [path[3], path[4]];
      let end = [path[5], path[6]];

      points = points.concat(bezier(start, c1, c2, end, scale));
      ppos = end;
    }
  }
  return points;
};