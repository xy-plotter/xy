const plotter = require('./../index.js')();
const path = require('path');

const job = plotter.Job('hello');
job.svg(path.join(__dirname, 'svg', 'hello.svg'));

// writing to a png file
const file = plotter.File();
file.export(job, path.join(__dirname, 'hello.png'));

// anonymous call to serial
plotter.Serial('/dev/tty.wchusbserial1410').send(job);