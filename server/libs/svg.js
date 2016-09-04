const fs        = require('fs');
const SVGO      = require('svgo');
const extract   = require('extract-svg-path');
const parse     = require('parse-svg-path');
const abs       = require('abs-svg-path');
const normalize = require('normalize-svg-path');
const bezier    = require('adaptive-bezier-curve');


function sanitize(svgString) {
  let extracted = extract.parse(svgString);
  let parsed = parse(extracted);
  let absed = abs(parsed);
  return normalize(absed);
}

module.exports = function svg(filePath, _scale) {
  let svgo = new SVGO({
    plugins: [
    {convertShapeToPath: true},
    {convertPathData: {
      straightCurves: false,
      lineShorthands: false,
      curveSmoothShorthands: false,
      floatPrecision: 3,
      transformPrecision: 5,
      removeUseless: true,
      collapseRepeated: true,
      utilizeAbsolute: true,
      leadingZero: true,
      negativeExtraSpace: true,
    }},
    ]
  });

  let file = fs.readFileSync(filePath, 'utf8');
  let points = [];
  svgo.optimize(file, (result) => {
    let paths = sanitize(result.data);
    let scale = _scale || 2;
    for (let i = 0, ppos; i < paths.length; i++) {
      let path = paths[i];
      if (path[0] === 'M') {
        points.push(path);
        ppos = [path[1], path[2]];
      } else if (path[0] === 'L') {
        let start = [path[1], path[2]];
        let end = [path[3], path[4]];
        points.push(start);
        points.push(end);
        ppos = end;
      } else if (ppos && path[0] === 'C') {
        let start = ppos;
        let c1 = [path[1], path[2]];
        let c2 = [path[3], path[4]];
        let end = [path[5], path[6]];

        points = points.concat(bezier(start, c1, c2, end, scale));
        ppos = end;
      }
    }
  });
  return points;
};