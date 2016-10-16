const plotter = require('./../index.js')();

const job = plotter.Job('text-test');

job.text('hello world !', 100, 100);

// writing to a png file
const path = require('path');
const file = plotter.File();
file.export(job, path.join(__dirname, 'text-test.png'));

// anonymous call to serial
plotter.Serial('/dev/tty.wchusbserial1410').send(job);