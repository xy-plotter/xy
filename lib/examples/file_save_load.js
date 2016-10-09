const plotter = require('./../index.js')();

const job = plotter.Job('circles');

let cx = plotter.width / 2;
let cy = plotter.height / 2;
let margin = 1;
let maxRadius = 100;
let sides = 100;


job.setSpeed(0.8);
for (let r = 0; r < maxRadius; r += margin) job.ellipse(cx, cy, r, maxRadius);
for (let r = 0; r < maxRadius; r += margin) job.ellipse(cx, cy, maxRadius, r);

const path = require('path');
const file = plotter.File();

const jobPath = path.join(__dirname, 'circles.json');
file.save(job, jobPath);

const loadedJob = file.load(jobPath);
file.export(loadedJob, path.join(__dirname, 'circles.png'));