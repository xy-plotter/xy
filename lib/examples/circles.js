const plotter = require('./../index.js').Plotter;
plotter.connect('/dev/tty.wchusbserial1410', 115200);

let cx = plotter.WIDTH / 2;
let cy = plotter.HEIGHT / 2;
let margin = 1;
let maxRadius = 100;
let sides = 100;

plotter.setSpeed(0.8);
for (let r = 0; r < maxRadius; r += margin) plotter.ellipse(cx, cy, r, maxRadius);
for (let r = 0; r < maxRadius; r += margin) plotter.ellipse(cx, cy, maxRadius, r);

plotter.end(() => plotter.disconnect());