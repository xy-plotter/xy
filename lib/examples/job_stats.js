const plotter = require('./../index.js');

const job = plotter.Job('circles');

let cx = plotter.width / 2;
let cy = plotter.height / 2;
let margin = 1;
let maxRadius = 100;
let sides = 100;


job.setSpeed(0.8);
for (let r = 0; r < maxRadius; r += margin) job.ellipse(cx, cy, r, maxRadius);
for (let r = 0; r < maxRadius; r += margin) job.ellipse(cx, cy, maxRadius, r);

const stats = plotter.Stats(job);
console.log('distance', stats.getDistance(), 'mm');
console.log('duration', stats.getDuration(), 's');

const serial = plotter.Serial('/dev/tty.wchusbserial1410');
serial.send(job);